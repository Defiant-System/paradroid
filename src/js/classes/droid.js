
class Droid {
	constructor(cfg) {
		let { arena, section, id, x, y, patrol } = cfg;

		this.arena = arena;
		this.section = section;
		// droid tile coords
		this.x = x || 0;
		this.y = y || 0;
		// set droid id
		this.setId(id);

		this.position = new Point(0, 0);
		this.velocity = new Point(0, 0);
		this.acceleration = new Point(0, 0);
		this.maxSpeed = 1;
		this.maxForce = .0075;

		// droid physics body
		let path = window.find(`svg#droid-mask path`)[0],
			vertexSets = Matter.Svg.pathToVertices(path, 12);
		this.body = Matter.Bodies.fromVertices(0, 0, vertexSets, { frictionAir: .1 });
		// prevents droid to rotate
		Matter.Body.setInertia(this.body, Infinity);

		// droid "spining" sprite
		this.sprites = {
			bg: arena.assets["droid"].img,
			digits: arena.assets["digits"].img,
		};

		// used to animate droid "spin"
		this.frame = {
			index: 0,
			last: 120,
			speed: 120,
		};

		if (patrol) {
			// patrol points
			let index = 0,
				target = patrol[0],
				force = new Point(0, 0);
			this.home = { index, patrol, target, force };

			// starting position
			this.spawn({ id, x: target[0], y: target[1] });
		}
	}

	seek(target) {
		let force = target.subtract(this.position);
		force = force.setMagnitude(this.maxSpeed);
		force = force.subtract(this.velocity);
		force = force.limit(this.maxForce);
		return force;
	}

	pursue(droid) {
		let target = droid.position.clone();
		let prediction = droid.velocity.clone();
		prediction.multiply(10);
		target = target.add(prediction);
		return this.seek(target);
	}

	flee(droid) {
		return this.seek(droid.position).multiply(-1);
	}

	evade(droid) {
		let pursuit = this.pursue(droid);
	    pursuit = pursuit.multiply(-1);
	    return pursuit;
	}

	arrive(target) {

	}

	collide() {

	}

	setId(id) {
		let xDroid = window.bluePrint.selectSingleNode(`//Droid[@id="${id}"]`),
			xWeapon = window.bluePrint.selectSingleNode(`//Weapon[@id="${xDroid.getAttribute("weapon")}"]`);
		// update this droid properties
		this.weight = +xDroid.getAttribute("weight");
		this.speed = +xDroid.getAttribute("speed") * .00025;
		this.energy = +xDroid.getAttribute("energy");
		this.loss = +xDroid.getAttribute("loss");
		this.agression = +xDroid.getAttribute("agression");
		this.weapon = {
			id: +xWeapon.getAttribute("id"),
			recharge: +xWeapon.getAttribute("recharge"),
			damage: +xWeapon.getAttribute("damage"),
		};
		// paint digits on droid
		this.digits = id.toString().split("").map((x, i) => {
			return {
				x: +x * 28,
				l: (i * 15) + Utils.digits[id][i],
			};
		});
		// save id
		this.id = id;
	}

	spawn(cfg) {
		let { id, x, y, power } = cfg,
			tile = this.arena.config.tile;
		// tile coords
		this.x = x;
		this.y = y;
		// optional values
		if (id) this.setId(id);
		if (power) this.power = power;

		let pos = {
			x: (this.x - .5) * tile,
			y: (this.y - .5) * tile,
		};
		// console.log( this.id, this.body );
		Matter.Body.setPosition(this.body, pos);
		// copy physical position to "this" internal position
		this.position.x = this.body.position.x;
		this.position.y = this.body.position.y;
	}

	move(force) {
		// if (this.id != "001") console.log(force);
		force.x = this.body.mass * force.x * this.speed;
		force.y = this.body.mass * force.y * this.speed;
		Matter.Body.applyForce(this.body, this.body.position, force);
		// copy physical position to "this" internal position
		this.position.x = this.body.position.x;
		this.position.y = this.body.position.y;
	}

	update(delta) {
		this.frame.last -= delta;
		if (this.frame.last < 0) {
			this.frame.last = (this.frame.last + this.frame.speed) % this.frame.speed;
			this.frame.index++;
			if (this.frame.index > 8) this.frame.index = 0;
		}

		if (!this.isPlayer) {
			this.velocity = this.velocity.add(this.acceleration);
			this.velocity = this.velocity.limit(this.maxSpeed);
			this.position = this.position.add(this.velocity);
			this.acceleration = this.acceleration.multiply(0);

			// seek player droid
			let force = this.evade(this.arena.player);
			// let force = this.flee(this.arena.player);
			
			// let force = this.pursue(this.arena.player);
			// let force = this.seek(this.arena.player.position);
			this.move(force);

			// console.log( this.arena.player.position, this.position );
			// Matter.Body.setPosition(this.body, this.position);
		}

		// update tile position
		let tile = this.arena.config.tile;
		this.x = Math.round(this.body.position.x / tile);
		this.y = Math.round(this.body.position.y / tile);
	}

	render(ctx) {let arena = this.arena,
			digits = this.digits,
			w = arena.config.char,
			f = this.frame.index * w,
			pX,
			pY;

		if (this.isPlayer) {
			pX = arena.viewport.half.w;
			pY = arena.viewport.half.h;
		} else {
			pX = this.body.position.x + arena.viewport.x;
			pY = this.body.position.y + arena.viewport.y;
		}

		ctx.save();
		ctx.translate(pX, pY);

		if (this.blur) {
			// droid "player"
			ctx.shadowColor = this.blur.color;
			ctx.shadowBlur = this.blur.size;
		} else {
			// other droids
			f = (8 - this.frame.index) * w;
		}

		// normal draw if debug mode is < 2
		if (arena.debug.mode < 2) {
			ctx.save();
			ctx.translate(-22, -25);
			// top + bottom caps
			ctx.drawImage(this.sprites.bg,
				f, 0, w, w,
				0, 0, w, w
			);
			// digits
			ctx.drawImage(this.sprites.digits,
				this.digits[0].x, 0, 28, 32,
				this.digits[0].l, 15, 14, 16
			);
			ctx.drawImage(this.sprites.digits,
				this.digits[1].x, 0, 28, 32,
				this.digits[1].l, 15, 14, 16
			);
			ctx.drawImage(this.sprites.digits,
				this.digits[2].x, 0, 28, 32,
				this.digits[2].l, 15, 14, 16
			);
			ctx.restore();
		}
		
		ctx.restore();
	}
}
