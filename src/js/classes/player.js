
// Droid "001"
class Player extends Droid {
	constructor(cfg) {
		super(cfg);

		this.light = {
			strength: .325,
			radius: 100,
		};
		this.speed = .75;
		this.player = true;

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
		let arena = this.arena,
			size = arena.tiles.size,
			oX = arena.viewport.half.w - size,
			oY = arena.viewport.half.h - size;
		// tile coords
		this.x = x;
		this.y = y;
		this.pos.x = oX + (x * size);
		this.pos.y = oY + (y * size);
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

	move(vel) {
		let arena = this.arena,
			size = arena.tiles.size,
			map = arena.map.collision,
			point = vel.multiply(this.speed),
			viewX = (arena.viewport.half.w - size),
			viewY = (arena.viewport.half.h - size),
			newPos = {
				x: Math.floor((this.pos.x - viewX + point.x + (point.x > 0 ? size : 0)) / size),
				y: Math.floor((this.pos.y - viewY + point.y + (point.y > 0 ? size : 0)) / size),
			},
			tile;

		if (point.x !== 0) {
			tile = map[this.y][newPos.x] || map[this.y+1][newPos.x];
			if (tile !== 1) {
				this.pos.x += point.x;
			} else {
				this.pos.x = point.x > 0
							? Math.max(viewX - 1 + ((newPos.x - 1) * size), this.pos.x)
							: Math.min(viewX + 1 + ((newPos.x + 1) * size), this.pos.x);
			}
		}

		if (point.y !== 0) {
			tile = map[newPos.y][this.x] || map[newPos.y][this.x+1];
			if (tile !== 1) {
				this.pos.y += point.y;
			} else {
				this.pos.y = point.y > 0
							? Math.max(viewY - 1 + ((newPos.y - 1) * size), this.pos.y)
							: Math.min(viewY + 1 + ((newPos.y + 1) * size), this.pos.y);
			}
		}
		this.x = Math.floor((this.pos.x - viewX) / size);
		this.y = Math.floor((this.pos.y - viewY) / size);
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
