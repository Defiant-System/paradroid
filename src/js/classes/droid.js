
class Droid {
	constructor(cfg) {
		let { arena, id, x, y, speed, patrol } = cfg,
			pX = x * arena.tiles.size,
			pY = y * arena.tiles.size;

		this.arena = arena;
		this.id = id;
		this.speed = speed;
		// tile coords
		this.x = x || 0;
		this.y = y || 0;
		this.pos = new Point(pX, pY);

		if (id !== "001") {
			// patrol points
			let index = patrol.findIndex(e => e[0] == x && e[1] == y);
			this.home = { index, patrol };
		}

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
		this.frame.last -= delta;
		if (this.frame.last < 0) {
			this.frame.last = (this.frame.last + this.frame.speed) % this.frame.speed;
			this.frame.index++;
			if (this.frame.index > 8) this.frame.index = 0;
		}

		if (!this.isPlayer) {
			let vel = new Point(-2, 0);
			this.move(vel);
		}
	}

	render(ctx) {
		let arena = this.arena,
			digits = this.digits,
			w = arena.tiles.char,
			f = this.frame.index * w,
			pos = this.pos.subtract(new Point(arena.viewport.x, arena.viewport.y)),
			pX = this.isPlayer ? arena.viewport.half.w : pos.x,
			pY = this.isPlayer ? arena.viewport.half.h : pos.y;

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
