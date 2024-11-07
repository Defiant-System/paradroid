
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
			// tile = arena.config.tile,
			centerX = 0,
			centerY = 0;
		// this.x = (this.player.x * tile) - this.half.w;
		// this.y = (this.player.y * tile) - this.half.h;
		this.scroll(centerX, centerY);
	}

	scroll(x, y) {
		let newX = x - this.half.w,
			newY = y - this.half.h;
		this.x = newX; // * .115;
		this.y = newY; // * .115;
	}
}
