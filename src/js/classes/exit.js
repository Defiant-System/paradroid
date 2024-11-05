
class Exit {
	constructor(cfg) {
		let { arena, type, x, y } = cfg,
			size = arena.tiles.size,
			pX = x * size,
			pY = y * size;
		
		this.arena = arena;
		this.type = type;
		this.x = x;
		this.y = y;

		this.pos = new Point(pX, pY);
	}

	update(delta) {
		let dist = this.arena.player.pos.distance(this.pos);
		if (dist < 32) {
			this.active = true;
			this.arena.player.setState({ id: "exit" });
		} else if (this.active) {
			delete this.active;
			this.arena.player.setState({ id: "clear" });
		}
	}

	render(ctx) {
		// let arena = this.arena,
		// 	viewport = arena.viewport,
		// 	size = arena.tiles.size,
		// 	vX = viewport.x + ((this.arena.width - viewport.w) >> 1),
		// 	vY = viewport.y + ((this.arena.height - viewport.h) >> 1),
		// 	x = Math.round((this.x * size) - vX),
		// 	y = Math.round((this.y * size) - vY);

		// ctx.save();
		// ctx.translate(x, y);
		// ctx.fillStyle = "#f90";
		// ctx.fillRect(0, 0, 64, 64);
		// ctx.restore();
	}
}
