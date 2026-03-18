import { Trash2 } from 'lucide-react';
import { useState } from 'react';

// 1. 저장된 단어의 모양을 정의합니다.
interface VocabItem {
  word: string;
  meaning: string;
}

interface VocabPageProps {
  onBack: () => void;
}

export default function VocabPage({ onBack }: VocabPageProps) {
  // 1. 단어장 데이터를 '상태(State)'로 관리합니다.
  const [words, setWords] = useState<VocabItem[]>(
    JSON.parse(localStorage.getItem('myVocab') || '[]')
  );

  // 2. 삭제 함수: 새로고침 없이 상태만 변경
  const deleteWord = (index: number) => {
    // 필터링된 배열 생성
    const updated = words.filter((_, i) => i !== index);
    
    // 로컬스토리지 업데이트
    localStorage.setItem('myVocab', JSON.stringify(updated));
    
    // 상태를 업데이트하여 화면을 즉시 다시 그림 (새로고침 X)
    setWords(updated);
  };

  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
      <h2 className="text-2xl font-black text-gray-800 mb-6 text-center">나의 단어장</h2>
      
      {words.length === 0 ? (
        <p className="text-gray-400 text-center mt-10">아직 저장된 단어가 없어요!</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {words.map((item, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-jade-100 flex justify-between items-center shadow-sm">
              <div>
                <p className="text-jade-600 font-bold text-lg">{item.word}</p>
                <p className="text-gray-600 text-sm">{item.meaning}</p>
              </div>
              <button 
                onClick={() => deleteWord(i)} 
                className="text-crimson-600 hover:text-crimson-800 transition-all p-2 rounded-full hover:bg-crimson-50"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <button 
        onClick={onBack} 
        className="mt-8 w-full py-4 rounded-2xl font-bold transition-all 
           bg-jade-200 text-jade-700 border border-jade-300 
           hover:bg-jade-300 hover:border-jade-400 
           active:scale-[0.98] active:bg-jade-400"
      >
         뒤로가기
      </button>
    </div>
  );
}