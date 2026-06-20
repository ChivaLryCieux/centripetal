// by SamuelYAN
// more works //
// https://twitter.com/SamuelAnn0924
// https://www.instagram.com/samuel_yan_1990/

// refer: Bubble Chamber - Jared Tarbell, 2003
// http://www.complexification.net/gallery/machines/bubblechamber/

// --- 全局变量 ---
var mySize, margin;
var seed = Math.random() * 9217;

// 色彩定义 — 投影模式：白底搭配高饱和度彩色
// 浅底色（用于背景）
let colors1 = "ffffff-fafdff-fcfbf4-f9f8f6".split("-").map((a) => "#" + a);
let colors2;
// 高饱和度调色板（已重新调整：替换原本黑色/灰色项为高饱和颜色，确保在白底上清晰且鲜艳）
let colors_tone1 = "0D1E40-224573-5679A6-F2A25C-D96B43".split("-").map((a) => "#" + a); // 海洋日落
let colors_tone2 = "7E56A6-F28B50-A63B14-591202-D9043D".split("-").map((a) => "#" + a); // 红橙紫
let colors_tone3 = "4ED98A-3B8C57-F2AD85-2E86AB-D9043D".split("-").map((a) => "#" + a); // 翠绿橙
let colors_tone4 = "725373-7866F2-8979F2-025373-BF7D56".split("-").map((a) => "#" + a); // 紫青暖
let colors_tone5 = "20BF1B-218C11-17590C-D9A404-D9043D".split("-").map((a) => "#" + a); // 森林霓虹
let colors_tone6 = "F20519-A60522-031059-071773-044BD9".split("-").map((a) => "#" + a); // 红蓝高对比
let colors_tone7 = "F2E96D-F2B84B-BF8034-D9043D-7E56A6".split("-").map((a) => "#" + a); // 金黄暖
let colors_tone8 = "9E9BF2-F2E088-F29544-F24405-F27E63".split("-").map((a) => "#" + a); // 糖果记忆

let colors_root = "362300-805300-402900-734E39".split("-").map((a) => "#" + a);

let colorset = [];
// 高饱和深色调色板：用于阴影/分形纹理，在白底上提供清晰且色彩斑斓的对比
let colorbg = "1a3370-7a1a73-066b5e-a30a3a-3d0a8c-c44a00".split("-").map((a) => "#" + a);
let filter1;
let t, par_num;

// --- 实时数据驱动：上证指数 (SSE Composite Index) ---
// 数据由 data.js 的 SSE 层提供（live quote，失败回退到 sse_index_daily.csv）。
// 映射策略：指数点位 → 向心流速 + 辉光强度；当日涨跌方向 → 调色板冷暖。
let warmPalettes = [colors_tone2, colors_tone7, colors_tone8, colors_tone5]; // 涨：暖色
let coolPalettes = [colors_tone1, colors_tone3, colors_tone4, colors_tone6]; // 跌：冷色
let lastChangeSign = 0;        // 上一次涨跌方向，用于检测翻转并重选调色板
let lastPaletteFlipMs = -10000; // 调色板翻转节流，避免在零点附近频繁闪烁
let displayNorm = 0.5;         // 缓动后的归一化指数 [0,1]，用于驱动视觉
let speedMul = 1.0;            // 向心流速倍率（由指数点位驱动）
let glowMul = 1.0;             // 辉光强度倍率（由指数点位驱动）

// 根据涨跌方向从对应色系中重选调色板，重建 colorset
function applyPalette(sign) {
	const family = sign >= 0 ? warmPalettes : coolPalettes;
	colors2 = random(family);
	colorset[0] = random(colors2);
	colorset[1] = random(colors2);
	colorset[2] = random(colors1);
	colorset[3] = random(colors2);
	colorset[4] = random(colors2);
	colorset[5] = random(colors2);
	lastChangeSign = sign;
}

// 数据层 preload：加载上证指数缓存样本（live quote 在 draw 中按节拍拉取）
function preload() {
	SSE.preload();
}
let originalGraphics; // 合并后的主离屏画布，包含背景和所有累加绘制的线条与粒子
let glowGraphics; // 独立的向心辉光离屏画布，每帧清空以消除灰色拖影
let fractalGraphics; // 顶层分形图案静态缓存离屏画布，在 setup 中一次性绘制，保持高性能
let overAllTexture; // 噪点纹理离屏画布
let ver;
let bgCol; // 随机的深色背景底色

// 向心粒子系统：粒子从外缘向中心螺旋运动
let cParticles = [];
const C_PARTICLE_COUNT = 12; // 调整为 12，配合 10 倍长的渐消拖尾，可自动累积成星尘长尾效果

// 向心线条环：从外向内收缩的多层波纹环
let lineRings = [];
const LINE_RING_COUNT = 3;

// 向心辉光圆环：独立的径向渐变圆，从外缘向中心运动并在到达后销毁
let glowCircles = [];
const MAX_GLOW_CIRCLES = 30;

function setup() {
	frameRate(50);
	randomSeed(int(seed));
	// mySize = min(windowWidth, windowHeight);
	mySize = 860;
	margin = mySize / 100;
	createCanvas(mySize, mySize);
	originalGraphics = createGraphics(width, height);
	glowGraphics = createGraphics(width, height);

	// 初始化向心粒子，分散在不同半径处，形成持续的向心流
	for (let i = 0; i < C_PARTICLE_COUNT; i++) {
		cParticles.push({
			angle: random(TWO_PI),
			dist: random(mySize * 0.05, mySize * 0.5),
			speed: random(0.15, 0.5),
			rotSpeed: random(-0.004, 0.004),
			spreadScale: random(0.6, 1.4)
		});
	}

	// 初始化线条环，从不同半径开始收缩
	for (let i = 0; i < LINE_RING_COUNT; i++) {
		lineRings.push({
			radius: random(mySize * 0.1, mySize * 0.5),
			speed: random(0.2, 0.5)
		});
	}

	// pixelDensity(3);
	// 初始化实时数据层：计算观测区间、从最新缓存行播种当前读数
	SSE.init();
	// 依据初始涨跌方向选择冷暖调色板（替代原先的完全随机选色）
	applyPalette(Math.sign(SSE.state.changePct));
	displayNorm = SSE.norm(SSE.state.value);
	// 投影模式：使用浅色版本，纯白背景以保持画面整体明亮
	ver = 1;
	bgCol = "#ffffff";
	background(bgCol);

	// 初始化主离屏画布为不透明的背景底色，以 RGB 模式安全处理避免 colorMode 混淆
	let c = color(bgCol);
	originalGraphics.background(c.levels[0], c.levels[1], c.levels[2]);
	filter1 = new makeFilter();

	// 初始化分形缓存画布并进行一次性绘制
	fractalGraphics = createGraphics(width, height);
	fractalGraphics.clear();
	
	// 在缓存画布上配置分形绘制属性（复原自原版第 600 帧逻辑）
	fractalGraphics.strokeWeight(random(0.10, 0.2) / 1);
	fractalGraphics.stroke(str(random(colorbg)) + "33");
	fractalGraphics.noFill();
	fractalGraphics.drawingContext.setLineDash([1, 5, 1, 3]);
	
	// 绘制分形
	drawOverPattern(fractalGraphics);
	
	// 重置虚线设置
	fractalGraphics.drawingContext.setLineDash([1, 1, 1, 1]);

	t = 0;
}

function draw() {
	// 不需要每帧重绘主画布背景，因为 opaque 的 originalGraphics 会完全覆盖它并自带渐消背景

	randomSeed(seed);
	noiseSeed(int(seed));
	let ver_val = int(random(4, 8));

	// ========== 0. 实时数据驱动更新 ==========
	// 拉取/步进上证指数读数，缓动归一化值，推导流速与辉光倍率
	const st = SSE.update(millis());
	const targetNorm = SSE.norm(st.value);
	displayNorm = lerp(displayNorm, targetNorm, 0.05);
	speedMul = lerp(0.55, 1.6, displayNorm); // 指数越高 → 向心流速越快
	glowMul = lerp(0.4, 1.5, displayNorm);   // 指数越高 → 辉光越强
	// 涨跌方向翻转（且距上次翻转 > 8s）→ 重选冷暖调色板
	const sign = Math.sign(st.changePct);
	if (sign !== 0 && sign !== lastChangeSign && millis() - lastPaletteFlipMs > 8000) {
		applyPalette(sign);
		lastPaletteFlipMs = millis();
	}

	// 针对已合并的 originalGraphics 进行渐隐
	// 使用 BLEND 模式叠加极透明的背景色（alpha=3），使拖尾在流向中心的过程中自然过渡到背景色，呈现五彩斑斓的晕染变化而不留灰色拖影
	originalGraphics.noStroke();
	let c = color(bgCol);
	originalGraphics.fill(c.levels[0], c.levels[1], c.levels[2], 3);
	originalGraphics.rect(0, 0, width, height);

	// 每帧清空辉光画布，消除累积绘制产生的长灰色拖影，使其表现保持和原版一致的干净通透
	glowGraphics.clear();

	// ========== 1. 线条背景 (lineGraphics) — 向心收缩的波纹环 ==========
	par_num = random(120, 180); // 降低线条密度 (120 到 180)
	for (let i = 0; i <= par_num; i++) {
		// 将每个标记分配到不同的收缩环上
		let ringIdx = i % LINE_RING_COUNT;
		let ringRadius = lineRings[ringIdx].radius;

		// 线条生命周期机制：随半径收缩而渐隐并变细，在归于中心前自然销毁消失
		let lifeFactor = constrain(ringRadius / (mySize * 0.15), 0, 1);
		// 投影模式：白底需要更高的不透明度才能看清线条（提至 ~25%~50%）
		let alphaVal = int(lerp(64, 128, lifeFactor));
		let alphaHex = alphaVal.toString(16).padStart(2, '0');

		originalGraphics.fill(str(random(colorset)) + alphaHex);
		originalGraphics.noStroke();
		if (frameCount % 2 == 0) {
			originalGraphics.stroke(str(random(colorset)) + alphaHex);
			originalGraphics.strokeWeight(random(0.35, 0.15)); // 保持原型粗细量级 (0.15 到 0.35)，不乘以 lifeFactor 以免过细
			originalGraphics.noFill();
		}
		// 恢复原型阴影设置：模糊度设为 0，偏置设为 1，确保线条边缘极其锐利清晰
		originalGraphics.drawingContext.shadowColor = str(random(colorbg)) + "0d";
		originalGraphics.drawingContext.shadowOffsetX = 1;
		originalGraphics.drawingContext.shadowOffsetY = 1;
		originalGraphics.drawingContext.shadowBlur = 0;

		const xAngle = map(0, 0, width, -random(0.5, 1) * PI, random(0.5, 1) * PI, true);
		const yAngle = map(height, 0, height, -random(0.5, 1) * PI, random(0.5, 1) * PI, true);
		const angle = xAngle * width + yAngle * height;

		// 用 ringRadius 替代固定 mySize/2，随着环收缩，线条向中心靠拢
		const myX = width / 2 + ringRadius * sin(random(0.5, 1.5) * TAU * t + angle);
		const myY = height / 2 + ringRadius * cos(random(0.5, 1.5) * TAU * t + angle);

		originalGraphics.push();
		originalGraphics.translate(myX + sin(random(0.5, 1.5) * TAU * t + angle), myY + cos(random(0.5, 1.5) * TAU * t + angle));
		originalGraphics.rotate(sin(t) * PI / 10);
		originalGraphics.ellipse(0, 0, random(0.75, 1.25) * (1 - sqrt(random(random(1)))));
		originalGraphics.pop();
	}
	t += random(0.005, 0.01) * speedMul;

	// ========== 2. 向心粒子点阵 (originalGraphics) — 由外向内螺旋运动 ==========
	if (frameCount % 25 == 0) {
		randomSeed(seed * random(frameCount / 10));
	}
	for (let cp of cParticles) {
		let version = random(1, 0.1) * ver_val;

		// 粒子当前笛卡尔坐标
		let px = width / 2 + cos(cp.angle) * cp.dist;
		let py = height / 2 + sin(cp.angle) * cp.dist;

		// 生命因子：外缘=1.0，接近中心=0.0，用于控制透明度和线宽的淡出
		let lifeFactor = constrain(cp.dist / (mySize * 0.12), 0, 1);
		// 扩散比例：距中心越近，周围点云越紧凑（向心压缩效果）
		let spreadRatio = cp.dist / (mySize * 0.5) * cp.spreadScale;

		let b1 = noise(px / version, py / version) * TWO_PI;
		let c = random(100, 50);

		// *** main point *** //
		let b2 = (TWO_PI / c) * int((b1 / TWO_PI) * c);

		originalGraphics.push();
		originalGraphics.translate(px, py);
		originalGraphics.rotate(random(TAU));

		// 点云扩散范围随距离收缩：外缘宽广，中心紧凑
		let gard_w = random(mySize / 0.5, mySize / 1) / ver_val * spreadRatio;
		let gard_h = random(mySize / 0.5, mySize / 1) / ver_val * spreadRatio;

		// 透明度随生命因子变化：接近中心时逐渐消失（进一步调高整体不透明度以提升色彩饱和度与明亮度）
		let alphaVal = int(lerp(40, 220, lifeFactor));
		let alphaHex = alphaVal.toString(16).padStart(2, '0');
		originalGraphics.stroke(str(random(colorset)) + alphaHex);
		originalGraphics.strokeWeight(random(0.25, 0.75) * (1 - sqrt(random(random(random())))) * lifeFactor);
		originalGraphics.noFill();

		let shadowAlpha = int(lifeFactor * 120).toString(16).padStart(2, '0'); // 调高阴影不透明度，使拖尾色彩更为耀眼
		originalGraphics.drawingContext.shadowColor = str(random(colorbg)) + shadowAlpha;
		originalGraphics.drawingContext.shadowOffsetX = random(-1, 1);
		originalGraphics.drawingContext.shadowOffsetY = random(-1, 1);
		originalGraphics.drawingContext.shadowBlur = random(2, 6) * lifeFactor; // 加大发光模糊半径，增加色彩晕染效果

		originalGraphics.push();
		// 外层散点 (50 个) — 最大扩散半径
		for (let k = 0; k < 50; k++) {
			let r = (1 - sqrt(random(random(random())))) * (random(1, 2) * random(gard_w, gard_h) / random(1.5, 0.5));
			originalGraphics.strokeWeight((1 - sqrt(random(random(random())))) * lifeFactor);
			let angle = random(TWO_PI);
			let point_x = cos(angle) * r;
			let point_y = sin(angle) * r;
			originalGraphics.point(point_x, point_y);
		}
		// 中层散点 (20 个)
		for (let k = 0; k < 20; k++) {
			let r = (1 - sqrt(random(random(random())))) * (random(1, 2) * random(gard_w, gard_h) / random(4, 2));
			originalGraphics.strokeWeight((1 - sqrt(random(random(random())))) * lifeFactor);
			let angle = random(TWO_PI);
			let point_x = cos(angle) * r;
			let point_y = sin(angle) * r;
			originalGraphics.point(point_x, point_y);
		}
		// 内层散点 (10 个) — 最小扩散半径
		for (let k = 0; k < 10; k++) {
			let r = (1 - sqrt(random(random(random())))) * (random(1, 2) * random(gard_w, gard_h) / random(4, 8));
			originalGraphics.strokeWeight((1 - sqrt(random(random(random())))) * lifeFactor);
			let angle = random(TWO_PI);
			let point_x = cos(angle) * r;
			let point_y = sin(angle) * r;
			originalGraphics.point(point_x, point_y);
		}


		originalGraphics.pop();
		originalGraphics.pop();
	}

	// ========== 3. 向心辉光圆环 — 独立运动、到达中心后销毁 ==========

	// 每 5 帧在外缘生成新的辉光圆（数量与尺寸随指数点位增强）
	if (frameCount % 5 == 0 && glowCircles.length < MAX_GLOW_CIRCLES) {
		let spawnCount = Math.floor((2 + Math.random() * 2) * glowMul); // 每次生成 2~3 个 × glowMul
		for (let i = 0; i < spawnCount; i++) {
			if (glowCircles.length >= MAX_GLOW_CIRCLES) break;
			glowCircles.push({
				angle: Math.random() * TWO_PI,
				dist: mySize * (0.32 + Math.random() * 0.2),
				speed: 0.25 + Math.random() * 0.5,
				rotSpeed: (Math.random() - 0.5) * 0.006,
				size: (10 + Math.random() * 50) * glowMul,
				color: colorset[Math.floor(Math.random() * colorset.length)],
				shadowColor: colorset[Math.floor(Math.random() * colorset.length)],
				blurAmount: (10 + Math.random() * 40) * glowMul
			});
		}
	}

	// 更新位置、绘制、到达中心后销毁
	for (let i = glowCircles.length - 1; i >= 0; i--) {
		let gc = glowCircles[i];
		gc.dist -= gc.speed * speedMul;
		gc.angle += gc.rotSpeed;

		// 到达中心 → 销毁
		if (gc.dist < 5) {
			glowCircles.splice(i, 1);
			continue;
		}

		let gx = width / 2 + cos(gc.angle) * gc.dist;
		let gy = height / 2 + sin(gc.angle) * gc.dist;
		let life = constrain(gc.dist / (mySize * 0.15), 0, 1);
		let currentSize = gc.size * life; // 接近中心时缩小

		glowGraphics.push();
		glowGraphics.translate(gx, gy);

		// 辉光不透明度随指数点位增强（glowMul），并 clamp 到合法 hex 范围
		let glAlpha = int(constrain(life * 230 * glowMul, 0, 255)).toString(16).padStart(2, '0');
		glowGraphics.drawingContext.shadowColor = gc.shadowColor + glAlpha;
		glowGraphics.drawingContext.shadowOffsetX = 0;
		glowGraphics.drawingContext.shadowOffsetY = 0;
		glowGraphics.drawingContext.shadowBlur = gc.blurAmount * life;
		glowGraphics.fill(0);
		glowGraphics.noStroke();

		let gradR = max(1, currentSize);
		let grad = glowGraphics.drawingContext.createRadialGradient(0, 0, 0, 0, 0, gradR);
		let gradAlpha = int(constrain(life * 180 * glowMul, 0, 255)).toString(16).padStart(2, '0');
		grad.addColorStop(0.0, gc.color + "00");
		grad.addColorStop(0.4, gc.color + gradAlpha);
		grad.addColorStop(0.85, gc.color + "00");
		glowGraphics.drawingContext.fillStyle = grad;
		glowGraphics.circle(0, 0, gradR * 2);

		glowGraphics.pop();
	}

	blendMode(BLEND);
	image(originalGraphics, 0, 0);
	image(glowGraphics, 0, 0);
	image(overAllTexture, 0, 0);

	// ========== 4. 叠加分形图案与边框 (从静态图二还原，保持画面不剧变) ==========
	// MULTIPLY 让深色分形纹理在白底上以高饱和度色彩呈现，而不是被白底吞掉
	blendMode(MULTIPLY);
	image(fractalGraphics, 0, 0);
	blendMode(BLEND);

	noFill();
	strokeWeight(margin);
	rectMode(CORNER);
	stroke("#2B00C4");
	rect(0, 0, width, height);

	// ========== 5. 现场铭牌 (in-space label) — 实时读数 ==========
	drawHud(st);

	// ========== 3. 更新运动状态（绘制完成后更新，不干扰当前帧的随机序列）==========

	// 线条环向内收缩，到达中心后在外缘重生（流速由指数点位驱动）
	for (let ring of lineRings) {
		ring.radius -= ring.speed * speedMul;
		if (ring.radius < mySize * 0.02) {
			ring.radius = mySize * (0.35 + Math.random() * 0.17);
			ring.speed = 0.2 + Math.random() * 0.3;
		}
	}

	// 向心粒子向中心移动并缓慢旋转，到达中心后在外缘重生（流速由指数点位驱动）
	for (let cp of cParticles) {
		cp.dist -= cp.speed * speedMul;
		cp.angle += cp.rotSpeed;
		if (cp.dist < 3) {
			cp.angle = Math.random() * TWO_PI;
			cp.dist = mySize * (0.35 + Math.random() * 0.17);
			cp.speed = 0.15 + Math.random() * 0.35;
			cp.rotSpeed = (Math.random() - 0.5) * 0.008;
			cp.spreadScale = 0.6 + Math.random() * 0.8;
		}
	}

}

/**
 * 现场铭牌 (in-space label)：在画布左上角绘制实时读数
 * 标题 + 当前点位 + 涨跌（点数 / 百分比）+ 时间戳 + 数据来源标记
 * 主画布在 setup 中被 makeFilter 切到 HSB 模式，这里用 push/pop 临时切回 RGB。
 */
function drawHud(st) {
	push();
	colorMode(RGB, 255);
	blendMode(BLEND);

	const x0 = 16, y0 = 16, w = 348, h = 82;

	// 半透明白底背板 + 细边框，保证在彩色画面上的可读性
	noStroke();
	fill(255, 255, 255, 232);
	rect(x0, y0, w, h, 4);
	noFill();
	stroke(43, 0, 196, 110);
	strokeWeight(1);
	rect(x0, y0, w, h, 4);

	noStroke();
	textFont('monospace');
	textAlign(LEFT, TOP);

	// 标题
	fill(43, 0, 196);
	textSize(13);
	text('CENTRIPETAL · SSE Composite Index', x0 + 12, y0 + 9);

	// 数值 + 涨跌
	const up = st.change >= 0;
	const arrow = up ? '▲' : '▼';
	const valStr = st.value.toFixed(2);
	const chgStr = (up ? '+' : '') + st.change.toFixed(2);
	const pctStr = (up ? '+' : '') + st.changePct.toFixed(2) + '%';
	fill(up ? 217 : 34, up ? 4 : 69, up ? 61 : 115);
	textSize(20);
	text(`${valStr}  ${arrow} ${chgStr} (${pctStr})`, x0 + 12, y0 + 30);

	// 时间戳 + 来源标记
	fill(70);
	textSize(11);
	const srcTag = st.source === 'live' ? 'LIVE' : 'CACHE';
	text(`${st.timestamp || '—'}   ·   ${srcTag} · qt.gtimg.cn`, x0 + 12, y0 + 59);

	pop();
}
