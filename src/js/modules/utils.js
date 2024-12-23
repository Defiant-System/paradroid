
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
	}
};

// get digit adjustments from xml data
window.bluePrint.selectNodes(`//Droid`).map(x => {
	let id = x.getAttribute("id"),
		arr = x.getAttribute("digits").split(",").map(i => +i);
	Utils.digits[id] = arr;
});
