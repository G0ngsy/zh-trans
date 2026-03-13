import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { X } from 'lucide-react';
import axios from 'axios';

interface RealtimeLensProps {
  onClose: () => void;
}

// ✨ [해결 1] any 대신 서버에서 받아올 데이터의 모양(타입)을 명확히 정의합니다.
interface DetectedItem {
  text: string;
  pinyin: string;
  x: number;
  y: number;
}

export default function RealtimeLens({ onClose }: RealtimeLensProps) {
  const webcamRef = useRef<Webcam>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // ✨ [해결 1 적용] any[] 대신 DetectedItem[] 사용
  const [detectedResults, setDetectedResults] = useState<DetectedItem[]>([]);
  const [box, setBox] = useState({ top: 150, left: 40, width: 280, height: 140 });
  
  const [dragType, setDragType] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0, top: 0, left: 0, w: 0, h: 0 });

  // --- 드래그 조절 핸들러 ---
  const handleStart = (type: string) => (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragType(type);
    setStartPos({ x: clientX, y: clientY, top: box.top, left: box.left, w: box.width, h: box.height });
  };

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragType) return;
    const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
    const dx = clientX - startPos.x;
    const dy = clientY - startPos.y;

    if (dragType === 'move') {
      setBox(prev => ({ ...prev, top: startPos.top + dy, left: startPos.left + dx }));
    } else {
      setBox(prev => ({ ...prev, width: Math.max(50, startPos.w + dx), height: Math.max(50, startPos.h + dy) }));
    }
  },[dragType, startPos]);

  useEffect(() => {
    const end = () => setDragType(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', end);
    return () => { 
        window.removeEventListener('mousemove', handleMove); 
        window.removeEventListener('mouseup', end);
        window.removeEventListener('touchmove', handleMove); 
        window.removeEventListener('touchend', end);
    };
  }, [handleMove]);

  // --- 실시간 분석 로직 ---
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!webcamRef.current?.video) return;
      const video = webcamRef.current.video;
      if (video.readyState !== 4) return;

      const canvas = document.createElement('canvas');
      const scaleX = video.videoWidth / video.clientWidth;
      const scaleY = video.videoHeight / video.clientHeight;
      
      canvas.width = box.width * scaleX;
      canvas.height = box.height * scaleY;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, box.left * scaleX, box.top * scaleY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const formData = new FormData();
          formData.append('file', blob, 'frame.jpg');
          try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await axios.post(`${apiUrl}/analyze_realtime`, formData, {
              headers: { 'ngrok-skip-browser-warning': '69420' }
            });

            console.log("실시간 서버 응답 데이터:", res.data);
            setDetectedResults(res.data.results ||[]);
          } catch (e) {
            // ✨ [해결 2] 빈 블록({}) 대신 콘솔 로그를 남겨서 에러 방지
            console.error("실시간 분석 중 오류 발생:", e);
          }
        }, 'image/jpeg', 0.8);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [box]);

   return (
    <div ref={containerRef} className="fixed inset-0 bg-black z-50 select-none">
      <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-black/40 text-white rounded-full">
        <X size={24} />
      </button>
      
      <Webcam 
        audio={false} 
        ref={webcamRef} 
        videoConstraints={{ facingMode: "environment" }} 
        className="absolute inset-0 w-full h-full object-cover" 
      />

      {/* 🟢 조절 가능한 초록색 가이드 박스 */}
      <div 
        style={{ top: box.top, left: box.left, width: box.width, height: box.height }} 
        className="absolute border-2 border-jade-400 z-40 bg-white/5 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
      >
        <div onMouseDown={handleStart('move')} onTouchStart={handleStart('move')} className="absolute inset-0 cursor-move"></div>
        <div onMouseDown={handleStart('br')} onTouchStart={handleStart('br')} className="absolute -right-2 -bottom-2 w-8 h-8 bg-jade-400 rounded-full cursor-se-resize"></div>
      </div>

      {/* ✨ [신규] 박스 하단 자막 영역 (병음 표시) */}
      {detectedResults.length > 0 && (
        <div 
          className="absolute z-50 w-full flex justify-center px-4 pointer-events-none transition-all duration-200"
          style={{ top: box.top + box.height + 16 }} // 박스 바로 16px 아래에 위치
        >
          <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-2xl max-w-xs shadow-xl border border-white/10">
            <p className="text-jade-300 font-bold text-sm leading-relaxed text-center font-mono">
              {/* 모든 병음을 띄어쓰기로 연결해서 한 문장처럼 보여줌 */}
              {detectedResults.map(item => item.pinyin).join(' ')}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}