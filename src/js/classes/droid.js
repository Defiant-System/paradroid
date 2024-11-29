
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
		this.body.label = `droid-${id}`;
		// prevents droid to rotate
		Matter.Body.setInertia(this.body, Infinity);

		// droid "spining" sprite
		this.sprites = {
			bg: arena.assets["droid"].img,
			digits: arena.assets["digits"].img,
		};

		this.fire = {
			shooting: false,
			reload: 0,
			speed: 200,
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

	setDirection(x, y) {
		let viewport = this.arena.viewport,
			px = x + this.position.x,
			py = y + this.position.y,
			pos = new Point(px, py);
		this.dir = this.position.direction(pos);
	}

	shoot() {
		let angle = this.dir || Math.PI / 4;
		new Laser({ owner: this, arena: this.arena, x: this.x, y: this.y, angle });
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

		this.fire.reload -= delta;
		if (this.fire.shooting && this.fire.reload < 0) {
			this.fire.reload = (this.fire.reload + this.fire.speed) % this.fire.speed;
			this.shoot();
		}

		if (!this.isPlayer) {
			if (this.x === this.home.target[0] && this.y === this.home.target[1]) {
				// droid reached target - change target
				this.home.index++;
				this.home.target = this.home.patrol[this.home.index % this.home.patrol.length];

				this.home.force.x = 0;
				this.home.force.y = 0;
				if (this.home.target[0] !== this.x) this.home.force.x = this.home.target[0] < this.x ? -1 : 1;
				if (this.home.target[1] !== this.y) this.home.force.y = this.home.target[1] < this.y ? -1 : 1;
			} else {
				this.move(this.home.force.clone());
			}

			// this.velocity = this.velocity.add(this.acceleration);
			// this.velocity = this.velocity.limit(this.maxSpeed);
			// this.position = this.position.add(this.velocity);
			// this.acceleration = this.acceleration.multiply(0);

			// seek player droid
			// let force = this.evade(this.arena.player);
			// let force = this.flee(this.arena.player);

			// let force = this.pursue(this.arena.player);
			// let force = this.seek(this.arena.player.position);
			// this.move(force);

			// console.log( this.arena.player.position, this.position );
			// Matter.Body.setPosition(this.body, this.position);
		}

		// update tile position
		let tile = this.arena.config.tile;
		this.x = Math.round(this.body.position.x / tile);
		this.y = Math.round(this.body.position.y / tile);
	}

	render(ctx) {
		let arena = this.arena,
			digits = this.digits,
			w = arena.config.char,
			f = this.frame.index * w,
			pX,
			pY;

		if (this.isPlayer) {
			pX = arena.viewport.half.w;
			pY = arena.viewport.half.h;
		} else {
			pX = this.position.x + arena.viewport.x;
			pY = this.position.y + arena.viewport.y;
		}

		ctx.save();
		ctx.translate(pX, pY);

		if (this.blur) {
			// droid "player"
			ctx.shadowColor = this.blur.color;
			ctx.shadowBlur = this.blur.size;

			if (this.aura) {
				let aura = this.aura,
					gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, aura.radius);
				gradient.addColorStop(0, `rgba(${aura.color.join(",")}, ${aura.strength})`);
				gradient.addColorStop(1, `rgba(${aura.color.join(",")}, 0)`);

				ctx.save();
				ctx.beginPath();
				ctx.fillStyle = gradient;
				ctx.arc(0, 0, aura.radius, 0, Math.TAU);
				ctx.fill();
				ctx.restore();
			}
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
