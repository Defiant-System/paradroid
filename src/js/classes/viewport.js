
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
			centerX = this.half.w - arena.player.body.position.x,
			centerY = this.half.h - arena.player.body.position.y;
		this.scroll(centerX, centerY);
	}

	scroll(x, y) {
		this.x = x;
		this.y = y;
	}
}
