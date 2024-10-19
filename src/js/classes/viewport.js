
class Viewport {
	constructor(cfg) {
		let { arena, x, y, w, h } = cfg;
		
		this.arena = arena;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}

	center() {
		let move_x = 0,
			move_y = 0,
			center_x = this.arena.player.pos.x + (this.arena.tiles.char / 2),
			center_y = this.arena.player.pos.y + (this.arena.tiles.char / 2);

		// for (let key in keys) {
		// 	if (keys[key].a) {
		// 		if (keys[key].x != 0) move_x = keys[key].x;
		// 		if (keys[key].y != 0) move_y = keys[key].y;
		// 	}
		// }

		this.arena.player.move(move_x, move_y);
		this.scroll(center_x, center_y);
	}
	
	scroll(x, y) {
		this.x = x - (this.w / 2);
		this.y = y - (this.h / 2);
	}
}
