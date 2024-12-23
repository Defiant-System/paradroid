
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
					let index = this.entries.findIndex(e => e.bullet == +b1);
					if (index > -1) {
						let entry = this.entries.splice(index, 1)[0],
							{ arena, owner } = entry,
							{ x, y } = pair.collision.supports[0];
						new Sparks({ arena, owner, x, y });
					}
					Matter.Composite.remove(this.engine.world, pair.bodyA);
				}
				if (a2 === "fire") {
					let index = this.entries.findIndex(e => e.bullet == +b2);
					if (index > -1) {
						let entry = this.entries.splice(index, 1)[0],
							{ arena, owner } = entry,
							{ x, y } = pair.collision.supports[0];
						new Sparks({ arena, owner, x, y });
					}
					Matter.Composite.remove(this.engine.world, pair.bodyB);
				}
			});
		});
	}

	setState(state) {
		let tile = this.arena.config.tile,
			xSection = window.bluePrint.selectSingleNode(`//Data/Section[@id="${state.id}"]`),
			section = { id: xSection.getAttribute("id") };
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
		this.background = []; // level map data

		// physics bodies array
		let bodies = [this.arena.player.body],
			backgrounds = xSection.selectNodes(`./Layer[@id="background"]/i`),
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
		[...Array(this.height)].map(row => this.grid.push([]));
		backgrounds.map((xTile, col) => {
			let row = Math.floor(col / this.width),
				cell = gap.includes(xTile.getAttribute("id")) ? 1 : 0;
			this.grid[row].push(cell);
		});
		// console.log( this.grid.join("\n") );

		// add rows
		[...Array(this.height)].map(row => this.background.push([]));
		backgrounds.map((xTile, col) => {
			let row = Math.floor(col / this.width),
				tile = xTile.getAttribute("id"),
				arg = [];
			if (tile) {
				let [a, t, l] = tile.split("");
				arg = [a, parseInt(t, 16), parseInt(l, 16)];
			}
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

		// add droids
		xSection.selectNodes(`./Layer[@id="droids"]/i`).map(xItem => {
			let id = xItem.getAttribute("id"),
				patrol = JSON.parse(xItem.getAttribute("patrol")),
				droid = new Droid({ arena: this.arena, section, id, patrol });
			// add droid to map droid list
			this.droids.push(droid);
			// plot droid patrol path
			droid.setPath();
			// add droid body to physical world
			bodies.push(droid.body);
		});

		// physics setup
		Matter.Composite.add(this.engine.world, bodies);
		// run the engine
		// Matter.Runner.run(this.runner, this.engine);
	}

	addItem(item) {
		// add entity to entries list
		this.entries.push(item);
		// add item body to physical world
		if (item.body) Matter.Composite.add(this.engine.world, item.body);
	}

	update(delta) {
		this.entries.map(item => item.update(delta));
		this.droids.map(droid => droid.update(delta));

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
		let assets = this.arena.assets,
			viewport = this.arena.viewport,
			tile = this.arena.config.tile,
			debug = this.arena.debug.mode,
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
					let col = this.background[y][x];
					if (!col) continue;

					let [a, t, l] = col,
						oX = Math.floor(l * tile),
						oY = Math.floor(t * tile),
						tX = Math.floor((x * tile) - vX),
						tY = Math.floor((y * tile) - vY);

					ctx.drawImage(
						assets["big-map"].img,
						oX, oY, tile, tile,
						tX, tY, tile, tile
					);
				}
			}
		}

		// draw entries - exclude droids
		this.entries
			.filter(entry => !entry.id && entry.x >= xMin-1 && entry.x <= xMax && entry.y >= yMin-1 && entry.y <= yMax)
			.map(entry => entry.render(ctx));

		// visibility map mask
		ctx.save();
		this.raycaster.render(ctx, this.rcConf);
		if (debug < 1) {
			// lights
			this.lights
				.filter(light => light.tX >= xMin-1 && light.tX <= xMax && light.tY >= yMin-1 && light.tY <= yMax)
				.map(light => {
					let lX = light.x - vX,
						lY = light.y - vY,
						r = 120 * light.r,
						r2 = r >> 1,
						gradient = ctx.createRadialGradient(lX, lY, 0, lX, lY, r);
					gradient.addColorStop(0.0, "#fff3");
					gradient.addColorStop(0.5, "#fff0");
					gradient.addColorStop(1.0, "#fff0");
					ctx.fillStyle = gradient;
					ctx.fillRect(lX-r2, lY-r2, r, r);
				});
		}
		// now render droids (with mask clip)
		this.droids
			.filter(droid => !droid.isPlayer && droid.x >= xMin-1 && droid.x <= xMax && droid.y >= yMin-1 && droid.y <= yMax)
			.map(droid => droid.render(ctx));
		// restore drawing context
		ctx.restore();

		// player droid
		this.arena.player.render(ctx);

		// now render fx layer
		this.entries
			.filter(entry => entry._fx)
			.map(entry => entry.render(ctx));
	}
}
