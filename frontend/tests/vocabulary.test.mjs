import assert from 'node:assert/strict';
import { matchesVocabulary, readVocabulary } from '../src/vocabulary.ts';
const coffee = { word: '咖啡', pinyin: 'kā fēi', meaning: '커피' };
assert.ok(matchesVocabulary(coffee, 'KA FEI'));
assert.ok(matchesVocabulary(coffee, 'kā fēi'));
assert.ok(matchesVocabulary(coffee, '咖'));
assert.ok(matchesVocabulary(coffee, '커피'));
assert.ok(!matchesVocabulary(coffee, '친구'));
assert.ok(matchesVocabulary({word:'准备',pinyin:'zhǔn bèi',meaning:'준비하다'}, 'ZHUN BEI'));
const original = globalThis.localStorage;
try {
  globalThis.localStorage = { getItem: () => JSON.stringify([coffee]) };
  assert.deepEqual(readVocabulary(), [coffee]);
  globalThis.localStorage = { getItem: () => '{broken' };
  assert.deepEqual(readVocabulary(), []);
} finally { globalThis.localStorage = original; }
console.log('PASS vocabulary: Chinese/Korean, case and tone insensitive search, existing records, invalid storage');
