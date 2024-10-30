
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
			// centerX = (arena.map.w < this.w ? (arena.width - this.w + arena.map.w) : this.w) >> 1,
			// centerY = (arena.map.h < this.h ? (arena.height - this.h + arena.map.h) : this.h) >> 1;
			centerX = arena.player.pos.x - arena.viewport.half.w + arena.tiles.size,
			centerY = arena.player.pos.y - arena.viewport.half.h + arena.tiles.size;

		for (let key in arena.input) {
			if (arena.input[key].pressed) {
				step = step.add(arena.input[key].move);
				// if (arena.input[key].x != 0) moveX = arena.input[key].x;
				// if (arena.input[key].y != 0) moveY = arena.input[key].y;
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
		this.x += (newX - this.x) * .115;
		this.y += (newY - this.y) * .115;
	}
}
