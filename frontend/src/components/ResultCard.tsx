
import { RefreshCcw } from 'lucide-react';

interface ResultCardProps {
  imageUrl: string | null;
  result: {
    original: string;
    pinyin: string;
    meaning: string;
  };
  onRetry: () => void;
}

export default function ResultCard({ imageUrl, result, onRetry }: ResultCardProps) {
  return (
    <div className="flex flex-col h-full animate-fade-in pb-10">
      {/* 1. 사용자가 올린 이미지 (상단) */}
      {imageUrl && (
        <div className="w-full h-48 bg-gray-900 rounded-3xl overflow-hidden shadow-md mb-6 relative">
          <img src={imageUrl} alt="Uploaded" className="w-full h-full object-contain" />
        </div>
      )}

      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="font-bold text-gray-800 text-lg">분석 결과</h3>
        <span className="text-xs font-bold text-jade-500 bg-jade-50 px-2 py-1 rounded-full">
          1 ITEMS FOUND
        </span>
      </div>

      {/* 2. 결과 카드 */}
      <div className="bg-white border-2 border-jade-100 rounded-3xl p-6 shadow-sm mb-6">
        {/* 한자 & 병음 */}
        <div className="mb-4">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1 leading-tight tracking-wide">
            {result.original}
          </h1>
          <p className="text-orange-500 font-medium font-mono text-sm">
            {result.pinyin}
          </p>
        </div>

        {/* 구분선 */}
        <div className="h-px bg-gray-100 my-4"></div>

        {/* 한국어 뜻 */}
        <div className="flex gap-2">
          <span className="text-gray-400 select-none">›</span>
          <p className="text-gray-700 font-medium text-lg leading-relaxed">
            {result.meaning}
          </p>
        </div>
      </div>

      {/* 3. 문맥 해석 (추후 AI 고도화 시 활용, 지금은 고정 멘트 예시) */}
      <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 mb-8">
        <p className="text-sm text-gray-500 italic">
          "문맥에 따라 해석이 달라질 수 있습니다. 추출된 텍스트를 다시 한번 확인해주세요."
        </p>
      </div>

      {/* 4. 다시하기 버튼 */}
      <button 
        onClick={onRetry}
        className="w-full py-4 bg-[#1C1C1C] hover:bg-black text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all"
      >
        <RefreshCcw size={18} />
        다른 이미지 분석하기
      </button>
    </div>
  );
}