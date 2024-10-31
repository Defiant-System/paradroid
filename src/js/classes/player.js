
// Droid "001"
class Player extends Droid {
	constructor(cfg) {
		super(cfg);

		this.light = {
			radius: 100,
		};

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
				x: (oX >> 1) + ((x * 2) * size),
				y: (oY >> 1) + ((y * 2) * size),
			};
		
		this.pos.x = pos.x;
		this.pos.y = pos.y;
	}

	move(point) {
		let viewport = this.arena.viewport,
			size = this.arena.tiles.size,
			move = this.pos.add(point);

		// Only check "y", use old "x"
		if (!this.checkCollision(this.pos.x, move.y)) {
			this.pos.y = move.y;
		}
		// Only check "x", use old "y"
		if (!this.checkCollision(move.x, this.pos.y)) {
			this.pos.x = move.x;
		}

		this.tile.x = Math.ceil((move.x + viewport.x) / size);
		this.tile.y = Math.ceil((move.y + viewport.y) / size);
	}

	checkCollision(x, y) {
		let arena = this.arena,
			size = this.arena.tiles.size,
			map = arena.map.collision,
			x1 = Math.floor((x + 1) / size), 
			y1 = Math.floor((y + 1) / size),
			x2 = Math.floor((x + 1 - 1) / size), 
			y2 = Math.floor((y + 1 - 1) / size);
		
		if (map[y1][x1] !== 0 || map[y2][x1] !== 0 || map[y1][x2] !== 0 ||  map[y2][x2] !== 0) {
			return true;
		}
		return false;
	}
}
