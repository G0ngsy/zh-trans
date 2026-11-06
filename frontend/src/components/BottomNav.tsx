import { House, ScanLine, NotebookPen } from 'lucide-react';
interface Props { active: 'HOME' | 'VOCAB' | 'RESULT'; onHome: () => void; onScan: () => void; onVocab: () => void }
export default function BottomNav({ active, onHome, onScan, onVocab }: Props) {
  return <nav className="bottom-nav" aria-label="주요 메뉴"><div>
    <button onClick={onHome} aria-current={active === 'HOME' ? 'page' : undefined}><House size={23}/><span>홈</span></button>
    <button onClick={onScan} className="scan-nav"><span className="scan-circle"><ScanLine size={27}/></span><span>스캔</span></button>
    <button onClick={onVocab} aria-current={active === 'VOCAB' ? 'page' : undefined}><NotebookPen size={23}/><span>단어장</span></button>
  </div></nav>;
}
