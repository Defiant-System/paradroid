
class Laser {
	constructor(cfg) {
		let { arena, owner, type, x, y, angle, speed } = cfg;

		this.arena = arena;
		this.bullet = Math.random();
		this.type = type;
		this.x = x;
		this.y = y;
		this.angle = angle + Math.PI / 2;

		this.asset = arena.assets[this.type];
		this.offset = {
				x: this.asset.img.width >> 1,
				y: this.asset.img.height >> 1,
			};
		
		this.speed = speed || .005;
		let vX = Math.cos(angle) * this.speed,
 			vY = Math.sin(angle) * this.speed;
		this.force = new Point(vX, vY);
		
		this.position = owner.position.clone();
		this.position.x += Math.cos(angle) * 30;
		this.position.y += Math.sin(angle) * 30;

		this.body = Matter.Bodies.circle(this.position.x, this.position.y, 3, { density: 0.1, frictionAir: .006, friction: 0 });
		this.body.label = `fire-${this.bullet}`;

		// add to map entries
		this.arena.map.addItem(this);

		this.update(16);
	}

	update(delta) {
		let force = this.force;
		// force.x = this.body.mass * force.x * this.speed;
		// force.y = this.body.mass * force.y * this.speed;
		Matter.Body.applyForce(this.body, this.body.position, force);
		// copy physical position to "this" internal position
		this.position.x = this.body.position.x;
		this.position.y = this.body.position.y;

		// let speed = this.force.setMagnitude(delta/16);
		// this.position = this.position.add(speed);
		
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
		ctx.drawImage(this.asset.img, -this.offset.x, -this.offset.y);
		ctx.restore();
	}
}
