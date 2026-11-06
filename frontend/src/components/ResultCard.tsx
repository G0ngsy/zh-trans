import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { RefreshCcw, Volume2, Plus, Check, Pause } from 'lucide-react';
import { readVocabulary } from '../vocabulary';

interface ResultCardProps {
  imageUrl: string | null;
  result: {
    original: string;    // 중국어 원문
    pinyin: string;      // 성조 포함 병음
    literary: VocabItem[]; // 단어장 데이터
    colloquial: string;  // 구어체 번역
    hanja_read: string;  // 한국식 한자 독음

  };
  onRetry: () => void;
}

// 단어장 아이템 타입 정의
interface VocabItem {
  word: string;
  meaning: string;
  pinyin: string;
}

export default function ResultCard({ imageUrl, result, onRetry }: ResultCardProps) {
  const [savedWords, setSavedWords] = useState(() => new Set(readVocabulary().map(item => item.word)));
  const [saveMessage, setSaveMessage] = useState('');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  //  상태 추가
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);  //  현재 재생 중인 segment의 인덱스나 내용을 저장할 상태

  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => { requestRef.current?.abort(); audioRef.current?.pause(); audioRef.current = null; }, []);
  const saveToVocab = (word: string, meaning: string, pinyin: string) => {
    try {
      const saved = readVocabulary();
      if (!saved.some(item => item.word === word)) localStorage.setItem('myVocab', JSON.stringify([...saved, { word, meaning, pinyin }]));
      setSavedWords(new Set([...saved.map(item => item.word), word]));
      setSaveMessage(`${word} 단어장에 저장했어요.`);
    } catch { setSaveMessage('단어를 저장하지 못했어요. 저장 공간을 확인해주세요.'); }
  };
  const playAudio = async (text: string, voiceGender: 'female' | 'male') => {
    requestRef.current?.abort(); audioRef.current?.pause();
    const audio = new Audio(); audioRef.current = audio;
    const controller = new AbortController(); requestRef.current = controller;
    setActiveSegment(text); setIsPlaying(false);
    audio.onended = () => { if (audioRef.current === audio) { setIsPlaying(false); setActiveSegment(null); } };
    try {
      let response;
      try { response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/speak`, { text, gender: voiceGender }, { signal: controller.signal, timeout: 1000, headers: { 'ngrok-skip-browser-warning': '69420' } }); }
      catch { if (controller.signal.aborted) return; response = await axios.post('https://suny0731-hanyu-lens-fallback.hf.space/speak', { text, gender: voiceGender }, { signal: controller.signal, timeout: 10000 }); }
      if (audioRef.current !== audio) return;
      audio.src = `data:audio/mp3;base64,${response.data.audio}`; await audio.play();
      if (audioRef.current === audio) setIsPlaying(true);
    } catch { if (!controller.signal.aborted && audioRef.current === audio) { setIsPlaying(false); setActiveSegment(null); setSaveMessage('발음을 불러오지 못했어요. 잠시 후 다시 시도해주세요.'); } }
  };
    const stop = () => { requestRef.current?.abort(); audioRef.current?.pause(); audioRef.current = null; setIsPlaying(false); setActiveSegment(null); };
  return <section className="result-content">
    <div className="page-title"><h1>분석 결과</h1><span className="count-badge">분석 완료</span></div>
    {imageUrl && <div className="result-image"><img src={imageUrl} alt="분석한 이미지"/></div>}
    <article className="paper-card sentence-card">
      <p className="eyebrow">발견한 문장</p><h2 className="hanzi original-text">{result.original}</h2>
      <div className="sentence-pinyin">{result.pinyin.split('\n').map((line, i) => <p key={i}>{line.replace(/([。！？，；、,!?])\s*/g, '$1\n').split('\n').filter(Boolean).map((segment, j) => <button key={j} className={activeSegment === segment.trim() ? 'segment active' : 'segment'} onClick={() => void playAudio(segment.trim(), gender)} aria-label={`${segment} 발음 듣기`}>{segment}</button>)}</p>)}</div>
      <p className="translation">{result.colloquial}</p>
      <div className="voice-controls"><button className="primary-button" onClick={() => activeSegment ? stop() : void playAudio(result.original, gender)}>{isPlaying || activeSegment ? <Pause size={19}/> : <Volume2 size={19}/>} {activeSegment ? '재생 정지' : '문장 듣기'}</button><div className="voice-options" role="group" aria-label="발음 목소리">{(['female','male'] as const).map(value => <button key={value} aria-pressed={gender === value} onClick={() => setGender(value)}>{value === 'female' ? '여성' : '남성'}</button>)}</div></div>
      {result.hanja_read && <p className="hanja-reading"><span>한국식 독음</span> {result.hanja_read}</p>}
    </article>
    <div className="word-section-heading"><h2>단어 뜻 풀이</h2><span>마음에 드는 단어를 모아보세요</span></div><p className="status-message" role="status">{saveMessage}</p>
    <div className="result-words">{Array.isArray(result.literary) && result.literary.filter(item => /[\u4e00-\u9fff]/.test(item.word || '')).map((item, i) => <article className="paper-card result-word" key={`${item.word}-${i}`}><div><p className="pinyin">{item.pinyin}</p><h3 className="hanzi">{item.word}</h3><p className="word-meaning">{item.meaning}</p></div><div className="word-actions"><button className="icon-button listen-button" onClick={() => void playAudio(item.word, gender)} aria-label={`${item.word} 발음 듣기`}><Volume2 size={21}/></button><button className="icon-button save-button" onClick={() => saveToVocab(item.word, item.meaning, item.pinyin)} aria-label={`${item.word} ${savedWords.has(item.word) ? '저장됨' : '저장'}`} aria-pressed={savedWords.has(item.word)} disabled={savedWords.has(item.word)}>{savedWords.has(item.word) ? <Check size={21}/> : <Plus size={21}/>}</button></div></article>)}</div>
    <aside className="learning-note">단어의 뜻과 문장 전체의 의미를 함께 살펴보세요. 듣기 버튼으로 성조를 익히고, + 버튼으로 단어를 저장할 수 있어요.</aside>
    <button className="primary-button retry-button" onClick={onRetry}><RefreshCcw size={18}/>다른 중국어 분석하기</button>
  </section>;
}
