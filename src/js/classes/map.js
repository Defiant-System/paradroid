
class Map {
	constructor(cfg) {
		let { arena } = cfg;
		// parent object
		this.arena = arena;
		// items on the map
		this.entries = [];
		this.droids = [];

		// physics engine
		this.engine = Matter.Engine.create({ gravity: { x: 0, y: 0, scale: 1 } });
		// create runner
		this.runner = Matter.Runner.create();
	}

	setState(state) {
		let tile = this.arena.config.tile,
			xSection = window.bluePrint.selectSingleNode(`//Data/Section[@id="${state.id}"]`);
		// dimensions of this level map
		this.width = +xSection.getAttribute("width");
		this.height = +xSection.getAttribute("height");

		// empty physical world
		Matter.Composite.clear(this.engine.world);

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

		// walls
		xSection.selectNodes(`./Layer[@id="collision"]/i`).map(xColl => {
			let x = +xColl.getAttribute("x") * tile,
				y = +xColl.getAttribute("y") * tile;
			bodies.push(Matter.Bodies.rectangle(x, y, tile, tile, { isStatic: true }));
		});

		// add item classses
		xSection.selectNodes(`./Layer[@id="action"]/i`).map((xItem, index) => {
			let x = +xItem.getAttribute("x"),
				y = +xItem.getAttribute("y"),
				w = +xItem.getAttribute("w"),
				h = +xItem.getAttribute("h"),
				id = xItem.getAttribute("id"),
				action = xItem.getAttribute("action");
			// console.log( action );
			switch (action) {
				case "door-h":
				case "door-v":
					let type = action.split("-")[1];
					this.entries.push(new Door({ arena: this.arena, type, x, y }));
					break;
				case "exit":
					this.entries.push(new Exit({ arena: this.arena, x, y }));
					break;
				case "console":
					this.entries.push(new Console({ arena: this.arena, x, y }));
					break;
				case "recharge":
					this.entries.push(new Recharge({ arena: this.arena, x, y }));
					break;
				case "droid":
					break;
			}
		});

		// physics setup
		Matter.Composite.add(this.engine.world, bodies);

		// run the engine
		Matter.Runner.run(this.runner, this.engine);
	}

	update(delta) {
		this.entries.map(item => item.update(delta));
	}

	render(ctx) {
		let assets = this.arena.assets,
			viewport = this.arena.viewport,
			tile = this.arena.config.tile,
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

		// draw entries - exclude droids
		this.entries
			.filter(entry => !entry.id && entry.x >= xMin-1 && entry.x <= xMax && entry.y >= yMin-1 && entry.y <= yMax)
			.map(entry => entry.render(ctx));
		
		// normal draw if debug mode is < 2
		if (this.arena.debug.mode < 2) {
			// ctx.save();
			// ctx.translate(vX, vY);

			for (let y = yMin; y < yMax; y++) {
				for (let x = xMin; x < xMax; x++) {
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

			// ctx.restore();
		}
	}
}
