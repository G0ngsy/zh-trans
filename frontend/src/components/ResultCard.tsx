import { RefreshCcw, BookOpen, MessageCircle, Lightbulb } from 'lucide-react';

interface ResultCardProps {
  imageUrl: string | null; // 사용자가 촬영/업로드한 이미지 (크롭된 이미지)
  result: {
    original: string;    // 중국어 원문
    pinyin: string;      // 성조 포함 병음
    literary: string;    // 문어체 (직역, 한자어 본연의 뜻)
    colloquial: string;  // 구어체 (의역, 실제 통용되는 의미)
    hanja_read: string;
  };
  onRetry: () => void;   // '다시 하기' 버튼 클릭 시 호출되는 함수
}

export default function ResultCard({ imageUrl, result, onRetry }: ResultCardProps) {
  return (
    <div className="flex flex-col h-full animate-fade-in pb-10">
      
      {/* 1. 분석된 이미지 미리보기 섹션 */}
      {imageUrl && (
        <div className="w-full h-44 bg-gray-900 rounded-3xl overflow-hidden shadow-md mb-6 relative border-2 border-white">
          <img src={imageUrl} alt="Uploaded" className="w-full h-full object-contain" />
        </div>
      )}

      {/* 2. 섹션 타이틀 */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-bold text-gray-800 text-lg">분석 결과</h3>
        <span className="text-[10px] font-black text-jade-600 bg-jade-50 px-2 py-1 rounded-lg border border-jade-100 uppercase tracking-tighter">
          Analysis Complete
        </span>
      </div>

      {/* 3. 메인 분석 결과 카드 */}
      <div className="bg-white border-2 border-jade-100 rounded-[2.5rem] p-7 shadow-xl shadow-jade-900/5 mb-6">
        
        {/* [원문 및 병음 영역] */}
        <div className="mb-6">
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
            {result.original}
          </h1>
          <p className="text-orange-500 font-bold text-lg font-mono">
            {result.pinyin}
          </p>
        </div>

        {/* 중간 구분선 */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent my-6"></div>
        
        <div className="mb-6">
          {/* 1. 중국어 원문 */}
          <h1 className="text-4xl font-black text-gray-900 mb-2">{result.original}</h1>
          
          {/* 2. 병음과 한국식 한자음을 나란히 배치 */}
          <div className="flex flex-wrap gap-2 items-center">
            <p className="text-orange-500 font-bold text-lg">{result.pinyin}</p>
            <span className="px-2 py-1 bg-jade-100 text-jade-700 text-xs font-black rounded-md">
              {result.hanja_read}
            </span>
          </div>
        </div>
        {/* [번역 결과 영역] - 문어체와 구어체 분리 */}
        <div className="space-y-6">
          
          {/* A. 문어체 (Literary) - 학습용 직역 */}
          <div className="relative pl-5 border-l-4 border-jade-400">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BookOpen size={14} className="text-jade-500" />
              <span className="text-[11px] font-black text-jade-600 uppercase tracking-wider">
                문어체 (글자 뜻)
              </span>
            </div>
            <p className="text-2xl font-extrabold text-gray-800 leading-tight">
              {result.literary}
            </p>
          </div>

          {/* B. 구어체 (Colloquial) - 상황별 의역 */}
          <div className="relative pl-5 border-l-4 border-gray-200">
            <div className="flex items-center gap-1.5 mb-1.5">
              <MessageCircle size={14} className="text-gray-400" />
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                구어체 (실제 의미)
              </span>
            </div>
            <p className="text-xl font-bold text-gray-500 italic leading-snug">
              "{result.colloquial}"
            </p>
          </div>

        </div>
      </div>

      {/* 4. 학습 팁 박스 (주황색 테두리 영역) */}
      <div className="bg-orange-50/80 border border-orange-100 rounded-2xl p-4 mb-8 flex gap-3">
        <div className="shrink-0 mt-0.5">
          <Lightbulb size={18} className="text-orange-400" />
        </div>
        <div className="space-y-1">
          <p className="text-[13px] text-orange-800 font-bold leading-none">한어 렌즈 가이드</p>
          <p className="text-xs text-orange-700/80 leading-relaxed">
            한자어 본연의 뜻을 공부할 때는 <b>문어체</b>를, 실제 현지에서의 느낌을 이해할 때는 <b>구어체</b>를 참고하세요!
          </p>
        </div>
      </div>

      {/* 5. 하단 액션 버튼 */}
      <button 
        onClick={onRetry}
        className="w-full py-4.5 bg-[#1C1C1C] hover:bg-black text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] py-4"
      >
        <RefreshCcw size={18} />
        다른 이미지 분석하기
      </button>
      
    </div>
  );
}