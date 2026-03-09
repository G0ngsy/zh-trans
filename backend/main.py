import os
import requests
import json
import easyocr
import hanja
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pypinyin import pinyin, Style
from deep_translator import GoogleTranslator # 구글 번역 라이브러리

app = FastAPI()

# 1. 모델 및 번역기 초기화
reader = easyocr.Reader(['ch_sim', 'en'], gpu=False)
google_translator = GoogleTranslator(source='zh-CN', target='ko')

# 2. 로컬 Ollama 설정 (EXAONE 3.5 사용)
OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "exaone3.5:7.8b"

def get_smart_word_list(text):
    """
    엑사원 AI에게 군더더기 없는 단어장 생성을 요청합니다.
    """
    prompt = f"""너는 '중국어-한국어 학습용 단어 사전'이야. 다음 문장을 중국어 문법 체계에 맞춰 '최소한의 낱말 단위'로 완전히 분해해줘.

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
    {{"word": "단어", "meaning": "뜻"}}
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
        return ai_data.get('word_list', [])
    except Exception as e:
        print(f"AI 분석 실패: {e}")
        return [] # 실패 시 빈 리스트 반환 (프론트에서 처리)

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
        # A. 이미지에서 텍스트 추출 (OCR)
        image_bytes = await file.read()
        result = reader.readtext(image_bytes, detail=0, paragraph=True)
        full_text = " ".join(result).strip()

        if not full_text:
            return {"status": "error", "message": "글자를 인식하지 못했습니다."}

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