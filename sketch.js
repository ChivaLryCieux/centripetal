// by SamuelYAN
// more works //
// https://twitter.com/SamuelAnn0924
// https://www.instagram.com/samuel_yan_1990/

// refer: Bubble Chamber - Jared Tarbell, 2003
// http://www.complexification.net/gallery/machines/bubblechamber/

// --- 全局变量 ---
var mySize, margin;
var seed = Math.random() * 9217;

// 色彩定义
let colors1 = "fef9fb-fafdff-fcfbf4-f9f8f6".split("-").map((a) => "#" + a);
let colors2;
let colors_tone1 = "0D1E40-224573-5679A6-F2A25C-D96B43".split("-").map((a) => "#" + a);
let colors_tone2 = "7E56A6-F28B50-A63B14-591202-260101".split("-").map((a) => "#" + a);
let colors_tone3 = "4ED98A-3B8C57-F2AD85-404040-0D0D0D".split("-").map((a) => "#" + a);
let colors_tone4 = "725373-7866F2-8979F2-025373-BF7D56".split("-").map((a) => "#" + a);
let colors_tone5 = "20BF1B-218C11-17590C-11400A-0D0D0D".split("-").map((a) => "#" + a);
let colors_tone6 = "F20519-A60522-031059-071773-044BD9".split("-").map((a) => "#" + a);
let colors_tone7 = "F2E96D-F2B84B-BF8034-402B12-0D0D0D".split("-").map((a) => "#" + a);
let colors_tone8 = "9E9BF2-F2E088-F29544-F24405-F27E63".split("-").map((a) => "#" + a); // candy memory

let colors_root = "362300-805300-402900-734E39".split("-").map((a) => "#" + a);

let colorset = [];
let colorbg = "1C2611-2B4016-261416-031740".split("-").map((a) => "#" + a); // dark
let filter1;
let t, par_num;
let originalGraphics;
let lineGraphics;
let glowGraphics; // 独立的向心辉光离屏画布，每帧清空以消除灰色拖影
let fractalGraphics; // 顶层分形图案静态缓存离屏画布，在 setup 中一次性绘制，保持高性能
let overAllTexture; // 噪点纹理离屏画布
let ver;

// 向心粒子系统：粒子从外缘向中心螺旋运动
let cParticles = [];
const C_PARTICLE_COUNT = 8;

// 向心线条环：从外向内收缩的多层波纹环
let lineRings = [];
const LINE_RING_COUNT = 5;

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
	lineGraphics = createGraphics(width, height);
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
	colors2 = random([colors_tone1, colors_tone2, colors_tone3, colors_tone4, colors_tone5, colors_tone6, colors_tone7, colors_tone8]);
	// colors2 = colors_tone8;
	colorset[0] = random(colors2);
	colorset[1] = random(colors2);
	colorset[2] = random(colors1);
	colorset[3] = random(colors2);
	colorset[4] = random(colors2);
	colorset[5] = random(colors2);
	// ver = random([1, 2]);
	ver = 2;
	if (ver == 1) {
		background("#fafdff");
	}
	if (ver == 2) {
		background("#202020");
	}
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
	randomSeed(seed);
	noiseSeed(int(seed));
	let ver_val = int(random(4, 8));

	// 每帧对离屏缓冲叠加一层极低透明度的背景色，使旧标记逐渐淡出
	// alpha=3 → 标记约 8 秒后完全消失，形成流畅的向心拖尾轨迹
	lineGraphics.noStroke();
	lineGraphics.fill(32, 32, 32, 3);
	lineGraphics.rect(0, 0, width, height);
	originalGraphics.noStroke();
	originalGraphics.fill(32, 32, 32, 3);
	originalGraphics.rect(0, 0, width, height);

	// 每帧清空辉光画布，消除累积绘制产生的长灰色拖影，使其表现保持和原版一致的干净通透
	glowGraphics.clear();

	// ========== 1. 线条背景 (lineGraphics) — 向心收缩的波纹环 ==========
	par_num = random(300, 400);
	for (let i = 0; i <= par_num; i++) {
		// 将每个标记分配到不同的收缩环上
		let ringIdx = i % LINE_RING_COUNT;
		let ringRadius = lineRings[ringIdx].radius;

		lineGraphics.fill(str(random(colorset)) + "0d");
		lineGraphics.noStroke();
		if (frameCount % 2 == 0) {
			lineGraphics.stroke(str(random(colorset)) + "0d");
			lineGraphics.strokeWeight(random(0.25, 0.1));
			lineGraphics.noFill();
		}
		lineGraphics.drawingContext.shadowColor = str(random(colorbg)) + "0d";
		lineGraphics.drawingContext.shadowOffsetX = 1;
		lineGraphics.drawingContext.shadowOffsetY = 1;
		lineGraphics.drawingContext.shadowBlur = 0;

		const xAngle = map(0, 0, width, -random(0.5, 1) * PI, random(0.5, 1) * PI, true);
		const yAngle = map(height, 0, height, -random(0.5, 1) * PI, random(0.5, 1) * PI, true);
		const angle = xAngle * width + yAngle * height;

		// 用 ringRadius 替代固定 mySize/2，随着环收缩，线条向中心靠拢
		const myX = width / 2 + ringRadius * sin(random(0.5, 1.5) * TAU * t + angle);
		const myY = height / 2 + ringRadius * cos(random(0.5, 1.5) * TAU * t + angle);

		lineGraphics.push();
		lineGraphics.translate(myX + sin(random(0.5, 1.5) * TAU * t + angle), myY + cos(random(0.5, 1.5) * TAU * t + angle));
		lineGraphics.rotate(sin(t) * PI / 10);
		lineGraphics.ellipse(0, 0, random(0.75, 1.25) * (1 - sqrt(random(random(1)))));
		lineGraphics.pop();
	}

	image(lineGraphics, 0, 0);
	t += random(0.005, 0.01);

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

		// 透明度随生命因子变化：接近中心时逐渐消失
		let alphaVal = int(lerp(4, 26, lifeFactor));
		let alphaHex = alphaVal.toString(16).padStart(2, '0');
		originalGraphics.stroke(str(random(colorset)) + alphaHex);
		originalGraphics.strokeWeight(random(0.25, 0.75) * (1 - sqrt(random(random(random())))) * lifeFactor);
		originalGraphics.noFill();

		let shadowAlpha = int(lifeFactor * 64).toString(16).padStart(2, '0');
		originalGraphics.drawingContext.shadowColor = str(random(colorbg)) + shadowAlpha;
		originalGraphics.drawingContext.shadowOffsetX = random(-1, 1);
		originalGraphics.drawingContext.shadowOffsetY = random(-1, 1);
		originalGraphics.drawingContext.shadowBlur = 0;

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

	// 每 5 帧在外缘生成新的辉光圆
	if (frameCount % 5 == 0 && glowCircles.length < MAX_GLOW_CIRCLES) {
		let spawnCount = 2 + Math.floor(Math.random() * 2); // 每次生成 2~3 个
		for (let i = 0; i < spawnCount; i++) {
			if (glowCircles.length >= MAX_GLOW_CIRCLES) break;
			glowCircles.push({
				angle: Math.random() * TWO_PI,
				dist: mySize * (0.32 + Math.random() * 0.2),
				speed: 0.25 + Math.random() * 0.5,
				rotSpeed: (Math.random() - 0.5) * 0.006,
				size: 10 + Math.random() * 50,
				color: colorset[Math.floor(Math.random() * colorset.length)],
				shadowColor: colorset[Math.floor(Math.random() * colorset.length)],
				blurAmount: 10 + Math.random() * 40
			});
		}
	}

	// 更新位置、绘制、到达中心后销毁
	for (let i = glowCircles.length - 1; i >= 0; i--) {
		let gc = glowCircles[i];
		gc.dist -= gc.speed;
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

		let glAlpha = int(life * 128).toString(16).padStart(2, '0');
		glowGraphics.drawingContext.shadowColor = gc.shadowColor + glAlpha;
		glowGraphics.drawingContext.shadowOffsetX = 0;
		glowGraphics.drawingContext.shadowOffsetY = 0;
		glowGraphics.drawingContext.shadowBlur = gc.blurAmount * life;
		glowGraphics.fill(0);
		glowGraphics.noStroke();

		let gradR = max(1, currentSize);
		let grad = glowGraphics.drawingContext.createRadialGradient(0, 0, 0, 0, 0, gradR);
		let gradAlpha = int(life * 51).toString(16).padStart(2, '0');
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

	// ========== 4. 叠加分形图案与蓝色边框 (从静态图二还原，保持画面不剧变) ==========
	blendMode(ADD);
	image(fractalGraphics, 0, 0);
	blendMode(BLEND);

	noFill();
	strokeWeight(margin);
	rectMode(CORNER);
	stroke("#2B00C4");
	rect(0, 0, width, height);

	// ========== 3. 更新运动状态（绘制完成后更新，不干扰当前帧的随机序列）==========

	// 线条环向内收缩，到达中心后在外缘重生
	for (let ring of lineRings) {
		ring.radius -= ring.speed;
		if (ring.radius < mySize * 0.02) {
			ring.radius = mySize * (0.35 + Math.random() * 0.17);
			ring.speed = 0.2 + Math.random() * 0.3;
		}
	}

	// 向心粒子向中心移动并缓慢旋转，到达中心后在外缘重生
	for (let cp of cParticles) {
		cp.dist -= cp.speed;
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
