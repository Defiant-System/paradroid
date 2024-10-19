
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
		let map = this.arena.map,
			size = this.arena.tiles.size,
			pos = {
				x: Math.ceil(this.pos.x / size),
				y: Math.ceil(this.pos.y / size)
			},
			new_pos = {
				x: Math.ceil((this.pos.x + x) / size),
				y: Math.ceil((this.pos.y + y) / size)
			};

		for (let i = 0; i <= 1; i++) {
			let tile = (i == 0) ? map.layout[pos.y][new_pos.x] : map.layout[new_pos.y][pos.x];
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
