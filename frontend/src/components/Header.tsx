
export default function Header() {
  return (
    // [헤더 영역] 상단 고정, 하단 테두리로 구분감 부여
    <header className="w-full flex items-center p-4 border-b border-jade-100 bg-white">
      <div className="max-w-4xl w-full mx-auto flex items-center gap-3">
       
        <div className="w-10 h-10 rounded-xl bg-jade-400 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-jade-100">
          汉à
        </div>
        
        {/* [타이틀 및 서브타이틀] */}
        <div className="flex flex-col">
          <h1 className="text-xl font-extrabold text-gray-800 leading-tight">
            Hanyu Lens
          </h1>
          <span className="text-[10px] font-bold text-gray-400 tracking-wider">
            CHINESE TRANSLATOR
          </span>
        </div>
      </div>
    </header>
  );
}
