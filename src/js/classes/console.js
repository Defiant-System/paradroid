
class Console {
	constructor(cfg) {
		let { arena, type, x, y, w, h } = cfg,
			size = arena.tiles.size,
			pX = arena.viewport.half.w + (x * size),
			pY = arena.viewport.half.h + (y * size);
		
		this.arena = arena;
		this.type = type;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		this.pos = new Point(pX, pY);
	}

	update(delta) {
		let dist = this.arena.player.pos.distance(this.pos);
		// if (this.x === 44 && this.y === 10) console.log( dist );
		if (dist < 42) this.arena.player.setState({ id: "console" });
	}

	render(ctx) {
		// let arena = this.arena,
		// 	viewport = arena.viewport,
		// 	size = arena.tiles.size,
		// 	vX = viewport.x + ((this.arena.width - viewport.w) >> 1),
		// 	vY = viewport.y + ((this.arena.height - viewport.h) >> 1),
		// 	x = Math.round((this.x * size) - vX),
		// 	y = Math.round((this.y * size) - vY),
		// 	args = this.w === 2 ? [0, 0, 64, 32] : [0, 0, 32, 64];

		// ctx.save();
		// ctx.translate(x, y);
		// ctx.fillStyle = "#fff";
		// ctx.fillRect(...args);
		// ctx.restore();
	}
}
