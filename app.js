/* =========================================================
   Find my car – Garden City
   逻辑 + 数据。改内容只动下面两块：CONFIG 和 CARPARKS
   ========================================================= */

/* ---------- 1. 可配置内容 ---------- */
const CONFIG = {
  useRealGPS: false,    // true = 选层时向浏览器申请定位，只用来显示精度；pin 位置仍用下面的预设
  findingDelay: 1100,   // "Finding your car…" 停留毫秒

  levels: {
    L1: {
      name: 'Level 1',
      /* 静态底图：商场官方楼层图，透视矫正 + 去色偏后的版本。w/h 是图片像素尺寸，
         zones 的坐标就在这个像素空间里 */
      plan: { image: 'images/L1-plan.jpg', w: 1750, h: 2650 },
      /* 可点击的停车区。park 指向 CARPARKS 里的编号，pts 是 "x y,x y,..." */
      zones: [],
      car:  { carpark: 'P6' }   // 不填 x/y 就落在所属区域的中心；要微调就加 x / y（底图宽高的百分比）
    },
    L2: {
      name: 'Level 2',
      plan: { image: 'images/L2-plan.jpg', w: 1100, h: 1676 },
      zones: [],
      car:  { carpark: 'P10' }
    }
  },

  /* 每个停车场的细节图和提示，示例内容待替换 */
  carparks: {
    P6: {
      detail: { image: '', aspect: '4 / 3', car: { x: 44, y: 58 } },
      tips: [
        { title: 'Nearby: Entry 1', note: 'Closest way into the centre', image: '', alt: 'Entry 1 photo' },
        { title: 'Landmark: Coles', note: 'Your row is next to the Coles entrance', image: '', alt: 'Coles photo' }
      ]
    },
    P10: {
      detail: { image: '', aspect: '4 / 3', car: { x: 56, y: 62 } },
      tips: [
        { title: 'Nearby: Entry 3', note: 'Closest way into the centre', image: '', alt: 'Entry 3 photo' },
        { title: 'Landmark: BIG W', note: 'Your row is behind BIG W', image: '', alt: 'BIG W photo' }
      ]
    }
  }
};

/* ---------- 2. 停车场名字和颜色（和商场指示牌一致） ---------- */
const CARPARKS = {
  P1:  ['P1 Navy',         '#1B2A6B'],
  P2:  ['P2 Blue',         '#2E5BD9'],
  P3:  ['P3 Blue',         '#2E5BD9'],
  P4:  ['P4 Aqua',         '#7FCFA6'],
  P5:  ['P5 Aqua',         '#7FCFA6'],
  P6:  ['P6 Pink',         '#E0457B'],
  P7:  ['P7 Grey',         '#7C7C7C'],
  P8:  ['P8 P9 Black',     '#1a1a1a'],
  P10: ['P10 Violet',      '#B15CB5'],
  P11: ['P11 Purple',      '#5B2D8E'],
  P13: ['P13 White',       '#ffffff'],
  P14: ['P14 Red',         '#D12B2B'],
  P15: ['P15 P16 Orange',  '#F26B21'],
  P17: ['P17 P18 Yellow',  '#F6C700'],
  P19: ['P19 Maroon',      '#6E1B2E'],
  P20: ['P20 Brown',       '#8B3A2F'],
  P21: ['P21 Green',       '#6DBE2B'],
  P22: ['P22 Olive',       '#3F5A2E']
};

/* ---------- 3. 中心结构：直接从指示牌照片描出来的多边形 ---------- */
/*  坐标 = 牌子上的画面坐标（俯视 + 斜切已经画在形状里），范围 999 × 755。
    一块图形可能包含两个停车场（AQUA = P4+P5，BLUE = P2+P3），和牌子一样。   */
const CENTRE = {
  w: 999, h: 755,
  shapes: [
    { id:'P20', lv:'', park:'P20', pts:'187 0,216 24,114 33,91 10,186 1' },
    { id:'B1', lv:'', bldg:true, pts:'289 37,400 41,367 68,368 77,390 77,391 100,389 84,381 84,368 95,156 87,151 83,155 82,245 75,288 38' },
    { id:'P19', lv:'', park:'P19', pts:'151 110,214 114,230 127,131 136,107 114,150 111' },
    { id:'P8', lv:'L2', park:'P8', pts:'857 3,999 7,997 32,970 53,962 53,950 67,949 58,927 61,925 85,917 91,809 103,782 86,780 69,731 67,729 42,756 21,831 22,856 4' },
    { id:'P15', lv:'L2', park:'P15', pts:'76 210,96 216,147 257,43 265,40 285,3 255,0 235,75 211' },
    { id:'P17', lv:'L2', park:'P17', pts:'91 210,165 214,176 236,223 237,243 248,147 256,91 211' },
    { id:'P11', lv:'L1', park:'P11', pts:'274 198,396 202,378 217,257 215,169 212,169 207,273 199' },
    { id:'P22', lv:'L2', park:'P22', pts:'409 224,756 233,756 247,393 237,408 225' },
    { id:'B2', lv:'L1 L2', bldg:true, pts:'839 233,977 236,976 249,975 243,966 243,898 288,795 298,771 284,779 278,777 268,708 267,672 293,614 292,615 281,532 279,512 294,273 288,89 304,43 268,241 252,245 247,261 249,274 239,817 249,838 234' },
    { id:'P10', lv:'L2', park:'P10', pts:'282 291,402 295,384 309,374 309,187 303,182 299,281 292' },
    { id:'P7', lv:'L2', park:'P7', pts:'727 269,774 270,779 274,769 274,726 307,514 301,532 283,613 285,612 295,679 296,710 272,726 270' },
    { id:'P21', lv:'L1', park:'P21', pts:'654 375,685 377,653 397,384 388,400 378,653 376' },
    { id:'B3', lv:'L1 L2', bldg:true, pts:'734 378,805 380,805 392,832 393,824 403,825 413,866 413,869 400,882 394,959 397,888 442,786 451,772 446,615 441,597 454,502 451,501 459,494 461,494 445,479 444,497 442,513 430,512 421,414 418,385 440,291 438,303 429,302 420,261 412,326 398,337 390,700 402,733 379' },
    { id:'P13', lv:'', park:'P13', pts:'422 421,520 425,489 444,395 441,421 422' },
    { id:'P14', lv:'L2', park:'P14', pts:'166 430,191 444,188 448,112 453,92 437,165 431' },
    { id:'P6', lv:'L1', park:'P6', pts:'622 445,740 449,740 468,730 472,726 458,610 454,621 446' },
    { id:'AQUA', lv:'L1', park:'P4', pts:'808 485,969 489,969 494,959 495,954 504,940 504,879 545,762 554,753 548,714 547,693 561,505 553,574 506,713 511,731 499,781 501,807 486' },
    { id:'BLUE', lv:'', park:'P2', pts:'816 594,942 598,941 614,941 605,932 604,869 641,763 649,711 643,693 655,509 647,540 627,672 633,729 597,806 600,815 595' },
    { id:'P1', lv:'', park:'P1', pts:'749 698,909 704,908 720,858 748,744 755,698 745,698 729,748 699' }  ]
};

/* ---------- 4. 楼层模型的摆放 ---------- */
/*  切换条、层号的排版都在 styles.css 里（.pick / .plate）  */
const MODEL = {
  squash: 0.90,   // 纵向压扁比例（1 = 和牌子完全同比例）
  floor:  26,     // 地板本身的厚度 —— 这一整块就代表「一层」
  zone:    6,     // 停车场区域高出地板多少（薄薄一层，像铺在地上的色块）
  tower:  15,     // 商场楼从地板上立起多高（太高会挡住北边的停车场）
  edge:   34,     // 地板比这一层的内容宽出多少
  margin: 18      // 画布留白
};

/* =========================================================
   以下是逻辑
   ========================================================= */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const parkName = id => (CARPARKS[id] || ['?', '#888'])[0];
const parkFill = id => (CARPARKS[id] || ['?', '#888'])[1];

const state = { level: 'L1', pick: 'L1', detail: null, gps: null, busy: false };

/* 由本色算出侧面的深浅：太深的颜色改成往亮里混，免得糊成一片 */
function sideColour(hex, amount){
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const isDark = (0.299*r + 0.587*g + 0.114*b) / 255 < 0.3;
  const target = isDark ? 255 : 0, k = isDark ? amount * 0.8 : amount;
  const mix = v => Math.round(v + (target - v) * k);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

/* 把一块多边形抬高 lift、挤出 height 的厚度画出来
   lift = 顶面离地板面多高，height = 侧墙多高。地板自己 lift=0、height=厚度 */
function slab(pts, lift, height, topFill, sideFill){
  let area = 0;
  for (let i = 0; i < pts.length; i++){
    const a = pts[i], b = pts[(i + 1) % pts.length];
    area += a[0]*b[1] - b[0]*a[1];
  }
  const ring = (area < 0 ? pts.slice().reverse() : pts)   // 统一绕向，侧墙判断才准
    .map(p => [p[0], +(p[1] - lift).toFixed(1)]);

  const walls = [];
  for (let i = 0; i < ring.length; i++){
    const a = ring[i], b = ring[(i + 1) % ring.length];
    if (b[0] - a[0] < 0) walls.push([a, b]);              // 这条边朝着观众，要画墙
  }
  walls.sort((u, v) => (u[0][1] + u[1][1]) - (v[0][1] + v[1][1]));

  let out = '';
  for (const [a, b] of walls){
    out += `<polygon class="wall" points="${a[0]},${a[1]} ${b[0]},${b[1]} ` +
           `${b[0]},${(b[1] + height).toFixed(1)} ${a[0]},${(a[1] + height).toFixed(1)}" fill="${sideFill}"/>`;
  }
  out += `<polygon class="top" points="${ring.map(p => p.join(',')).join(' ')}" fill="${topFill}"/>`;
  return out;
}

/* 楼层图上的多边形：像素坐标，不做压扁 */
const parseZone = str => str.split(',').map(p => p.trim().split(/\s+/).map(Number));

const parsePts = str => str.split(',').map(p => {
  const [x, y] = p.split(' ').map(Number);
  return [x, +(y * MODEL.squash).toFixed(1)];
});

/* 凸包：地板的外形跟着这一层实际有哪些块走，改分层不用手动重画地板 */
function hull(pts){
  const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (P.length < 3) return P;
  const cross = (o, a, b) => (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]);
  const half = arr => {
    const h = [];
    for (const q of arr){
      while (h.length >= 2 && cross(h[h.length-2], h[h.length-1], q) <= 0) h.pop();
      h.push(q);
    }
    return h;
  };
  return half(P).slice(0, -1).concat(half(P.slice().reverse()).slice(0, -1));
}

/* 把闭合多边形每条边向外推 m，再求相邻边交点 —— 等距外扩 */
function grow(poly, m){
  const n = poly.length, lines = [];
  for (let i = 0; i < n; i++){
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % n];
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const nx = dy / L, ny = -dx / L;
    lines.push([x1 + nx*m, y1 + ny*m, x2 + nx*m, y2 + ny*m]);
  }
  const out = [];
  for (let i = 0; i < n; i++){
    const [ax, ay, bx, by] = lines[(i - 1 + n) % n], [cx, cy, ex, ey] = lines[i];
    const r1x = bx - ax, r1y = by - ay, r2x = ex - cx, r2y = ey - cy;
    const den = r1x*r2y - r1y*r2x;
    if (Math.abs(den) < 1e-9){ out.push([cx, cy]); continue; }
    const t = ((cx - ax)*r2y - (cy - ay)*r2x) / den;
    out.push([+(ax + r1x*t).toFixed(1), +(ay + r1y*t).toFixed(1)]);
  }
  return out;
}

const polyArea = p => Math.abs(p.reduce((a, q, i) => {
  const r = p[(i + 1) % p.length];
  return a + q[0]*r[1] - r[0]*q[1];
}, 0)) / 2;

/* 某一层有哪些块 */
const shapesOn = lv => CENTRE.shapes.filter(s => s.lv.split(' ').includes(lv))
  .map(s => ({ ...s, pts: parsePts(s.pts) }));

/* 某一层的地板 */
function floorOf(items){
  const H = hull(items.flatMap(s => s.pts));
  if (H.length < 3) return H;
  const a = grow(H, MODEL.edge);
  return polyArea(a) >= polyArea(H) ? a : grow(H, -MODEL.edge);
}

/* 侧面不用纯色，用一条上亮下暗的渐变 —— 哑光材质在顶光下就是这样 */
function wallGrads(){
  const out = {}, defs = [];
  for (const id in CARPARKS){
    const hex = parkFill(id), key = 'w' + hex.slice(1);
    if (out[hex]) continue;
    out[hex] = `url(#${key})`;
    defs.push(`<linearGradient id="${key}" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${sideColour(hex, .14)}"/>` +
      `<stop offset="1" stop-color="${sideColour(hex, .44)}"/></linearGradient>`);
  }
  return { map: out, defs: defs.join('') };
}

/* 固定的那几条渐变和滤镜：地板、商场楼、接地投影 */
const MODEL_DEFS =
  `<linearGradient id="w-floor" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="var(--floor-side-1)"/>` +
    `<stop offset="1" stop-color="var(--floor-side-2)"/></linearGradient>` +
  `<linearGradient id="w-bldg" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="var(--bldg-side-1)"/>` +
    `<stop offset="1" stop-color="var(--bldg-side-2)"/></linearGradient>` +
  `<filter id="drop-floor" x="-12%" y="-12%" width="130%" height="140%">` +
    `<feDropShadow dx="7" dy="16" stdDeviation="15" flood-color="var(--shade)" flood-opacity=".9"/>` +
  `</filter>` +
  `<filter id="drop-mass" x="-30%" y="-30%" width="180%" height="200%">` +
    `<feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="var(--shade)" flood-opacity=".75"/>` +
  `</filter>`;

/* 画一层：一整块地板，停车场铺在地板上，商场楼从地板上立起来。
   整块地板就代表「一层」—— 不再是一摞悬空的板子 */
function deck(lv){
  const g = wallGrads();
  const items = shapesOn(lv);

  let body = `<g filter="url(#drop-floor)">` +
    slab(floorOf(items), 0, MODEL.floor, 'var(--floor)', 'url(#w-floor)') +
  `</g>`;

  items.sort((a, b) => Math.max(...a.pts.map(p => p[1])) - Math.max(...b.pts.map(p => p[1])));

  for (const s of items){
    body += s.bldg
      ? `<g filter="url(#drop-mass)">` +
          slab(s.pts, MODEL.tower, MODEL.tower, 'var(--bldg)', 'url(#w-bldg)') +
        `</g>`
      : slab(s.pts, MODEL.zone, MODEL.zone, parkFill(s.park), g.map[parkFill(s.park)]);
  }
  return `<defs>${MODEL_DEFS}${g.defs}</defs>${body}`;
}

/* 屏 1：一次只画一层。L1 / L2 只是换个名字——同一座停车楼，两层轮廓本来就一样 */
function renderStage(){
  /* 每层的地板各自居中，但两层共用同一个尺寸 —— 切换时不会一大一小 */
  const boxes = Object.keys(CONFIG.levels).map(k => {
    const items = shapesOn(k), pl = floorOf(items);
    const tops = items.filter(s => s.bldg).flatMap(s => s.pts.map(p => p[1] - MODEL.tower));
    const xs = pl.map(p => p[0]), ys = pl.map(p => p[1]);
    return { k,
      x0: Math.min(...xs), x1: Math.max(...xs),
      y0: Math.min(...ys, ...tops), y1: Math.max(...ys) + MODEL.floor };
  });
  const m = MODEL.margin;
  const w = Math.max(...boxes.map(b => b.x1 - b.x0)) + m * 2;
  const h = Math.max(...boxes.map(b => b.y1 - b.y0)) + m * 2;
  const b = boxes.find(x => x.k === state.pick) || boxes[0];
  const vb = [(b.x0 + b.x1) / 2 - w / 2, (b.y0 + b.y1) / 2 - h / 2, w, h]
    .map(n => n.toFixed(1)).join(' ');

  $('#deckhost').innerHTML =
    `<button class="deck" type="button" ` +
      `aria-label="${esc(CONFIG.levels[state.pick].name)}, show where my car is">` +
      `<span class="deck-art">` +
        `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" ` +
          `focusable="false">${deck(state.pick)}</svg>` +
      `</span>` +
    `</button>`;

  $('#deckhost .deck').addEventListener('click', e => pickLevel(state.pick, e.currentTarget));
}

/* 切换首屏显示哪一层 */
function setPick(lv){
  if (state.busy || lv === state.pick) return;
  state.pick = lv;
  renderStage();          // 两层内容不一样，必须重画
  paintPick();
  const host = $('#deckhost');
  host.classList.remove('swap');
  void host.offsetWidth;
  host.classList.add('swap');          // 换层时轻轻动一下，让人看到确实切了
}

function paintPick(){
  $$('[data-pick]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pick === state.pick)));
  $('#deck-plate').textContent = `Level 0${state.pick.slice(1)}`;
  const d = $('#deckhost .deck');
  if (d) d.setAttribute('aria-label', `${CONFIG.levels[state.pick].name}, show where my car is`);
}

/* ---------- 平面图 ---------- */
function setPlan(box, src, emptyText){
  const img = box.querySelector('img'), empty = box.querySelector('.empty');
  if (src){
    img.src = src;
    img.alt = emptyText;
    img.hidden = false;
    empty.hidden = true;
  } else {
    img.removeAttribute('src'); img.hidden = true;
    empty.hidden = false;
    empty.innerHTML = `<span>${esc(emptyText)}</span><small>image coming</small>`;
  }
}

function thumb(src, alt){
  return `<div class="thumb">${src ? `<img src="${esc(src)}" alt="">` : esc(alt || 'photo')}</div>`;
}

function pin(x, y, o){
  const wrap = document.createElement('div');
  wrap.className = 'pin';
  wrap.style.cssText = `left:${x}%;top:${y}%`;

  const body = document.createElement('div');
  body.className = 'pin-body' + (o.drop ? ' drop' : '');
  if (o.onTap){
    body.setAttribute('role', 'button');
    body.tabIndex = 0;
    body.setAttribute('aria-label', `${o.title}. Open car park map`);
    body.addEventListener('click', o.onTap);
    body.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); o.onTap(); }
    });
  }
  const side = (x < 35 ? ' to-right' : x > 65 ? ' to-left' : '') + (o.thumbAlt === undefined ? ' tight' : '');
  body.innerHTML =
    `<div class="callout${side}">${o.thumbAlt !== undefined ? thumb(o.thumb, o.thumbAlt) : ''}` +
    `<div><b>${esc(o.title)}</b>${o.note ? `<small>${esc(o.note)}</small>` : ''}</div></div>` +
    `<div class="pin-head"></div><div class="pin-stem"></div>`;
  wrap.appendChild(body);
  return wrap;
}

/* 多边形的重心，用来放标签和默认的 pin 位置 */
function centroid(pts){
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < pts.length; i++){
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    const f = x1 * y2 - x2 * y1;
    a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f;
  }
  if (!a) return pts[0] || [0, 0];
  return [cx / (3 * a), cy / (3 * a)];
}

/* 屏 2：商场楼层图当静态底图，停车区是画在上面的可点多边形 */
function renderLevel(lv, drop){
  state.level = lv;
  const L = CONFIG.levels[lv], mine = L.car.carpark, info = CONFIG.carparks[mine];

  $('#level-swatch').style.background = parkFill(mine);
  $('#level-title').textContent = parkName(mine);
  $('#level-sub').textContent = `Your car is here, ${L.name}` +
    (state.gps ? ` · GPS accuracy ±${Math.round(state.gps.coords.accuracy)} m` : '');
  $$('.seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.level === lv)));

  const box = $('#level-plan');
  const zones = L.zones || [];

  /* 还没放楼层图时，退回原来的占位格子 */
  if (!L.plan.image){
    box.classList.remove('is-plan');
    box.style.aspectRatio = '4 / 3';
    setPlan(box, '', `${L.name} map`);
    $('#level-overlay').innerHTML = '';
    $('#level-note').textContent = `${L.name} plan coming.`;
    return;
  }

  box.classList.add('is-plan');
  box.style.aspectRatio = `${L.plan.w} / ${L.plan.h}`;
  setPlan(box, '', '');

  const u = L.plan.w / 1000;        // 底图分辨率不同，尺寸都按这个单位缩放
  const parsed = zones.map(z => ({ ...z, poly: parseZone(z.pts) }));
  const my = parsed.find(z => z.park === mine);
  const car = (L.car.x != null && L.car.y != null)
    ? [L.car.x / 100 * L.plan.w, L.car.y / 100 * L.plan.h]
    : (my ? centroid(my.poly) : null);

  const body = parsed.map(z => {
    const d = z.poly.map(p => p.join(',')).join(' ');
    const isMine = z.park === mine;
    const [lx, ly] = centroid(z.poly);
    return `<g class="pz${isMine ? ' is-mine' : ''}" role="button" tabindex="0" ` +
      `data-park="${esc(z.park)}" aria-label="${esc(parkName(z.park))}` +
      `${isMine ? ', where your car is' : ''}. Open this car park">` +
      `<polygon class="pz-fill" points="${d}" style="--pc:${parkFill(z.park)}" ` +
        `stroke-width="${(3 * u).toFixed(1)}"/>` +
      `<text class="pz-tag" x="${lx.toFixed(0)}" y="${ly.toFixed(0)}" text-anchor="middle" ` +
        `dominant-baseline="central" font-size="${(26 * u).toFixed(1)}" ` +
        `stroke-width="${(4.5 * u).toFixed(1)}">${esc(z.name || parkName(z.park))}</text>` +
    `</g>`;
  }).join('');

  const marker = !car ? '' :
    `<g class="carmark${drop ? ' drop' : ''}" ` +
      `transform="translate(${car[0].toFixed(0)},${car[1].toFixed(0)})">` +
      `<circle class="carmark-halo" r="${(46 * u).toFixed(1)}"/>` +
      `<circle class="carmark-dot" r="${(15 * u).toFixed(1)}" ` +
        `stroke-width="${(5 * u).toFixed(1)}"/>` +
      `<circle class="carmark-eye" r="${(4.5 * u).toFixed(1)}"/>` +
    `</g>`;

  $('#level-overlay').innerHTML =
    `<svg viewBox="0 0 ${L.plan.w} ${L.plan.h}" xmlns="http://www.w3.org/2000/svg" ` +
      `class="planmap" role="group" aria-label="${esc(L.name)} plan, tap a car park">` +
      `<image href="${esc(L.plan.image)}" x="0" y="0" width="${L.plan.w}" height="${L.plan.h}" ` +
        `preserveAspectRatio="none"/>` +
      `<g class="pzs">${body}</g>${marker}` +
    `</svg>`;

  $$('#level-overlay .pz').forEach(g => {
    const open = () => openDetail(g.dataset.park);
    g.addEventListener('click', open);
    g.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); }
    });
  });

  $('#level-note').textContent = !zones.length
    ? `${L.name} plan. Car park zones coming.`
    : (my ? `Your car is in the ${parkName(mine)}. Tap any car park to see it.`
          : 'Tap a car park to see it.');
}

function renderDetail(){
  const L = CONFIG.levels[state.level];
  const id = state.detail || L.car.carpark;
  const mine = id === L.car.carpark;
  const info = CONFIG.carparks[id] || { detail: { image: '', aspect: '4 / 3', car: { x: 50, y: 50 } }, tips: [] };

  $('#detail-swatch').style.background = parkFill(id);
  $('#detail-title').textContent = parkName(id);
  $('#detail-sub').textContent = mine
    ? `${L.name} · your car is here`
    : `${L.name}, car park map`;

  const box = $('#detail-plan');
  box.style.aspectRatio = info.detail.aspect;
  setPlan(box, info.detail.image, `${parkName(id)} car park map`);

  const layer = $('#detail-overlay');
  layer.innerHTML = '';
  if (mine) layer.appendChild(pin(info.detail.car.x, info.detail.car.y, { title: 'Your car', drop: true }));

  $('#detail-tips').innerHTML = info.tips.map(t =>
    `<li>${thumb(t.image, t.alt)}<div><b>${esc(t.title)}</b><small>${esc(t.note)}</small></div></li>`
  ).join('');
}

/* ---------- 换屏 ---------- */
function show(id, dir){
  $$('.screen').forEach(s => {
    s.classList.toggle('is-on', s.id === id);
    s.classList.remove('anim-fwd', 'anim-back');
  });
  const el = document.getElementById(id);
  if (dir){ void el.offsetWidth; el.classList.add(dir === 'back' ? 'anim-back' : 'anim-fwd'); }
  window.scrollTo(0, 0);
  const h = el.querySelector('h1');
  if (h) h.focus({ preventScroll: true });
}

function showFinding(on){
  const el = $('#locating');
  if (on){ el.hidden = false; void el.offsetWidth; el.classList.add('is-on'); }
  else { el.classList.remove('is-on'); setTimeout(() => { el.hidden = true; }, 280); }
}

function locate(){
  return new Promise(res => {
    if (!CONFIG.useRealGPS || !navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(p => res(p), () => res(null),
      { enableHighAccuracy: true, timeout: 4000 });
  });
}

/* 点楼板 → 该层抬起、另一层淡出 → 定位 → 平面图立起来 */
async function pickLevel(lv, node){
  if (state.busy) return;
  state.busy = true;

  node.classList.add('is-picked');
  $('#home').classList.add('is-leaving');

  const ready = Promise.all([locate(), wait(CONFIG.findingDelay)]);
  await wait(230);
  showFinding(true);
  const [pos] = await ready;

  state.gps = pos;
  renderLevel(lv, true);
  show('level', 'fwd');
  showFinding(false);

  $('#home').classList.remove('is-leaving');
  $$('.deck').forEach(g => g.classList.remove('is-picked'));
  state.busy = false;
}

function openDetail(park){
  state.detail = park || CONFIG.levels[state.level].car.carpark;
  renderDetail();
  show('detail', 'fwd');
}

/* ---------- 接线 ---------- */
renderStage();
paintPick();
$$('[data-pick]').forEach(b => b.addEventListener('click', () => setPick(b.dataset.pick)));
$$('.seg button').forEach(b => b.addEventListener('click', () => renderLevel(b.dataset.level, true)));
$$('[data-back]').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.reset) state.gps = null;
  show(b.dataset.back, 'back');
}));
