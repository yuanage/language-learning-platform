// 文本相似度：归一化 + 编辑距离比值，用于口语跟读与听力听写判分
function normalize(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, ' ')
    .trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

// 返回 0~100 的相似度得分
function similarityScore(target, said) {
  const t = normalize(target), s = normalize(said);
  if (!t && !s) return 100;
  if (!t || !s) return 0;
  const dist = levenshtein(t, s);
  const score = Math.max(0, 1 - dist / Math.max(t.length, s.length));
  return Math.round(score * 1000) / 10;
}

module.exports = { normalize, similarityScore };
