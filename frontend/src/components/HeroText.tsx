export default function HeroText() {
  return (
    // [메인 카피 영역] 텍스트 중앙 정렬, 상하 여백
    <section className="text-center mt-20 mb-16 px-4">
      
      <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 leading-snug">
        중국어 이미지를 찍어<br />
        <span className="text-jade-400">성조</span>와 <span className="text-jade-400">뜻</span>을 확인하세요
      </h2>
      
      {/* 서브 설명 텍스트 */}
      <p className="text-gray-500 text-sm md:text-base break-keep">
        한자를 직접 입력할 필요 없이 카메라로 비추기만 하면<br />
        병음과 한국어 번역을 즉시 제공합니다.
      </p>
    </section>
  );
}