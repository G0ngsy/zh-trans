import re
import os
import sys

# 윈도우 환경 안정성 설정
os.environ["KMP_DUPLICATE_LIB_OK"] = "True"

import edge_tts
import asyncio
import requests
import json
import hanja
import base64
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pypinyin import pinyin, Style
from deep_translator import GoogleTranslator

# PaddleOCR 임포트 전에 이 아래 세 줄을 추가하면 경로 문제를 방지할 수 있습니다.
import paddleocr
from paddleocr import PaddleOCR

import cv2
import numpy as np



app = FastAPI()

# 1. 모델 및 번역기 초기화
#reader = easyocr.Reader(['ch_sim', 'en'], gpu=False)
ocr_engine = PaddleOCR(use_angle_cls=True, lang='ch', use_gpu=False, show_log=False)
google_translator = GoogleTranslator(source='zh-CN', target='ko')

# 2. 로컬 Ollama 설정 (EXAONE 3.5 사용)
OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "exaone3.5:7.8b"

def get_smart_word_list(text):
    """
    엑사원 AI에게 군더더기 없는 단어장 생성을 요청합니다.
    """
    limit_prompt = "중요한 핵심 단어 20개 내외를 선정해서" if len(text) > 30 else "모든 단어를"
    
    prompt = f"""너는 '중국어 학습용 단어 사전'이야. 다음 문장에서 {limit_prompt} 쪼개서 분석해줘.

문장: "{text}"

[절대 엄수 규칙 - 분석의 정확도가 가장 중요]
1. 중복 제거: 리스트 내에 동일한 단어가 두 번 나오지 않게 할 것. (예: '我'가 문장에 여러 번 있어도 리스트에는 1개만 포함)
2. 필수 결합: 아래 케이스는 반드시 '하나의 단어'로 묶을 것.
   - [수사 + 양사]: 숫자와 단위 (예: '一辆'은 무조건 합침. '一'과 '辆'으로 쪼개지 마)
   - [동사 + 보어]: 동작의 상태 (예: '一下', '一遍'은 무조건 합침)
3. 무조건 분리: 아래 케이스는 반드시 '별개의 단어'로 쪼갤 것. 절대 합치지 마.
   - [동사 + 대명사]: (예: '帮我' -> '帮', '我'로 분리)
   - [대명사 + 조동사]: (예: '你能' -> '你', '能'으로 분리)
   - [조동사 + 동사]: (예: '想买' -> '想', '买'으로 분리)
4. 단어 뜻(meaning): 부연 설명 없이 5자 이내 단답형.
   - '能' -> '할 수 있다', '想' -> '~하고 싶다', '一下' -> '좀 / 한번', '私家车' -> '자가용'
5. 언어: 'word'는 중국어, 'meaning'은 한국어.


반드시 아래 JSON 형식으로만 답변해 (JSON 외의 텍스트는 금지):
{{
  "word_list": [
    {{"word": "단어", "meaning": "뜻","pinyin": "병음"}}
  ]
}}"""


    try:
        response = requests.post(OLLAMA_API_URL, json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }, timeout=60)
        
        ai_data = json.loads(response.json()['response'])
        # 2. [필터링 핵심 코드] 한자가 하나라도 포함된 단어만 남기기
        filtered_list = []
        for item in ai_data.get('word_list', []):
            word = item.get('word', '')
            # 정규식: \u4e00-\u9fff 는 모든 한자 범위를 뜻합니다.
            if re.search(r'[\u4e00-\u9fff]', word):
                filtered_list.append(item)
        
        return filtered_list
    except:
        return []

# 3. CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hanyu-Lens Hybrid Engine is running"}

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    try:
        # 이미지 읽기
        image_bytes = await file.read()
        
        # --- [Step 1: PaddleOCR로 텍스트 추출] ---
        # 바이너리 데이터를 OpenCV 이미지로 변환
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"status": "error", "message": "이미지를 읽을 수 없습니다."}

        # 1. OCR 실행
        result = ocr_engine.ocr(img)

        if not result or not result[0]:
            return {"status": "error", "message": "글자를 인식하지 못했습니다.", "literary": []}

        # ✨ [개선된 로직] 좌표 데이터 정밀 추출
        boxes_and_texts = []
        for line in result[0]:
            box = line[0]  # [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
            text = line[1][0]
            
            # 박스의 중심 Y 좌표 (top-left와 bottom-left의 중간)
            center_y = (box[0][1] + box[3][1]) / 2 
            # 박스의 중심 X 좌표
            center_x = (box[0][0] + box[1][0]) / 2 
            # 박스의 세로 높이
            height = box[3][1] - box[0][1]
            
            boxes_and_texts.append({
                "text": text, 
                "x": center_x, 
                "y": center_y, 
                "h": height
            })

        # 1. Y축(위에서 아래) 기준으로 1차 정렬
        boxes_and_texts.sort(key=lambda item: item['y'])

        # 2. 같은 줄(Line) 판별 및 묶기
        lines = []
        current_line = []
        
        for item in boxes_and_texts:
            if not current_line:
                current_line.append(item)
            else:
                # 현재 줄의 '평균 Y 좌표'를 구해서 비교합니다. (이게 훨씬 정확함)
                avg_y = sum(i['y'] for i in current_line) / len(current_line)
                
                # Y 좌표 차이가 글자 높이(h)의 50% 이내면 같은 줄로 인정!
                if abs(item['y'] - avg_y) < (item['h'] * 0.5):
                    current_line.append(item)
                else:
                    # 차이가 크면 기존 줄을 저장하고 새 줄을 시작
                    lines.append(current_line)
                    current_line = [item]
        
        if current_line:
            lines.append(current_line)

        # 3. 같은 줄 안에서 X축(왼쪽에서 오른쪽)으로 2차 정렬 및 텍스트 합치기
        full_text_lines = []
        for line in lines:
            line.sort(key=lambda item: item['x'])
            # 띄어쓰기 한 칸을 넣어서 글자가 너무 뭉개지지 않게 합침
            line_text = " ".join([item['text'] for item in line])
            full_text_lines.append(line_text)

        # 4. 최종 텍스트: 각 줄을 엔터(\n)로 연결
        full_text = "\n".join(full_text_lines).strip()
        print("정렬된 텍스트 확인:\n", full_text)

        
        
        # --- [Step 2: 기존 분석 로직 그대로 진행] ---
        # B. 한국식 한자 독음 (hanja)
        hanja_read = hanja.translate(full_text, 'substitution')

        # C. [EXAONE AI 담당] 스마트 단어장 분석 (문법 특화)
        word_list = get_smart_word_list(full_text)

        # D. [Google Translator 담당] 자연스러운 구어체 번역
        # 사용자가 만족했던 매끄러운 번역 결과를 가져옵니다.
        colloquial_result = google_translator.translate(full_text)

        # E. 성조 병음 변환 (pypinyin)
        # (엔터도 그대로 살려두기 위해 텍스트 전체를 넘깁니다)
        pinyin_list = pinyin(full_text, style=Style.TONE)
        pinyin_str = " ".join([item[0] if item[0] != '\n' else '\n' for item in pinyin_list])
        # 깔끔하게 정리 (엔터 주변 공백 제거)
        pinyin_str = pinyin_str.replace(" \n ", "\n").replace("\n ", "\n")

        # F. 최종 데이터 조합하여 반환
        return {
            "status": "success",
            "original": full_text,
            "pinyin": pinyin_str,
            "hanja_read": hanja_read,
            "literary": word_list,       # AI가 만든 단어 리스트
            "colloquial": colloquial_result # 구글이 만든 문장 번역
        }

    except Exception as e:
        # ✨ [핵심] 어떤 에러가 났는지 터미널에 아주 크게 출력합니다!
        import traceback
        print("================ 에러 발생!! ================")
        traceback.print_exc()
        print("===========================================")
        
        # 리액트에게 에러가 났다고 알려줍니다.
        return {
            "status": "error", 
            "message": f"분석 중 서버 오류가 발생했습니다: {str(e)}"
        }
    
    
@app.post("/analyze_realtime")
async def analyze_realtime(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # 1. OCR 실행
        result = ocr_engine.ocr(img, cls=True)
        
        detected_data =[]
        if result and result[0]:
            for line in result[0]:
                box = line[0]  # 좌표 4개 모서리 [[x1,y1], [x2,y2],[x3,y3], [x4,y4]]
                text = line[1][0]
                
                # 병음 추출
                pinyin_str = " ".join([item[0] for item in pinyin(text, style=Style.TONE)])
                
                # ✨ 핵심: 글자의 한가운데 좌표 계산
                center_x = (box[0][0] + box[2][0]) / 2
                center_y = (box[0][1] + box[2][1]) / 2
                
                detected_data.append({
                    "text": text,
                    "pinyin": pinyin_str,
                    "x": center_x,
                    "y": center_y
                })
        
        # ✨ 핵심: 'results'라는 이름으로 배열을 보냄
        return {"results": detected_data}
    except Exception as e:
        print(f"실시간 에러: {e}")
        return {"results":[]}


@app.post("/analyze_text")
async def analyze_text(data: dict):
    text = data.get("text", "")
    if not text:
        return {"status": "error", "message": "입력된 텍스트가 없습니다."}
    
    # 엑사원/번역기 로직 재사용
    hanja_read = hanja.translate(text, 'substitution')
    word_list = get_smart_word_list(text)
    colloquial_result = google_translator.translate(text)
    pinyin_str = " ".join([item[0] for item in pinyin(text, style=Style.TONE)])

    return {
        "status": "success",
        "original": text,
        "pinyin": pinyin_str,
        "hanja_read": hanja_read,
        "literary": word_list,
        "colloquial": colloquial_result
    }
   

@app.post("/speak")
async def speak(data: dict):
    try:
        text = data.get("text", "")
        gender = data.get("gender", "female")
        if not text:
            return {"status": "error", "message": "텍스트 없음"}
            
        # 성별에 따른 목소리 ID 설정
        voice = "zh-CN-YunjianNeural" if gender == "male" else "zh-CN-XiaoxiaoNeural"
        communicate = edge_tts.Communicate(text, voice)
        
        # 1. 파일 시스템에 저장하지 않고 메모리(BytesIO)에서 처리
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
                
        # 2. 바로 base64 인코딩
        encoded_audio = base64.b64encode(audio_data).decode('utf-8')
            
        return {"audio": encoded_audio}
        
    except Exception as e:
        print(f"TTS 에러: {e}")
        return {"status": "error", "message": str(e)}