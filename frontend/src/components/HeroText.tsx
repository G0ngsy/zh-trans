import panda from '../assets/panda01.png';
export default function HeroText() {
  return <section className="home-hero"><div><h1>발견한 중국어를<br />나의 단어로</h1></div><img src={panda} alt="중국어 학습을 도와주는 판다" width="180" height="180" /><p className="hero-description">카메라로 발견하고, 병음과 뜻으로 이해하세요.</p></section>;
}
