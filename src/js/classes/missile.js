
class Missile {
	constructor(cfg) {
		let { arena, owner, target, angle } = cfg;

		this.arena = arena;
		this.owner = owner;
		this.angle = angle + Math.PI / 2;
		this.asset = arena.assets.missile;
		this.bullet = Math.random();
		this.trail = [];

		this.position = owner.position.clone();
		this.position.x += Math.cos(angle) * 28;
		this.position.y += Math.sin(angle) * 28;

		let speed = 2,
			vX = Math.cos(angle) * speed,
 			vY = Math.sin(angle) * speed;
		this.velocity = new Point(vX, vY);

		this.target = new Point(target.x, target.y);
	    this.acceleration = new Point(0, 0);
	    this.maxspeed = .25;
	    this.maxforce = .15;

		// add to map entries
		this.arena.map.addItem(this);
	}

	destroy() {
		let arena = this.arena,
			owner = this.owner,
			index = arena.map.entries.indexOf(this);
		arena.map.entries.splice(index, 1);
		// sparks at kill zone
		new Sparks({ arena, owner, x: this.position.x, y: this.position.y });
	}

	seek() {
		let desired = this.target.subtract(this.position);
		desired = desired.setMagnitude(this.maxspeed);
		let steer = desired.subtract(this.velocity);
		steer = steer.limit(this.maxforce);
		// We could add mass here if we want A = F / M
		this.acceleration = this.acceleration.add(steer);
	}

	update(delta) {
		if (this.position.distance(this.target) < 15) {
			return this.destroy();
		} else if (this.position.distance(this.owner.position) < 55) {
			this.position = this.position.add(this.velocity);
			this.acceleration = this.velocity.clone().setMagnitude(10);

			// if (!this._test) {
			// 	this._test = true;
			// 	setTimeout(() => this.target.y -= 250, 400);
			// }
		} else {
			this.seek();
			// Update velocity & Limit speed
			this.velocity = this.velocity.add(this.acceleration).limit(this.maxspeed);
			this.position = this.position.add(this.velocity);
			// Reset accelerationelertion to 0 each cycle
			this.acceleration = this.acceleration.multiply(0.75);
			this.angle = this.velocity.direction() + Math.PI/2;
		}

		// add trail
		this.trail.unshift({
			x: this.position.x,
			y: this.position.y,
		});
		// trim trail log
		this.trail.splice(29, 9);
		
		// update tile position
		let tile = this.arena.config.tile;
		this.x = Math.round(this.position.x / tile);
		this.y = Math.round(this.position.y / tile);
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport,
			x = this.position.x + viewport.x,
			y = this.position.y + viewport.y,
			s = 9;

		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(this.angle);
		ctx.drawImage(this.asset.img, -this.asset.item.oX, -this.asset.item.oY);
		ctx.restore();

		if (this.trail.length > 10) {
			ctx.save();
			ctx.lineWidth = 2;
			ctx.strokeStyle = "#fff9";
			ctx.beginPath();
			ctx.moveTo(this.trail[s].x + viewport.x, this.trail[s].y + viewport.y);
			this.trail.slice(s).map(p => {
					let x2 = p.x + viewport.x,
						y2 = p.y + viewport.y;
					ctx.lineTo(x2, y2);
				});
			ctx.stroke();
			ctx.restore();
		}
	}
}
