import { useState } from 'react';
import { Camera, ImageUp, ScanLine, ArrowRight, Search, TextSearch } from 'lucide-react';
interface ActionButtonsProps { onCameraClick: () => void; onUploadClick: () => void; onRealtimeClick: () => void; onTextAnalyze: (text: string) => void }
export default function ActionButtons({ onCameraClick, onUploadClick, onRealtimeClick, onTextAnalyze }: ActionButtonsProps) {
  const [inputText, setInputText] = useState('');
  return <section className="home-actions" aria-label="중국어 분석 방법">
    <button onClick={onRealtimeClick} className="ar-action"><span className="action-symbol"><ScanLine size={26}/></span><span><strong>실시간 AR 번역</strong><small>카메라로 비추면 병음과 성조를 확인해요</small></span><ArrowRight size={22}/></button>
    <div className="secondary-actions"><button onClick={onCameraClick}><Camera size={20}/>카메라 촬영</button><button onClick={onUploadClick}><ImageUp size={20}/>이미지 업로드</button></div>
    <form className="paper-card text-analysis" onSubmit={e => { e.preventDefault(); if (inputText.trim()) onTextAnalyze(inputText.trim()); }}>
      <div className="section-label"><h2><TextSearch size={20}/>텍스트 검색</h2></div>
      <label className="sr-only" htmlFor="chinese-input">분석할 중국어</label><textarea id="chinese-input" placeholder="중국어를 입력하세요" value={inputText} onChange={e => setInputText(e.target.value)} />
      <div className="input-footer"><button type="submit" className="primary-button" disabled={!inputText.trim()}>분석하기<Search size={17}/></button></div>
    </form>
    <p className="home-note">낯선 한자도, 익숙한 나의 단어가 되도록.</p>
  </section>;
}
