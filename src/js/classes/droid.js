
class Droid {
	constructor(cfg) {
		let { arena, section, id, x, y, patrol } = cfg;

		this.arena = arena;
		this.section = section;
		// droid tile coords
		this.x = x || 0;
		this.y = y || 0;
		this._freeze = false;
		// droid "spining" sprite
		this.sprites = {
			bg: arena.assets["droid"].img,
			digits: arena.assets["digits"].img,
		};
		// droid fire details
		this.fire = {
			shooting: false,
			lastShot: Date.now(),
		};
		// used to animate droid "spin"
		this.frame = {
			index: 0,
			last: 120,
			speed: 120,
		};
		// set droid id
		this.setId(id);
		this._path = [];

		this.position = new Point(0, 0);
		this.velocity = new Point(0, 0);
		this.acceleration = new Point(0, 0);
		this.maxSpeed = 1;
		this.maxForce = .0075;

		// droid physics body
		let path = window.find(`svg#droid-mask path`)[0],
			vertexSets = Matter.Svg.pathToVertices(path, 12);
		this.body = Matter.Bodies.fromVertices(0, 0, vertexSets, { density: .9, frictionAir: .06 });
		this.body.label = `droid-${id}`;
		// prevents droid to rotate
		Matter.Body.setInertia(this.body, Infinity);

		if (patrol) {
			// patrol points
			let [x, y] = patrol[0], // patrol[Utils.randomInt(0, patrol.length)],
				target = new Point(x, y),
				force = new Point(0, 0);
			this.home = { patrol, target, force, dist: 0 };

			// starting position
			this.spawn({ id, x, y });
		}
	}

	get freeze() {
		return this._freeze;
	}

	set freeze(v) {
		// physically freeze droid
		Matter.Sleeping.set(this.body, v);
		// internal value
		this._freeze = v;
	}

	setDirection(x, y) {
		let px = x + this.position.x,
			py = y + this.position.y;
		this.target = new Point(px, py);
		this.dir = this.position.direction(this.target);
	}

	setPath() {
		let patrol = this.home.patrol.filter(p => p.join() != [this.x, this.y].join()),
			target = patrol[Utils.randomInt(0, patrol.length)],
			graph = new Finder.Graph(this.arena.map.grid),
			start = graph.grid[this.y][this.x],
			end = graph.grid[target[1]][target[0]],
			// opt = { heuristic: Finder.astar.heuristics.diagonal },
			result = Finder.astar.search(graph, start, end);
		
		this._path = result.map(p => [p.y, p.x]);
		// this._path = [[this.x, this.y], ...result.map(p => [p.y, p.x])];
		// console.log( this._path.join("\n") );

		// console.log( result );
		// console.log( this._path );
		// console.log( this.x, this.y );
		// console.log( target[0], target[1] );
	}

	shoot() {
		let cfg = {
				owner: this,
				arena: this.arena,
				target: this.target,
				angle: this.dir || Math.PI / 4,
				type: this.fire.name,
			},
			count,
			inc,
			a;
		// weapons and implementations
		switch (this.fire.name) {
			case "laser":
			case "phaser":
				new Fire(cfg);
				break;
			case "sonic":
				new Sonic(cfg);
				break;
			case "plasma":
				count = 16;
				inc = 360 / count;
				a = 0;
				[...Array(count)].map(e => {
					new Fire({ ...cfg, angle: a * Math.PI / 180 });
					a += inc;
				});
				break;
			case "exterminator":
				count = 7;
				inc = (Math.TAU * .8) / count;
				a = this.dir + (Math.TAU * .65);
				// launch missiles
				[...Array(count)].map(m => {
					new Missile({ ...cfg, angle: a });
					a += inc;
				});
				break;
			case "disruptor":
				let droids = cfg.arena.map.droids.filter(d => !d.isPlayer),
					bodies = Matter.Composite.allBodies(cfg.arena.map.engine.world),
					origin = {
						x: -(cfg.arena.viewport.x - cfg.arena.viewport.half.w),
						y: -(cfg.arena.viewport.y - cfg.arena.viewport.half.h),
					};
				// loop droids and disrupt those in view
				droids.map(droid => {
					let collisions = Matter.Query.ray(bodies, origin, droid.position),
						color = this.isPlayer ? "#fff" : "#000";
					// if nothing is in the way, disruptor
					if (collisions.length === 2) new Electric({ ...cfg, droid, color });
				});
				break;
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

	setId(id) {
		let xDroid = window.bluePrint.selectSingleNode(`//Droid[@id="${id}"]`),
			xWeapon = window.bluePrint.selectSingleNode(`//Weapon[@id="${xDroid.getAttribute("weapon")}"]`);
		// update this droid properties
		this.weight = +xDroid.getAttribute("weight");
		this.speed = +xDroid.getAttribute("speed") * .00015;
		this.energy = +xDroid.getAttribute("energy");
		this.loss = +xDroid.getAttribute("loss");
		this.agression = +xDroid.getAttribute("agression");
		
		this.fire.name = xWeapon.getAttribute("id");
		this.fire.coolDown = +xWeapon.getAttribute("coolDown");

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
		let { id, x, y, patrol } = cfg,
			tile = this.arena.config.tile;
		// tile coords
		this.x = x;
		this.y = y;
		// optional values ()
		if (id) this.setId(id);

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
		// if (this.id != "711") console.log("move");
		force.x = this.body.mass * force.x * this.speed;
		force.y = this.body.mass * force.y * this.speed;
		Matter.Body.applyForce(this.body, this.body.position, force);
		// copy physical position to "this" internal position
		this.position.x = this.body.position.x;
		this.position.y = this.body.position.y;
	}

	isStuck() {
		// Math.abs(this.home.distance - distance) < .05
	}

	update(delta) {
		// dont move
		if (this._freeze) return;

		this.frame.last -= delta;
		if (this.frame.last < 0) {
			this.frame.last = (this.frame.last + this.frame.speed) % this.frame.speed;
			this.frame.index++;
			if (this.frame.index > 8) this.frame.index = 0;
		}

		let now = Date.now();
		if (this.fire.shooting && now - this.fire.lastShot > this.fire.coolDown) {
			this.fire.lastShot = now;
			this.shoot();
		}

		if (!this.isPlayer) {
			let pos = new Point(this.x, this.y),
				distance = this.home.target.distance(pos);

			if (!this._path.length || this.isStuck()) this.setPath();
			this.home.distance = distance;

			if (distance == 0) {
				let [x1, y1] = this._path.shift();
				this.home.target = new Point(x1, y1);
				this.home.force = this.home.target.subtract(pos);
			} else {
				this.move(this.home.force.clone());
			}
		}

		// update tile position
		let tile = this.arena.config.tile;
		this.x = Math.ceil(this.body.position.x / tile);
		this.y = Math.ceil(this.body.position.y / tile);
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

		if (!this.isPlayer && this._path.length) {
			let tile = this.arena.config.tile,
				hT = tile >> 1,
				tX = (this._path[0][0] * tile) - hT,
				tY = (this._path[0][1] * tile) - hT;
			// this._path.map(p => {
			// 	p[0] = (p[0] * tile) - hT;
			// 	p[1] = (p[1] * tile) - hT;
			// });
			// temp draw path
			ctx.save();
			ctx.translate(arena.viewport.x, arena.viewport.y);
			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(tX, tY);
			this._path.slice(1).map(p => {
				let x = (p[0] * tile) - hT,
					y = (p[1] * tile) - hT;
				ctx.lineTo(x, y);
			});
		    ctx.stroke();
			ctx.restore();
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
