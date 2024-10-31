
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
			vX = (arena.viewport.half.w - size),
			vY = (arena.viewport.half.h - size),
			oldPos = {
				x: Math.floor((this.pos.x - vX) / size),
				y: Math.floor((this.pos.y - vY) / size),
			},
			newPos = {
				x: Math.floor((this.pos.x - vX + point.x + (point.x > 0 ? size : 0)) / size),
				y: Math.floor((this.pos.y - vY + point.y + (point.y > 0 ? size : 0)) / size),
			},
			tile;

		tile = map[oldPos.y][newPos.x] || map[oldPos.y+1][newPos.x];
		if (tile !== 1) {
			this.pos.x += point.x;
		} else {
			this.pos.x = point.x > 0
						? Math.max(vX + ((newPos.x - 1) * size), this.pos.x)
						: Math.min(vX + ((newPos.x + 1) * size), this.pos.x);
		}

		tile = map[newPos.y][oldPos.x] || map[newPos.y][oldPos.x+1];
		if (tile !== 1) {
			this.pos.y += point.y;
		} else {
			this.pos.y = point.y > 0
						? Math.max(vY + ((newPos.y - 1) * size), this.pos.y)
						: Math.min(vY + ((newPos.y + 1) * size), this.pos.y);
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
