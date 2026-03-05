import  { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { X,  RefreshCcw, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  // 모바일 후면 카메라 우선, 없으면 전면
  const videoConstraints = {
    facingMode: "environment"
  };

  // 1. [촬영] 버튼 누르면 실행
  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  // 2. [분석하기] 버튼 누르면 실행
  const handleConfirm = () => {
    if (imgSrc) {
      // Base64 이미지를 File 객체로 변환
      fetch(imgSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
          onCapture(file); // 부모(App.tsx)로 파일 전달 -> 바로 분석 시작
        });
    }
  };

  return (
    // 전체 화면 덮기 (검은 배경)
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between">
      
      {/* 1. 상단 닫기 버튼 */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={onClose} 
          className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        >
          <X size={28} />
        </button>
      </div>

      {/* 2. 카메라 영역 */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {!imgSrc ? (
          /* A. 카메라 라이브 화면 */
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* 가이드라인 박스 (가운데 네모) */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/50 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-jade-400 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-jade-400 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-jade-400 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-jade-400 rounded-br-xl"></div>
              </div>
            </div>
            <p className="absolute bottom-10 text-white/80 text-sm font-medium bg-black/30 px-4 py-1 rounded-full backdrop-blur-sm">
              글자를 박스 안에 맞춰주세요
            </p>
          </>
        ) : (
          /* B. 찍은 사진 미리보기 */
          <img src={imgSrc} alt="Captured" className="w-full h-full object-contain" />
        )}
      </div>

      {/* 3. 하단 컨트롤러 (버튼 영역) */}
      <div className="h-32 bg-black flex items-center justify-center pb-6">
        
        {!imgSrc ? (
          /* === 촬영 전: 셔터 버튼 === */
          <button 
            onClick={capture}
            className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          >
            {/* 셔터 내부 디자인 */}
            <div className="w-16 h-16 bg-white border-2 border-black rounded-full"></div>
          </button>
        ) : (
          /* === 촬영 후: 재촬영 / 분석 버튼 === */
          <div className="flex items-center justify-center gap-6 w-full px-8">
            {/* 재촬영 버튼 */}
            <button 
              onClick={() => setImgSrc(null)}
              className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <RefreshCcw size={20} />
              재촬영
            </button>
            
            {/* 분석 버튼 (포인트 컬러) */}
            <button 
              onClick={handleConfirm}
              className="flex-1 py-4 bg-jade-500 hover:bg-jade-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-jade-500/30"
            >
              <Check size={20} />
              분석하기
            </button>
          </div>
        )}
      </div>

    </div>
  );
}