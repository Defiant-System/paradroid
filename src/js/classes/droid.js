
class Droid {
	constructor(cfg) {
		let { arena, id, speed, x, y, patrol } = cfg;
		if (patrol) [x, y] = patrol[0];
		let pX = x * arena.tiles.size,
			pY = y * arena.tiles.size;

		this.arena = arena;
		this.id = id;
		this.speed = speed;
		// tile coords
		this.x = x || 0;
		this.y = y || 0;
		this.r = 23;
		this.pos = new Point(pX, pY);

		if (id !== "001") {
			// patrol points
			let index = patrol.findIndex(e => e[0] == x && e[1] == y),
				target = patrol[index % patrol.length],
				step = new Point(0, 0);
			this.home = { index, patrol, target, step };
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

	collide(other) {
		let impactVector = this.pos.subtract(other.pos);
		let d = impactVector.mag();
		
		if (d < this.r + other.r) {
			console.log( "collision" );
		}
	}

	move(vel) {
		let arena = this.arena,
			size = arena.tiles.size,
			map = arena.map.collision,
			point = vel.multiply(this.speed),
			newPos = {
				x: Math.floor((this.pos.x + point.x + (point.x > 0 ? size : 0)) / size),
				y: Math.floor((this.pos.y + point.y + (point.y > 0 ? size : 0)) / size),
			},
			tile;

		if (this.isPlayer) {
			if (point.x !== 0) {
				tile = map[this.y][newPos.x] || map[this.y+1][newPos.x];
				if (tile !== 1) {
					this.pos.x += point.x;
				} else {
					this.pos.x = point.x > 0
								? Math.max(((newPos.x - 1) * size) - 1, this.pos.x)
								: Math.min(((newPos.x + 1) * size) + 1, this.pos.x);
				}
			}
			if (point.y !== 0) {
				tile = map[newPos.y][this.x] || map[newPos.y][this.x+1];
				if (tile !== 1) {
					this.pos.y += point.y;
				} else {
					this.pos.y = point.y > 0
								? Math.max(((newPos.y - 1) * size) - 1, this.pos.y)
								: Math.min(((newPos.y + 1) * size) + 1, this.pos.y);
				}
			}
		} else {
			this.pos.x += point.x;
			this.pos.y += point.y;
		}
		// update tile position
		this.x = Math.floor(this.pos.x / size);
		this.y = Math.floor(this.pos.y / size);
	}

	update(delta) {
		this.frame.last -= delta;
		if (this.frame.last < 0) {
			this.frame.last = (this.frame.last + this.frame.speed) % this.frame.speed;
			this.frame.index++;
			if (this.frame.index > 8) this.frame.index = 0;
		}

		if (!this.isPlayer) {
			// console.log( this.home.target, this.x, this.y );
			if (this.x === this.home.target[0] && this.y === this.home.target[1]) {
				// droid reached target - change target
				this.home.target = this.home.patrol[this.home.index % this.home.patrol.length];
				this.home.index++;

				this.home.step.x = 0;
				this.home.step.y = 0;
				if (this.home.target[0] !== this.x) this.home.step.x = this.home.target[0] < this.x ? -2 : 2;
				if (this.home.target[1] !== this.y) this.home.step.y = this.home.target[1] < this.y ? -2 : 2;
			} else {
				// console.log(this.home.target.join(","));
				this.move(this.home.step);
			}
		}
	}

	render(ctx) {
		let arena = this.arena,
			digits = this.digits,
			w = arena.tiles.char,
			f = this.frame.index * w,
			pos = this.pos.subtract(new Point(arena.viewport.x, arena.viewport.y)),
			pX,
			pY;

		if (this.isPlayer) {
			pX = arena.viewport.half.w;
			pY = arena.viewport.half.h;
		} else {
			pX = pos.x;
			pY = pos.y;
		}

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
		if (arena.debug.mode < 3) {
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
		if (arena.debug.mode > 0) {
			ctx.save();
			ctx.fillStyle = this.isPlayer ? "#6699ff77" : "#ff000077";
			ctx.beginPath();
			ctx.arc(16, 16, 16, 0, Math.TAU);
			ctx.fill();
			ctx.restore();
		}

		ctx.restore();
	}
}
