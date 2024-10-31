
// Droid "001"
class Player extends Droid {
	constructor(cfg) {
		super(cfg);

		this.light = {
			radius: 100,
		};

		this.speed = .85;

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
		let viewport = this.arena.viewport,
			size = this.arena.tiles.size,
			move = this.pos.add(point.multiply(this.speed));

		// Only check "y", use old "x"
		if (!this.checkCollision(this.pos.x, move.y)) {
			this.pos.y = move.y;
		}
		// Only check "x", use old "y"
		if (!this.checkCollision(move.x, this.pos.y)) {
			this.pos.x = move.x;
		}

		this.tile.x = Math.ceil((this.pos.x + viewport.x) / size);
		this.tile.y = Math.ceil((this.pos.y + viewport.y) / size);
	}

	checkCollision(x, y) {

		x -= 320;
		y -= 180;

		let arena = this.arena,
			size = arena.tiles.size,
			map = arena.map.collision,
			x1 = Math.floor((x + 1) / size), 
			y1 = Math.floor((y + 1) / size),
			x2 = Math.floor((x + 1 - 1) / size), 
			y2 = Math.floor((y + 1 - 1) / size);
		// if there is wall, return true
		return (map[y1][x1] !== 0 || map[y2][x1] !== 0 || map[y1][x2] !== 0 ||  map[y2][x2] !== 0);
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
