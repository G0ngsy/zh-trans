export interface VocabItem { word: string; pinyin: string; meaning: string }
export function readVocabulary(): VocabItem[] {
  try { const value: unknown = JSON.parse(localStorage.getItem('myVocab') || '[]');
    return Array.isArray(value) ? value.filter((item): item is VocabItem => item && typeof item.word === 'string' && typeof item.meaning === 'string' && typeof item.pinyin === 'string') : [];
  } catch { return []; }
}
export function normalizeSearch(text: string): string { return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim(); }
export function matchesVocabulary(item: VocabItem, query: string): boolean {
  const q = normalizeSearch(query);
  return [item.word, item.pinyin, item.meaning].some(value => normalizeSearch(value).includes(q));
}
