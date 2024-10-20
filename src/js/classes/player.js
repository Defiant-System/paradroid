
// Droid "001"
class Player extends Droid {
	constructor(cfg) {
		super(cfg);

		this.torch = {
			lit: false,
			frame: 0
		};
	}

	spawn(x, y) {
		let arena = this.arena,
			size = arena.tiles.size,
			oX = (arena.viewport.w - arena.map.w) >> 1,
			oY = (arena.viewport.h - arena.map.h) >> 1,
			pos = {
				x: oX + ((x * 2) * size) + 9,
				y: oY + ((y * 2) * size) + 9,
			};
		
		this.pos.x = pos.x;
		this.pos.y = pos.y;
	}

	move(point) {
		this.pos = this.pos.add(point);
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
			// let collision = map.assets[tile].collision;

			// if (!collision) {
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
