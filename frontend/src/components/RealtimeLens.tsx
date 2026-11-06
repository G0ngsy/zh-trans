import { useRef, useState, useEffect } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import Webcam from 'react-webcam';
import { X } from 'lucide-react';
import axios from 'axios';
import { constrainBox, resizeBox, videoCrop } from './lensGeometry';
import type { Box, Size, Corner } from './lensGeometry';
interface RealtimeLensProps { onClose: () => void }
interface DetectedItem { text: string; pinyin: string; x: number; y: number }
interface Drag { id: number; x: number; y: number; box: Box; type: Corner | 'move'; target: HTMLElement }
const corners: Corner[] = ['nw', 'ne', 'sw', 'se'];
export default function RealtimeLens({ onClose }: RealtimeLensProps) {
  const webcamRef = useRef<Webcam>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const boxRef = useRef<Box>({ left: 0, top: 0, width: 64, height: 64 });
  const sizeRef = useRef<Size>({ width: 0, height: 0 });
  const revisionRef = useRef(0);
  const requestRef = useRef<AbortController | null>(null);
  const [box, setBox] = useState(boxRef.current);
  const [size, setSize] = useState(sizeRef.current);
  const [detectedResults, setDetectedResults] = useState<DetectedItem[]>([]);
  const invalidate = () => {
    revisionRef.current++;
    requestRef.current?.abort();
    setDetectedResults([]);
  };
  const finishDrag = (id?: number) => {
    const drag = dragRef.current;
    if (!drag || (id !== undefined && drag.id !== id)) return;
    dragRef.current = null;
    if (drag.target.hasPointerCapture(drag.id)) drag.target.releasePointerCapture(drag.id);
  };
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      finishDrag();
      invalidate();
      const first = !sizeRef.current.width;
      const nextSize = { width, height };
      const initial = { left: width * 0.1, top: height * 0.25, width: Math.min(360, width * 0.8), height: Math.min(180, height * 0.3) };
      const nextBox = constrainBox(first ? initial : boxRef.current, nextSize);
      sizeRef.current = nextSize;
      boxRef.current = nextBox;
      setSize(nextSize);
      setBox(nextBox);
    });
    observer.observe(container);
    return () => { observer.disconnect(); finishDrag(); };
  }, []);
  const start = (type: Drag['type']) => (e: ReactPointerEvent<HTMLElement>) => {
    if (dragRef.current || !e.isPrimary || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, box: boxRef.current, type, target: e.currentTarget };
    invalidate();
  };
  const move = (e: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    const next = drag.type === 'move'
      ? constrainBox({ ...drag.box, left: drag.box.left + dx, top: drag.box.top + dy }, sizeRef.current)
      : resizeBox(drag.box, drag.type, dx, dy, sizeRef.current);
    boxRef.current = next;
    setBox(next);
  };
  useEffect(() => {
    let active = true;
    let busy = false;
    const analyze = async () => {
      const video = webcamRef.current?.video;
      if (!active || busy || dragRef.current || !video || video.readyState < 2) return;
      const crop = videoCrop(boxRef.current, sizeRef.current, { width: video.videoWidth, height: video.videoHeight });
      if (!crop) return;
      busy = true;
      const revision = revisionRef.current;
      const controller = new AbortController();
      requestRef.current = controller;
      const current = () => active && !controller.signal.aborted && revision === revisionRef.current;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(crop.width));
        canvas.height = Math.max(1, Math.round(crop.height));
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, crop.left, crop.top, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
        if (!blob || !current()) return;
        const data = new FormData();
        data.append('file', blob, 'frame.jpg');
        const api = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        let results: DetectedItem[];
        try {
          const response = await axios.post(`${api}/analyze_realtime`, data, { signal: controller.signal, timeout: 2000, headers: { 'ngrok-skip-browser-warning': '69420' } });
          results = response.data.results || [];
        } catch {
          if (!current()) return;
          const response = await axios.post('https://suny0731-hanyu-lens-fallback.hf.space/analyze_realtime', data, { signal: controller.signal, timeout: 5000 });
          results = response.data.results || [];
        }
        if (current()) setDetectedResults(results);
      } catch (error) {
        if (current()) { setDetectedResults([]); console.error('실시간 분석 서버 연결 실패:', error); }
      } finally {
        if (requestRef.current === controller) requestRef.current = null;
        busy = false;
      }
    };
    const interval = window.setInterval(() => { void analyze(); }, 1000);
    return () => { active = false; clearInterval(interval); requestRef.current?.abort(); };
  }, []);
  const sorted = [...detectedResults].sort((a, b) => a.y - b.y);
  return (
    <div ref={containerRef} className="fixed inset-0 bg-black z-50 select-none">
      <button onClick={() => { requestRef.current?.abort(); onClose(); }} aria-label="실시간 AR 닫기" className="absolute top-4 right-4 z-50 p-2 bg-black/40 text-white rounded-full cursor-pointer"><X size={24} /></button>
      <Webcam audio={false} ref={webcamRef} videoConstraints={{ facingMode: 'environment' }} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center' }} />
      {size.width > 0 && <div
        style={{ ...box, position: 'absolute', boxSizing: 'border-box', touchAction: 'none' }}
        className="border-2 border-jade-400 z-40 bg-white/5 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move"
        onPointerDown={start('move')} onPointerMove={move}
        onPointerUp={e => finishDrag(e.pointerId)} onPointerCancel={e => finishDrag(e.pointerId)} onLostPointerCapture={e => finishDrag(e.pointerId)}
      >
        {corners.map(corner => <div key={corner} aria-label={`${corner} 영역 크기 조절`} onPointerDown={start(corner)}
          style={{ position: 'absolute', width: 44, height: 44, touchAction: 'none', top: corner.includes('n') ? 0 : undefined, bottom: corner.includes('s') ? 0 : undefined, left: corner.includes('w') ? 0 : undefined, right: corner.includes('e') ? 0 : undefined, cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize' }}>
          <span style={{ position: 'absolute', width: 14, height: 14, pointerEvents: 'none', borderColor: 'var(--color-jade-400)', borderStyle: 'solid', borderWidth: `${corner.includes('n') ? 3 : 0}px ${corner.includes('e') ? 3 : 0}px ${corner.includes('s') ? 3 : 0}px ${corner.includes('w') ? 3 : 0}px`, top: corner.includes('n') ? 0 : undefined, bottom: corner.includes('s') ? 0 : undefined, left: corner.includes('w') ? 0 : undefined, right: corner.includes('e') ? 0 : undefined }} />
        </div>)}
      </div>}
      {sorted.length > 0 && <div className="absolute z-50 left-1/2 -translate-x-1/2 w-[92%] max-w-md pointer-events-none" style={{ maxHeight: Math.max(0, size.height - 32), overflow: 'hidden', ...(box.top > size.height / 2 ? { bottom: size.height - box.top + 20 } : { top: box.top + box.height + 20 }) }}>
        <p className="bg-black/90 px-4 py-4 rounded-3xl border border-white/20 ar-pinyin font-bold text-sm sm:text-base font-mono text-center leading-loose break-words whitespace-pre-wrap">{sorted.map((item, i) => (i ? (Math.abs(item.y - sorted[i - 1].y) > 15 ? '\n' : '  ') : '') + item.pinyin).join('')}</p>
      </div>}
    </div>
  );
}
