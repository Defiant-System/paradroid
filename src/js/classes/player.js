
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
			oldPos = {
				x: Math.ceil((this.pos.x - viewport.x) / size),
				y: Math.ceil((this.pos.y - viewport.y) / size),
			},
			move = this.pos.add(point),
			newPos = {
				x: Math.ceil((move.x + viewport.x) / size),
				y: Math.ceil((move.y + viewport.y) / size),
			};
		// console.log( newPos );

		// for (let i = 0; i <= 1; i++) {
			// let tile = (i == 0) ? map.layout[oldPos.y][newPos.x] : map.layout[newPos.y][oldPos.x];
		// 	let wall = map.tiles[tile].wall;

		// 	if (!wall) {
		// 		if (i == 0) {
		// 			this.pos.x += x;
					this.tile.x = newPos.x;
		// 		} else {
		// 			this.pos.y += y;
					this.tile.y = newPos.y;
		// 		}
		// 	}
		// }
		this.pos = move;
		// this.pos = new Point(150, 150);
	}

	move_(x, y) {
		let map = this.arena.map,
			size = this.arena.tiles.size,
			pos = {
				x: Math.ceil(this.pos.x / size),
				y: Math.ceil(this.pos.y / size)
			},
			newPos = {
				x: Math.ceil((this.pos.x + x) / size),
				y: Math.ceil((this.pos.y + y) / size)
			};

		for (let i = 0; i <= 1; i++) {
			// let tile = (i == 0) ? map.layout[pos.y][newPos.x] : map.layout[newPos.y][pos.x];
			// let wall = map.assets[tile].wall;

			// if (!wall) {
				if (i == 0) {
					this.pos.x += x;
					this.tile.x = newPos.x;
				} else {
					this.pos.y += y;
					this.tile.y = newPos.y;
				}
			// }
		}
	}
}
