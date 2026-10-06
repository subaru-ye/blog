// 校验 UI_RULES.md 的对比度红线：亮暗两套主题下 fg / muted / accent / danger 对 bg 均 ≥ 4.5:1
// 用法：npm run check:contrast（解析 src/styles/global.css 中的 token 定义）
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');

function block(selector) {
  const re = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`);
  const m = css.match(re);
  if (!m) throw new Error(`找不到选择器块: ${selector}`);
  const vars = {};
  for (const [, name, value] of m[1].matchAll(/(--[a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    vars[name] = value;
  }
  return vars;
}

const light = block(':root');
// html[data-theme='dark'] 与 prefers-color-scheme 回退块取值相同，取前者
const dark = block("html[data-theme='dark']");

function luminance(hex) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i + 1, i + 3), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(fg, bg) {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

const CHECKS = ['--fg', '--muted', '--accent', '--danger'];
let failed = false;

for (const [name, tokens] of [['亮色', light], ['暗色', dark]]) {
  for (const key of CHECKS) {
    const r = ratio(tokens[key], tokens['--bg']);
    const ok = r >= 4.5;
    if (!ok) failed = true;
    console.log(`${ok ? '✓' : '✗'} ${name} ${key} (${tokens[key]}) on --bg (${tokens['--bg']}): ${r.toFixed(2)}:1`);
  }
}

if (failed) {
  console.error('\n对比度不达标，见上表 ✗ 项（UI_RULES.md 红线 ≥ 4.5:1）');
  process.exit(1);
}
console.log('\n全部通过');
