// by SamuelYAN
// more works //
// https://twitter.com/SamuelAnn0924
// https://www.instagram.com/samuel_yan_1990/

// refer: Bubble Chamber - Jared Tarbell, 2003
// http://www.complexification.net/gallery/machines/bubblechamber/

var p = [];
var mySize, margin;
var seed = Math.random() * 9217;
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
let plusO, plus1;
let t, par_num;
let originalGraphics;
let lineGraphics;
let overAllTexture; // 噪点纹理离屏画布
let ver;

function setup() {
	frameRate(50);
	randomSeed(int(seed));
	// mySize = min(windowWidth, windowHeight);
	mySize = 860;
	margin = mySize / 100;
	createCanvas(mySize, mySize);
	originalGraphics = createGraphics(width, height);
	lineGraphics = createGraphics(width, height);

	for (let j = 0; j < 1; j++) {
		for (let i = 0; i < 5; i++) {
			p[i] = createVector(width / 2, height / 2);
		}
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
	plusO = plus1 = t = 0;
}

function draw() {
	randomSeed(seed);
	noiseSeed(int(seed));
	let ver_val = int(random(4, 8));

	// 1. 绘制流动线条背景 (lineGraphics)
	par_num = random(300, 400);
	for (let i = 0; i <= par_num; i++) {
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

		const myX = width / 2 + mySize / 2 * sin(random(0.5, 1.5) * TAU * t + angle);
		const myY = height / 2 + mySize / 2 * cos(random(0.5, 1.5) * TAU * t + angle);

		lineGraphics.push();
		lineGraphics.translate(myX + sin(random(0.5, 1.5) * TAU * t + angle), myY + cos(random(0.5, 1.5) * TAU * t + angle));
		lineGraphics.rotate(sin(t) * PI / 10);
		lineGraphics.ellipse(0, 0, random(0.75, 1.25) * (1 - sqrt(random(random(1)))));
		lineGraphics.pop();
	}

	image(lineGraphics, 0, 0);
	t += random(0.005, 0.01);

	// 2. 绘制星系辐射点阵 (originalGraphics)
	if (frameCount % 25 == 0) {
		randomSeed(seed * random(frameCount / 10));
	}
	for (let newp of p) {
		let version = random(1, 0.1) * ver_val;
		let b1 = noise(newp.x / version, newp.y / version) * TWO_PI * 1;
		let c = random(100, 50);

		// *** main point *** //
		let b2 = (TWO_PI / c) * int((b1 / TWO_PI) * c);
		// newp.add(random(0.1, 0.5) * sin(b2), random(0.1, 0.5) * cos(b2));
		originalGraphics.push();
		originalGraphics.translate(newp.x, newp.y);
		originalGraphics.rotate(random(TAU));
		let gard_w = random(mySize / 0.5, mySize / 1) / ver_val;
		let gard_h = random(mySize / 0.5, mySize / 1) / ver_val;
		originalGraphics.stroke(str(random(colorset)) + "1a");
		originalGraphics.strokeWeight(random(0.25, 0.75) * (1 - sqrt(random(random(random())))));
		originalGraphics.noFill();

		originalGraphics.drawingContext.shadowColor = str(random(colorbg)) + "40";
		originalGraphics.drawingContext.shadowOffsetX = random(-1, 1);
		originalGraphics.drawingContext.shadowOffsetY = random(-1, 1);
		originalGraphics.drawingContext.shadowBlur = 0;

		originalGraphics.push();
		for (let k = 0; k < 50; k++) {
			let r = (1 - sqrt(random(random(random())))) * (random(1, 2) * random(gard_w, gard_h) / random(1.5, 0.5) + plus1 * 100);
			originalGraphics.strokeWeight(1 - sqrt(random(random(random()))) + plus1);
			let angle = random(TWO_PI);
			let point_x = cos(angle) * r;
			let point_y = sin(angle) * r;
			originalGraphics.point(point_x, point_y);
		}
		for (let k = 0; k < 20; k++) {
			let r = (1 - sqrt(random(random(random())))) * (random(1, 2) * random(gard_w, gard_h) / random(4, 2) + plus1 * 100);
			originalGraphics.strokeWeight(1 - sqrt(random(random(random()))) + plus1);
			let angle = random(TWO_PI);
			let point_x = cos(angle) * r;
			let point_y = sin(angle) * r;
			originalGraphics.point(point_x, point_y);
		}
		for (let k = 0; k < 10; k++) {
			let r = (1 - sqrt(random(random(random())))) * (random(1, 2) * random(gard_w, gard_h) / random(4, 8) + plus1 * 100);
			originalGraphics.strokeWeight(1 - sqrt(random(random(random()))) + plus1);
			let angle = random(TWO_PI);
			let point_x = cos(angle) * r;
			let point_y = sin(angle) * r;
			originalGraphics.point(point_x, point_y);
		}

		if (frameCount % 5 == 0) {
			originalGraphics.push();
			randomSeed(seed * random(frameCount / 10));
			originalGraphics.translate(random(2.75, 0.75) * random(-gard_w, gard_w), random(2.55, 1) * random(-gard_h, gard_h));
			originalGraphics.drawingContext.shadowColor = str(random(colorset)) + "80";
			originalGraphics.drawingContext.shadowOffsetX = 0;
			originalGraphics.drawingContext.shadowOffsetY = 0;
			originalGraphics.drawingContext.shadowBlur = random(10, 50);
			originalGraphics.fill(0);
			originalGraphics.noStroke();
			let grad = drawingContext.createRadialGradient(0, 0, 0, 0, 0, random(1, 2) * random(gard_w, gard_h) / random(32, 8));
			grad.addColorStop(0.0, str(random(colorset)) + "00");
			grad.addColorStop(random(0.55, 0.25), str(random(colorset)) + "33");
			grad.addColorStop(random(0.65, 0.85), str(random(colorset)) + "00");
			originalGraphics.drawingContext.fillStyle = grad;
			originalGraphics.circle(0, 0, random(1, 2) * random(gard_w, gard_h) / random(32, 8));
			originalGraphics.pop();
		}
		originalGraphics.pop();
		originalGraphics.pop();
		plusO -= random(2, 3) * random(3, 2) * random(0.001, 0.00075) / 2;
		plus1 += random(2, 1) * random(3, 2) * random(0.001, 0.0005) / 10;
	}

	blendMode(BLEND);
	image(originalGraphics, 0, 0);
	image(overAllTexture, 0, 0);

	// 3. 第 600 帧结束绘制，应用叠加混合模式的分形线条图案与边框
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
