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
        }, timeout=15)
        
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

        # OCR 실행
        # 2. OCR 실행 (안정 버전에서는 cls 인자 없이 실행 가능)
        result = ocr_engine.ocr(img, cls=True)

        # PaddleOCR의 결과는 [[좌표, (텍스트, 신뢰도)], ...] 형태.
        # 여기서 텍스트만 뽑아 한 문장으로 
        full_text = ""
        # PaddleOCR 결과 파싱: result[0] 안에 [[좌표, (텍스트, 확률)], ...]이 들어있음
        if result and result[0]:
            for line in result[0]:
                text = line[1][0] # 텍스트만 추출
                full_text += text + " "
        
          # 마지막 공백 제거 및 정리
        full_text = full_text.strip()


        if not full_text:
            return {"status": "error", "message": "글자를 인식하지 못했습니다."}
        
        
        # --- [Step 2: 기존 분석 로직 그대로 진행] ---
        # B. 한국식 한자 독음 (hanja)
        hanja_read = hanja.translate(full_text, 'substitution')

        # C. [EXAONE AI 담당] 스마트 단어장 분석 (문법 특화)
        word_list = get_smart_word_list(full_text)

        # D. [Google Translator 담당] 자연스러운 구어체 번역
        # 사용자가 만족했던 매끄러운 번역 결과를 가져옵니다.
        colloquial_result = google_translator.translate(full_text)

        # E. 성조 병음 변환 (pypinyin)
        pinyin_list = pinyin(full_text, style=Style.TONE)
        pinyin_str = " ".join([item[0] for item in pinyin_list])

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
        print(f"서버 내부 오류: {e}")
        return {"status": "error", "message": str(e)}
    
    
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
        voice = "zh-CN-XiaoxiaoNeural"
        
        # 1. Edge-TTS 객체 생성
        communicate = edge_tts.Communicate(text, voice)
        
        # 2. 임시 파일로 저장 (메모리 처리가 복잡하면 파일 저장이 안전합니다)
        output_file = "temp_audio.mp3"
        await communicate.save(output_file)
        
        # 3. 파일을 읽어서 base64로 인코딩
        with open(output_file, "rb") as f:
            audio_data = f.read()
            encoded_audio = base64.b64encode(audio_data).decode('utf-8')
            
        return {"audio": encoded_audio}
    except Exception as e:
        print(f"TTS 에러: {e}")
        return {"status": "error", "message": str(e)}