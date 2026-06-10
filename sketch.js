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
let overAllTexture; // 噪点纹理离屏画布
let ver;

// 向心粒子系统：粒子从外缘向中心螺旋运动
let cParticles = [];
const C_PARTICLE_COUNT = 8;

// 向心线条环：从外向内收缩的多层波纹环
let lineRings = [];
const LINE_RING_COUNT = 5;

function setup() {
	frameRate(50);
	randomSeed(int(seed));
	// mySize = min(windowWidth, windowHeight);
	mySize = 860;
	margin = mySize / 100;
	createCanvas(mySize, mySize);
	originalGraphics = createGraphics(width, height);
	lineGraphics = createGraphics(width, height);

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
	t = 0;
}

function draw() {
	randomSeed(seed);
	noiseSeed(int(seed));
	let ver_val = int(random(4, 8));

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

		// 径向渐变辉光（每 5 帧绘制一次）
		if (frameCount % 5 == 0) {
			originalGraphics.push();
			randomSeed(seed * random(frameCount / 10));
			originalGraphics.translate(
				random(2.75, 0.75) * random(-gard_w, gard_w),
				random(2.55, 1) * random(-gard_h, gard_h)
			);
			let glowAlpha = int(lifeFactor * 128).toString(16).padStart(2, '0');
			originalGraphics.drawingContext.shadowColor = str(random(colorset)) + glowAlpha;
			originalGraphics.drawingContext.shadowOffsetX = 0;
			originalGraphics.drawingContext.shadowOffsetY = 0;
			originalGraphics.drawingContext.shadowBlur = random(10, 50) * lifeFactor;
			originalGraphics.fill(0);
			originalGraphics.noStroke();
			let gradR = random(1, 2) * random(gard_w, gard_h) / random(32, 8);
			let grad = drawingContext.createRadialGradient(0, 0, 0, 0, 0, gradR);
			let gradAlpha = int(lifeFactor * 51).toString(16).padStart(2, '0');
			grad.addColorStop(0.0, str(random(colorset)) + "00");
			grad.addColorStop(random(0.55, 0.25), str(random(colorset)) + gradAlpha);
			grad.addColorStop(random(0.65, 0.85), str(random(colorset)) + "00");
			originalGraphics.drawingContext.fillStyle = grad;
			originalGraphics.circle(0, 0, gradR);
			originalGraphics.pop();
		}
		originalGraphics.pop();
		originalGraphics.pop();
	}

	blendMode(BLEND);
	image(originalGraphics, 0, 0);
	image(overAllTexture, 0, 0);

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

	// ========== 4. 第 600 帧：停止绘制，叠加分形图案与边框 ==========
	if (frameCount == 600) {
		noLoop();
		blendMode(BLEND);
		image(overAllTexture, 0, 0);
		blendMode(ADD);
		strokeWeight(random(0.10, 0.2) / 1);
		stroke(str(random(colorbg)) + "33");
		noFill();
		drawingContext.setLineDash([1, 5, 1, 3]);
		drawOverPattern();
		drawingContext.setLineDash([1, 1, 1, 1]);
		blendMode(BLEND);

		noFill();
		strokeWeight(margin);
		rectMode(CORNER);
		stroke("#2B00C4");
		rect(0, 0, width, height);
	}
}
