interface HeaderProps {
  onLogoClick: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  return (
    <header className="w-full flex items-center p-4 border-b border-jade-100 bg-white">
      <div className="max-w-4xl w-full mx-auto">
        {/* 로고와 텍스트 전체를 감싸서 클릭 범위를 넓힙니다 */}
        <div 
          onClick={onLogoClick}
          className="flex items-center gap-3 cursor-pointer  transition-opacity w-fit"
        >
          {/* 로고 아이콘 */}
          <div className="w-10 h-10 rounded-xl bg-jade-400 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-jade-100 hover:opacity-80">
            汉à
          </div>

          {/* 타이틀 및 서브타이틀 */}
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-gray-800 leading-tight">
              Hanyu Lens
            </h1>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider">
              CHINESE TRANSLATOR
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}