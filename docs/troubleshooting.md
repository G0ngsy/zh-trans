# 작업 중 발견한 문제와 조치 기록

작성일: 2026-11-06

## 1. Hugging Face Space 시작 실패 — OCR 모델 다운로드 중단

### 문제
- `hanyu-lens-fallback` Space가 실행되지 않음.
- 처음 전달된 로그에는 Paddle의 `SIGTERM` 종료 메시지가 표시됨.

### 원인
- 공개 Space API 조회 시 `RUNTIME_ERROR`와 종료 코드 1을 확인함.
- `main.py` 43번째 줄의 PaddleOCR 초기화 중 인식 모델 다운로드가 중단됨.
- 오류: `requests.exceptions.ChunkedEncodingError` 및 `IncompleteRead(3294913 bytes read, 7682367 more expected)`.
- 약 11MB 모델 중 3.29MB만 받은 상태에서 연결이 끊김.
- OCR을 모듈 로딩 단계에서 초기화하므로 다운로드 실패가 서버 시작 실패로 이어짐.
- 최초 SIGTERM 로그만으로는 원인을 확정할 수 없으며, 해당 신호가 위 다운로드 실패와 동일 실행에서 발생했는지는 확인하지 못함.

### 해결방법
- 일시적인 연결 문제라면 Space 재시작으로 다운로드를 다시 시도할 수 있음.
- Dockerfile에서 패키지 설치 후 PaddleOCR을 초기화해 모델을 빌드 단계에 미리 다운로드하도록 변경하는 방안을 안내함.
- 다운로드 실패 시 최대 5회 재시도하고, 끝까지 실패하면 빌드를 실패 처리함.
- 빌드와 실행 시 모델 설정 및 캐시 경로를 동일하게 유지해야 저장된 모델을 재사용할 수 있음.

### 결과
- 원인은 공개 실행 상태에서 확인함.
- 제안한 빌드 단계 다운로드 코드를 적용한 뒤, 모델 다운로드 이전에 별도의 pyclipper import 오류가 발생함.
- 정상 빌드 및 서버 복구는 아직 확인하지 못함.

## 2. 빌드 중 pyclipper import 실패

### 문제
- Dockerfile의 모델 준비 단계에서 `from paddleocr import PaddleOCR` 실행 중 빌드가 종료됨.
- 오류: `zlib.error: Error -2 while decompressing data: inconsistent stream state`.

### 원인
- traceback상 PaddleOCR의 의존성인 `pyclipper._pyclipper`를 불러오는 과정에서 실패함.
- 정확한 근본 원인은 미확정임. 설치 파일 문제나 라이브러리 로딩 충돌을 확정할 근거는 없음.
- import가 재시도 루프 밖에 있어 기존 다운로드 재시도 코드로 처리되지 않음.
- pip 새 버전 알림은 해당 오류의 원인을 나타내는 메시지가 아님.

### 해결방법
- 검증할 우회 방법으로 PaddleOCR보다 먼저 `import pyclipper`를 실행하도록 안내함.
- Dockerfile의 모델 준비 코드와 Space의 main.py 모두 아래 순서로 배치함.

```python
import pyclipper
from paddleocr import PaddleOCR
```

- main.py만 변경하면 Dockerfile 내부 import 오류는 해결되지 않으므로 두 위치를 확인해야 함.
- 같은 오류가 반복되면 설치된 pyclipper 버전과 패키지 조합을 확인하고 추가 진단이 필요함.

### 결과
- import 순서 변경을 안내한 상태이며, 해결 효과는 아직 검증하지 못함.
- 빌드 로그의 `OCR models ready`와 실행 로그의 `Application startup complete`를 확인해야 함.
- 이후 이미지 OCR 요청까지 성공해야 기능 복구로 판단할 수 있음.

## 3. 로컬 프론트엔드 전체 빌드 미완료

### 문제
- 입력 안내 문구 변경 검증 중 전체 빌드가 종료 코드 1로 끝남.

### 원인
- 로그에는 Vite 모듈 2,207개 변환 완료까지 표시되었으며, 구체적인 실패 원인은 출력되지 않음.
- 권한 제한 밖에서 다시 실행해도 같은 결과여서 권한 문제로 단정할 수 없음.

### 해결방법
- TypeScript 타입 검사와 커밋 대상 변경의 공백 검사를 별도로 수행함.
- 전체 빌드 실패 원인은 별도 진단이 필요함.

### 결과
- 타입 검사와 커밋 대상 변경 검사는 통과함.
- 요청한 안내 문구 변경만 커밋 `5b461ac`로 poly 브랜치에 푸시 완료함.
- 기존 미커밋 작업은 보존함.
- 전체 빌드 성공은 확인하지 못했으며, Hugging Face 백엔드 장애와의 연관성도 확인되지 않음.

## 참고
- Space 코드: https://huggingface.co/spaces/suny0731/hanyu-lens-fallback/blob/main/main.py
- Space 공개 상태 API: https://huggingface.co/api/spaces/suny0731/hanyu-lens-fallback
- 실행 상태와 오류 내용은 당시 조회 및 사용자가 제공한 로그 기준이며 이후 변경될 수 있음.

## 추가 검증 — main 머지 사전 점검

- 2026-11-06: 미커밋 변경을 제외한 poly 커밋 사본에서 전체 프론트엔드 빌드(PWA 생성 포함) 및 ESLint 검사가 통과함.
- 변경된 백엔드 파일 3개의 문법 검사도 통과함. 실제 OCR·번역 통합 실행은 미검증임.
- 따라서 위 3번의 빌드 실패는 커밋된 poly 사본에서는 재현되지 않음. 당시 실패 원인 자체가 규명된 것은 아님.
