
// Droid "001"
class Player extends Droid {
	constructor(cfg) {
		super(cfg);

		this.torch = {
			lit: false,
			frame: 0
		};
	}

	move(x, y) {
		let map = this.arena.map;

		let pos = {
			x: Math.ceil(this.pos.x / this.arena.tiles.size),
			y: Math.ceil(this.pos.y / this.arena.tiles.size)
		};

		let new_pos = {
			x: Math.ceil((this.pos.x + x) / this.arena.tiles.size),
			y: Math.ceil((this.pos.y + y) / this.arena.tiles.size)
		};

		for (let i = 0; i <= 1; i++) {
			let tile = ((i == 0) ? map.layout[pos.y][new_pos.x] : map.layout[new_pos.y][pos.x]) - 1;
			// let collision = map.assets[tile].collision;

			// if (!collision) {
				if (i == 0) {
					this.pos.x += x;
					this.tile.x = new_pos.x;
				}
				else {
					this.pos.y += y;
					this.tile.y = new_pos.y;
				}
			// }
		}
	}
}
