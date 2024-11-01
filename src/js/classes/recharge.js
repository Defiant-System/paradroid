
class Recharge {
	constructor(cfg) {
		let { arena, x, y, w, h } = cfg;
		
		this.arena = arena;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}

	update(delta) {
		
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport,
			size = arena.tiles.size,
			vX = viewport.x + ((this.arena.width - viewport.w) >> 1),
			vY = viewport.y + ((this.arena.height - viewport.h) >> 1),
			x = (this.x * size) - vX,
			y = (this.y * size) - vY,
			w = this.w * size,
			h = this.h * size;

		// console.log(x, y, viewport.x, viewport.y);
		ctx.save();
		ctx.fillStyle = "#ff000077";
		ctx.fillRect(x, y, w, h);
		ctx.restore();
	}
}
