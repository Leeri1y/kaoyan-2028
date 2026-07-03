// 生成基于日期字符串的种子。
//
// 之前 words.js / quotes.js 里用的是 "年+月+日 直接相加"（如 2026+7+2），
// 加法可交换，很容易撞出相同的种子（例如 2026-07-02 和 2026-06-03 算出的
// 种子完全一样），导致不同日期抽到一模一样的单词/金句。
//
// 这里改成把整段日期字符串当成一个数字（如 "2026-07-02" -> 20260702），
// 每天的种子值天然离散、不会因为加法巧合而撞在一起。
function dateSeed(dateStr) {
  const digits = String(dateStr).replace(/-/g, '');
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : 0;
}

module.exports = { dateSeed };
