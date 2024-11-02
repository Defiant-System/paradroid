
class Droid {
	constructor(cfg) {
		let { arena, id, x, y } = cfg,
			pX = x * arena.tiles.size,
			pY = y * arena.tiles.size;

		this.arena = arena;
		this.id = id;
		this.tile = { x, y };
		this.pos = new Point(pX, pY);

		this.blur = {
			color: "#000",
			size: 0,
		};
		this.sprites = {
			bg: arena.assets["droid"].img,
			digits: arena.assets["digits"].img,
		};

		if (id === "001") {
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
				color: "#00000044",
				size: 3,
			};
		}
		// paint digits on droid
		this.digits = this.id.toString().split("").map((x, i) => {
			return {
				x: +x * 28,
				l: (i * 15) + Utils.digits[this.id][i],
			};
		});
		// used to animate droid "spin"
		this.frame = {
			index: 0,
			last: 80,
			speed: 80,
		};
		// add player to map droids array
		this.arena.map.droids.push(this);
	}

	move(x, y) {

	}

	update(delta) {
		this.frame.last -= delta;
		if (this.frame.last < 0) {
			this.frame.last = (this.frame.last + this.frame.speed) % this.frame.speed;
			this.frame.index++;
			if (this.frame.index > 8) this.frame.index = 0;
		}
	}

	render(ctx) {
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
			radialGradient.addColorStop(0, "rgba(255, 255, 255, 0.325)");
			radialGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

			ctx.fillStyle = radialGradient;
			ctx.arc(lightX, lightY, radius, 0, Math.TAU);
			ctx.fill();
		}

		if (this.blur) {
			// droid "001"
			ctx.shadowColor = this.blur.color;
			ctx.shadowBlur = this.blur.size;
		} else {
			// other droids
			f = (8 - this.frame.index) * w;
		}

		// normal draw if debug mode is < 3
		if (this.arena.debug.mode < 3) {
			// top + bottom caps
			ctx.drawImage(this.sprites.bg,
				f, 0, w, w,
				0, 0, w, w
			);
			// digits
			ctx.drawImage(this.sprites.digits,
				this.digits[0].x, 0, 28, 32,
				this.digits[0].l, 15, 14, 16
			);
			ctx.drawImage(this.sprites.digits,
				this.digits[1].x, 0, 28, 32,
				this.digits[1].l, 15, 14, 16
			);
			ctx.drawImage(this.sprites.digits,
				this.digits[2].x, 0, 28, 32,
				this.digits[2].l, 15, 14, 16
			);
		}
		// if debug mode on, draw extras
		if (this.arena.debug.mode > 0) {
			ctx.save();
			ctx.fillStyle = "#ff000077";
			ctx.fillRect(5, 9, 32, 32);
			ctx.restore();
		}

		ctx.restore();
	}
}
