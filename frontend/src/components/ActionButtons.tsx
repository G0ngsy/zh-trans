import { useState } from 'react';
import { Camera, ImageUp, ScanSearch } from 'lucide-react';

interface ActionButtonsProps {
  onCameraClick: () => void;
  onUploadClick: () => void;
  onRealtimeClick: () => void;
  onTextAnalyze: (text: string) => void;
}

export default function ActionButtons({ onCameraClick, onUploadClick, onRealtimeClick, onTextAnalyze }: ActionButtonsProps) {
  const [inputText, setInputText] = useState('');

  return (
    <section className="w-full max-w-2xl mx-auto px-4 mt-6">
      
      {/* 1. 텍스트 직접 입력창 (통합 검색창 스타일) */}
      <div className="w-full bg-white border-2 border-jade-100 rounded-3xl shadow-sm mb-6 overflow-hidden focus-within:border-jade-400 transition-all">
        <textarea 
          placeholder="중국어를 직접 입력하거나 붙여넣으세요..." 
          className="w-full p-5 outline-none text-gray-800 text-sm h-24 resize-none"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <div className="flex justify-between items-center px-4 pb-3">
          <button 
            onClick={onRealtimeClick}
            className="flex items-center gap-1.5 text-[11px] font-black text-jade-600 bg-jade-50 px-3 py-1.5 rounded-full hover:bg-jade-100 transition-all"
          >
            <ScanSearch size={14} /> 실시간 AR 번역
          </button>
          <button 
            onClick={() => onTextAnalyze(inputText)}
            disabled={!inputText.trim()}
            className="bg-jade-500 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-jade-600 disabled:bg-gray-200 transition-all"
          >
            분석하기
          </button>
        </div>
      </div>

      {/* 2. 카메라 & 업로드 버튼 (그리드 반응형) */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={onCameraClick} 
          className="flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-gray-50 rounded-4xl hover:border-jade-300 hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 rounded-full bg-jade-50 flex items-center justify-center text-jade-500">
            <Camera size={28} />
          </div>
          <span className="text-gray-700 font-bold text-sm">카메라 촬영</span>
        </button>

        <button 
          onClick={onUploadClick} 
          className="flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-gray-50 rounded-4xl hover:border-jade-300 hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 rounded-full bg-jade-50 flex items-center justify-center text-jade-500">
            <ImageUp size={28} />
          </div>
          <span className="text-gray-700 font-bold text-sm">이미지 업로드</span>
        </button>
      </div>
    </section>
  );
}