
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
		// satellites
		this.satellites = [
				{ speed: 0.0015, rotateAngle: Math.PI },
				{ speed: 0.0015, rotateAngle: Math.PI * 1/3 },
				{ speed: 0.0015, rotateAngle: Math.PI * -1/3 },
			];
		// a little bit blur
		this.blur = {
			color: "#00000055",
			size: 3,
		};
		// update label
		this.body.label = "player";
		// temp
		this.opponent = "249";

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

	update(delta) {
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

		let arena = this.arena,
			cX = arena.viewport.half.w,
			cY = arena.viewport.half.h - 1,
			rX = 28,
			rY = 25;

		ctx.save();
		ctx.translate(cX, cY);
		ctx.fillStyle = "#fff";
		// Draw the satellite
		// ctx.lineWidth = 2;
		// ctx.strokeStyle = "#ddd9";
		// ctx.beginPath();
		// ctx.ellipse(0, 0, rX, rY, 0, 0, Math.TAU);
		// ctx.stroke();

		this.satellites.map(sat => {
			// Calculate circle position based on time
			let currentAngle = (Date.now() * sat.speed) + sat.rotateAngle;
			let satX = rX * Math.cos(currentAngle);
			let satY = rY * Math.sin(currentAngle);
			// Draw the rotating satellite
			ctx.beginPath();
			ctx.arc(satX, satY, 3, 0, Math.TAU);
			ctx.fill();
		});
		ctx.restore();
	}
}
