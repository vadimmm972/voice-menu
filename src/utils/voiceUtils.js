// src/voiceUtils.js

export function similarity(a, b) {
  a = a.split(' ');
  b = b.split(' ');
  const shared = a.filter(word => b.includes(word)).length;
  return shared / Math.max(a.length, b.length);
}

export function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function fuzzyCandidates(items, query) {
  const arr = items.map(i => ({
    ...i,
    lev: levenshtein(i.name.toLowerCase(), query.toLowerCase())
  }));
  arr.sort((a, b) => a.lev - b.lev);
  return arr.filter(a => a.lev <= 2);
}
