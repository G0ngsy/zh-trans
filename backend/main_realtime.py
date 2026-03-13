import os
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pypinyin import pinyin, Style
from paddleocr import PaddleOCR

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
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # 1. OCR 실행
        result = ocr_engine.ocr(img, cls=True)
        
        # 2. 결과 구조화 (좌표 + 텍스트 + 병음)
        detected_data = []
        if result and result[0]:
            for line in result[0]:
                box = line[0]  # 좌표 [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
                text = line[1][0]
                
                # 병음 추출
                pinyin_str = "".join([item[0] for item in pinyin(text, style=Style.TONE)])
                
                # 좌표 중심 계산 (화면 중앙값용)
                center_x = (box[0][0] + box[2][0]) / 2
                center_y = (box[0][1] + box[2][1]) / 2
                
                detected_data.append({
                    "text": text,
                    "pinyin": pinyin_str,
                    "x": center_x,
                    "y": center_y
                })
        
        return {"results": detected_data}
    except Exception as e:
        return {"results": []}