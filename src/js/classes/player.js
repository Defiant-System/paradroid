
// Droid "001"
class Player extends Droid {
	constructor(cfg) {
		super(cfg);

		this.light = {
			radius: 100,
		};

		this.speed = .5;

		this.tile = {
			x: 0,
			y: 0,
		};

		this.torch = {
			lit: false,
			frame: 0,
		};
	}

	spawn(x, y) {
		let arena = this.arena,
			size = arena.tiles.size,
			oX = arena.viewport.w - arena.tiles.char,// - arena.map.w,
			oY = arena.viewport.h - arena.tiles.char,// - arena.map.h,
			pos = {
				x: (oX >> 1) + (x * size),
				y: (oY >> 1) + (y * size),
			};
		
		this.pos.x = pos.x;
		this.pos.y = pos.y;
	}

	move(point) {
		let arena = this.arena,
			size = arena.tiles.size,
			// move = this.pos.add(point.multiply(this.speed)),
			map = arena.map.collision,
			vX = (arena.viewport.half.w - 32),
			vY = (arena.viewport.half.h - 32);

		let old_pos = {
			x: Math.floor((this.pos.x - vX) / size),
			y: Math.floor((this.pos.y - vY) / size),
		};
		let new_pos = {
			x: Math.floor((this.pos.x - vX + point.x + (point.x > 0 ? size : 0)) / size),
			y: Math.floor((this.pos.y - vY + point.y + (point.y > 0 ? size : 0)) / size),
		};

		for (let i=0; i<=1; i++) {
			let tile = (i === 0) ? map[old_pos.y][new_pos.x] : map[new_pos.y][old_pos.x];
			
			if (tile !== 1) {
				if (i == 0) {
					this.pos.x += point.x;
					this.tile.x = new_pos.x;
				} else {
					this.pos.y += point.y;
					this.tile.y = new_pos.y;
				}
			} else {
				if (i == 0) {
					this.pos.x = point.x > 0
								? Math.max(vX + ((new_pos.x - 1) * size), this.pos.x)
								: Math.min(vX + ((new_pos.x + 1) * size), this.pos.x);
				} else {
					this.pos.y = point.y > 0
								? Math.max(vY + ((new_pos.y - 1) * size), this.pos.y)
								: Math.min(vY + ((new_pos.y + 1) * size), this.pos.y);
				}
			}
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
		super.render(ctx);
	}
}
