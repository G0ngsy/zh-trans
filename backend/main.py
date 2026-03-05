from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import easyocr
from pypinyin import pinyin, Style
from deep_translator import GoogleTranslator 
import io

app = FastAPI()

# 1. EasyOCR 로드 (서버 켤 때 한 번만)
# gpu=False는 일반 PC 환경에서 가장 안전합니다.
reader = easyocr.Reader(['ch_sim', 'en'], gpu=False)

# 2. 번역기 로드 (중국어 -> 한국어)
translator = GoogleTranslator(source='zh-CN', target='ko')

# CORS 설정 (프론트엔드 연결 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "EasyOCR 엔진이 준비되었습니다!"}

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    try:
        # 3. 이미지 읽기
        image_bytes = await file.read()
        
        # 4. OCR 실행
        # detail=0: 텍스트만 추출
        # paragraph=True: 흩어진 글자들을 문맥에 맞게 합쳐줌 (손글씨에 도움됨)
        result = reader.readtext(image_bytes, detail=0, paragraph=True)
        
        full_text = " ".join(result).strip()

        if not full_text:
            return {"status": "error", "message": "글자를 인식하지 못했습니다."}

        # 5. 병음(성조) 변환
        pinyin_list = pinyin(full_text, style=Style.TONE)
        pinyin_str = " ".join([item[0] for item in pinyin_list])

        # 6. 한국어 번역
        translated_text = translator.translate(full_text)

        return {
            "status": "success",
            "original": full_text,
            "pinyin": pinyin_str,
            "meaning": translated_text
        }

    except Exception as e:
        print(f"서버 에러: {e}")
        return {"status": "error", "message": str(e)}