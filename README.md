# Centripetal - 创生艺术与向心引力

这是一个基于 **p5.js** 开发的生成艺术（Generative Art）项目。本项目的设计灵感来源于经典生成艺术作品——Jared Tarbell 于 2003 年创作的 *Bubble Chamber（气泡室）*。[Complexification | Gallery of Computation](http://www.complexification.net/gallery/) [Jared S Tarbell – Generative Art and Computational Work](https://www.jaredstarbell.com/)

项目通过流动的线迹背景、不断向外辐射扩散的微小粒子同心环、若隐若现的渐变恒星辉光，以及在最终阶段（第 600 帧）瞬间定格的精密几何分形网格，构建出了一个融合了“有机混沌”与“秩序几何”的视觉宇宙。

---

## 📂 项目结构

项目代码经过语义化与规范化重命名，结构如下：
*   **[`index.html`](file:///c:/Users/bb287/Desktop/centripetal/index.html)**：项目入口文件。优化了加载顺序，优先引入 p5.js 核心库，然后引入特效辅助脚本与主逻辑脚本。同时增加了居中排版和深色背景样式。
*   **[`sketch.js`](file:///c:/Users/bb287/Desktop/centripetal/sketch.js)**：画布初始化与主渲染循环。负责流动线条背景绘制、向心点阵辐射计算、恒星渐变辉光渲染以及多图层混合合成。并将上证指数实时读数映射到向心流速、辉光强度与调色板冷暖。
*   **[`effects.js`](file:///c:/Users/bb287/Desktop/centripetal/effects.js)**：效果工具集。包含胶片噪点颗粒滤镜的计算、键盘交互保存事件以及递归划分三角形（谢尔宾斯基三角形变体）分形图案的计算。
*   **[`data.js`](file:///c:/Users/bb287/Desktop/centripetal/data.js)**：实时数据层。拉取上证指数（SSE Composite Index）实时行情，失败时回退到本地的 `sse_index_daily.csv` 缓存样本，并对外暴露归一化点位、涨跌幅、时间戳与来源标记。
*   **[`sse_index_daily.csv`](file:///c:/Users/bb287/Desktop/centripetal/sse_index_daily.csv)**：上证指数日线缓存样本（200 个交易日，2025-08-06 至 2026-06-05，含 date/open/close/high/low），作为实时拉取失败时的回退数据源。

---

## 🎨 核心技术解析

### 1. 胶片噪点颗粒滤镜 (Film Grain & Noise Texture)

为了使数字生成的画面具有传统纸张、画布或复古胶片的物理质感，项目在初始化时使用 `makeFilter()` 函数生成了一张半透明的静态噪点纹理图层（`overAllTexture`）。

#### 实现原理：
1.  **HSB 颜色模式**：使用极低饱和度（Saturation）的色调控制，仅微调亮度和透明度。
2.  **双重像素循环**：利用 `createGraphics` 创建一个离屏画布，双重循环遍历画布上的每一个像素点 $(i, j)$。
3.  **2D Perlin 噪声插值**：
    噪声值的计算公式为：
    $$\text{noiseValue} = \text{noise}\left(\frac{i}{3}, \frac{j}{3}, \frac{i \times j}{50}\right)$$
    Perlin 噪声能产生比纯随机数更平滑、具有方向性和自然纹理特征的连续灰度过渡，模拟出精细的“颗粒”堆积感。
4.  **随机透明度叠加**：
    根据设定的黑白版本（`ver == 1` 为亮色纸张，`ver == 2` 为暗色碳质），将计算出的噪声值乘以一个随机缩放系数作为 Alpha 通道（透明度）写入像素：
    ```javascript
    color(0, 0, random(5, 10), noise(i / 3, j / 3, (i * j) / 50) * random(5, 15))
    ```
5.  **图层叠加**：在每一帧渲染的末尾，使用 `blendMode(BLEND)` 将该噪点图层铺在最上方，赋予整幅画作一种微小颗粒起伏的纸质微光感。

---

### 2. 谢尔宾斯基三角形变体递归划分算法 (Recursive Triangle Subdivision)

当动画播放到第 600 帧时，主循环通过 `noLoop()` 停止。此时，画作的顶层会以 `ADD`（加色混合）模式绘制一层精密的几何分形图案。该图案基于经典的 **谢尔宾斯基三角形（Sierpinski Triangle）** 递归划分算法的变体实现。

#### 算法步骤与几何分解：
1.  **六向基底对称**：
    在 `drawOverPattern()` 中，算法以画布中心为原点，每次旋转 $60^\circ$（$\frac{2\pi}{6}$），围绕中心点生成 6 个相互拼接的大三角形，围合成一个正六边形区域。
2.  **三等分线性插值**：
    辅助函数 `prop(x1, y1, x2, y2, k)` 用于计算两点间比例为 $k$ 的插值点坐标。
    $$\vec{P}_{new} = (1 - k)\vec{P}_1 + k\vec{P}_2$$
3.  **非对称九划分递归 (`divideOP`)**：
    传统的谢尔宾斯基三角形每次迭代将一个三角形划分为 4 个子三角形。而本项目的变体算法则更加复杂，它在三角形的三条边上计算出了三等分点（$1/3$ 和 $2/3$ 比例处）以及一个内部对角平分点 $G$。
    通过这 7 个控制点（$A, B, C, D, E, F$ 以及中点 $G$），单次划分会分裂出 **9 个更小的子三角形**：
    *   角部三角形：$\Delta(1, A, F)$, $\Delta(B, 2, C)$, $\Delta(E, D, 3)$
    *   边部三角形：$\Delta(A, B, G)$, $\Delta(C, G, B)$, $\Delta(G, C, D)$, $\Delta(D, E, G)$, $\Delta(G, E, F)$, $\Delta(F, G, A)$
    
    递归深度被硬编码为 `n = 6`。这意味着一个初始三角形会经历 6 次分裂，最终在叶子节点处产生多达 $9^6 = 531,441$ 个微型三角形，具有极高的几何细节度。

4.  **叶子节点线描渲染 (`makeTriangle`)**：
    当递归到达叶子层（`n == 1`）时，系统不再继续划分，而是调用 `makeTriangle()` 渲染该三角形：
    *   随机打乱三个顶点的顺序，以产生不对称的朝向。
    *   以 $\frac{1}{2^m}$ （$m \in [2, 3]$）为步长，在三角形内部绘制渐进式的平行线条。
    *   配合 `drawingContext.setLineDash([1, 5, 1, 3])` 设置虚线样式，使得这些细小的线条呈现出精密仪器刻度或星图连线般的科幻质感。

---

## 📈 实时数据映射 (Real-time Data Mapping)

本项目以 **上证综合指数（SSE Composite Index）** 作为驱动材料，将市场行情接入向心引力的视觉宇宙。

### 数据来源与回退
*   **实时行情**：通过公开行情接口 `https://qt.gtimg.cn/q=sh000001` 每 30 秒拉取一次最新点位、涨跌点数与涨跌幅（该接口返回 `Access-Control-Allow-Origin: *`，浏览器可直接跨域请求）。
*   **缓存回退**：当实时请求失败（离线 / 网络受限 / 行情接口不可达）时，自动回退到本地 `sse_index_daily.csv`，并按每 3 秒一个交易日的节拍向前推进，保证装置永不黑屏。实时读数超过 90 秒未刷新亦视为过期，回落到缓存流。

### 数据 → 视觉映射
| 数据维度 | 视觉属性 | 映射方式 |
| --- | --- | --- |
| 指数点位（归一化到观测区间 3633–4242） | 向心流速 `speedMul` | `lerp(0.55, 1.6, norm)` — 点位越高，粒子与线条向心坠落越快 |
| 指数点位（归一化） | 辉光强度 `glowMul` | `lerp(0.4, 1.5, norm)` — 点位越高，向心辉光越亮越大 |
| 当日涨跌方向 | 调色板冷暖 | 涨（change ≥ 0）→ 暖色系；跌 → 冷色系，方向翻转时重选 |

画面左上角的**现场铭牌（in-space label）**实时显示：当前点位、涨跌（点数 / 百分比）、时间戳与 `LIVE` / `CACHE` 来源标记，构成公共场景中的“实时读数”说明牌。

---

## 🚀 运行与保存

1.  **运行项目**：
    *   **必须通过静态服务器运行**（`loadTable` 加载 CSV 不能在 `file://` 协议下工作）：
        ```bash
        # 使用 Python
        python -m http.server 8000

        # 或者使用 Node.js
        npx http-server .
        ```
    *   然后在浏览器中打开 `http://localhost:8000/index.html`。
2.  **键盘交互**：
    *   运行过程中，随时可以在键盘上按下 **`S`** 或 **`s`** 键，快速将当前画布上的画面保存为高品质的 `.png` 图片。
