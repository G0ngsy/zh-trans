
import { RefreshCcw, MessageCircle, Lightbulb, Book} from 'lucide-react';

interface ResultCardProps {
  imageUrl: string | null;
  result: {
    original: string;    // 중국어 원문
    pinyin: string;      // 성조 포함 병음
    literary: VocabItem[]; // 단어장 데이터
    colloquial: string;  // 구어체 번역
    hanja_read: string;  // 한국식 한자 독음
    
  };
  onRetry: () => void;
}

// 단어장 아이템 타입 정의
interface VocabItem {
  word: string;
  meaning: string;
  pinyin: string;
}

export default function ResultCard({ imageUrl, result, onRetry }: ResultCardProps) {

  // 단어 저장 함수
  const saveToVocab = (word: string, meaning: string) => {
    // 저장된 데이터를 VocabItem 배열로 명확하게 가져옴
    const saved: VocabItem[] = JSON.parse(localStorage.getItem('myVocab') || '[]');
    
    // 중복 저장 방지
    if (!saved.find((item) => item.word === word)) {
      const newVocab = [...saved, { word, meaning }];
      localStorage.setItem('myVocab', JSON.stringify(newVocab));
      alert('단어장에 저장되었습니다!');
    } else {
      alert('이미 저장된 단어입니다.');
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in pb-10">
      
      {/* 1. 분석된 이미지 미리보기 */}
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
      <div className="bg-white border-2 border-jade-100 rounded-[2.5rem] shadow-xl shadow-jade-900/5 overflow-hidden mb-6">
        
        {/* [A] 헤더: 원문 + 병음 */}
        <div className="p-7 pb-6 bg-jade-50/30">
          <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight leading-tight break-all">
            {result.original}
          </h1>
          <p className="text-sunset-400 font-bold text-lg font-mono">
            {result.pinyin}
          </p>
        </div>

        {/* [B] 상세 분석 영역 */}
        <div className="p-7 pt-0 space-y-8">
          
          {/* 구분선 */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>

          {/* 1. 한국식 한자 독음 */}
          <div className="flex items-center gap-3">
            <div className="shrink-0 flex items-center gap-1.5 text-[10px] font-black text-jade-600/50 uppercase tracking-tighter">
              
              <span>한국식 독음</span>
            </div>
            <span className="px-3 py-1 bg-jade-100 text-jade-700 text-sm font-black rounded-xl border border-jade-200 shadow-sm">
              {result.hanja_read}
            </span>
          </div>

          {/* 2. 핵심 단어장 (Vocabulary) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-jade-50 rounded-xl flex items-center justify-center text-jade-500 border border-jade-100">
                <Book size={20} />
              </div>
              <div>
                <span className="text-[11px] font-black text-jade-600 uppercase tracking-widest opacity-70 leading-none">WORD LIST</span>
                <h4 className="text-sm font-bold text-gray-700">단어 뜻 풀이</h4>
              </div>
            </div>

            {/* 단어 카드 그리드 (글자가 길어질 것을 대비해 grid-cols-2 기본 적용) */}
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1 pr-2 scrollbar-thin">
               {/* result.literary 뒤에 ?를 붙여서 데이터가 없을 때 에러 방지 */}
              {result.literary
                // 1단계 필터: 한자가 하나라도 포함된 단어만 통과
                ?.filter(item => /[\u4e00-\u9fff]/.test(item.word)) 
                // 2단계 렌더링
                .map((item, i) => (
                <div 
                  key={i} 
                  onContextMenu={(e) => { e.preventDefault(); saveToVocab(item.word, item.meaning); }} // 마우스 우클릭 혹은 꾹 누르기
                  className="bg-gray-50/50 border border-gray-100 rounded-2xl p-3.5 transition-all hover:border-jade-300 hover:bg-white hover:shadow-md group"
                >
                  {/* 1. 한자 */}
                  <p className="text-jade-600 font-black text-xl mb-0.5 group-hover:scale-105 transition-transform origin-left">
                    {item.word}
                  </p>
                  
                  {/* 2. 병음 (성조 포함) */}
                  <p className="text-sunset-400 font-bold text-xs font-mono mb-2">
                    {item.pinyin}
                  </p>

                  {/* 3. 뜻 */}
                  <p className="text-gray-600 text-xs font-bold truncate border-t border-gray-50 pt-2">
                    {item.meaning}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full"></div>

          {/* 3. 구어체 (Colloquial) */}
          <div className="flex gap-4 pb-4">
            <div className="shrink-0 w-10 h-10 bg-jade-50 rounded-xl flex items-center justify-center text-jade-500 border border-jade-100">
              <MessageCircle size={20} />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-black text-jade-600 uppercase tracking-widest opacity-70">FULL TEXT</span>
              <h4 className="text-sm font-bold text-gray-700">전체 문장 해석</h4>
              <p className="text-xl font-bold text-gray-700 italic leading-snug break-keep">
                "{result.colloquial}"
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 4. 학습 팁 박스 */}
      <div className="bg-orange-50/80 border border-orange-100 rounded-3xl p-5 mb-8 flex gap-4 items-center">
        <div className="shrink-0 bg-white p-2 rounded-2xl shadow-sm text-orange-400">
          <Lightbulb size={24} />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-orange-800 font-bold leading-none">한어 렌즈 가이드</p>
          <p className="text-[11px] text-orange-700/80 leading-relaxed font-medium">
            개별 단어의 뜻이 궁금할 땐 <b>단어 뜻 풀이</b>를,<br/>
      문장의 전체적인 흐름은 <b>전체 문장 해석</b>을 참고하세요!
          </p>
        </div>
      </div>

      {/* 5. 하단 버튼 */}
      <button 
        onClick={onRetry}
        className="w-full py-5 bg-jade-500 hover:bg-jade-600 text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
      >
        <RefreshCcw size={18} />
        <span>다른 이미지 분석하기</span>
      </button>
      
    </div>
  );
}