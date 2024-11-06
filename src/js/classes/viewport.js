
class Viewport {
	constructor(cfg) {
		let { arena, x, y, w, h } = cfg;
		
		this.arena = arena;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		// mid point of viewport
		let p = { x: w >> 1, y: h >> 1 };
		this.half = { p, w: p.x, h: p.y };
	}

	center() {
		let arena = this.arena,
			centerX = arena.player.pos.x,
			centerY = arena.player.pos.y;
		this.scroll(centerX, centerY);
	}

	scroll(x, y) {
		let newX = x - this.half.w,
			newY = y - this.half.h;
		this.x += (newX - this.x); // * .115;
		this.y += (newY - this.y); // * .115;
	}
}
