// 按键事件监听：按 's' 或 'S' 键保存当前画布为 PNG 图像
function keyTyped() {
	if (key === "s" || key === "S") {
		saveCanvas("1112_RE:BubbleChamber_8_2022", "png");
	}
}

/**
 * 创建胶片噪点纹理滤镜 (Perlin Noise Filter)
 * 在 HSB 颜色模式下遍历像素，利用 2D Perlin 噪声生成细微的透明度/亮度波动，
 * 创造出质感丰富的复古胶片颗粒感。
 */
function makeFilter() {
	colorMode(HSB, 360, 100, 100, 100);
	drawingContext.shadowColor = color(0, 0, 5, 95);
	
	overAllTexture = createGraphics(width, height);
	overAllTexture.loadPixels();
	for (let i = 0; i < width; i++) {
		for (let j = 0; j < height; j++) {
			let n = noise(i / 3, j / 3, (i * j) / 50);
			if (ver == 1) {
				// 浅色主题（投影模式）：深灰颗粒，在白底上提供胶片质感而不致刺眼
				let alphaVal = n * random(15, 35);
				let grayVal = random(40, 90); // 深灰
				overAllTexture.set(i, j, [grayVal, grayVal, grayVal, alphaVal]);
			}
			if (ver == 2) {
				// 深色主题下：直接写入高亮白灰色颗粒，还原第一版细腻有质感的噪点杂色
				let alphaVal = n * random(25, 55); // 25%-55% 的透明度
				let grayVal = random(160, 230);   // 亮白灰色
				overAllTexture.set(i, j, [grayVal, grayVal, grayVal, alphaVal]);
			}
		}
	}
	overAllTexture.updatePixels();
}

/**
 * 绘制顶层几何分形图案
 * 在画布中心旋转并递归划分正六边形区域内的三角形
 */
function drawOverPattern(g) {
	const pg = g || { push, pop, translate, rotate };
	pg.push();
	pg.translate(width / 2, height / 2);
	pg.rotate(-PI / 2);
	let s = (mySize / 2) * sqrt(3) - 2;
	let n = 6; // 递归深度
	for (let theta = TWO_PI / 6; theta < TWO_PI; theta += TWO_PI / 6) {
		divideOP(
			0,
			0,
			s * cos(theta),
			s * sin(theta),
			s * cos(theta + TWO_PI / 6),
			s * sin(theta + TWO_PI / 6),
			n,
			g
		);
	}
	pg.pop();
}

/**
 * 线性插值计算两点之间的比例点坐标
 * @param {number} x1 - 起点 X
 * @param {number} y1 - 起点 Y
 * @param {number} x2 - 终点 X
 * @param {number} y2 - 终点 Y
 * @param {number} k - 插值比例 (0 到 1)
 * @returns {number[]} 插值点的 [x, y] 坐标
 */
function prop(x1, y1, x2, y2, k) {
	let x3 = (1 - k) * x1 + k * x2;
	let y3 = (1 - k) * y1 + k * y2;
	return [x3, y3];
}

/**
 * 递归划分三角形算法 (谢尔宾斯基三角形变体)
 * 将三角形按 1:2 比例及三等分点进行细分，并生成多层嵌套子三角形。
 *
 * @param {number} x1, y1 - 顶点 1 坐标
 * @param {number} x2, y2 - 顶点 2 坐标
 * @param {number} x3, y3 - 顶点 3 坐标
 * @param {number} n - 剩余递归深度
 * @param {object} g - 离屏画布对象 (可选)
 */
function divideOP(x1, y1, x2, y2, x3, y3, n, g) {
	if (n > 1) {
		let [xA, yA] = prop(x1, y1, x2, y2, 1 / 3);
		let [xB, yB] = prop(x1, y1, x2, y2, 2 / 3);
		let [xC, yC] = prop(x2, y2, x3, y3, 1 / 3);
		let [xD, yD] = prop(x2, y2, x3, y3, 2 / 3);
		let [xE, yE] = prop(x3, y3, x1, y1, 1 / 3);
		let [xF, yF] = prop(x3, y3, x1, y1, 2 / 3);
		let [xG, yG] = prop(xF, yF, xC, yC, 1 / 2);
		
		divideOP(x1, y1, xA, yA, xF, yF, n - 1, g);
		divideOP(xA, yA, xB, yB, xG, yG, n - 1, g);
		divideOP(xB, yB, x2, y2, xC, yC, n - 1, g);
		divideOP(xG, yG, xF, yF, xA, yA, n - 1, g);
		divideOP(xC, yC, xG, yG, xB, yB, n - 1, g);
		divideOP(xF, yF, xG, yG, xE, yE, n - 1, g);
		divideOP(xG, yG, xC, yC, xD, yD, n - 1, g);
		divideOP(xD, yD, xE, yE, xG, yG, n - 1, g);
		divideOP(xE, yE, xD, yD, x3, y3, n - 1, g);
	} else {
		makeTriangle([x1, y1], [x2, y2], [x3, y3], g);
	}
}

/**
 * 绘制单个三角形，并在内部填充渐进线条
 * @param {number[]} v1 - 顶点 1 [x, y]
 * @param {number[]} v2 - 顶点 2 [x, y]
 * @param {number[]} v3 - 顶点 3 [x, y]
 * @param {object} g - 离屏画布对象 (可选)
 */
function makeTriangle(v1, v2, v3, g) {
	const pg = g || { triangle };
	let points = shuffle([v1, v2, v3]);
	let [x1, y1] = points[0];
	let [x2, y2] = points[1];
	let [x3, y3] = points[2];
	let iStep = 1 / pow(2, floor(random(4, 2)));
	for (let i = 0; i < 1; i += iStep) {
		let [x4, y4] = prop(x1, y1, x2, y2, 1 - i);
		let [x5, y5] = prop(x1, y1, x3, y3, 1 - i);
		pg.triangle(x1, y1, x4, y4, x5, y5);
	}
}
