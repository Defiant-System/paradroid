
class Missile {
	constructor(cfg) {
		let { arena, owner, target, angle } = cfg;

		this.arena = arena;
		this.owner = owner;
		this.target = new Point(target.x, target.y);
		
		this.bullet = Math.random();
		this.angle = angle + Math.PI / 2;
		this.asset = arena.assets.missile;
		this.trail = [];
		
		this.position = owner.position.clone();
		this.position.x += Math.cos(angle) * 30;
		this.position.y += Math.sin(angle) * 30;

		let speed = .00001,
			vX = Math.cos(angle) * speed,
 			vY = Math.sin(angle) * speed;
		this.velocity = new Point(vX, vY);
		// this.velocity = new Point(0, 0);
		this.maxSpeed = .001;
		this.maxForce = .00001;

		this.body = Matter.Bodies.circle(this.position.x, this.position.y, 2, { frictionAir: .006 });
		this.body.label = `fire-${this.bullet}`;

		// add to map entries
		this.arena.map.addItem(this);

		this.update(16);
	}

	seek(target) {
		let force = target.subtract(this.position);
		force = force.setMagnitude(this.maxSpeed);
		force = force.subtract(this.velocity);
		force = force.limit(this.maxForce);
		return force;
	}

	move(force) {
		Matter.Body.applyForce(this.body, this.body.position, force);

		// copy physical position to "this" internal position
		this.position.x = this.body.position.x;
		this.position.y = this.body.position.y;
	}

	update(delta) {
		let force = this.velocity.setMagnitude(delta/16);
		// let force = this.seek(this.target);
		this.move(force);

		// prepend position to trail
		this.trail.unshift({ x: this.position.x, y: this.position.y });
		// trim trail log
		this.trail.splice(9, 9);

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
		ctx.drawImage(this.asset.img, -this.asset.item.oX, -this.asset.item.oY);
		ctx.restore();
	}
}
