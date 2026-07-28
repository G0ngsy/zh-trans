import cv2
import numpy as np
from pypinyin import Style, pinyin


async def analyze_realtime_image(
    file,
    ocr_engine,
    *,
    pinyin_separator: str,
    include_line_id: bool,
):
    """Run realtime OCR while preserving each API entry point's response format."""
    image_bytes = await file.read()
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    result = ocr_engine.ocr(img, cls=True)

    detected_data = []
    if result and result[0]:
        for line_idx, line in enumerate(result[0]):
            box = line[0]
            text = line[1][0]
            item = {
                "text": text,
                "pinyin": pinyin_separator.join(
                    syllable[0] for syllable in pinyin(text, style=Style.TONE)
                ),
                "x": (box[0][0] + box[2][0]) / 2,
                "y": (box[0][1] + box[2][1]) / 2,
            }
            if include_line_id:
                item["line_id"] = line_idx
            detected_data.append(item)

    return {"results": detected_data}
