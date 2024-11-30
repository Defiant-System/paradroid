
class Particle {
	constructor(cfg) {
		let { arena, owner, x, y, count } = cfg;

		this.arena = arena
		this.owner = owner
		this.count = count || 1;
		this.position = new Point(x, y);

		// update tile position
		let tile = this.arena.config.tile;
		this.x = Math.round(this.position.x / tile);
		this.y = Math.round(this.position.y / tile);

		// add entity to entries list
		this.arena.map.entries.push(this);
	}

	update(delta) {
		// nothing to do
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport,
			x = this.position.x + viewport.x,
			y = this.position.y + viewport.y;

		ctx.save();
		ctx.translate(x, y);
		ctx.fillStyle = "red";
		ctx.fillRect(-5, -5, 10, 10);
		// ctx.drawImage(this.asset.img, -this.offset.x, -this.offset.y);
		ctx.restore();
	}
}
