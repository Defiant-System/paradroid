
class Droid {
	constructor(cfg) {
		let { arena, id, speed, x, y, patrol } = cfg;
		if (patrol) [x, y] = patrol[0];
		let pX = x * arena.tiles.size,
			pY = y * arena.tiles.size;

		this.arena = arena;
		this.id = id;
		this.speed = speed || 1;
		// tile coords
		this.x = x || 0;
		this.y = y || 0;
		this.pos = new Point(pX, pY);

		this.r = 20;
		this.mass = 20;
		this.velocity = new Point(0, 0);

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
		let d = impactVector.magnitude();
		
		if (d < this.r + other.r) {
			// Push the particles out so that they are not overlapping
			let overlap = d - (this.r + other.r);
			let dir = impactVector.clone();
			dir = dir.setMagnitude(overlap * 0.5);
			this.pos = this.pos.add(dir);
			other.pos = other.pos.subtract(dir);

			// Correct the distance!
			d = this.r + other.r;
			impactVector = impactVector.setMagnitude(d);
			
			let mSum = this.mass + other.mass;
			let vDiff = this.velocity.subtract(other.velocity);
			let num = vDiff.dot(impactVector);
			let den = mSum * d * d;

			// Particle A (this)
			let deltaVA = impactVector.clone();
			deltaVA = deltaVA.multiply(2 * other.mass * num / den);
			// this.velocity = this.velocity.add(deltaVA);
			// this.move(deltaVA);

			// Particle B (other)
			let deltaVB = impactVector.clone();
			deltaVB = deltaVB.multiply(-2 * this.mass * num / den);
			// other.velocity = other.velocity.add(deltaVB);
			other.move(deltaVB);

			// other.move(new Point(-5, 0));
		}
	}

	move(vel) {
		let arena = this.arena,
			size = arena.tiles.size,
			map = arena.map.collision,
			velocity = vel.multiply(this.speed),
			newPos = {
				x: Math.floor((this.pos.x + velocity.x + (velocity.x > 0 ? size : 0)) / size),
				y: Math.floor((this.pos.y + velocity.y + (velocity.y > 0 ? size : 0)) / size),
			},
			tile;

		if (this.isPlayer) {
			if (velocity.x !== 0) {
				tile = map[this.y][newPos.x] || map[this.y+1][newPos.x];
				if (tile !== 1) {
					this.pos.x += velocity.x;
				} else {
					this.pos.x = velocity.x > 0
								? Math.max(((newPos.x - 1) * size) - 1, this.pos.x)
								: Math.min(((newPos.x + 1) * size) + 1, this.pos.x);
				}
			}
			if (velocity.y !== 0) {
				tile = map[newPos.y][this.x] || map[newPos.y][this.x+1];
				if (tile !== 1) {
					this.pos.y += velocity.y;
				} else {
					this.pos.y = velocity.y > 0
								? Math.max(((newPos.y - 1) * size) - 1, this.pos.y)
								: Math.min(((newPos.y + 1) * size) + 1, this.pos.y);
				}
			}
		} else {
			this.pos.x += velocity.x;
			this.pos.y += velocity.y;
		}
		this.velocity = velocity;
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
