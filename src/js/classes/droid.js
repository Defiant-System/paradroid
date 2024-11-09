
class Droid {
	constructor(cfg) {
		let { arena, id, x, y, patrol } = cfg;

		this.arena = arena;
		// droid tile coords
		this.x = x || 0;
		this.y = y || 0;
		// radius
		this.r = 17;
		// set droid id
		this.setId(id);

		// droid physics body
		let path = window.find(`svg#droid-mask path`)[0],
			vertexSets = Matter.Svg.pathToVertices(path, 12);
		// this.body = Matter.Bodies.circle(0, 0, this.r, { frictionAir: .1 });
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
			last: 80,
			speed: 80,
		};

		if (patrol) {
			// patrol points
			let index = patrol.findIndex(e => e[0] == x && e[1] == y),
				target = patrol[index % patrol.length],
				step = new Point(0, 0);
			this.home = { index, patrol, target, step };
			// starting position
			this.spawn({ x: target[0], y: target[1] });
		}
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
		console.log( this.id, this.body );
		Matter.Body.setPosition(this.body, pos);
	}

	update(delta) {
		this.frame.last -= delta;
		if (this.frame.last < 0) {
			this.frame.last = (this.frame.last + this.frame.speed) % this.frame.speed;
			this.frame.index++;
			if (this.frame.index > 8) this.frame.index = 0;
		}
		// update tile position
		let tile = this.arena.config.tile;
		this.x = Math.floor(this.body.position.x / tile);
		this.y = Math.floor(this.body.position.y / tile);
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
