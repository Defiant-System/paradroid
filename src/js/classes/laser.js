
class Laser {
	constructor(cfg) {
		let { arena, owner, x, y, angle } = cfg;

		this.arena = arena;
		this.x = x;
		this.y = y;
		this.position = owner.position.clone();
		this.velocity = new Point(1, 0);

		// add to map entries
		this.arena.map.entries.push(this);
	}

	update(delta) {
		// this.position.add(this.velocity);
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport,
			x = this.position.x + viewport.x,
			y = this.position.y + viewport.y;

		ctx.save();
		// ctx.translate(x, y);
		ctx.fillStyle = "red";
		ctx.fillRect(100, 100, 50, 50);
		ctx.restore();
	}
}
