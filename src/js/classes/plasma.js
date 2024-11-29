
class Plasma {
	constructor(cfg) {
		let { arena, owner, x, y } = cfg;

		this.arena = arena;
		this.bullet = Math.random();
		this.x = x;
		this.y = y;

		this.asset = arena.assets.plasma;
		this.offset = {
				x: this.asset.width >> 1,
				y: this.asset.height >> 1,
			};
		
		this.force = new Point(.0005, .0005);
		this.position = owner.position.clone();
		this.position.x += 15;
		this.position.y += 15;

		this.body = Matter.Bodies.circle(this.position.x, this.position.y, 3, { density: 0.1, frictionAir: .006, friction: 0 });
		this.body.label = `fire-${this.bullet}`;

		// add to map entries
		this.arena.map.addItem(this);

		this.update(16);
	}

	update(delta) {
		let force = this.force;
		Matter.Body.applyForce(this.body, this.body.position, force);
		// copy physical position to "this" internal position
		this.position.x = this.body.position.x;
		this.position.y = this.body.position.y;

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
		ctx.drawImage(this.asset.img, -this.offset.x, -this.offset.y);
		ctx.restore();
	}
}
