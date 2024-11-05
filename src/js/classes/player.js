
// Droid "001"
class Player extends Droid {
	constructor(cfg) {
		super(cfg);

		this.light = {
			strength: .325,
			radius: 100,
		};
		this.speed = .75;
		this.isPlayer = true;

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
		// a little bit blur
		this.blur = {
			color: "#00000055",
			size: 3,
		};
	}

	spawn(x, y) {
		let size = this.arena.tiles.size;
		// tile coords
		this.x = x;
		this.y = y;
		this.pos.x = x * size;
		this.pos.y = y * size;
	}

	setState(state) {
		// console.log( state.id );
		switch (state.id) {
			case "exit":
				this.light.strength = .6;
				break;
			case "recharge":
				this.light.strength = .6;
				break;
			case "console":
				this.light.strength = .6;
				break;
			case "clear":
				this.light.strength = .325;
				break;
		}
	}

	update(delta) {
		let arena = this.arena,
			step = new Point(0, 0);
		// check input
		for (let key in arena.input) {
			if (arena.input[key].pressed) {
				step = step.add(arena.input[key].move);
			}
		}
		if (step.x !== 0 || step.y !== 0) {
			this.move(step);
		}
		super.update(delta);
	}

	render(ctx) {
		// render droid
		super.render(ctx);

		let arena = this.arena,
			digits = this.digits,
			w = arena.tiles.char,
			f = this.frame.index * w,
			pX = arena.viewport.half.w,
			pY = arena.viewport.half.h;

		ctx.save();
		ctx.translate(pX-5, pY-9);

		if (this.light) {
			let lightX = (arena.tiles.size / 2);
			let lightY = (arena.tiles.size / 2);

			let radius = this.light.radius;
			let radialGradient = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, radius);
			radialGradient.addColorStop(0, `rgba(255, 255, 255, ${this.light.strength})`);
			radialGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

			ctx.fillStyle = radialGradient;
			ctx.arc(lightX, lightY, radius, 0, Math.TAU);
			ctx.fill();
		}
	}
}
