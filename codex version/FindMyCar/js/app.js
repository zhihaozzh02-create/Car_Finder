/* FindMyCar core application logic. Requires config.js. */
/* =========================================================
   以下是逻辑
   ========================================================= */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
/* 元素找不到就跳过，别让一处缺失把后面的接线全带崩 */
const on = (sel, ev, fn) => { const el = $(sel); if (el) el.addEventListener(ev, fn); };
const noMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 点下去先让元素自己动一下，再执行动作 —— 比一个蓝框清楚 */
function tapThen(el, fn){
  if (noMotion()) return fn();
  el.classList.add('is-tapped');
  setTimeout(() => { el.classList.remove('is-tapped'); fn(); }, 210);
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const parkName = id => (CARPARKS[id] || ['?', '#888'])[0];
const parkFill = id => (CARPARKS[id] || ['?', '#888'])[1];

const state = { level: 'L1', pick: 'L1', detail: null, gps: null, watch: null, busy: false,
                parked: null, ask: null };

/* 这一层的车停在哪。用户自己在车位图上标过就以用户的为准，否则用 CONFIG 里的演示数据 */
function carOf(lv){
  if (!state.parked) return null;                           // 没标过就是没有车
  return state.parked.level === lv ? state.parked : null;   // 车只可能在一层
}

/* 标过的车位记下来，刷新页面还在 —— 演示的时候不用每次重标 */
const PARKED_KEY = 'findmycar:parked';
function loadParked(){
  try {
    const raw = localStorage.getItem(PARKED_KEY);
    if (raw) state.parked = JSON.parse(raw);
  } catch (e) { /* 隐私模式下 localStorage 会抛，忽略就好 */ }
}
function saveParked(){
  try {
    if (state.parked) localStorage.setItem(PARKED_KEY, JSON.stringify(state.parked));
    else localStorage.removeItem(PARKED_KEY);
  } catch (e) {}
}

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

/* 经纬度 -> 图纸坐标。两个标定点给出旋转 + 缩放 + 平移（相似变换），
   这对一层停车场足够了，不需要完整的地理配准 */
function geoToPlan(geo, lat, lon){
  const a = geo && geo.a, b = geo && geo.b;
  if (!a || a.lat == null || a.x == null || !b || b.lat == null || b.x == null) return null;

  const R = 111320, k = Math.cos(a.lat * Math.PI / 180);
  const local = (la, lo) => [(lo - a.lon) * R * k, -(la - a.lat) * R];  // 东 +x，北 -y

  const [bx, by] = local(b.lat, b.lon);
  const den = bx * bx + by * by;
  if (!den) return null;                        // 两个标定点重合了

  const dx = b.x - a.x, dy = b.y - a.y;
  const sc = (dx * bx + dy * by) / den;         // 相似变换 [sc, -rt; rt, sc]
  const rt = (dy * bx - dx * by) / den;

  const [px, py] = local(lat, lon);
  return {
    x: a.x + sc * px - rt * py,
    y: a.y + rt * px + sc * py,
    perMetre: Math.hypot(sc, rt)                // 1 米等于多少图纸单位，用来画精度圈
  };
}

/* 多边形的重心，用来放标签和默认的车标位置 */
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

/* =========================================================
   车位图：没有真实车位数据，按车场轮廓程序化生成。
   商场导览屏上就是「通道两侧成排车位」的常规排布，这里照着做，
   不求和现场一一对应，只要认得出是停车场、找得到自己那格
   ========================================================= */

/* 最小面积外接矩形 —— 车位该朝哪个方向排，由车场自己的形状决定，
   不能写死角度，否则斜着的 Green 那种就排歪了 */
function minAreaRect(pts){
  const H = hull(pts);
  if (H.length < 3) return null;
  let best = null;
  for (let i = 0; i < H.length; i++){
    const a = H[i], b = H[(i + 1) % H.length];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const c = Math.cos(-ang), s = Math.sin(-ang);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of H){
      const x = p[0] * c - p[1] * s, y = p[0] * s + p[1] * c;
      if (x < x0) x0 = x;  if (x > x1) x1 = x;
      if (y < y0) y0 = y;  if (y > y1) y1 = y;
    }
    const area = (x1 - x0) * (y1 - y0);
    if (!best || area < best.area) best = { area, ang, x0, x1, y0, y1 };
  }
  return best;
}

/* 射线法判断点在不在多边形里，用来把排到界外的车位丢掉 */
function inPoly(p, poly){
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++){
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) &&
        p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const ROWS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // 跳过 I 和 O，免得和 1 / 0 混

/* 标准车位 2.5m × 5m，通道 6m。换算成图纸单位 */
const baySpec = upm => ({ bayW: 2.5 * upm, bayD: 5 * upm, aisle: 6 * upm });

/* 在轮廓里铺车位：一条通道两侧各一排，整组重复。
   只保留四角都在轮廓内的整格 —— 半格探到界外看着就是坏的 */
function layoutBays(poly, o){
  const r = minAreaRect(poly);
  if (!r) return [];
  const bayW = o.bayW, bayD = o.bayD, aisle = o.aisle;
  const band = bayD * 2 + aisle;
  const c = Math.cos(r.ang), s = Math.sin(r.ang);
  const world = (x, y) => [x * c - y * s, x * s + y * c];

  const out = [];
  let rowNo = 0;
  for (let by = r.y0; by < r.y1; by += band){
    for (const dy of [0, bayD + aisle]){
      const y = by + dy;
      if (y + bayD > r.y1) continue;
      let col = 0;
      const row = [];
      for (let x = r.x0; x + bayW <= r.x1; x += bayW){
        const quad = [[x, y], [x + bayW, y], [x + bayW, y + bayD], [x, y + bayD]].map(q => world(q[0], q[1]));
        if (quad.every(q => inPoly(q, poly))) row.push({ quad, col: col++ });
      }
      if (row.length){
        const letter = ROWS[rowNo % ROWS.length] + (rowNo >= ROWS.length ? String(Math.floor(rowNo / ROWS.length) + 1) : '');
        row.forEach(b => { b.row = letter; b.ref = `Row ${letter} · Bay ${b.col + 1}`; });
        out.push(...row);
        rowNo++;
      }
    }
  }
  return out;
}

/* 屏 2：我们自己画的楼层平面图。商场本体是静态的，只有停车区能点 */
function renderLevel(lv, drop){
  state.level = lv;
  const L = CONFIG.levels[lv], car = carOf(lv), mine = car ? car.park : null;

  const sw = $('#level-swatch');
  sw.style.background = mine ? parkFill(mine) : 'transparent';
  sw.hidden = !mine;
  $('#level-title').textContent = mine ? parkName(mine) : L.name;
  $('#level-sub').textContent = (mine ? `Your car is here, ${L.name}` : `Tap the car park you parked in`) +
    (state.gps ? ` · GPS accuracy ±${Math.round(state.gps.coords.accuracy)} m` : '');
  $$('.seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.level === lv)));

  const box = $('#level-plan'), P = L.plan || {}, zones = L.zones || [];

  if (!P.w || !zones.length){          // 数据还没齐，退回占位格子
    box.classList.remove('is-plan');
    box.style.aspectRatio = '4 / 3';
    setPlan(box, '', `${L.name} map`);
    $('#level-overlay').innerHTML = '';
    $('#level-note').textContent = `${L.name} plan coming.`;
    return;
  }

  box.classList.add('is-plan');
  box.style.aspectRatio = `${P.w} / ${P.h}`;
  setPlan(box, '', '');

  const u = P.w / 1000;                // 尺寸跟着图纸坐标空间缩放
  const parsed = zones.map(z => ({ ...z, poly: parseZone(z.pts) }));
  /* 车标落点：标过车位就落在那一格上，否则落在整块车场的中心 */
  const my = parsed.find(z => z.park === mine);
  let at = null;
  if (my){
    at = centroid(my.poly);
    if (car.bay != null){
      const spots = layoutBays(my.poly, baySpec(P.upm));
      if (spots[car.bay]) at = centroid(spots[car.bay].quad);
    }
  }

  /* 商场本体：静态，不可点 */
  const mall = (P.mall || []).map(d => `<polygon class="pm" points="${esc(d)}"/>`).join('');

  const anchors = (P.anchors || []).map(a =>
    `<text class="pa" x="${a.x}" y="${a.y}" text-anchor="middle" dominant-baseline="central" ` +
      `font-size="${(a.size || 19) * u}">${esc(a.name)}</text>`).join('');

  const streets = (P.streets || []).map(st => {
    const t = st.rotate ? ` transform="rotate(${st.rotate} ${st.x} ${st.y})"` : '';
    return `<text class="ps" x="${st.x}" y="${st.y}" text-anchor="middle" ` +
      `dominant-baseline="central" font-size="${16 * u}"${t}>${esc(st.name)}</text>`;
  }).join('');

  /* 停车区：唯一可点的东西 */
  const pz = parsed.map(z => {
    const d = z.poly.map(p => p.join(',')).join(' ');
    const isMine = z.park === mine;
    const [lx, ly] = centroid(z.poly);
    const label = (z.name || parkName(z.park)).replace(/\s*Carpark$/i, '');
    const ly2 = isMine ? ly - 34 * u : ly;   // 自己那块要给车标让位
    return `<g class="pz${isMine ? ' is-mine' : ''}" role="button" tabindex="0" ` +
      `data-park="${esc(z.park)}" aria-label="${esc(parkName(z.park))}` +
      `${isMine ? ', where your car is' : ''}. Open this car park">` +
      `<polygon class="pz-fill" points="${d}" style="--pc:${parkFill(z.park)}" ` +
        `stroke-width="${(3 * u).toFixed(1)}"/>` +
      `<text class="pz-tag" x="${lx.toFixed(0)}" y="${ly2.toFixed(0)}" text-anchor="middle" ` +
        `dominant-baseline="central" font-size="${(24 * u).toFixed(1)}" ` +
        `stroke-width="${(4 * u).toFixed(1)}">${esc(label)}</text>` +
    `</g>`;
  }).join('');

  /* 「你在这」：有定位、且这一层做过标定才画。拿不到就什么都不显示，
     用户照着 pin 走一样能找到车 */
  let here = '';
  if (state.gps && L.geo){
    const c = state.gps.coords, at = geoToPlan(L.geo, c.latitude, c.longitude);
    if (at && at.x > -P.w && at.x < P.w * 2 && at.y > -P.h && at.y < P.h * 2){
      const acc = Math.max(8 * u, (c.accuracy || 30) * at.perMetre);
      here =
        `<g transform="translate(${at.x.toFixed(0)},${at.y.toFixed(0)})"><g class="hereme">` +
          `<circle class="here-acc" r="${acc.toFixed(0)}"/>` +
          `<circle class="here-dot" r="${(11 * u).toFixed(1)}" stroke-width="${(4 * u).toFixed(1)}"/>` +
        `</g></g>`;
    }
  }

  /* 外层负责定位、内层负责动画：CSS 的 transform 会盖掉 SVG 的 transform 属性，
     写在同一个元素上车标会被打回原点 */
  const marker = !at ? '' :
    `<g transform="translate(${at[0].toFixed(0)},${at[1].toFixed(0)})">` +
      `<g class="carmark${drop ? ' drop' : ''}">` +
        `<circle class="carmark-halo" r="${(34 * u).toFixed(1)}"/>` +
        `<circle class="carmark-dot" r="${(15 * u).toFixed(1)}" stroke-width="${(5 * u).toFixed(1)}"/>` +
        `<circle class="carmark-eye" r="${(4.5 * u).toFixed(1)}"/>` +
      `</g>` +
    `</g>`;

  /* 取景收到实际画了东西的范围，别把图纸下方的空白也框进来 */
  const all = [];
  (P.mall || []).forEach(d => parseZone(d).forEach(q => all.push(q)));
  parsed.forEach(z => z.poly.forEach(q => all.push(q)));
  (P.anchors || []).forEach(a => all.push([a.x, a.y]));
  (P.streets || []).forEach(t => all.push([t.x, t.y]));
  const pad = 46 * u;
  const bx0 = Math.min(...all.map(q => q[0])) - pad, bx1 = Math.max(...all.map(q => q[0])) + pad;
  const by0 = Math.min(...all.map(q => q[1])) - pad, by1 = Math.max(...all.map(q => q[1])) + pad;
  box.style.aspectRatio = `${(bx1 - bx0).toFixed(0)} / ${(by1 - by0).toFixed(0)}`;

  $('#level-overlay').innerHTML =
    `<svg viewBox="${bx0.toFixed(0)} ${by0.toFixed(0)} ${(bx1-bx0).toFixed(0)} ${(by1-by0).toFixed(0)}" ` +
      `xmlns="http://www.w3.org/2000/svg" class="planmap" role="group" ` +
      `aria-label="${esc(L.name)} plan, tap a car park">` +
      `<g class="zoomer">` +
        streets + `<g class="pmall">${mall}</g>` + anchors +
        `<g class="pzs">${pz}</g>` + here + marker +
      `</g>` +
    `</svg>`;

  $$('#level-overlay .pz').forEach(g => {
    const open = () => openDetail(g.dataset.park);
    g.addEventListener('click', () => { if (!zoomMoved($('#level-overlay'))) tapThen(g, open); });
    g.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); tapThen(g, open); }
    });
  });

  const lvlSvg = $('#level-overlay svg');
  makeZoomable(lvlSvg);
  hitFallback(lvlSvg, '.pz', g => tapThen(g, () => openDetail(g.dataset.park)));

  $('#level-note').textContent = my
    ? `Your car is in the ${parkName(mine)}${car.ref ? ', ' + car.ref : ''}.`
    : 'Open a car park and tap the bay you parked in.';
}

/* 屏 3：这一个停车场的车位图。车位是按轮廓生成的，不是真实数据 */
function renderDetail(){
  const L = CONFIG.levels[state.level], car = carOf(state.level);
  const id = state.detail || (car && car.park) || (L.zones[0] && L.zones[0].park);
  const mine = !!car && id === car.park;
  const info = CONFIG.carparks[id] || { detail: {}, tips: [] };
  const zone = (L.zones || []).find(z => z.park === id);

  $('#detail-swatch').style.background = parkFill(id);
  $('#detail-title').textContent = parkName(id);

  const box = $('#detail-plan'), layer = $('#detail-overlay');
  layer.innerHTML = '';

  if (!zone || !L.plan.upm){                       // 没轮廓就退回占位
    box.classList.remove('is-plan');
    box.style.aspectRatio = '4 / 3';
    $('#detail-sub').textContent = `${L.name}, car park map`;
    setPlan(box, '', `${parkName(id)} map`);
    $('#detail-tips').innerHTML = (info.tips || []).map(t =>
      `<li>${thumb(t.image, t.alt)}<div><b>${esc(t.title)}</b><small>${esc(t.note)}</small></div></li>`).join('');
    return;
  }

  const poly = parseZone(zone.pts);
  const spots = layoutBays(poly, baySpec(L.plan.upm));
  state.spots = spots;
  const myBay = mine ? (car.bay != null ? car.bay : Math.floor(spots.length * 0.42)) : -1;
  state.detail = id;

  $('#detail-sub').textContent = mine
    ? `${L.name} · ${spots[myBay] ? spots[myBay].ref : 'your car is here'}`
    : `${L.name} · ${spots.length} bays · tap the one you parked in`;

  /* 取景到这个车场，留一点边 */
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
  const pad = 6 * L.plan.upm;
  const x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad;
  const y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
  const u = (x1 - x0) / 1000;                      // 尺寸随车场大小缩放

  box.classList.add('is-plan');
  box.style.aspectRatio = `${(x1 - x0).toFixed(0)} / ${(y1 - y0).toFixed(0)}`;
  setPlan(box, '', '');

  const quad = q => q.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const cells = spots.map((b, i) =>
    `<polygon class="bay${i === myBay ? ' is-car' : ''}" points="${quad(b.quad)}" ` +
      `data-bay="${i}" role="button" tabindex="0" ` +
      `aria-label="${esc(b.ref)}${i === myBay ? ', your car' : ''}. Park here"/>`).join('');

  let mark = '';
  if (myBay >= 0 && spots[myBay]){
    const c = centroid(spots[myBay].quad);
    mark = `<g transform="translate(${c[0].toFixed(1)},${c[1].toFixed(1)})"><g class="carmark drop">` +
      `<circle class="carmark-halo" r="${(70 * u).toFixed(1)}"/>` +
      `<circle class="carmark-dot" r="${(22 * u).toFixed(1)}" stroke-width="${(7 * u).toFixed(1)}"/>` +
      `<circle class="carmark-eye" r="${(7 * u).toFixed(1)}"/>` +
    `</g></g>`;
  }

  layer.innerHTML =
    `<svg viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${(x1-x0).toFixed(0)} ${(y1-y0).toFixed(0)}" ` +
      `xmlns="http://www.w3.org/2000/svg" class="baymap" role="img" ` +
      `aria-label="${esc(parkName(id))}, ${spots.length} bays${mine ? ', your car marked' : ''}">` +
      `<g class="zoomer">` +
        `<polygon class="bay-ground" points="${quad(poly)}" style="--pc:${parkFill(id)}"/>` +
        `<g class="bays">${cells}</g>${mark}` +
      `</g>` +
    `</svg>`;

  /* 每一格都能点：问一句「是不是停在这」，确认了就记下来 */
  layer.querySelectorAll('.bay').forEach(el => {
    const pick = () => askPark(id, +el.dataset.bay);
    el.addEventListener('click', () => { if (!zoomMoved(layer)) tapThen(el, pick); });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); tapThen(el, pick); }
    });
  });
  const detSvg = layer.querySelector('svg');
  makeZoomable(detSvg);
  hitFallback(detSvg, '.bay', el => tapThen(el, () => askPark(id, +el.dataset.bay)));

  $('#detail-tips').innerHTML = (info.tips || []).map(t =>
    `<li>${thumb(t.image, t.alt)}<div><b>${esc(t.title)}</b><small>${esc(t.note)}</small></div></li>`).join('');
}

/* =========================================================
   地图缩放：车位在手机上只有几像素，得能放大才点得到。
   单指拖动 = 平移，双指 = 捏合，滚轮 / 双击也支持
   ========================================================= */
const MINK = 1, MAXK = 16;

/* 指针可能已经抬起了，捕获会抛，包一层 */
function grab(el, id){
  try { el.setPointerCapture(id); return true; } catch (e) { return false; }
}

/* 兜底：万一 click 因为指针捕获之类的原因没落到目标元素上，
   就用指针位置反查一次。不加这层的话，这类问题会静默地让整个地图点不动 */
function hitFallback(svg, sel, run){
  svg.addEventListener('click', e => {
    if (svg.dataset.moved === '1') return;
    if (e.target.closest && e.target.closest(sel)) return;   // 元素自己已经处理了
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const el = under && under.closest && under.closest(sel);
    if (el) run(el);
  });
}

function makeZoomable(svg){
  if (!svg || svg.dataset.zoom) return;
  const g = svg.querySelector('.zoomer');
  if (!g) return;
  svg.dataset.zoom = '1';

  const vb = svg.viewBox.baseVal;
  const view = { k: 1, x: 0, y: 0 };
  const pts = new Map();
  let pinch = null;

  const apply = () => {
    const span = 1 - view.k;
    const lo = x => Math.min((vb.x + vb.width) * span, Math.max(vb.x * span, x));
    const loY = y => Math.min((vb.y + vb.height) * span, Math.max(vb.y * span, y));
    view.x = lo(view.x); view.y = loY(view.y);
    g.setAttribute('transform', `translate(${view.x.toFixed(2)} ${view.y.toFixed(2)}) scale(${view.k.toFixed(4)})`);
    svg.classList.toggle('is-zoomed', view.k > 1.02);
  };

  /* 屏幕坐标 -> viewBox 坐标 */
  const toUser = e => {
    const m = svg.getScreenCTM();
    if (!m) return [0, 0];
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return [p.x, p.y];
  };

  /* 以某点为锚缩放，那一点在屏幕上不动 */
  const zoomAt = (p, k1) => {
    k1 = Math.max(MINK, Math.min(MAXK, k1));
    const c = [(p[0] - view.x) / view.k, (p[1] - view.y) / view.k];
    view.k = k1;
    view.x = p[0] - c[0] * k1;
    view.y = p[1] - c[1] * k1;
    apply();
  };

  let downAt = null, captured = false;
  svg.addEventListener('pointerdown', e => {
    /* 这里绝对不能马上 setPointerCapture：一旦捕获，pointerdown/up 都被重定向到 svg，
       浏览器就把 click 派到 svg 而不是停车区，区域上的监听器永远收不到。
       等真的开始拖了再捕获 */
    pts.set(e.pointerId, toUser(e));
    svg.dataset.moved = '0';
    downAt = [e.clientX, e.clientY];
    if (pts.size === 2){
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: view.k };
      if (!captured) captured = grab(svg, e.pointerId);   // 双指必然是手势
    }
  });

  svg.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId), now = toUser(e);
    pts.set(e.pointerId, now);

    if (pts.size === 2 && pinch){
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (pinch.d > 0) zoomAt([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], pinch.k * (d / pinch.d));
      svg.dataset.moved = '1';
    } else if (pts.size === 1){
      /* 「算不算拖动」按屏幕像素判断 —— 用 viewBox 单位会小到一点就误判 */
      if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 9){
        svg.dataset.moved = '1';
        if (!captured) captured = grab(svg, e.pointerId);   // 拖起来了再捕获
      }
      if (svg.dataset.moved === '1'){
        view.x += now[0] - prev[0];
        view.y += now[1] - prev[1];
        apply();
      }
    }
  });

  const drop = e => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (!pts.size) captured = false;
  };
  svg.addEventListener('pointerup', drop);
  svg.addEventListener('pointercancel', drop);

  svg.addEventListener('wheel', e => {
    e.preventDefault();
    zoomAt(toUser(e), view.k * (e.deltaY < 0 ? 1.18 : 1 / 1.18));
  }, { passive: false });

  svg.addEventListener('dblclick', e => {
    e.preventDefault();
    zoomAt(toUser(e), view.k > 1.8 ? 1 : 4);
  });

  svg.reset = () => { view.k = 1; view.x = 0; view.y = 0; apply(); };
  apply();
}

/* 刚才那一下是拖动还是点击 —— 拖完不该顺手选中一个车位 */
function zoomMoved(box){
  const svg = box.querySelector('svg');
  return !!svg && svg.dataset.moved === '1';
}

/* ---------- 「是不是停在这」 ---------- */
function askPark(park, bay){
  const spot = (state.spots || [])[bay];
  if (!spot || !$('#ask')) return;
  state.ask = { level: state.level, park, bay, ref: spot.ref };
  $('#ask-where').textContent = `${parkName(park)} · ${spot.ref}`;
  const el = $('#ask');
  el.hidden = false;
  void el.offsetWidth;
  el.classList.add('is-on');
  $('#ask-yes').focus();
}

function closeAsk(){
  const el = $('#ask');
  el.classList.remove('is-on');
  setTimeout(() => { el.hidden = true; }, 220);
  state.ask = null;
}

function confirmPark(){
  if (!state.ask) return;
  state.parked = { ...state.ask };
  saveParked();
  const park = state.ask.park;
  closeAsk();
  state.detail = park;
  renderDetail();
  renderLevel(state.level, false);
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

/* 停车场在楼板下面时定位会飘甚至断掉，所以是持续跟踪 + 安静降级：
   拿不到就不画「你在这」，图和 pin 照常 */
function trackHere(on){
  if (!CONFIG.useRealGPS || !navigator.geolocation) return;
  if (!on){
    if (state.watch != null) navigator.geolocation.clearWatch(state.watch);
    state.watch = null;
    return;
  }
  if (state.watch != null) return;
  state.watch = navigator.geolocation.watchPosition(
    pos => { state.gps = pos; if ($('#level').classList.contains('is-on')) renderLevel(state.level, false); },
    () => {},
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
  );
}

/* 点楼板 → 该层抬起、另一层淡出 → 定位 → 平面图立起来 */
async function pickLevel(lv, node){
  if (state.busy) return;
  state.busy = true;

  const hunting = !!carOf(lv);       // 标过车位才叫「找车」，否则是去标车位
  node.classList.add('is-picked');
  $('#home').classList.add('is-leaving');

  const ready = Promise.all([locate(), wait(hunting ? CONFIG.findingDelay : 420)]);
  if (hunting){ await wait(230); showFinding(true); }
  const [pos] = await ready;

  state.gps = pos;
  renderLevel(lv, true);
  show('level', 'fwd');
  trackHere(true);
  showFinding(false);

  $('#home').classList.remove('is-leaving');
  $$('.deck').forEach(g => g.classList.remove('is-picked'));
  state.busy = false;
}

function openDetail(park){
  const car = carOf(state.level), zs = CONFIG.levels[state.level].zones || [];
  state.detail = park || (car && car.park) || (zs[0] && zs[0].park);
  renderDetail();
  show('detail', 'fwd');
}

/* ---------- 接线 ---------- */
loadParked();
renderStage();
on('#ask-yes', 'click', confirmPark);
on('#ask-no', 'click', closeAsk);
on('#ask', 'click', e => { if (e.target.id === 'ask') closeAsk(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && state.ask) closeAsk(); });
paintPick();
$$('[data-pick]').forEach(b => b.addEventListener('click', () => setPick(b.dataset.pick)));
$$('.seg button').forEach(b => b.addEventListener('click', () => renderLevel(b.dataset.level, true)));
$$('[data-back]').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.back === 'home'){ trackHere(false); state.gps = null; }
  if (b.dataset.reset){ state.parked = null; saveParked(); }   // 找到车了，这次的记录就结束
  show(b.dataset.back, 'back');
}));
