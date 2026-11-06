// Manual UI regression fixture: use a separate localhost port from your normal app.
// API responses are synthetic and never contact the translation/voice services.
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import App from '../src/App';
import '../src/index.css';
const baseline = localStorage.getItem('myVocab');
const words = [
 { word: '咖啡', pinyin: 'kā fēi', meaning: '커피' },
 { word: '谢谢', pinyin: 'xiè xie', meaning: '고마워요, 감사합니다' },
 { word: '准备', pinyin: 'zhǔn bèi', meaning: '준비하다, 마련하다' },
 { word: '喜欢', pinyin: 'xǐ huan', meaning: '좋아하다. 긴 뜻이 있어도 카드 안에서 자연스럽게 줄바꿈되어 모든 내용을 읽을 수 있어야 합니다.' },
];
localStorage.setItem('myVocab', JSON.stringify(words));
axios.defaults.adapter = async config => {
  if (config.url?.endsWith('/speak')) throw new Error('Voice service is intentionally disabled in this fixture.');
  await new Promise(resolve => setTimeout(resolve, 500));
  return { status:200,statusText:'OK',headers:{},config,data:{original:'我想喝一杯咖啡。今天和朋友一起学习中文。',pinyin:'wǒ xiǎng hē yì bēi kā fēi. jīn tiān hé péng you yì qǐ xué xí zhōng wén.',hanja_read:'아상갈일배가배. 금천화붕우일기학습중문.',colloquial:'커피 한 잔 마시고 싶어요. 오늘 친구와 함께 중국어를 공부해요.',literary:[...words,{word:'朋友',pinyin:'péng you',meaning:'친구'}]}};
};
createRoot(document.getElementById('fixture-controls')!).render(<div style={{padding:8,background:'#e4ece5',fontSize:12}}>디자인 검증용 샘플 · 실제 API 미사용 <button style={{padding:8}} onClick={() => { if(baseline === null) localStorage.removeItem('myVocab'); else localStorage.setItem('myVocab',baseline); location.href='/'; }}>샘플 정리하고 홈으로</button></div>);
createRoot(document.getElementById('root')!).render(<App/>);
