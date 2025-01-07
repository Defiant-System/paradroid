
class Fire {
	constructor(cfg) {
		let { arena, owner, type, angle, speed, damage, rotate, scale } = cfg;

		this.arena = arena;
		this.owner = owner;
		this.bullet = Math.random();
		this.type = type;
		this.angle = angle + Math.PI / 2;
		this.asset = arena.assets[this.type];
		// ripper uses scale + rotate
		this.rotate = rotate || 0;
		this.scale = scale || 1;
		// this ensures this to be rendered on top
		this._fx = true;
		
		this.speed = speed || .00005;
		let vX = Math.cos(angle) * this.speed,
 			vY = Math.sin(angle) * this.speed;
		this.force = new Point(vX, vY);
		
		this.position = owner.position.clone();
		this.position.x += Math.cos(angle) * 30;
		this.position.y += Math.sin(angle) * 30;

		let opt = { frictionAir: 0, friction: 0, inertia: Infinity, mass: 0 };
		this.body = Matter.Bodies.circle(this.position.x, this.position.y, 1.5, opt);
		this.body.label = `fire-${this.bullet}`;

		// add to map entries
		this.arena.map.addItem(this);

		this.update(16);
	}

	update(delta) {
		let force = this.force.setMagnitude(delta/48);
		Matter.Body.applyForce(this.body, this.body.position, force);

		// rotate (!?)
		this.angle += this.rotate;
		if (this.scale < 1) this.scale += .005;

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

		if (arena.debug.mode < 2) {
			ctx.save();
			ctx.translate(x, y);
			ctx.rotate(this.angle);
			ctx.scale(this.scale, this.scale);
			ctx.drawImage(this.asset.img, -this.asset.item.oX, -this.asset.item.oY);
			ctx.restore();
		}
	}
}
