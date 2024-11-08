
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
			centerX = arena.player.body.position.x,
			centerY = arena.player.body.position.y;
		// this.scroll(centerX, centerY);
		this.scroll(250, 250);
	}

	scroll(x, y) {
		let newX = x, // - this.half.w,
			newY = y; // - this.half.h;
		this.x = newX; // * .115;
		this.y = newY; // * .115;
	}
}
