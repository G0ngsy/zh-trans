import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { X, RefreshCcw, Check, Move } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File, previewUrl: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  // 박스 상태 (초기 위치는 화면 중앙 근처로 설정)
  const [box, setBox] = useState({ top: 200, left: 50, width: 280, height: 140 });
  
  // 현재 어떤 조작을 하고 있는지 상태 ('move' | 'tl' | 'tr' | 'bl' | 'br' | null)
  const [dragType, setDragType] = useState<string | null>(null);
  // 드래그 시작 시점의 마우스 좌표와 박스 위치 저장
  const [startPos, setStartPos] = useState({ x: 0, y: 0, boxTop: 0, boxLeft: 0, boxW: 0, boxH: 0 });

  const videoConstraints = { facingMode: "environment", width: 1280, height: 720 };

  // --- 드래그/조절 시작 핸들러 ---
  const handleStart = (type: string) => (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragType(type);
    setStartPos({
      x: clientX,
      y: clientY,
      boxTop: box.top,
      boxLeft: box.left,
      boxW: box.width,
      boxH: box.height
    });
  };

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragType || !containerRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - startPos.x;
    const deltaY = clientY - startPos.y;

    setBox(prev => {
      let { top, left, width, height } = prev;

      if (dragType === 'move') {
        // 1. 전체 이동 로직
        top = startPos.boxTop + deltaY;
        left = startPos.boxLeft + deltaX;
      } else {
        // 2. 모서리 크기 조절 로직
        if (dragType === 'tl') {
          left = startPos.boxLeft + deltaX;
          top = startPos.boxTop + deltaY;
          width = startPos.boxW - deltaX;
          height = startPos.boxH - deltaY;
        } else if (dragType === 'tr') {
          top = startPos.boxTop + deltaY;
          width = startPos.boxW + deltaX;
          height = startPos.boxH - deltaY;
        } else if (dragType === 'bl') {
          left = startPos.boxLeft + deltaX;
          width = startPos.boxW - deltaX;
          height = startPos.boxH + deltaY;
        } else if (dragType === 'br') {
          width = startPos.boxW + deltaX;
          height = startPos.boxH + deltaY;
        }
      }

      // 화면 밖으로 나가지 않게 & 최소 크기 제한
      const minS = 60;
      if (width < minS) width = minS;
      if (height < minS) height = minS;

      return { top, left, width, height };
    });
  }, [dragType, startPos]);

  useEffect(() => {
    const handleEnd = () => setDragType(null);
    if (dragType) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
    };
  }, [dragType, handleMove]);

  // --- 이미지 캡처 로직 (동일) ---
  const captureAndCrop = useCallback(() => {
    if (!webcamRef.current) return;
    const video = webcamRef.current.video;
    if (!video || video.readyState !== 4) return;

    const vW = video.videoWidth;
    const vH = video.videoHeight;
    const eW = video.clientWidth;
    const eH = video.clientHeight;

    const scale = Math.max(eW / vW, eH / vH);
    const offsetX = (vW * scale - eW) / 2;
    const offsetY = (vH * scale - eH) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = box.width / scale;
    canvas.height = box.height / scale;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(video, (box.left + offsetX) / scale, (box.top + offsetY) / scale, box.width / scale, box.height / scale, 0, 0, canvas.width, canvas.height);
      setImgSrc(canvas.toDataURL('image/jpeg', 0.9));
    }
  }, [box]);

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black z-50 flex flex-col h-[100dvh] overflow-hidden select-none touch-none">
      
      {/* 닫기 버튼 */}
      <div className="absolute top-4 right-4 z-50">
        <button onClick={onClose} className="p-2 bg-black/40 text-white rounded-full backdrop-blur-md cursor-pointer"><X size={24} /></button>
      </div>

      <div className="flex-1 relative bg-black min-h-0">
        {!imgSrc ? (
          <>
            <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={videoConstraints} className="absolute inset-0 w-full h-full object-cover" />
            
            {/* 어두운 배경 오버레이 (박스 부분만 뚫림) */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bg-black/50" style={{ top: 0, left: 0, right: 0, height: box.top }}></div>
                <div className="absolute bg-black/50" style={{ top: box.top, left: 0, width: box.left, height: box.height }}></div>
                <div className="absolute bg-black/50" style={{ top: box.top, right: 0, left: box.left + box.width, height: box.height }}></div>
                <div className="absolute bg-black/50" style={{ top: box.top + box.height, left: 0, right: 0, bottom: 0 }}></div>
            </div>

            {/* [메인 가이드 박스] */}
            <div 
              style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
              className={`absolute border-2 z-40 ${dragType ? 'border-white' : 'border-jade-400'} transition-colors shadow-2xl`}
            >
              {/* 1. 이동 핸들 (박스 전체 영역) */}
              <div 
                onMouseDown={handleStart('move')} 
                onTouchStart={handleStart('move')}
                className="absolute inset-0 cursor-move flex items-center justify-center group"
              >
                <Move className={`opacity-0 ${!dragType && 'group-hover:opacity-40'} text-white transition-opacity`} size={32} />
              </div>

              {/* 2. 크기 조절 모서리 핸들 (L자 디자인) */}
              <div onMouseDown={handleStart('tl')} onTouchStart={handleStart('tl')} className="absolute -top-1.5 -left-1.5 w-10 h-10 border-t-4 border-l-4 border-jade-400 cursor-nw-resize"></div>
              <div onMouseDown={handleStart('tr')} onTouchStart={handleStart('tr')} className="absolute -top-1.5 -right-1.5 w-10 h-10 border-t-4 border-r-4 border-jade-400 cursor-ne-resize"></div>
              <div onMouseDown={handleStart('bl')} onTouchStart={handleStart('bl')} className="absolute -bottom-1.5 -left-1.5 w-10 h-10 border-b-4 border-l-4 border-jade-400 cursor-sw-resize"></div>
              <div onMouseDown={handleStart('br')} onTouchStart={handleStart('br')} className="absolute -bottom-1.5 -right-1.5 w-10 h-10 border-b-4 border-r-4 border-jade-400 cursor-se-resize"></div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-6 bg-neutral-900 ">
            <img src={imgSrc} alt="Cropped" className="max-w-full max-h-[70dvh] rounded-2xl border-4 border-jade-400 shadow-2xl animate-fade-in " />
          </div>
        )}
      </div>

      {/* 하단 버튼 섹션 */}
      <div className="flex-shrink-0 bg-neutral-950 p-8 flex flex-col items-center justify-center pb-12 sm:pb-16 z-50 ">
        {!imgSrc ? (
          <button onClick={captureAndCrop} className="w-18 h-18 bg-white rounded-full border-4 border-jade-500 shadow-2xl active:scale-90 transition-transform flex items-center justify-center cursor-pointer">
            <div className="w-14 h-14 bg-white border border-black/10 rounded-full"></div>
          </button>
        ) : (
          <div className="flex flex-col gap-3 w-full max-w-xs animate-slide-up">
            <button onClick={() => { fetch(imgSrc).then(r=>r.blob()).then(b => onCapture(new File([b],"c.jpg",{type:"image/jpeg"}), imgSrc)); }} className="py-4.5 bg-jade-500 hover:bg-jade-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-jade-500/20 active:bg-jade-600 transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <Check size={22} /> 이 영역 분석하기
            </button>
            <button onClick={() => setImgSrc(null)} className="py-3 bg-white/10 text-white/50 hover:bg-white/15 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
              <RefreshCcw size={16} /> 다시 찍기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}