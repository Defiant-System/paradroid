
class Map {
	constructor(cfg) {
		let { arena } = cfg;
		// parent object
		this.arena = arena;
		// items on the map
		this.entries = [];
		this.droids = [];

		// init visibility engine
		this.raycaster = Raycaster.init();

		// physics engine
		this.engine = Matter.Engine.create({ gravity: { x: 0, y: 0, scale: 1 } });
		// create runner
		this.runner = Matter.Runner.create();
		// event handler
		Matter.Events.on(this.engine, "collisionStart", event => {
			// console.log( event );
			event.pairs.map(pair => {
				let [a1, b1] = pair.bodyA.label.split("-"),
					[a2, b2] = pair.bodyB.label.split("-");
				if (a1 === "fire") {
					let index = this.entries.findIndex(e => e.bullet == +b1),
						damage = 0;
					if (index > -1) {
						let entry = this.entries.splice(index, 1)[0],
							{ arena, owner } = entry,
							{ x, y } = pair.collision.supports[0];
						new Sparks({ arena, owner, x, y });
						// weapon damage value
						damage = owner.fire.damage;
					}
					Matter.Composite.remove(this.engine.world, pair.bodyA);
					if (["player", "droid"].includes(a2)) this.damageDroid(pair.bodyB, damage);
				}
				if (a2 === "fire") {
					let index = this.entries.findIndex(e => e.bullet == +b2),
						damage = 0;
					if (index > -1) {
						let entry = this.entries.splice(index, 1)[0],
							{ arena, owner } = entry,
							{ x, y } = pair.collision.supports[0];
						new Sparks({ arena, owner, x, y });
						// weapon damage value
						damage = owner.fire.damage;
					}
					Matter.Composite.remove(this.engine.world, pair.bodyB);
					if (["player", "droid"].includes(a1)) this.damageDroid(pair.bodyA, damage);
				}
				if (a1 === a2 && a1 === "droid") {
					this.changeDroidPath([pair.bodyA, pair.bodyB]);
				}
			});
		});
	}

	changeDroidPath(collided=[]) {
		collided.map(body => {
			let droid = this.droids.filter(item => item.body === body);
			if (droid.length && !droid[0].isPlayer) droid[0].setPath();
		});
 	}

	damageDroid(body, value) {
		let droid = this.droids.filter(item => item.body === body);
		if (droid.length) droid[0].dealDamage(value);
 	}

	addItem(item) {
		// add entity to entries list
		this.entries.push(item);
		// add item body to physical world
		if (item.body) Matter.Composite.add(this.engine.world, item.body);
	}

	mapUpdate() {
		let xPath = `//Data/Section[@level="${this.xSection.getAttribute("level")}"]`,
			// keep track of droid count
			total = window.bluePrint.selectNodes(`${xPath}/Layer[@id="droids"]/i`).length,
			alive = window.bluePrint.selectNodes(`${xPath}/Layer[@id="droids"]/i[not(@dead)]`).length,
			level = alive / total;
		// update progress bar for level droid count
		paradroid.hud.dispatch({ type: "progress-update", level });
	}

	setState(state) {
		let tile = this.arena.config.tile,
			xSection = window.bluePrint.selectSingleNode(`//Data/Section[@id="${state.id}"]`),
			section = { id: xSection.getAttribute("id") };
		// keep reference to nodes
		this.xSection = xSection;
		// dimensions of this level map
		this.width = +xSection.getAttribute("width");
		this.height = +xSection.getAttribute("height");

		// set player droid section
		this.arena.player.section = section;

		// empty physical world
		Matter.Composite.clear(this.engine.world);

		// save reference to active map
		this.id = state.id;

		// reset map arrays
		this.entries = [];
		this.grid = [];
		this.droids = [this.arena.player];
		this.tiles = []; // level map tiles
		this.background = []; // level map data

		// physics bodies array
		let bodies = [this.arena.player.body],
			backgrounds = xSection.selectNodes(`./Layer[@id="background"]/i`),
			doors = {
				"m02": [[0,0],[2,2]],
				"m03": [[0,0],[2,2]],
				"m04": [[0,2],[0,2]],
				"m05": [[2,0],[2,0]],
				"m12": [[2,2],[0,0]],
				"m13": [[2,2],[0,0]],
				"m14": [[0,2],[0,2]],
				"m15": [[2,0],[2,0]],
			},
			gap = [
				"m00", "m01", "m02", "m03", "m04", "m05", "m06", "m07",
				"m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17",
				"m42", "m43", "m45", "m46", "m48", "m49", "m4a", "m4b",
				"m50", "m51", "m55", "m56", "m58", "m59", "m5a", "m5b",
				"m60", "m61", "m62", "m63", "m64", "m67", "m6c", "m6d",
				"m6e", "m6f", "m70", "m71", "m72", "m73", "m7c", "m7d",
				"m7e", "m7f"
			];

		// grid for astar algorithm
		let w2 = this.width * 2,
			h2 = this.height * 2;
		[...Array(h2)].map(row => this.grid.push([]));
		backgrounds.map((xTile, col) => {
			let id = xTile.getAttribute("id"),
				row = Math.floor(col / this.width) * 2,
				group = !!doors[id] ? doors[id] : gap.includes(id) ? [[1,1],[1,1]] : [[0,0],[0,0]];
			// if (id === "m02") console.log( group );
			this.grid[row].push(...group[0]);
			this.grid[row+1].push(...group[1]);
		});
		// console.log( "\n"+ this.grid.join("\n") );

		// add rows
		[...Array(this.height)].map(row => {
			this.tiles.push([]);
			this.background.push([]);
		});
		backgrounds.map((xTile, col) => {
			let row = Math.floor(col / this.width),
				tile = xTile.getAttribute("id"),
				arg = [];
			if (tile) {
				let [a, t, l] = tile.split("");
				arg = [a, parseInt(t, 16), parseInt(l, 16)];
			}
			this.tiles[row].push(tile);
			this.background[row].push(arg);
		});

		// walls for matter.js
		xSection.selectNodes(`./Layer[@id="collision"]/i`).map(xColl => {
			let id = xColl.getAttribute("id"),
				x = +xColl.getAttribute("x"),
				y = +xColl.getAttribute("y"),
				w = +xColl.getAttribute("w"),
				h = +xColl.getAttribute("h"),
				vertices,
				body;
			switch (id) {
				case "c1":
					body = Matter.Bodies.rectangle(x, y, w, h, { isStatic: true });
					break;
				case "c4":
					body = Matter.Bodies.rectangle(x, y, w, h, { isStatic: true, chamfer: { radius: 6 } });
					break;
				case "c5":
					vertices = [{ x: 42, y: 0 }, { x: 42, y: 42 }, { x: 0, y: 42 }];
					body = Matter.Bodies.fromVertices(x, y, vertices, { isStatic: true });
					break;
				case "c6":
					vertices = [{ x: 0, y: 0 }, { x: 0, y: 42 }, { x: 42, y: 42 }];
					body = Matter.Bodies.fromVertices(x, y, vertices, { isStatic: true });
					break;
			}
			// set friction of "walls" to zero
			body.friction = 0;
			// add body to bodies list
			bodies.push(body);
		});

		// lights
		this.lights = xSection.selectNodes(`./Layer[@id="lights"]/*`).map(xLight => ({
			tX: +xLight.getAttribute("x") / tile,
			tY: +xLight.getAttribute("y") / tile,
			x: +xLight.getAttribute("x"),
			y: +xLight.getAttribute("y"),
			r: +xLight.getAttribute("r"),
		}));

		// raycaster options
		this.rcConf = {
				floor: this.arena.debug.mode >= 1 ? 1 : 0,
				walls: this.arena.debug.mode == .5 ? 1 : 0,
				clip: this.arena.debug.mode == 0 ? 1 : 0,
			};

		// Line of Sight
		this.walls = [];
		xSection.selectNodes(`./Layer[@id="los"]/walls`).map(xWall => {
			let vertices = [],
				xSegments = xWall.selectNodes("./i");
			xSegments.map((xSeg, i) => {
				let vx = +xSeg.getAttribute("x"),
					vy = +xSeg.getAttribute("y"),
					vw = +xSeg.getAttribute("w"),
					vh = +xSeg.getAttribute("h");
				switch (xSeg.getAttribute("d")) {
					case "0": break;  // up
					case "1": vx += vw - 2; break;  // left
					case "2": vy += vh - 2; break;  // down
					case "3": break;  // right
					case ".5": // -45deg
						vx = +xSegments[i+1].getAttribute("x");
						vy = +xSegments[i+1].getAttribute("y");
						break;
					case "1.5": // 45deg
						vx = +xSegments[i+1].getAttribute("x");
						vy = +xSegments[i+1].getAttribute("y");
						break;
				}
				if (xSeg.getAttribute("d") === "3" && xSegments[i-1].getAttribute("d") === "1.5") {
					vy += vh;
				}
				vertices.push([vx, vy]);
			});
			if (vertices) this.walls.push(vertices);
		});
		// console.log( this.walls[0] );

		// add item classses
		xSection.selectNodes(`./Layer[@id="action"]/i`).map(xItem => {
			let x = +xItem.getAttribute("x"),
				y = +xItem.getAttribute("y"),
				w = +xItem.getAttribute("w"),
				h = +xItem.getAttribute("h"),
				id = xItem.getAttribute("id"),
				action = xItem.getAttribute("action");
			// console.log( section );
			switch (action) {
				case "door-h":
				case "door-v":
					let type = action.split("-")[1];
					this.entries.push(new Door({ arena: this.arena, section, type, x, y }));
					break;
				case "exit":
					this.entries.push(new Exit({ arena: this.arena, section, x, y }));
					break;
				case "console":
					this.entries.push(new Console({ arena: this.arena, section, x, y }));
					break;
				case "recharge":
					this.entries.push(new Recharge({ arena: this.arena, section, x, y }));
					break;
			}
		});

		// disable droids if stated dead
		if (state.dead) {
			xSection.selectNodes(`./Layer[@id="droids"]/i[@patrol != ""]`).map(xItem => {
				let nr = +xItem.getAttribute("nr");
				if (state.dead.includes(nr)) xItem.setAttribute("dead", "1");
			});
		}
		// add droids
		xSection.selectNodes(`./Layer[@id="droids"]/i[@patrol != ""][not(@dead)]`).map(xItem => {
			let id = xItem.getAttribute("id"),
				patrol = JSON.parse(xItem.getAttribute("patrol")),
				droid = new Droid({ arena: this.arena, section, id, xItem, patrol });
			// add droid to map droid list
			this.droids.push(droid);
			// add droid body to physical world
			bodies.push(droid.body);
		});

		// physics setup
		Matter.Composite.add(this.engine.world, bodies);
		// run the engine
		// Matter.Runner.run(this.runner, this.engine);
		
		// keep track of droid count
		this.mapUpdate();
	}

	update(delta, time) {
		this.entries.map(item => item.update(delta, time));
		this.droids.map(droid => droid.update(delta, time));

		// Raycaster: visibility map
		let arena = this.arena,
			m = 0,
			{ w, h, x, y } = arena.viewport,
			walls = [];
		this.walls.map(verts => {
			let wall = [];
			verts.map(v => wall.push([x + v[0], y + v[1]]));
			if (wall.length) walls.push(wall);
		});

		this.entries.filter(i => i.name === "door").map(item => {
			let wall = [];
			item.vertices.map(v => wall.push([x + v[0], y + v[1]]))
			// console.log(item.name);
			if (wall.length) walls.push(wall);
		});

		// turn on "floor lights", if base color is "gray"
		this.rcConf.floor = arena.colors.base === "#555";

		let pos = arena.player.position,
			origo = {
				x: x + pos.x,
				y: y + pos.y,
			};
		this.raycaster.loadMap(walls, origo);
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport,
			tile = arena.config.tile,
			debug = arena.debug.mode,
			hT = tile >> 1,
			vX = hT - viewport.x,
			vY = hT - viewport.y,
			xMin = Math.floor(vX / tile),
			yMin = Math.floor(vY / tile),
			xMax = Math.ceil((vX + viewport.w) / tile),
			yMax = Math.ceil((vY + viewport.h) / tile);

		if (xMin < 0) xMin = 0;
		if (yMin < 0) yMin = 0;
		if (xMax > this.width) xMax = this.width;
		if (yMax > this.height) yMax = this.height;

		// normal draw if debug mode is < 2
		if (debug < 2) {
			for (let y=yMin; y<yMax; y++) {
				for (let x=xMin; x<xMax; x++) {
					let col = this.background[y][x],
						bgt = this.tiles[y][x];
					if (!col) continue;

					let [a, t, l] = col,
						oX = Math.floor(l * tile),
						oY = Math.floor(t * tile),
						tX = Math.floor((x * tile) - vX),
						tY = Math.floor((y * tile) - vY);

					ctx.drawImage(
						arena.bgAsset.img,
						oX, oY, tile, tile,
						tX, tY, tile, tile
					);
					if (arena.led.floor) {
						let ledIndex = arena.led.tiles.indexOf(bgt);
						if (ledIndex > -1) {
							let [lx, ly, lw, lh] = arena.led.tileMap[Math.floor(ledIndex/6)];
							arena.led.ctx.drawImage(
								arena.bgAsset.img,
								lx, ly, lw, lh,
								tX, tY, lw, lh
							);
						}
					}
				}
			}

			if (debug >= 1) {
				ctx.save();
				ctx.fillStyle = "#6f62";
				for (let y=yMin; y<yMax; y++) {
					for (let x=xMin; x<xMax; x++) {
						let tY = (y * 2) + 0;
						let tX = (x * 2) + 0;
						if (this.grid[tY][tX] > 0) {
							let gX = (tX * hT) - vX;
							let gY = (tY * hT) - vY;
							ctx.fillRect(gX, gY, hT, hT);
						}
						tY = (y * 2) + 0;
						tX = (x * 2) + 1;
						if (this.grid[tY][tX] > 0) {
							let gX = (tX * hT) - vX;
							let gY = (tY * hT) - vY;
							ctx.fillRect(gX, gY, hT, hT);
						}
						tY = (y * 2) + 1;
						tX = (x * 2) + 0;
						if (this.grid[tY][tX] > 0) {
							let gX = (tX * hT) - vX;
							let gY = (tY * hT) - vY;
							ctx.fillRect(gX, gY, hT, hT);
						}
						tY = (y * 2) + 1;
						tX = (x * 2) + 1;
						if (this.grid[tY][tX] > 0) {
							let gX = (tX * hT) - vX;
							let gY = (tY * hT) - vY;
							ctx.fillRect(gX, gY, hT, hT);
						}
					}
				}
				ctx.restore();
			}
		}

		// draw entries - exclude droids
		this.entries
			.filter(entry => !entry.id && !entry._fx && entry.x >= xMin-1 && entry.x <= xMax && entry.y >= yMin-1 && entry.y <= yMax)
			.map(entry => entry.render(ctx));

		// visibility map mask
		ctx.save();
		this.raycaster.render(ctx, this.rcConf);
		if (debug < 1) {
			if (arena.led.floor) {
				ctx.save();
				ctx.globalCompositeOperation = "lighter";
				ctx.filter = "blur(7px)";
				ctx.drawImage(arena.led.cvs[0], 0, 0);
				ctx.filter = "opacity(.65)";
				ctx.drawImage(arena.led.cvs[0], 0, 0);
				ctx.restore();
			} else {
				// lights
				this.lights
					.filter(light => light.tX >= xMin-1 && light.tX <= xMax && light.tY >= yMin-1 && light.tY <= yMax)
					.map(light => {
						let lX = light.x - vX,
							lY = light.y - vY,
							r = 130 * light.r,
							r2 = r >> 1,
							gradient = ctx.createRadialGradient(lX, lY, 0, lX, lY, r);
						gradient.addColorStop(0.0, "#fff4");
						gradient.addColorStop(0.5, "#fff0");
						gradient.addColorStop(1.0, "#fff0");
						ctx.fillStyle = gradient;
						ctx.fillRect(lX-r2, lY-r2, r, r);
					});
			}
		}
		// now render droids (with mask clip)
		this.droids
			.filter(droid => !droid.isPlayer && droid.x >= xMin-1 && droid.x <= xMax && droid.y >= yMin-1 && droid.y <= yMax)
			.map(droid => droid.render(ctx));
		// restore drawing context
		ctx.restore();

		// player droid
		if (arena.player.health > 0) arena.player.render(ctx);

		// now render fx layer
		this.entries
			.filter(entry => entry._fx)
			.map(entry => entry.render(ctx));
	}
}
