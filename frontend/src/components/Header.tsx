import { Book } from 'lucide-react';
interface HeaderProps {
  onLogoClick: () => void;
  onVocabClick: () => void;
}

export default function Header({ onLogoClick,onVocabClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full flex items-center p-4 border-b border-jade-100 bg-white/80 backdrop-blur-md">
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between"> {/* justify-between 추가 */}
       
        {/* 왼쪽: 로고 */}
        <div onClick={onLogoClick} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-jade-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">汉à</div>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-gray-800 leading-tight">Hanyu Lens</h1>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider">CHINESE TRANSLATOR</span>
          </div>
        </div>

        {/* 오른쪽: 단어장 아이콘 */}
        <button 
          onClick={onVocabClick}
          className="p-2.5 rounded-full bg-jade-50 text-jade-600 hover:bg-jade-100 transition-colors shadow-sm"
        >
          <Book size={20} />
        </button>
      </div>
    </header>
  );
}
