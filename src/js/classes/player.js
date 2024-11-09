
class Player extends Droid {
	constructor(cfg) {
		super(cfg);

		// "aura" borealis
		this.aura = {
			color: [255, 255, 255],
			strength: .325,
			radius: 100,
		};
		this.speed = .0015;
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

	spawn(cfg) {
		super.spawn(cfg);

		
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
				if (f.x != 0) force.x = f.x;
				if (f.y != 0) force.y = f.y;
			}
		}
		force.x = this.body.mass * force.x * this.speed;
		force.y = this.body.mass * force.y * this.speed;
		Matter.Body.applyForce(this.body, this.body.position, force);

		super.update(delta);
	}

	render(ctx) {
		// render droid
		super.render(ctx);

		if (this.aura) {
			let arena = this.arena,
				digits = this.digits,
				pX = arena.viewport.half.w,
				pY = arena.viewport.half.h,
				hT = arena.config.tile >> 1,
				r = this.aura.radius,
				radialGradient = ctx.createRadialGradient(hT, hT, 0, hT, hT, r);
			radialGradient.addColorStop(0, `rgba(${this.aura.color.join(",")}, ${this.aura.strength})`);
			radialGradient.addColorStop(1, `rgba(${this.aura.color.join(",")}, 0)`);

			ctx.save();
			ctx.translate(pX-hT, pY-hT);
			ctx.fillStyle = radialGradient;
			ctx.arc(hT, hT, r, 0, Math.TAU);
			ctx.fill();
			ctx.restore();
		}
	}
}
