
class Player extends Droid {
	constructor(cfg) {
		super(cfg);

		// "aura" borealis
		// this.aura = {
		// 	color: [255, 255, 255],
		// 	strength: .5,
		// 	radius: 100,
		// };
		// this.speed = .0015;
		this.isPlayer = true;
		this.isVisible = true;
		// for electric gloria
		this.simplexNoise = new SimplexNoise;
		// a little bit blur
		this.blur = {
			color: "#00000055",
			size: 3,
		};
		// update label
		this.body.label = "player";

		this.input = {
			up:    { pressed: false, force: { x: 0, y: -1 } },
			left:  { pressed: false, force: { x: -1, y: 0 } },
			down:  { pressed: false, force: { x: 0, y: 1 } },
			right: { pressed: false, force: { x: 1, y: 0 } },
		};

		// create white versions of sprites
		Object.keys(this.sprites).map(k => {
			// for BG sprite
			let w = this.sprites[k].width,
				h = this.sprites[k].height,
				{ cvs, ctx } = Utils.createCanvas(w, h);
			// draw orignal droid sprite
			ctx.drawImage(this.sprites[k], 0, 0);
			// change droid color
			ctx.globalCompositeOperation = "source-atop";
			ctx.fillStyle = "#fff";
			ctx.fillRect(0, 0, w, h);
			// replace sprite
			this.sprites[k] = cvs[0];
		});
	}

	setState(item) {
		let APP = paradroid;
		// console.log( item );
		switch (item.id) {
			case "recharge":
				if (this.power !== 1) {
					// update player droid power / energy
					this.power = 1;
					// update UI
					APP.hud.dispatch({ type: "set-power", power: this.power });
				}
				break;
			case "exit":
			case "console":
				this.nextTo = item;
				break;
			case "clear":
				delete this.nextTo;
				break;
			case "transfer":
				console.log( item );
				break;
		}
	}

	noise(v) {
		let amp = 1,
			sum = 0,
			f = 1;
		for (let i=0; i<6; ++i) {
			amp *= 0.5;
			sum += amp * (this.simplexNoise.noise2D(v * f, 0) + 1) * 0.5;
			f *= 2;
		}
		return sum;
	}

	update(delta) {
		// let dx = this.arena.viewport.half.w,
		// 	dy = this.arena.viewport.half.h - 1,
		// 	r = 25,
		// 	len = 8,
		// 	a = 0,
		// 	inc = 360 / len,
		// 	points = this.points = [],
		// 	off = Utils.random(.2, 0.02),
		// 	waveWidth = 50;

		// for (let i=0; i<len; i++) {
		// 	let angle = a * Math.PI / 180,
		// 		cosv = Math.cos(angle),
		// 		sinv = Math.sin(angle),
		// 		n = i / waveWidth,
		// 		av = waveWidth * this.noise(n - off, 0),
		// 		ax = sinv * av,
		// 		ay = cosv * av,
		// 		bv = waveWidth * this.noise(n + off, 0),
		// 		bx = sinv * bv,
		// 		by = cosv * bv,
		// 		x = dx + cosv * r + (ax - bx),
		// 		y = dy + sinv * r - (ay - by);
		// 	points.push({ x, y });
		// 	a += inc;
		// }
		// points.push(points[0]);

		// USER input
		let force = { x: 0, y: 0 };
		for (let key in this.input) {
			if (this.input[key].pressed) {
				let f = this.input[key].force;
				if (f.x != 0) force.x = f.x;
				if (f.y != 0) force.y = f.y;
			}
		}
		this.move(force);

		super.update(delta);
	}

	render(ctx) {
		super.render(ctx);

		let points = this.points || [],
			len = points.length;
		// electric
		ctx.save();
		ctx.lineWidth = 2;
		ctx.strokeStyle = "#fff";
		ctx.beginPath();
		points.map((point, i) => ctx[i === 0 ? "moveTo" : "lineTo"](point.x, point.y));
		//ctx.closePath();
		ctx.stroke();
		ctx.restore();
	}
}
