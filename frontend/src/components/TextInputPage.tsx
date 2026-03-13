import { useState } from 'react';
import { Type, X } from 'lucide-react';

interface TextInputPageProps {
  onAnalyze: (text: string) => void;
}

export default function TextInputPage({ onAnalyze }: TextInputPageProps) {
  const [text, setText] = useState('');

  return (
    <div className="max-w-md mx-auto px-4 animate-slide-up mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Type className="text-jade-500" size={24} />
        <h2 className="text-xl font-black text-gray-800">텍스트 입력</h2>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="여기에 중국어 텍스트를 붙여넣으세요..."
          className="w-full h-48 p-5 bg-white border-2 border-gray-200 rounded-3xl focus:border-jade-400 focus:ring-4 focus:ring-jade-50 outline-none resize-none text-gray-800 text-lg shadow-sm transition-all"
        />
        {text && (
          <button 
            onClick={() => setText('')} 
            className="absolute top-4 right-4 p-1 bg-gray-100 text-gray-400 rounded-full hover:bg-gray-200"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <button 
        onClick={() => onAnalyze(text)}
        disabled={text.trim().length === 0}
        className={`mt-6 w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all ${
          text.trim().length > 0 ? 'bg-jade-600 hover:bg-jade-700 active:scale-[0.98]' : 'bg-gray-200 cursor-not-allowed'
        }`}
      >
        텍스트 분석하기
      </button>
    </div>
  );
}