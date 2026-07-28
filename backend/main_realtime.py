import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR
from realtime_ocr import analyze_realtime_image

# 윈도우/리눅스 에러 방지 설정
os.environ["KMP_DUPLICATE_LIB_OK"] = "True"

app = FastAPI()

# 1. PaddleOCR 초기화 (실시간을 위해 log를 끄고 가볍게)
# 실시간이므로 gpu=False (CPU 모드)가 안정적입니다.
ocr_engine = PaddleOCR(use_angle_cls=True, lang='ch', use_gpu=False, show_log=False)

# 2. CORS 설정 (프론트엔드 연결 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hanyu-Lens Realtime Engine is running"}

@app.post("/analyze_realtime")
async def analyze_realtime(file: UploadFile = File(...)):
    try:
        return await analyze_realtime_image(
            file,
            ocr_engine,
            pinyin_separator="",
            include_line_id=True,
        )
    except Exception as e:
        return {"results": []}
