
class Viewport {
	constructor(cfg) {
		let { arena, x, y, w, h } = cfg;
		
		this.arena = arena;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		// mid point of viewport
		this.half = { w: w >> 1, h: h >> 1 };
	}

	center() {
		let arena = this.arena,
			centerX = arena.player.pos.x - this.half.w + arena.tiles.size,
			centerY = arena.player.pos.y - this.half.h + arena.tiles.size;
		this.scroll(centerX, centerY);
	}

	scroll(x, y) {
		let newX = x - this.half.w,
			newY = y - this.half.h;
		this.x += (newX - this.x); // * .115;
		this.y += (newY - this.y); // * .115;
	}
}
