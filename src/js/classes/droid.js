
class Droid {
	constructor(cfg) {
		let { arena, id, x, y } = cfg,
			pX = x * arena.tiles.size,
			pY = y * arena.tiles.size;

		this.arena = arena;
		this.id = id;
		// tile coords
		this.x = x || 0;
		this.y = y || 0;
		this.pos = new Point(pX, pY);

		this.sprites = {
			bg: arena.assets["droid"].img,
			digits: arena.assets["digits"].img,
		};
		
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
			pos = this.pos.subtract(new Point(arena.viewport.x, arena.viewport.y)),
			pX = this.player ? arena.viewport.half.w : pos.x,
			pY = this.player ? arena.viewport.half.h : pos.y;

		ctx.save();
		ctx.translate(pX, pY);

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
			ctx.save();
			ctx.translate(-6, -9);
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
			ctx.restore();
		}
		// if debug mode on, draw extras
		if (this.arena.debug.mode > 0) {
			ctx.save();
			ctx.fillStyle = "#ff000077";
			ctx.fillRect(0, 0, 32, 32);
			ctx.restore();
		}

		ctx.restore();
	}
}
