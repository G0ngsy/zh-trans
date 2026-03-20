
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

          // 환경 변수 및 비상용 허깅페이스 주소 설정
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const fallbackApiUrl = 'https://suny0731-hanyu-lens-fallback.hf.space';

          try {
            // 1순위: 메인 서버 (내 PC) 시도
            const res = await axios.post(`${apiUrl}/analyze_realtime`, formData, {
              headers: { 'ngrok-skip-browser-warning': '69420' },
              timeout: 2000 // 실시간이므로 2초 안에 답 없으면 바로 비상서버로 넘김
            });
            setDetectedResults(res.data.results ||[]);
            
          } catch {
            // 2순위: 메인 서버가 꺼져있거나 에러나면 비상 서버(허깅페이스) 호출
            try {
              const fallbackRes = await axios.post(`${fallbackApiUrl}/analyze_realtime`, formData);
              setDetectedResults(fallbackRes.data.results ||[]);
            } catch (fallbackError) {
              console.error("실시간 분석 서버 연결 실패:", fallbackError);
            }
          }
        }, 'image/jpeg', 0.8);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [box]);

   return (
    <div ref={containerRef} className="fixed inset-0 bg-black z-50 select-none">
      <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-black/40 text-white rounded-full cursor-pointer">
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
        {/* 중앙 이동 핸들 */}
        <div onMouseDown={handleStart('move')} onTouchStart={handleStart('move')} className="absolute inset-0 cursor-move"></div>
        <div onMouseDown={handleStart('br')} onTouchStart={handleStart('br')} className="absolute -bottom-1.5 -right-1.5 w-10 h-10 border-b-4 border-r-4 border-jade-400 cursor-se-resize"></div>
      </div>

      {/* ✨ [신규] 박스 하단 자막 영역 (병음 표시) */}
      {detectedResults.length > 0 && (
  <div 
    className="absolute z-50 left-1/2 -translate-x-1/2 w-[92%] max-w-md flex justify-center pointer-events-none transition-all duration-300"
    style={{ 
      ...(box.top > window.innerHeight / 2 
        ? { bottom: window.innerHeight - box.top + 20 } 
        : { top: box.top + box.height + 20 }
      )
    }}
  >
    <div className="bg-black/90 backdrop-blur-xl px-4 py-4 rounded-3xl border border-white/20 shadow-2xl w-full">
      
      {/* ✨ 핵심 수정: flex 속성을 빼고, 문단(p)이 자연스럽게 줄바꿈(break-words) 되도록 변경 */}
      <p className="text-jade-300 font-bold text-sm sm:text-base font-mono text-center leading-loose break-words whitespace-pre-wrap">
        {/* ✨ 핵심: Y 좌표를 비교하여 줄바꿈(\n)을 동적으로 삽입합니다. */}
        {detectedResults
          // 1. Y 좌표 기준으로 위에서 아래로 정렬
          .sort((a, b) => a.y - b.y)
          // 2. Map으로 돌면서 이전 항목과 Y 좌표 차이 계산
          .map((item, i, arr) => {
            // 첫 번째 항목은 그냥 출력
            if (i === 0) return item.pinyin;
            
            // 이전 항목과의 Y 좌표(픽셀) 차이
            const yDiff = Math.abs(item.y - arr[i - 1].y);
            
            // Y 차이가 15px 이상이면 '새로운 줄'로 간주하여 엔터(\n) 추가
            // 아니면 그냥 같은 줄이므로 띄어쓰기( ) 추가
            const separator = yDiff > 15 ? '\n' : '  '; 
            
            return separator + item.pinyin;
          })
          .join('') // 이미 separator를 넣었으므로 그냥 빈 문자열로 합침
        }
      </p>

    </div>
  </div>
)}
    </div>
  );
}