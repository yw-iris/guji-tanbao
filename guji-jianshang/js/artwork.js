/* ============================================================
 *  文物 SVG 图形库
 *  ------------------------------------------------------------
 *  Demo 阶段用手绘 SVG 剪影代替真实照片：自包含、无外链、
 *  不会出现破图，且风格统一。正式版可替换为博物馆授权高清图
 *  （每张卡片已预留 image 字段的位置）。
 * ============================================================ */

const BRONZE_DEFS = `
  <defs>
    <linearGradient id="bronze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"   stop-color="#d9b671"/>
      <stop offset="0.45" stop-color="#a8813e"/>
      <stop offset="1"   stop-color="#5f4620"/>
    </linearGradient>
    <linearGradient id="bronzeLight" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0"   stop-color="#e8cd8f"/>
      <stop offset="1"   stop-color="#8a6a34"/>
    </linearGradient>
    <radialGradient id="patina" cx="0.5" cy="0.4" r="0.7">
      <stop offset="0"   stop-color="#6f9c7a" stop-opacity="0.0"/>
      <stop offset="1"   stop-color="#3c6b52" stop-opacity="0.35"/>
    </radialGradient>
  </defs>`;

const SHAPES = {
  // 方鼎：长方腹 + 两立耳 + 四柱足
  fangding: `
    <rect x="55" y="70" width="90" height="70" rx="6" fill="url(#bronze)"/>
    <rect x="55" y="70" width="90" height="70" rx="6" fill="url(#patina)"/>
    <path d="M70 70 q-14 -30 -2 -40 q10 -6 12 6" fill="none" stroke="url(#bronzeLight)" stroke-width="8"/>
    <path d="M130 70 q14 -30 2 -40 q-10 -6 -12 6" fill="none" stroke="url(#bronzeLight)" stroke-width="8"/>
    <rect x="62" y="140" width="12" height="55" fill="url(#bronze)"/>
    <rect x="126" y="140" width="12" height="55" fill="url(#bronze)"/>
    <rect x="88" y="140" width="10" height="40" fill="url(#bronze)" opacity="0.7"/>
    <rect x="60" y="86" width="80" height="16" fill="#3a2c14" opacity="0.35"/>`,
  // 圆鼎：半圆腹 + 两耳 + 三足
  yuanding: `
    <path d="M55 92 a45 42 0 0 0 90 0 a45 20 0 0 0 -90 0 z" fill="url(#bronze)"/>
    <path d="M55 92 a45 42 0 0 0 90 0 a45 20 0 0 0 -90 0 z" fill="url(#patina)"/>
    <path d="M72 78 q-12 -28 0 -36 q10 -5 11 6" fill="none" stroke="url(#bronzeLight)" stroke-width="8"/>
    <path d="M128 78 q12 -28 0 -36 q-10 -5 -11 6" fill="none" stroke="url(#bronzeLight)" stroke-width="8"/>
    <path d="M70 130 l-6 60" stroke="url(#bronze)" stroke-width="12" stroke-linecap="round"/>
    <path d="M130 130 l6 60" stroke="url(#bronze)" stroke-width="12" stroke-linecap="round"/>
    <path d="M100 138 l0 58" stroke="url(#bronze)" stroke-width="12" stroke-linecap="round"/>
    <path d="M60 84 h80" stroke="#3a2c14" stroke-width="10" opacity="0.3"/>`,
  // 方尊：大敞口喇叭形 + 鼓腹 + 圈足
  fangzun: `
    <path d="M56 60 L80 105 L120 105 L144 60 Z" fill="url(#bronzeLight)"/>
    <path d="M80 105 q-14 30 20 40 q34 -10 20 -40 Z" fill="url(#bronze)"/>
    <path d="M92 145 h16 l6 40 h-28 Z" fill="url(#bronze)"/>
    <path d="M56 60 L144 60" stroke="#3a2c14" stroke-width="6" opacity="0.3"/>
    <circle cx="82" cy="120" r="6" fill="#e8cd8f" opacity="0.6"/>
    <circle cx="118" cy="120" r="6" fill="#e8cd8f" opacity="0.6"/>
    <path d="M76 105 q-16 -6 -16 4 q0 10 14 8" fill="url(#bronze)"/>
    <path d="M124 105 q16 -6 16 4 q0 10 -14 8" fill="url(#bronze)"/>`,
  // 尊（何尊式）：束颈广肩 + 圈足
  zun: `
    <path d="M62 58 L82 92 L118 92 L138 58 Z" fill="url(#bronzeLight)"/>
    <path d="M82 92 q-10 28 18 34 q28 -6 18 -34 Z" fill="url(#bronze)"/>
    <path d="M82 92 q-10 28 18 34 q28 -6 18 -34 Z" fill="url(#patina)"/>
    <path d="M90 128 h20 l8 55 h-36 Z" fill="url(#bronze)"/>
    <path d="M62 58 L138 58" stroke="#3a2c14" stroke-width="6" opacity="0.3"/>
    <path d="M90 100 l0 18 M100 100 l0 20 M110 100 l0 18" stroke="#3a2c14" stroke-width="3" opacity="0.4"/>`,
  // 簋：碗形腹 + 两兽耳 + 圈足
  gui: `
    <path d="M62 96 a38 34 0 0 0 76 0 a38 16 0 0 0 -76 0 z" fill="url(#bronze)"/>
    <path d="M62 96 a38 34 0 0 0 76 0 a38 16 0 0 0 -76 0 z" fill="url(#patina)"/>
    <path d="M60 96 q-20 -4 -20 14 q0 16 18 12 l4 -14" fill="url(#bronze)"/>
    <path d="M140 96 q20 -4 20 14 q0 16 -18 12 l-4 -14" fill="url(#bronze)"/>
    <path d="M78 138 h44 l6 38 h-56 Z" fill="url(#bronze)"/>
    <path d="M64 92 h72" stroke="#3a2c14" stroke-width="8" opacity="0.3"/>`,
  // 鸮尊（猫头鹰形）
  owl: `
    <path d="M70 84 q30 -46 60 0 q10 60 -30 88 q-40 -28 -30 -88 Z" fill="url(#bronze)"/>
    <path d="M70 84 q30 -46 60 0 q10 60 -30 88 q-40 -28 -30 -88 Z" fill="url(#patina)"/>
    <path d="M74 60 l-6 -20 l18 12 Z" fill="url(#bronzeLight)"/>
    <path d="M126 60 l6 -20 l-18 12 Z" fill="url(#bronzeLight)"/>
    <circle cx="85" cy="78" r="11" fill="#f4e3b0"/><circle cx="85" cy="78" r="5" fill="#2a2013"/>
    <circle cx="115" cy="78" r="11" fill="#f4e3b0"/><circle cx="115" cy="78" r="5" fill="#2a2013"/>
    <path d="M100 86 l-7 12 h14 Z" fill="#5f4620"/>
    <path d="M78 110 q22 14 44 0 M80 128 q20 12 40 0" stroke="#3a2c14" stroke-width="3" fill="none" opacity="0.5"/>
    <path d="M84 174 l-4 18 M116 174 l4 18" stroke="url(#bronze)" stroke-width="9" stroke-linecap="round"/>`,
  // 方壶（莲鹤壶）：高瓶身 + 顶莲瓣 + 立鹤
  fanghu: `
    <path d="M96 40 q4 -14 8 0 q6 6 -4 10 q-10 -4 -4 -10" fill="#e8cd8f"/>
    <path d="M100 36 l6 -12" stroke="#e8cd8f" stroke-width="3"/>
    <path d="M78 62 q22 -18 44 0 q-22 6 -44 0 Z" fill="url(#bronzeLight)"/>
    <path d="M84 64 q16 -12 32 0" fill="url(#bronze)"/>
    <path d="M84 66 L80 96 q-12 20 20 30 q32 -10 20 -30 L116 66 Z" fill="url(#bronze)"/>
    <path d="M84 66 L80 96 q-12 20 20 30 q32 -10 20 -30 L116 66 Z" fill="url(#patina)"/>
    <path d="M92 126 h16 l6 46 h-28 Z" fill="url(#bronze)"/>
    <path d="M78 96 q-14 -2 -12 16 M122 96 q14 -2 12 16" stroke="url(#bronze)" stroke-width="6" fill="none"/>
    <path d="M88 84 l0 20 M100 82 l0 24 M112 84 l0 20" stroke="#3a2c14" stroke-width="2.5" opacity="0.4"/>`,
  // 尊盘（镂空繁饰）
  zunpan: `
    <path d="M60 128 a40 12 0 0 0 80 0 a40 18 0 0 0 -80 0 z" fill="url(#bronze)"/>
    <path d="M64 124 a36 8 0 0 0 72 0" fill="none" stroke="#3a2c14" stroke-width="3" opacity="0.4"/>
    <path d="M74 68 L88 96 L112 96 L126 68 Z" fill="url(#bronzeLight)"/>
    <path d="M88 96 q-8 20 12 26 q20 -6 12 -26 Z" fill="url(#bronze)"/>
    <path d="M74 68 q26 -16 52 0 q-8 -8 -16 -6 q-10 8 -20 0 q-8 -2 -16 6 Z" fill="url(#bronzeLight)"/>
    <path d="M62 118 q10 -10 18 0 q10 -10 18 0 q10 -10 18 0 q10 -10 18 0" fill="none" stroke="url(#bronzeLight)" stroke-width="3"/>
    <circle cx="80" cy="60" r="3" fill="#e8cd8f"/><circle cx="100" cy="56" r="3" fill="#e8cd8f"/><circle cx="120" cy="60" r="3" fill="#e8cd8f"/>`,
  // 剑
  sword: `
    <path d="M100 30 L108 46 L108 150 L100 168 L92 150 L92 46 Z" fill="url(#bronzeLight)"/>
    <path d="M100 30 L100 168" stroke="#6a5124" stroke-width="2" opacity="0.6"/>
    <path d="M78 150 q22 12 44 0 L118 162 q-18 10 -36 0 Z" fill="url(#bronze)"/>
    <rect x="96" y="162" width="8" height="34" fill="url(#bronze)"/>
    <ellipse cx="100" cy="200" rx="14" ry="7" fill="url(#bronze)"/>
    <path d="M96 60 l8 8 M104 60 l-8 8 M96 84 l8 8 M104 84 l-8 8 M96 108 l8 8 M104 108 l-8 8" stroke="#4a3a1c" stroke-width="1.6" opacity="0.7"/>`
};

function artifactSVG(shape) {
  const body = SHAPES[shape] || SHAPES.yuanding;
  return `<svg viewBox="0 0 200 210" xmlns="http://www.w3.org/2000/svg" class="artifact-svg" role="img">
    ${BRONZE_DEFS}
    <ellipse cx="100" cy="200" rx="70" ry="8" fill="#000" opacity="0.25"/>
    ${body}
  </svg>`;
}

window.artifactSVG = artifactSVG;
