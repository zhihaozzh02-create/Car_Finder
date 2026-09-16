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
      /* 我们自己画的平面图。w/h 是图纸坐标空间，下面所有坐标都在这个空间里。
         mall / zones 是从商场官方图（reference/）里描出来的，不是手写的 */
      plan: {
        w: 1750, h: 2650, upm: 3.4,   // 1 米 ≈ 多少图纸单位，车位尺寸按它算
        /* 商场本体：静态，不可点 */
        /* 商场本体：一块干净的外轮廓，内部细节对「找车」没用，只会糊 */
        mall: [
          '360.4 173.9,392.9 173.1,406.0 197.9,720.7 193.3,733.3 214.5,794.1 216.5,804.0 268.9,859.5 252.1,871.0 221.1,892.9 268.6,922.9 269.5,917.3 204.3,1042.8 218.8,1092.1 257.9,1105.5 314.9,1155.1 352.7,1161.4 386.3,1214.5 450.5,1212.6 467.5,1168.2 508.1,1158.9 866.9,1135.3 892.2,1119.2 1041.9,1154.0 1050.0,1346.0 1035.0,1362.6 1044.3,1363.2 1340.2,1061.5 1344.5,1054.2 1244.5,1018.1 1240.0,1007.1 1447.6,762.2 1450.1,762.5 1537.7,819.9 1563.1,818.6 1583.6,790.5 1590.1,789.0 1613.0,794.5 1631.1,819.1 1635.9,824.5 1657.1,995.5 1665.5,1005.3 1781.5,1254.5 1791.2,1251.5 2103.5,974.1 2107.5,971.9 2133.6,998.5 2159.2,998.9 2197.0,989.7 2240.0,957.0 2271.4,942.4 2270.6,919.8 2237.3,882.2 2239.2,868.0 2270.9,804.1 2238.4,796.8 2222.8,831.5 2194.9,831.9 2167.8,789.0 2157.0,751.7 2127.8,724.9 2133.2,703.8 2174.8,644.0 2147.6,541.5 2141.5,553.9 1973.9,638.4 1972.8,653.0 2007.9,744.5 1987.9,742.5 1942.9,670.5 1936.9,660.0 1841.0,744.5 1831.2,749.9 1810.0,714.9 1798.1,696.1 1748.4,667.1 1741.9,657.1 1616.5,614.8 1612.2,606.5 1585.9,571.3 1577.7,590.9 1493.9,644.2 1485.5,646.0 1371.0,577.1 1351.9,575.3 1197.3,618.1 1187.5,620.0 1134.0,569.1 1105.9,567.8 614.1,359.2 603.4,359.9 174.4',
          '187.4 749.9,313.0 748.5,330.5 759.5,328.5 966.5,185.5 963.9,186.9 750.4',
          '192.0 205.0,234.0 205.0,234.0 435.0,192.0 435.0'
        ],
        anchors: [
          { name: 'mycar', x: 212, y: 318 },
          { name: 'Officeworks', x: 257, y: 858 },
          { name: 'Kmart', x: 488, y: 402 },
          { name: 'H&M', x: 745, y: 252 },
          { name: 'MYER', x: 1000, y: 401 },
          { name: 'ZARA', x: 642, y: 757 },
          { name: 'ALDI', x: 1114, y: 748 },
          { name: 'Coles', x: 1265, y: 1190 },
          { name: 'JB HI-FI', x: 937, y: 1404 },
          { name: 'COTTON:ON', x: 898, y: 1697 },
          { name: 'UNIQLO', x: 849, y: 1941 },
          { name: 'rebel', x: 627, y: 2072 },
          { name: 'TOYMATE', x: 934, y: 2040 }
        ],
        streets: [
          { name: 'Link Street', x: 740, y: 112, rotate: 0 },
          { name: 'Logan Road', x: 103, y: 826, rotate: -90 },
          { name: 'Macgregor Street', x: 1520, y: 1096, rotate: -90 },
          { name: 'Pacific Motorway', x: 1620, y: 1096, rotate: -90 },
          { name: 'Kessels Road', x: 313, y: 2429, rotate: 47 },
          { name: 'Macgregor Street', x: 1400, y: 2456, rotate: -38 }
        ]
      },
      /* 可点的停车区。name 用图上印的叫法，park 指向 CARPARKS 里的编号 */
      zones: [
        { park: 'P4', name: 'Aqua Carpark', pts: '263 199,267 203,354 205,349 562,349 607,356 609,352 746,345 743,185 742,186 678,191 684,216 684,219 676,218 650,186 650,188 434,223 436,232 432,233 206,258 205' },
        { park: 'P5', name: 'Aqua Carpark', pts: '1208 611,1331 613,1363 641,1368 641,1428 700,1426 819,1169 820,1168 616,1173 612' },
        { park: 'P6', name: 'Pink Carpark', pts: '1237 822,1425 824,1428 953,1424 1028,1229 1029,1168 1029,1169 829,1172 823' },
        { park: 'P21', name: 'Green Carpark', pts: '189 1112,544 1115,545 1217,565 1220,563 1227,555 1229,555 1256,550 1260,549 1271,549 1664,575 1667,575 1763,561 1776,560 1797,542 1798,539 1802,540 2009,262 2003,244 2002,240 1996,186 1146' },
        { park: 'P11', name: 'Purple Carpark', pts: '866 1456,1185 1458,1190 1471,1187 1524,1191 1614,884 1612,881 1511,860 1506,859 1461' }
      ],
      /* GPS 标定：在场地里站两个认得出来的位置各记一次经纬度，
         把那两点的图纸坐标和经纬度填进来，就能把实时定位画到图上。
         两个点越远越准，别选在一条很短的线上。留 null = 不画「你在这」 */
      geo: { a: { x: null, y: null, lat: null, lon: null },
             b: { x: null, y: null, lat: null, lon: null } },
      car:  { carpark: 'P6' }   // 不填 x/y 就落在所属区域的中心；要微调就加 x / y（底图宽高的百分比）
    },
    L2: {
      name: 'Level 2',
      /* 我们自己画的平面图，几何来自 reference/ 里矫正后的官方图 */
      plan: {
        w: 1150, h: 1728, upm: 2.25,
        mall: [
          '517 367,553 462,762 463,781 483,779 559,618 577,615 606,618 668,722 671,722 954,750 956,734 958,742 1111,735 1034,713 1033,712 1011,674 1017,690 1096,679 1142,694 1143,696 1157,683 1160,683 1177,682 1159,630 1154,632 1126,606 1126,605 1152,584 1164,574 1133,531 1133,538 1075,442 1074,445 1129,475 1129,476 1109,494 1106,500 1179,545 1174,547 1191,579 1181,594 1200,668 1200,674 1214,693 1214,693 1247,672 1256,666 1288,631 1283,624 1298,621 1267,574 1284,575 1314,617 1315,600 1319,600 1345,619 1351,619 1375,653 1377,619 1376,618 1402,579 1401,579 1429,543 1429,461 1481,456 1456,433 1453,535 1427,550 1400,573 1394,568 1351,492 1326,473 1277,452 1271,425 1229,334 1229,334 1085,337 1067,494 1067,496 1052,514 1051,526 999,548 998,549 933,498 933,497 958,489 941,457 933,517 915,531 929,558 928,558 865,531 864,560 860,567 841,548 759,528 758,550 754,550 661,536 647,498 647,483 665,429 659,439 626,489 642,536 631,537 591,501 570,475 570,473 588,472 575,433 571,432 547,367 538,375 519,428 520,432 547,461 547,520 520,517 368',
          '518 115,648 131,681 189,700 193,701 207,671 208,671 249,719 259,728 240,726 261,678 288,658 331,541 325,534 287,503 287,498 314,499 264,472 261,497 261,502 241,505 274,536 275,547 237,514 227,513 205,478 205,463 250,444 214,416 215,415 301,457 302,461 283,461 338,447 340,447 358,457 302,416 302,408 336,267 333,269 122,517 116',
          '760 1150,775 1152,780 1180,817 1221,849 1221,881 1265,897 1267,904 1291,980 1313,960 1314,896 1458,821 1468,817 1486,784 1487,784 1441,747 1440,789 1436,790 1405,760 1411,738 1370,767 1370,773 1337,819 1328,820 1301,836 1300,826 1240,795 1242,792 1282,802 1283,783 1283,780 1301,767 1249,781 1248,781 1215,748 1211,739 1248,738 1221,703 1213,723 1178,750 1177,759 1151'
        ],
        anchors: [
          { name: 'Target', x: 345, y: 219 },
          { name: 'H&M', x: 488, y: 147 },
          { name: 'MYER', x: 612, y: 210 },
          { name: 'ZARA', x: 416, y: 413 },
          { name: 'BIG W', x: 636, y: 806 },
          { name: 'Harris Scarfe', x: 597, y: 1035 },
          { name: 'Woolworths', x: 378, y: 1155 },
          { name: 'Holey Moley', x: 708, y: 1008 },
          { name: 'Area X', x: 705, y: 1092 },
          { name: 'TIMEZONE', x: 875, y: 1330 },
          { name: 'ZONE BOWLING', x: 875, y: 1372 },
          { name: 'EVENT', x: 678, y: 1515 }
        ],
        streets: [
          { name: 'Link Street', x: 498, y: 62, rotate: 0 },
          { name: 'Logan Road', x: 78, y: 522, rotate: -90 },
          { name: 'Macgregor Street', x: 1008, y: 687, rotate: -90 },
          { name: 'Pacific Motorway', x: 1077, y: 683, rotate: -90 },
          { name: 'Kessels Road', x: 210, y: 1560, rotate: 47 },
          { name: 'Macgregor Street', x: 942, y: 1575, rotate: -38 }
        ]
      },
      zones: [
        { park: 'P8', name: 'Black Carpark', pts: '587 325,604 325,608 336,624 339,834 335,836 374,880 377,880 518,783 518,783 480,770 461,581 465,576 445,567 438,555 438,553 415,533 410,533 330,578 332' },
        { park: 'P7', name: 'Grey Carpark', pts: '783 520,880 520,878 725,729 727,725 664,619 663,619 581,699 581,708 575,711 565,779 563,783 559' },
        { park: 'P22', name: 'Olive Carpark', pts: '347 464,427 464,427 621,421 622,421 645,410 646,410 950,447 951,447 1062,306 1063,296 1047,289 1047,284 1023,266 991,269 775,264 471,266 467' },
        { park: 'P10', name: 'Violet Carpark', pts: '845 902,874 906,890 933,919 960,920 1266,908 1266,869 1244,851 1222,816 1211,796 1180,785 1176,785 1160,775 1150,775 930,777 925,798 925,799 907,804 903' },
        { park: 'P17', name: 'Yellow Carpark', pts: '163 1157,171 1157,207 1188,278 1235,351 1361,357 1381,363 1383,364 1394,180 1458' },
        { park: 'P17', name: 'Yellow Carpark', pts: '340 1234,430 1240,436 1251,446 1253,450 1267,473 1278,480 1290,480 1318,514 1321,532 1358,551 1364,559 1392,442 1448,429 1445,429 1435,423 1434,414 1407,400 1391,400 1382,369 1327,353 1283,347 1282,339 1258' },
        { park: 'P15', name: 'Orange Carpark', pts: '360 1394,369 1394,398 1446,433 1519,458 1556,460 1568,500 1631,511 1665,447 1667,438 1662,397 1634,364 1603,356 1602,350 1592,342 1591,301 1554,292 1552,290 1545,269 1534,265 1526,239 1511,221 1492,194 1476,190 1468,180 1465,180 1457,201 1455' },
        { park: 'P15', name: 'Orange Carpark', pts: '578 1426,584 1426,630 1502,630 1539,650 1540,682 1605,579 1663,556 1666,545 1656,508 1580,500 1574,472 1515,464 1509,460 1488,467 1480,480 1479' },
        { park: 'P14', name: 'Red Carpark', pts: '818 1433,857 1451,860 1460,936 1494,934 1506,902 1559,890 1590,884 1592,882 1607,867 1633,843 1629,796 1598,792 1522,784 1511,784 1500,794 1491,788 1464,794 1456,810 1455,816 1449' }
      ],
      geo: { a: { x: null, y: null, lat: null, lon: null },
             b: { x: null, y: null, lat: null, lon: null } },
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
/* 元素找不到就跳过，别让一处缺失把后面的接线全带崩 */
const on = (sel, ev, fn) => { const el = $(sel); if (el) el.addEventListener(ev, fn); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const parkName = id => (CARPARKS[id] || ['?', '#888'])[0];
const parkFill = id => (CARPARKS[id] || ['?', '#888'])[1];

const state = { level: 'L1', pick: 'L1', detail: null, gps: null, watch: null, busy: false,
                parked: null, ask: null };

/* 这一层的车停在哪。用户自己在车位图上标过就以用户的为准，否则用 CONFIG 里的演示数据 */
function carOf(lv){
  if (state.parked) return state.parked.level === lv ? state.parked : null;   // 车只可能在一层
  const c = CONFIG.levels[lv].car;
  return { level: lv, park: c.carpark, bay: c.bay != null ? c.bay : null, ref: null };
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
  $('#level-sub').textContent = (mine ? `Your car is here, ${L.name}` : `Tap the bay you parked in`) +
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
    g.addEventListener('click', () => { if (!zoomMoved($('#level-overlay'))) open(); });
    g.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); }
    });
  });

  makeZoomable($('#level-overlay svg'));

  $('#level-note').textContent = my
    ? `Your car is in the ${parkName(mine)}${car.ref ? ', ' + car.ref : ''}. Tap a car park to see its bays.`
    : 'Tap a car park to see its bays.';
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
    el.addEventListener('click', e => { if (!zoomMoved(layer)) pick(); });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); pick(); }
    });
  });
  makeZoomable(layer.querySelector('svg'));

  $('#detail-tips').innerHTML = (info.tips || []).map(t =>
    `<li>${thumb(t.image, t.alt)}<div><b>${esc(t.title)}</b><small>${esc(t.note)}</small></div></li>`).join('');
}

/* =========================================================
   地图缩放：车位在手机上只有几像素，得能放大才点得到。
   单指拖动 = 平移，双指 = 捏合，滚轮 / 双击也支持
   ========================================================= */
const MINK = 1, MAXK = 16;

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

  svg.addEventListener('pointerdown', e => {
    svg.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, toUser(e));
    svg.dataset.moved = '0';
    if (pts.size === 2){
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: view.k };
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
      const dx = now[0] - prev[0], dy = now[1] - prev[1];
      if (Math.abs(dx) + Math.abs(dy) > vb.width * 0.004) svg.dataset.moved = '1';
      view.x += dx; view.y += dy;
      apply();
    }
  });

  const drop = e => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
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

  node.classList.add('is-picked');
  $('#home').classList.add('is-leaving');

  const ready = Promise.all([locate(), wait(CONFIG.findingDelay)]);
  await wait(230);
  showFinding(true);
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
  state.detail = park || CONFIG.levels[state.level].car.carpark;
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
