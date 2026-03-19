import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { RefreshCcw, MessageCircle, Lightbulb, Book, Volume2, Plus, VolumeX} from 'lucide-react';

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
  const [gender, setGender] = useState<'female' | 'male'>('female');
  
    // ✨ 1. 여기에 useRef를 반드시 먼저 선언하세요!
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ✨ 2. 컴포넌트가 화면에서 사라질 때(Unmount) 오디오 자동 정지
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, []);
  


  // 단어 저장 함수
  const saveToVocab = (word: string, meaning: string,pinyin: string) => {
    // 저장된 데이터를 VocabItem 배열로 명확하게 가져옴
    const saved: VocabItem[] = JSON.parse(localStorage.getItem('myVocab') || '[]');
    
    // 중복 저장 방지
    if (!saved.find((item) => item.word === word)) {
      const newVocab = [...saved, { word, meaning ,pinyin }];
      localStorage.setItem('myVocab', JSON.stringify(newVocab));
      alert('단어장에 저장되었습니다!');
    } else {
      alert('이미 저장된 단어입니다.');
    }
  };


  const playAudio = async (text: string, voiceGender: 'female' | 'male') => {
    // 1. 기존에 재생 중인 오디오가 있다면 멈춤
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // 2. 새로운 오디오 객체 생성
    const audio = new Audio();
    audioRef.current = audio; // ✨ [추가] 새로 만든 객체를 ref에 저장!

    // 브라우저 재생 권한 획득용 빈 재생
    audio.play().catch(() => {});

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const fallbackApiUrl = 'https://suny0731-hanyu-lens-fallback.hf.space';

    try {
      const res = await axios.post(`${apiUrl}/speak`, { 
        text: text, 
        gender: voiceGender 
      }, {
        headers: { 'ngrok-skip-browser-warning': '69420' },
        timeout: 3000
      });
      console.log("서버가 보낸 데이터:", res.data);
      audio.src = `data:audio/mp3;base64,${res.data.audio}`;
      audio.play();
    } catch {
      try {
        const fallbackRes = await axios.post(`${fallbackApiUrl}/speak`, { 
          text: text, 
          gender: voiceGender 
        });
        audio.src = `data:audio/mp3;base64,${fallbackRes.data.audio}`;
        audio.play();
      } catch (fallbackError) {
        console.error("단어 발음 재생 실패:", fallbackError);
        alert("발음 재생에 실패했습니다.");
      }
    }
  };

  return (
    <div className="flex flex-col  h-full animate-fade-in pb-10">
      
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
      <div className="bg-white border-2 border-jade-100 rounded-2xl md:rounded-[2.5rem] shadow-xl md:shadow-2xl mb-4 md:mb-6">
        
        {/* [A] 헤더: 원문 + 병음 */}
        <div className="p-7 pb-6 bg-jade-50/30">
          <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight leading-tight break-all whitespace-pre-wrap">
            {result.original}
          </h1>

          {/* 병음 & 스피커 */}
          <div className="flex gap-2 mb-3 ">
            <div className="flex items-center gap-2 ">
           <button onClick={() => playAudio(result.original, gender)} className="text-jade-500 hover:text-jade-700 transition-colors cursor-pointer"><Volume2 size={24} /></button>
          <button 
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
              }
            }}
            className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-all cursor-pointer">
            <VolumeX size={18} fill="currentColor" />
          </button>
          {/* [여성 버튼] */}
          <button 
            onClick={() => setGender('female')} 
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              gender === 'female' 
                ? 'bg-jade-500 text-white shadow-md' 
                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
            }`}
          >
            여성
          </button>

          {/* [남성 버튼] */}
          <button 
            onClick={() => setGender('male')} 
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              gender === 'male' 
                ? 'bg-jade-500 text-white shadow-md' 
                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
            }`}
          >
            남성
          </button>
        </div>
      </div>
        <p className="text-orange-500 font-bold text-lg font-mono  break-all whitespace-pre-wrap">{result.pinyin}</p>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-1 pr-2 scrollbar-thin">
               {/* result.literary 뒤에 ?를 붙여서 데이터가 없을 때 에러 방지 */}
              {Array.isArray(result.literary) && result.literary
                // 1단계 필터: 한자가 하나라도 포함된 단어만 통과
                ?.filter(item => /[\u4e00-\u9fff]/.test(item.word || '')) 
                // 2단계 렌더링
                .map((item, i) => (
                <div 
                    key={i} 
                    onContextMenu={(e) => { e.preventDefault(); saveToVocab(item.word, item.meaning,item.pinyin); }} 
                    className="relative bg-gray-50/50 border border-gray-100 rounded-2xl p-3.5 transition-all hover:border-jade-300 hover:bg-white hover:shadow-md group cursor-pointer"
                  >
                    
                  {/* 1. 한자 */}
                  <p className="text-jade-600 font-black text-xl mb-0.5 group-hover:scale-105 transition-transform origin-left">
                    {item.word}
                  </p>

                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    
                    
                    {/* 저장 버튼 (+) */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); saveToVocab(item.word, item.meaning,item.pinyin); }}
                      className="p-1.5 text-sunset-300 hover:text-sunset-400 rounded-full hover:bg-sunset-50 cursor-pointer"
                    >
                      <Plus size={16} /> 
                    </button>

                    {/* 듣기 버튼 */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); playAudio(item.word, gender); }}
                      className="p-1.5 text-jade-400 hover:text-jade-600 rounded-full hover:bg-jade-50 cursor-pointer"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>

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
              <p className="text-xl font-bold text-gray-700 italic leading-snug break-keep ">
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