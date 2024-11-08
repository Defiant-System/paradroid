
class Player extends Droid {
	constructor(cfg) {
		super(cfg);

		// aurora borealis
		this.light = {
			strength: .325,
			radius: 100,
		};
		this.speed = .75;
		this.isPlayer = true;

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

	setState(state) {
		// console.log( state.id );
		switch (state.id) {
			case "exit":
				// this.light.strength = .6;
				break;
			case "recharge":
				// this.light.strength = .6;
				break;
			case "console":
				// this.light.strength = .6;
				break;
			case "clear":
				// this.light.strength = .325;
				break;
		}
	}

	update(delta) {
		let force = { x: 0, y: 0 };
		// check input
		for (let key in this.input) {
			if (this.input[key].pressed) {
				let f = this.input[key].force;
				force = { ...force, ...f };
			}
		}

		force.x = this.body.mass * force.x * 0.0025;
		force.y = this.body.mass * force.y * 0.0025;
		Matter.Body.applyForce(this.body, this.body.position, force);

		super.update(delta);
	}

	render(ctx) {
		// render droid
		super.render(ctx);

		if (this.light) {
			let arena = this.arena,
				digits = this.digits,
				tile = arena.config.tile,
				pX = arena.viewport.half.w,
				pY = arena.viewport.half.h,
				hT = tile >> 1,
				r = this.light.radius,
				radialGradient = ctx.createRadialGradient(hT, hT, 0, hT, hT, r);
			radialGradient.addColorStop(0, `rgba(255, 255, 255, ${this.light.strength})`);
			radialGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

			ctx.save();
			ctx.translate(pX-hT, pY-hT);
			ctx.fillStyle = radialGradient;
			ctx.arc(hT, hT, r, 0, Math.TAU);
			ctx.fill();
			ctx.restore();
		}
	}
}
