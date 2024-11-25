
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
	}

	setState(state) {
		let tile = this.arena.config.tile,
			xSection = window.bluePrint.selectSingleNode(`//Data/Section[@id="${state.id}"]`),
			section = { id: xSection.getAttribute("id") };
		// dimensions of this level map
		this.width = +xSection.getAttribute("width");
		this.height = +xSection.getAttribute("height");

		// empty physical world
		Matter.Composite.clear(this.engine.world);

		// save reference to active map
		this.id = state.id;

		// reset map arrays
		this.entries = [];
		this.droids = [this.arena.player];
		this.background = []; // level map data

		// physics bodies array
		let bodies = [this.arena.player.body];

		// add rows
		[...Array(this.height)].map(row => this.background.push([]));
		xSection.selectNodes(`./Layer[@id="background"]/i`).map((xTile, col) => {
			let row = Math.floor(col / this.width);
			this.background[row].push(xTile.getAttribute("id"));
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
			x: +xLight.getAttribute("x"),
			y: +xLight.getAttribute("y"),
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
				vx, vy, vw, vh;
			xWall.selectNodes("./i").map((xSeg, i) => {
				if (i === 0) {
					vx = +xSeg.getAttribute("x");
					vy = +xSeg.getAttribute("y");
					vertices.push([vx, vy]);
				}
				vw = +xSeg.getAttribute("w");
				vh = +xSeg.getAttribute("h");
				
				switch (xSeg.getAttribute("d")) {
					case "0": vy -= vh; break;  // up
					case "1": vx += vw; break;  // left
					case "2": vy += vh; break;  // down
					case "3": vx -= vw; break;  // right
				}
				vertices.push([vx, vy]);
			});
			if (vertices) this.walls.push(vertices);
		});
		console.log( this.walls[0] );

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
			this.droids.push(droid);
			// add droid body to physical world
			bodies.push(droid.body);
		});

		// physics setup
		Matter.Composite.add(this.engine.world, bodies);
		// run the engine
		Matter.Runner.run(this.runner, this.engine);
	}

	update(delta) {
		this.entries.map(item => item.update(delta));
		this.droids.map(droid => droid.update(delta));

		// Raycaster: visibility map
		let viewport = this.arena.viewport,
			m = 0,
			{ w, h, x, y } = viewport,
			walls = [];
		this.walls.map(verts => {
			let wall = [];
			verts.map(v => wall.push([x + v[0], y + v[1]]));
			if (wall.length) walls.push(wall);
		});

		let pos = this.arena.player.position,
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

					let [a, t, l] = col.split("").map(i => parseInt(i, 16)),
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
			this.lights.map(light => {
				let lX = light.x - vX,
					lY = light.y - vY,
					r = 150,
					r2 = r >> 1,
					gradient = ctx.createRadialGradient(lX, lY, 0, lX, lY, r);
				gradient.addColorStop(0.0, "#fff4");
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
	}
}
