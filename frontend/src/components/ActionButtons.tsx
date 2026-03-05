
// 부모에게 신호를 보낼 함수 타입 정의
interface ActionButtonsProps {
  onCameraClick: () => void; // "카메라 버튼 눌렀어!"
  onUploadClick: () => void; // "업로드 버튼 눌렀어!"
}

export default function ActionButtons({ onCameraClick, onUploadClick }: ActionButtonsProps) {
  return (
    <section className="flex flex-col sm:flex-row items-center justify-center gap-6 px-4 max-w-2xl mx-auto">
      
      {/* 1. 카메라 촬영 버튼 */}
      <button 
        onClick={onCameraClick} // 클릭 시 실행
        className="w-full sm:w-1/2 flex flex-col items-center justify-center gap-4 p-10 bg-white border-2 border-transparent rounded-3xl shadow-sm hover:border-jade-300 hover:shadow-lg transition-all group cursor-pointer"
      >
        <div className="w-16 h-16 rounded-full bg-jade-50 flex items-center justify-center text-jade-400 group-hover:scale-110 transition-transform">
          {/* 카메라 아이콘 */}
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span className="text-gray-700 font-bold text-lg">카메라로 촬영</span>
      </button>

      {/* 2. 이미지 업로드 버튼 */}
      <button 
        onClick={onUploadClick} // 클릭 시 실행
        className="w-full sm:w-1/2 flex flex-col items-center justify-center gap-4 p-10 bg-white border-2 border-transparent rounded-3xl shadow-sm hover:border-jade-300 hover:shadow-lg transition-all group cursor-pointer"
      >
        <div className="w-16 h-16 rounded-full bg-jade-50 flex items-center justify-center text-jade-400 group-hover:scale-110 transition-transform">
          {/* 업로드 아이콘 */}
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <span className="text-gray-700 font-bold text-lg">이미지 업로드</span>
      </button>

    </section>
  );
}