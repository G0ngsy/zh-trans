import os
import io
import jieba
import hanja  
import easyocr
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pypinyin import pinyin, Style
from deep_translator import GoogleTranslator

app = FastAPI()

# 1. 모델 로드
reader = easyocr.Reader(['ch_sim', 'en'], gpu=False)

# 2. 번역 함수 정의
def get_translations(text):
    try:
        translator = GoogleTranslator(source='zh-CN', target='ko')
        # 구어체: 전체 문장 번역
        colloquial = translator.translate(text)
        
        # 문어체: 단어별 쪼개서 번역
        words = jieba.lcut(text)
        literal_words = []
        for word in words:
            if word.strip():
                literal_words.append(translator.translate(word))
        literary = " ".join(literal_words)
        
        return literary, colloquial
    except Exception as e:
        print(f"번역 중 에러: {e}")
        return text, text # 에러 시 원문이라도 반환

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        
        # 3. OCR 실행
        result = reader.readtext(image_bytes, detail=0, paragraph=True)
        full_text = " ".join(result).strip()

        if not full_text:
            return {"status": "error", "message": "글자를 인식하지 못했습니다."}
        
        # 한국식 한자 읽기 변환 (예: 滨江道 -> 빈장도)
        hanja_read = hanja.translate(full_text, 'substitution')

        # 4. 중요: 함수 안에서 번역 호출 (full_text 정의 후 호출)
        literary_result, colloquial_result = get_translations(full_text)

        # 5. 병음 변환
        pinyin_list = pinyin(full_text, style=Style.TONE)
        pinyin_str = " ".join([item[0] for item in pinyin_list])

        # 6. 최종 결과 반환 (Key 이름을 리액트와 맞춤)
        return {
            "status": "success",
            "original": full_text,
            "pinyin": pinyin_str,
            "hanja_read": hanja_read,
            "literary": literary_result,   # 리액트가 보는 이름
            "colloquial": colloquial_result # 리액트가 보는 이름
        }

    except Exception as e:
        print(f"서버 내부 에러: {e}")
        return {"status": "error", "message": str(e)}