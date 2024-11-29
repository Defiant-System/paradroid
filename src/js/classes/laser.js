
class Laser {
	constructor(cfg) {
		let { arena, owner, x, y, angle } = cfg;

		this.arena = arena;
		this.x = x;
		this.y = y;
		this.angle = angle + Math.PI / 2;
		this.offset = {
				x: 48,
				y: 48,
			};
		let speed = 5,
			vX = Math.cos(angle) * speed,
 			vY = Math.sin(angle) * speed;
		this.velocity = new Point(vX, vY);
		this.position = owner.position.clone();

		// add to map entries
		this.arena.map.entries.push(this);
	}

	update(delta) {
		let speed = this.velocity.setMagnitude(delta/16);
		this.position = this.position.add(speed);
		// update tile position
		let tile = this.arena.config.tile;
		this.x = Math.round(this.position.x / tile);
		this.y = Math.round(this.position.y / tile);
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport,
			x = this.position.x + viewport.x,
			y = this.position.y + viewport.y;

		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(this.angle);
		ctx.drawImage(arena.assets.laser.img, -this.offset.x, -this.offset.y);
		ctx.restore();
	}
}
