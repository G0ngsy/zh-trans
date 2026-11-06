import { useEffect, useRef, useState } from 'react';
import { Pause, Volume2, Trash2, Search, BookOpen, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { readVocabulary, matchesVocabulary } from '../vocabulary';
interface VocabPageProps { onBack: () => void }
export default function VocabPage({ onBack }: VocabPageProps) {
  const [words, setWords] = useState(readVocabulary);
  const [query, setQuery] = useState('');
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const stopAudio = () => { requestRef.current?.abort(); requestRef.current = null; audioRef.current?.pause(); audioRef.current = null; setPlayingWord(null); };
  useEffect(() => () => { requestRef.current?.abort(); audioRef.current?.pause(); audioRef.current = null; }, []);
  const playAudio = async (text: string) => {
    if (playingWord === text) { stopAudio(); return; }
    stopAudio(); setMessage(''); setPlayingWord(text);
    const audio = new Audio(); audioRef.current = audio;
    const controller = new AbortController(); requestRef.current = controller;
    audio.onended = () => { if (audioRef.current === audio) setPlayingWord(null); };
    try {
      let response;
      try { response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/speak`, { text, gender: 'female' }, { signal: controller.signal, timeout: 1000, headers: { 'ngrok-skip-browser-warning': '69420' } }); }
      catch { if (controller.signal.aborted) return; response = await axios.post('https://suny0731-hanyu-lens-fallback.hf.space/speak', { text, gender: 'female' }, { signal: controller.signal, timeout: 10000 }); }
      if (audioRef.current !== audio) return;
      audio.src = `data:audio/mp3;base64,${response.data.audio}`; await audio.play();
    } catch { if (!controller.signal.aborted && audioRef.current === audio) { setPlayingWord(null); setMessage('발음을 불러오지 못했어요. 잠시 후 다시 시도해주세요.'); } }
  };
  const remove = (index: number) => {
    const next = words.filter((_, i) => i !== index);
    try { localStorage.setItem('myVocab', JSON.stringify(next)); if (playingWord === words[index].word) stopAudio(); setWords(next); setMessage('단어를 삭제했어요.'); }
    catch { setMessage('저장 공간에 접근하지 못했어요. 다시 시도해주세요.'); }
  };
  const filtered = words.map((item, index) => ({ item, index })).filter(({ item }) => matchesVocabulary(item, query));
  return <section className="vocab-page page-width"><div className="page-title"><h1>나의 단어장 <span className="count-badge">총 {words.length}개</span></h1><BookOpen size={24} aria-hidden="true"/></div>
    <label className="vocab-search"><Search size={23}/><span className="sr-only">단어, 병음, 한국어 뜻 검색</span><input type="search" placeholder="단어, 병음, 한국어 뜻 검색" value={query} onChange={e => setQuery(e.target.value)}/></label>
    <p className="list-summary" aria-live="polite">{query ? `검색 결과 ${filtered.length}개` : '차곡차곡 모은 나의 중국어'}</p>
    <p role="status" className="status-message">{message}</p>
    {filtered.length ? <div className="vocab-grid">{filtered.map(({ item, index }) => <article className="paper-card vocab-card" key={`${item.word}-${index}`}><div className="vocab-card-body"><p className="pinyin">{item.pinyin}</p><h2 className="hanzi">{item.word}</h2><p className="word-meaning">{item.meaning}</p></div><div className="word-actions"><button className="icon-button listen-button" aria-label={`${item.word} ${playingWord === item.word ? '발음 정지' : '발음 듣기'}`} aria-pressed={playingWord === item.word} onClick={() => void playAudio(item.word)}>{playingWord === item.word ? <Pause size={22}/> : <Volume2 size={22}/>}</button><button className="icon-button delete-button" aria-label={`${item.word} 삭제`} onClick={() => remove(index)}><Trash2 size={21}/></button></div></article>)}</div> : <div className="paper-card empty-state"><BookOpen size={40}/><h2>{words.length ? '검색 결과가 없어요' : '아직 저장한 단어가 없어요'}</h2><p>{words.length ? '다른 한자, 병음 또는 한국어 뜻으로 찾아보세요.' : '중국어를 분석하고 마음에 드는 단어를 저장해보세요.'}</p>{words.length ? <button className="secondary-button" onClick={() => setQuery('')}>검색 초기화</button> : <button className="primary-button" onClick={onBack}><ArrowLeft size={18}/>중국어 발견하러 가기</button>}</div>}
    {words.length > 0 && <p className="vocab-hint"><Volume2 size={17}/>스피커를 눌러 발음과 성조를 확인하세요.</p>}
  </section>;
}
