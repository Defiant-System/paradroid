
let Utils = {
	digits: {},
	// creates offscreen canvas
	createCanvas(width, height) {
		let cvs = $(document.createElement("canvas")),
			ctx = cvs[0].getContext("2d", { willReadFrequently: true });
		cvs.prop({ width, height });
		return { cvs, ctx }
	},
	random(min, max) {
		return Math.random() * ( max - min ) + min;
	},
	randomInt(min, max) {
		return this.random(min, max) | 0;
	},
	sortPointsCW(arr) {
		// Get the center (mean value) using reduce
		let center = arr.reduce((acc, { x, y }) => {
				acc.x += x / arr.length;
				acc.y += y / arr.length;
				return acc;
			}, { x: 0, y: 0 }),
			// Add an angle property to each point using tan(angle) = y/x
			angles = arr.map(({ x, y }) => {
				return { x, y, angle: Math.atan2(y - center.y, x - center.x) * 180 / Math.PI };
			});
		// Sort your points by angle
		return angles.sort((a, b) => a.angle - b.angle);
	},
	grand: 0,
	rSeed: Math.random() * 8388607 + 24478357,
	prand() {
		[...Array(25)].map(e => this.prandi());
		return this.prandi();
	},
	prandi() {
		this.grand += 1;
		this.rSeed = this.rSeed << 1;
		this.rSeed = this.rSeed | (this.rSeed & 1073741824) >> 30;
		this.rSeed = this.rSeed ^ (this.rSeed & 614924288) >> 9;
		this.rSeed = this.rSeed ^ (this.rSeed & 4241) << 17;
		this.rSeed = this.rSeed ^ (this.rSeed & 272629760) >> 23;
		this.rSeed = this.rSeed ^ (this.rSeed & 318767104) >> 10;
		return (this.rSeed & 16777215) / 16777216;
	}
};

// get digit adjustments from xml data
window.bluePrint.selectNodes(`//Droid`).map(x => {
	let id = x.getAttribute("id"),
		arr = x.getAttribute("digits").split(",").map(i => +i);
	Utils.digits[id] = arr;
});
