import { createRoot } from 'react-dom/client';
import ResultCard from '../src/components/ResultCard';
import Header from '../src/components/Header';
import BottomNav from '../src/components/BottomNav';
import '../src/index.css';
const sample = { original:'我想喝一杯咖啡。', pinyin:'wǒ xiǎng hē yì bēi kā fēi.', hanja_read:'아상갈일배가배', colloquial:'커피 한 잔 마시고 싶어요.', literary:[{word:'我',pinyin:'wǒ',meaning:'나'},{word:'想',pinyin:'xiǎng',meaning:'~하고 싶다'},{word:'喝',pinyin:'hē',meaning:'마시다'},{word:'一杯',pinyin:'yì bēi',meaning:'한 잔'},{word:'咖啡',pinyin:'kā fēi',meaning:'커피'}] };
const home = () => { location.href='/'; };
createRoot(document.getElementById('root')!).render(<div className="app-shell"><Header onLogoClick={home}/><main className="with-bottom-nav"><div className="result-page page-width"><p style={{fontSize:12,color:'#647067',paddingTop:16}}>사진 분석 결과 예시 · 샘플 이미지와 분석 데이터</p><ResultCard imageUrl="./sample-chinese.svg" result={sample} onRetry={home}/></div></main><BottomNav active="RESULT" onHome={home} onScan={home} onVocab={home}/></div>);
