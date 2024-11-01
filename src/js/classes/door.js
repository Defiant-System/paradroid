
class Door {
	constructor(cfg) {
		let { arena, type, x, y, w, h } = cfg;
		
		this.arena = arena;
		this.type = type;
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
			x = Math.round((this.x * size) - vX),
			y = Math.round((this.y * size) - vY),
			args = [arena.assets["big-map"].img, 128, 256, 64, 64, 0, 0, 64, 64];

		if (this.type === "v") args[2] = 320;

		ctx.save();
		ctx.translate(x, y);

		// ctx.fillStyle = "#ffffff55";
		// ctx.fillRect(0, 0, 64, 64);

		ctx.drawImage(...args);


		ctx.restore();
	}
}
