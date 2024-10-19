
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
		let arena = this.arena,
			moveX = 0,
			moveY = 0,
			centerX = arena.player.pos.x + (arena.tiles.char / 2),
			centerY = arena.player.pos.y + (arena.tiles.char / 2);

		for (let key in arena.input) {
			if (arena.input[key].pressed) {
				if (arena.input[key].x != 0) moveX = arena.input[key].x;
				if (arena.input[key].y != 0) moveY = arena.input[key].y;
			}
		}

		this.arena.player.move(moveX, moveY);
		this.scroll(centerX, centerY);
	}
	
	scroll(x, y) {
		this.x = x - (this.w / 2);
		this.y = y - (this.h / 2);
	}
}
