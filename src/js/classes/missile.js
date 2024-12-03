
class Missile {
	constructor(cfg) {
		let { arena, owner, target, angle } = cfg;

		this.arena = arena;
		this.owner = owner;
		this.angle = angle + Math.PI / 2;
		this.asset = arena.assets.missile;
		this.bullet = Math.random();

		this.position = owner.position.clone();
		this.position.x += Math.cos(angle) * 30;
		this.position.y += Math.sin(angle) * 30;
		this.target = new Point(target.x, target.y);

		let speed = .00000075,
			vX = Math.cos(angle) * speed,
 			vY = Math.sin(angle) * speed;
		this.velocity = new Point(vX, vY);
	    this.acceleration = new Point(0, 0);
	    this.maxspeed = .00015;
	    this.maxforce = .00025;

		this.body = Matter.Bodies.circle(this.position.x, this.position.y, 2, { frictionAir: .006 });
		this.body.label = `fire-${this.bullet}`;

		// add to map entries
		this.arena.map.addItem(this);
	}

	destroy() {
		let arena = this.arena,
			owner = this.owner,
			index = arena.map.entries.indexOf(this);
		arena.map.entries.splice(index, 1);
		// remove from physical world
		Matter.Composite.remove(arena.map.engine.world, this.body);
		// sparks at kill zone
		new Sparks({ arena, owner, x: this.position.x, y: this.position.y });
	}

	seek() {
		let target = this.target;
		let desired = this.position.subtract(this.target);
		desired = desired.setMagnitude(this.maxspeed);
		let steer = this.velocity.subtract(desired);
	    steer = steer.limit(this.maxforce);
	    this.applyForce(steer);
	}

	applyForce(force) {
		this.acceleration = this.acceleration.add(force);
		Matter.Body.applyForce(this.body, this.body.position, this.acceleration);

		// copy physical position to "this" internal position
		this.position.x = this.body.position.x;
		this.position.y = this.body.position.y;
	}

	update(delta) {
		if (this.position.distance(this.target) < 15) {
			return this.destroy();
		} else if (this.position.distance(this.owner.position) < 35) {
			this.applyForce(this.velocity);
		} else {
			this.seek();
			this.velocity = this.velocity.add(this.acceleration);
			this.velocity = this.velocity.limit(this.maxspeed);
			this.position = this.position.add(this.velocity);
			this.acceleration = this.acceleration.multiply(0);
			this.angle = this.velocity.direction() + Math.PI/2;
		}

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
