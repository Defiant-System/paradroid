
class Droid {
	constructor(cfg) {
		let { arena, section, xItem, id, x, y, patrol } = cfg;

		this.APP = paradroid;
		this.arena = arena;
		this.section = section;
		this.xItem = xItem;
		// droid tile coords
		this.x = x || 0;
		this.y = y || 0;
		this._freeze = false;
		// droid "spining" sprite
		this.sprites = {
			bg: arena.assets["droid"].img,
			digits: arena.assets["digits"].img,
			sonic: this.arena.assets["sonic"].img,
			ripper: this.arena.assets["ripper"].img,
			missile: this.arena.assets["missile"].img,
			electric: this.arena.assets["electric"].img,
		};
		// droid fire details
		this.fire = {
			shooting: false,
			lastShot: Date.now(),
		};
		// electric gloria
		this.electric = {
			active: true,
			index: 0,
			last: 25,
			speed: 25,
			angle: 0,
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
			let tile = this.arena.config.tile,
				hT = tile >> 1,
				[x, y] = patrol[Utils.randomInt(0, patrol.length)],
				target = new Point(x, y),
				force = new Point(0, 0);
			target = target.multiply(tile).subtract({ x: hT, y: hT });
			this.home = { patrol, target, force, _backOff: 0, log: [] };

			// starting position
			this.spawn({ id, x, y });

			// plot droid patrol path
			if (patrol.length > 1) this.setPath();
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

	dealDamage(v) {
		this.health -= v;
		// update hud UI, if this is player
		if (this.isPlayer) {
			let health = this.health / this._health;
			this.APP.hud.dispatch({ type: "progress-update", health });
			// shake screen on damage hit
			this.arena.viewport.addShake(.25 + (v/50));
		} else {
			// player can deal more damage
			this.health -= v;
		}
		if (this.health <= 0) {
			// kill this droid
			this.kill();
			// inset explosion animation
			new Explosion({ arena: this.arena, x: this.position.x, y: this.position.y });
		}
	}

	kill(opt={}) {
		// remove this droid from map
		let index = this.arena.map.droids.indexOf(this),
			droid = this.arena.map.droids.splice(index, 1)[0];
		// remove droid from physical world
		Matter.Composite.remove(this.arena.map.engine.world, this.body);
		// play sound fx
		if (opt.silent === undefined) window.audio.play("explosion");
		
		// shake screen on damage hit
		this.arena.viewport.addShake(.75);
		
		if (droid.isPlayer) {
			setTimeout(() => {
				// player droid killed - show "game over"
				this.APP.mobile.dispatch({ type: "player-droid-destroyed" });
			}, 1500);
		} else {
			// make node "dead"
			this.xItem.setAttribute("dead", 1);
			// notify map / section / level
			this.arena.map.mapUpdate();
		}
	}

	setDirection(x, y) {
		let px = x + this.position.x,
			py = y + this.position.y;
		this.target = new Point(px, py);
		this.dir = this.position.direction(this.target);
	}

	setPath() {
		let tile = this.arena.config.tile,
			patrol = this.home.patrol.filter(p => {
				let dist = this.position.distance({ x: p[0] * tile, y: p[1] * tile });
				return dist > tile * 1.5;
			}),
			seek = [this.arena.player.x, this.arena.player.y],
			isSeekDestroy = this.aggression.name === "seek-destroy" && this.arena.player.health > 0,
			target = isSeekDestroy ? seek : patrol[Utils.randomInt(0, patrol.length)],
			graph = new Finder.Graph(this.arena.map.grid),
			start = graph.grid[this.y*2][this.x*2],
			end = graph.grid[target[1]*2][target[0]*2],
			result = Finder.astar.search(graph, start, end);
		// new path to patrol
		this._path = result.length ? result.map(p => [p.y/2, p.x/2]) : [seek];
	}

	shoot() {
		let cfg = {
				owner: this,
				arena: this.arena,
				target: this.target,
				angle: this.dir, // || Math.PI / 4,
				type: this.fire.name,
				damage: this.fire.damage,
			},
			count,
			inc,
			a;
		// stop shooting if player is dead
		if (cfg.arena.player.health < 1) {
			this.fire.shooting = false;
		}

		// weapons and implementations
		switch (this.fire.name) {
			case "laser":
			case "phaser":
				new Fire(cfg);
				// play sound fx
				window.audio.play("laser");
				break;
			case "sonic":
				new Sonic(cfg);
				// play sound fx
				window.audio.play("sonic");
				break;
			case "ripper":
				count = 12;
				inc = 360 / count;
				a = 0;
				[...Array(count)].map(e => {
					new Fire({ ...cfg, angle: a * Math.PI / 180, scale: -1, rotate: .5 });
					a += inc;
				});
				// play sound fx
				window.audio.play("ripper");
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
				// play sound fx
				window.audio.play("io");
				break;
			case "disruptor":
				if (this.isPlayer) {
					let droids = cfg.arena.map.droids.filter(d => !d.isPlayer),
						bodies = Matter.Composite.allBodies(cfg.arena.map.engine.world),
						origin = {
							x: -(cfg.arena.viewport.x - cfg.arena.viewport.half.w),
							y: -(cfg.arena.viewport.y - cfg.arena.viewport.half.h),
						};
					// loop droids and disrupt those in view
					droids.map(droid => {
						let collisions = Matter.Query.ray(bodies, origin, droid.position),
							dist = droid.position.distance(origin);
						// if nothing is in the way, disruptor
						if (collisions.length === 2 && dist < 275) {
							new Electric({ ...cfg, droid, color: "#fff" });
							// deal damage to droid
							cfg.arena.map.damageDroid(droid.body, cfg.damage);
							// shake screen on damage hit
							this.arena.viewport.addShake(.35);
						}
					});
				} else {
					let droid = cfg.arena.player;
					new Electric({ ...cfg, droid, color: "#222" });
					// deal damage to droid
					cfg.arena.map.damageDroid(droid.body, cfg.damage);
					// shake screen on damage hit
					this.arena.viewport.addShake(.25);
				}
				// play sound fx
				window.audio.play("electric");
				break;
		}
	}

	seek(target) {
		let force = target.subtract(this.position);
		force = force.setMagnitude(this.maxSpeed);
		force = force.limit(this.maxForce);
		return force;
	}

	pursue(droid) {
		let target = droid.position.clone();
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
		this.health = +xDroid.getAttribute("health");
		// full health
		this._health = +xDroid.getAttribute("health");
		// host droid reject hack speed
		let reject = 180e3; // TODO: change droid in 3 minutes
		this.APP.hud.dispatch({ type: "progress-update", reject });
		
		this.fire.name = xWeapon.getAttribute("id");
		this.fire.damage = +xWeapon.getAttribute("damage");
		this.fire.coolDown = +xWeapon.getAttribute("coolDown");

		if (this.isPlayer) {
			// reset movement forces
			for (let key in this.input) {
				this.input[key].pressed = false;
			}
			// reset transfer mode
			this.transfer.active = false;
		} else {
			let strategy = ["ignore", "evade", "shoot-if-close", "pursue-if-close", "seek-destroy"],
				value = +xDroid.getAttribute("aggression"),
				segSize = 100 / strategy.length,
				length = 150 + (value * 3),
				aggression = { value, length, segValue: 5 + (value % segSize) };
			strategy.map((e, i) => { if (!aggression.name && value < segSize * (i+1)) aggression.name = e; });
			if (!aggression.name) aggression.name = strategy[0];
			if (value === 100) aggression.name = strategy[4];
			this.aggression = aggression;
			// console.log(aggression);
		}

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
		let { id, x, y, patrol, health } = cfg,
			tile = this.arena.config.tile;
		// tile coords
		this.x = x;
		this.y = y;
		// optional values ()
		if (id) this.setId(id);
		// if plyaer & health, set health
		if (health) {
			this.health = health;
			// update player health bar
			health = this.health / this._health;
			this.APP.hud.dispatch({ type: "progress-update", health });
		}

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

	update(delta, time) {
		if (this.fire.name === "disruptor") {
			// electric gloria
			this.electric.last -= delta;
			if (this.electric.last < 0) {
				this.electric.last = (this.electric.last + this.electric.speed) % this.electric.speed;
				this.electric.angle -= .015;
				this.electric.index++;
				if (this.electric.index > 29) this.electric.index = 0;
			}
		}

		// dont move
		if (this._freeze) return;

		this.frame.last -= delta;
		if (this.frame.last < 0) {
			this.frame.last = (this.frame.last + this.frame.speed) % this.frame.speed;
			this.frame.index++;
			if (this.frame.index > 8) this.frame.index = 0;
		}

		let tile = this.arena.config.tile,
			now = Date.now();
		if (this.fire.shooting && now - this.fire.lastShot > this.fire.coolDown) {
			this.fire.lastShot = now;
			this.shoot();
		}

		if (!this.isPlayer && this.home.patrol.length > 1) {
			let hT = tile >> 1,
				pos = this.position.clone(),
				target = this.home.target,
				distance = target.distance(pos);
			
			// keep track of movement - alter weight of position in grid
			this.home.log.unshift(distance);
			this.home.log.splice(10, 1);
			let rngMin = Math.min(...this.home.log),
				rngMax = Math.max(...this.home.log),
				rng = Math.abs(rngMax - rngMin);
			if (this.home.log.length > 9 && rng <= 0.15) {
				// push away from stuck position
				let push = {
						x: this.home.force.x > 0 ? -10 : 10,
						y: this.home.force.y > 0 ? -10 : 10,
					};
				this.move(this.home.force.add(push));
				this._cornered = true;
				// reset path
				distance = 1;
			}

			// apply movement force
			this.home.force = this.home.target.subtract(pos).norm().multiply(.5);

			if (distance <= hT) {
				if (!this._path.length) this.setPath();
				let [x1, y1] = this._path.shift(),
					target = new Point(x1, y1);
				this.home.target = target.multiply(tile).subtract(hT);
			} else {
				let pDist = this.position.distance(this.arena.player.position),
					prand,
					target,
					bodies,
					ray;
				// apply aggression
				switch (this.aggression.name) {
					case "ignore":
						// do nothing - just patrol
						break;
					case "evade":
						// keep distance to player droid
						target = this.arena.player.position;
						bodies = Matter.Composite.allBodies(this.arena.map.engine.world);
						ray = Matter.Query.ray(bodies, target, this.position);
						
						if (pDist < 150) {
							if (ray.length === 2) {
								this.home.force = this.evade(this.arena.player).multiply(1 + (this.aggression.segValue / 20));
								if (!this.home._pushed) {
									this.home._pushed = true;
									this.home._backOff++;

									if (this.home._backOff > 3) {
										this.home._backOff = 0;
										// re-new patrol path
										this.setPath();
										let [x1, y1] = this._path.shift(),
											target = new Point(x1, y1);
										this.home.target = target.multiply(tile).subtract(hT);
									}
								}

								if (this._path.length > 1) {
									this._path.shift();
								}
								// if cornered, start shooting
								if (!this.fire.shooting && this._cornered) {
									this.target = target;
									this.dir = this.position.direction(this.target);
									this.fire.shooting = true;
									this.fire._start = time;
								}
							}
						} else {
							this.home._pushed = false;
						}
						if (this.fire.shooting && time - this.fire._start > this.aggression.length) {
							this.fire.shooting = false;
							delete this._cornered;
						}
						break;
					case "shoot-if-close":
						prand = Utils.prand() * 700;
						target = this.arena.player.position;
						bodies = Matter.Composite.allBodies(this.arena.map.engine.world);
						ray = Matter.Query.ray(bodies, target, this.position);
						if (pDist < 150 && !this.fire.shooting && ray.length === 2 && prand < this.aggression.segValue) {
							this.target = target;
							this.dir = this.position.direction(this.target);
							this.fire.shooting = true;
							this.fire._start = time;
						}
						if (this.fire.shooting && time - this.fire._start > this.aggression.length) {
							this.fire.shooting = false;
						}
						break;
					case "pursue-if-close":
						prand = Utils.prand() * 700;
						target = this.arena.player.position;
						bodies = Matter.Composite.allBodies(this.arena.map.engine.world);
						ray = Matter.Query.ray(bodies, target, this.position);
						if (pDist < 250 && ray.length === 2) {
							this.home.target = target;

							if (pDist < 150 && !this.fire.shooting && prand < this.aggression.segValue) {
								this.target = target;
								this.dir = this.position.direction(this.target);
								this.fire.shooting = true;
								this.fire._start = time;
							}
						}
						if (this.fire.shooting && time - this.fire._start > this.aggression.length) {
							this.fire.shooting = false;
						}
						break;
					case "seek-destroy":
						prand = Utils.prand() * 700;
						target = this.arena.player.position;
						bodies = Matter.Composite.allBodies(this.arena.map.engine.world);
						ray = Matter.Query.ray(bodies, target, this.position);

						let pathTarget = [this.arena.player.x, this.arena.player.y];
						if ((this.home.targeting || []).join() != pathTarget.join()) this.setPath();
						this.home.targeting = pathTarget;

						if (pDist < 200 && ray.length === 2) {
							if (!this.fire.shooting && prand < this.aggression.segValue) {
								this.target = target;
								this.dir = this.position.direction(this.target);
								this.fire.shooting = true;
								this.fire._start = time;
							}
						}
						if (this.fire.shooting && time - this.fire._start > this.aggression.length) {
							this.fire.shooting = false;
						}
						break;
				}
				this.move(this.home.force.clone());
			}
		}

		// console.log( this.id, this.body );
		Matter.Body.setPosition(this.body, this.position);

		// update tile position
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

		// draw path of droid
		if (arena.debug.mode > 0 && !this.isPlayer && this._path.length) {
			let tile = this.arena.config.tile,
				hT = tile >> 1,
				path = this._path.map(p => {
					return [(p[0] * tile) - hT,
					 		(p[1] * tile) - hT];
				});
			// temp draw path
			ctx.save();
			ctx.translate(arena.viewport.x, arena.viewport.y);
			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(path[0], path[1]);
			path.slice(1).map(p => ctx.lineTo(p[0], p[1]));
		    ctx.stroke();
			ctx.restore();
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

		if (this.fire.name === "disruptor" && this.fire.shooting) {
			let w = 90,
				f = w * this.electric.index;
			ctx.save();
			ctx.rotate(this.electric.angle);
			ctx.translate(-35, -35);
			ctx.shadowBlur = 0;
			// top + bottom caps
			ctx.drawImage(this.sprites.electric,
				f, 0, w, w,
				0, 0, 70, 70
			);
			ctx.restore();
		}
		
		ctx.restore();
	}
}
