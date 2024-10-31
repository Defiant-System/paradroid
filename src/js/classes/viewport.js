
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
			step = new Point(0, 0),
			centerX = arena.player.pos.x - arena.viewport.half.w + arena.tiles.size,
			centerY = arena.player.pos.y - arena.viewport.half.h + arena.tiles.size;

		for (let key in arena.input) {
			if (arena.input[key].pressed) {
				step = step.add(arena.input[key].move);
			}
		}
		
		if (step.x !== 0 || step.y !== 0) {
			this.arena.player.move(step);
		}
		this.scroll(centerX, centerY);
	}

	scroll(x, y) {
		let newX = x - (this.w / 2),
			newY = y - (this.h / 2);
		this.x += (newX - this.x); // * .115;
		this.y += (newY - this.y); // * .115;
	}
}
