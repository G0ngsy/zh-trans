import { useRef, useState } from 'react'; // useRef 추가
import { CirclePause, CirclePlay, Trash2} from 'lucide-react';
import axios from 'axios';

interface VocabItem {
  word: string;
  meaning: string;
  pinyin: string;
}

interface VocabPageProps {
  onBack: () => void;
}


export default function VocabPage({ onBack }: VocabPageProps) {
  const [words, setWords] = useState<VocabItem[]>(
    JSON.parse(localStorage.getItem('myVocab') || '[]')
  );

  // ✨ 1. 오디오 참조용 변수 추가
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingWord, setPlayingWord] = useState<string | null>(null);


  // ✨ 2. 발음 재생 함수 (ResultCard와 동일하게 성별 인자 추가)
  const playAudio = async (text: string) => {
    // 1. 중복 재생 방지 및 기존 오디오 초기화
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // 2. 현재 재생 중인 단어 상태 설정 (아이콘이 즉시 '정지'로 변함)
    setPlayingWord(text);

    const audio = new Audio();
    audioRef.current = audio;

    // 3. 재생이 자연스럽게 끝나면 아이콘을 다시 '재생'으로 복구
    audio.onended = () => {
    if (playingWord === text) setPlayingWord(null);
     };  // 현재 재생 중인 단어가 이 오디오와 일치할 때만 상태 초기화

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const fallbackApiUrl = 'https://suny0731-hanyu-lens-fallback.hf.space';

    try {
      const res = await axios.post(`${apiUrl}/speak`, { text: text, gender: 'female' }, {
        headers: { 'ngrok-skip-browser-warning': '69420' },
        timeout: 1000
      });

      // ✨응답이 왔을 때, 사용자가 그 사이에 다른 단어를 눌렀는지 확인
      if (audioRef.current !== audio) return; 

      audio.src = `data:audio/mp3;base64,${res.data.audio}`;
      await audio.play(); // 소리 재생 시작
      
    } catch {
      try {
        const fallbackRes = await axios.post(`${fallbackApiUrl}/speak`, { text: text, gender: 'female' });
        if (audioRef.current !== audio) return; // [보완]

        audio.src = `data:audio/mp3;base64,${fallbackRes.data.audio}`;
        await audio.play();
      } catch (e) {
        setPlayingWord(null);
        console.error("재생 실패:", e);
      }
    }
  };

  const deleteWord = (index: number) => {
    const updated = words.filter((_, i) => i !== index);
    localStorage.setItem('myVocab', JSON.stringify(updated));
    setWords(updated);
  };

  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
      <h2 className="text-2xl font-black text-gray-800 mb-6 text-center">나의 단어장</h2>
      
      {words.length === 0 ? (
        <p className="text-gray-400 text-center mt-10">아직 저장한 단어가 없어요!</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {words.map((item, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-jade-100 flex items-center shadow-sm hover:shadow-md transition-shadow">
              
             {/* 스피커/정지 통합 버튼 */}
              <button 
                onClick={() => {
                  if (playingWord === item.word) {
                    // 현재 재생 중인 단어를 다시 누르면 정지
                    audioRef.current?.pause();
                    setPlayingWord(null);
                  } else {
                    // 다른 단어 재생
                    playAudio(item.word);
                  }
                }} 
                className={`mr-4 transition-all p-1 rounded-full cursor-pointer
                  ${playingWord === item.word ? 'text-gray-400 hover:text-gray-500' : 'text-jade-500 hover:text-jade-700'}`}
              >
                   {playingWord === item.word ? (<CirclePause size={24} /> ) : (<CirclePlay size={24} />)}
              </button>

              <div className="flex-1">
                <p className="text-jade-600 font-bold text-lg">{item.word}</p>
                <p className="text-sunset-400 font-bold text-xs font-mono mb-2">
                    {item.pinyin}
                  </p>
                <p className="text-gray-600 text-sm">{item.meaning}</p>
              </div>

              {/* 삭제 버튼 */}
              <button 
                onClick={() => deleteWord(i)} 
                className="text-crimson-600 hover:text-crimson-800 transition-all p-2 rounded-full hover:bg-crimson-50 cursor-pointer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex gap-3 mt-8">
        {/* 1. 이전 화면으로 이동 (history.back) */}
        <button 
          onClick={() => window.history.back()}
          className="flex-1 py-4 rounded-2xl font-bold transition-all bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 active:scale-[0.98]"
        >
          이전으로
        </button>

        {/* 2. 홈으로 이동 (onBack 함수 실행) */}
        <button 
          onClick={onBack}
          className="flex-1 py-4 rounded-2xl font-bold transition-all bg-jade-500 text-white shadow-lg shadow-jade-200 hover:bg-jade-600 active:scale-[0.98]"
        >
          홈으로
        </button>
      </div>
    </div>
  );
}