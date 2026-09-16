# Find my car – Garden City 原型

DECO7250 小组作业的 mid-fi 原型：帮顾客在 Westfield Garden City 找到自己停的车。
不需要安装任何东西，双击 `index.html` 就能看。

## 文件
- `index.html` — 只有结构
- `styles.css` — 全部样式，改颜色/间距只动最上面 `:root` 里的变量
- `app.js` — 数据 + 逻辑，分成 4 块，开头都有注释
- `images/` — 楼层图、提示照片；`reference-sign.jpg` 是商场那块 "Can't Find Your Car?"
  指示牌的照片，首页那个 3D 模型就是从它上面描出来的

## 三屏
1. 首页：整屏只有商场结构的 3D 模型，做成**上下两层楼板**（上面 L2、下面 L1）。
   点哪一层就选哪一层——没有顶栏、没有标题、没有按钮，楼板本身就是控件。
2. 该层平面图：红框 = 你的停车场，红色 pin = 你的车，点 pin 看细节。
3. 停车场细节图 + 提示列表 + "I found my car" 回首页。

## 换图片
1. 把图片放进 `images/`。
2. 打开 `app.js`，在最上面的 `CONFIG` 里把对应的 `image: ''` 改成 `image: 'images/文件名.png'`。
3. `aspect` 改成图片真实的宽高比（比如 `'16 / 9'`），pin 才会落在对的位置。
4. `x` / `y` / `zone` 是百分比（左上角 0,0），对着图调。

## 手机上看
在这个文件夹里运行 `python3 -m http.server 8000`，手机和电脑连同一个 Wi-Fi，
手机浏览器打开 `http://电脑的IP:8000`。
