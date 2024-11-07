
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
		this.w = this.width * tile;
		this.h = this.height * tile;

		// reset map arrays
		this.entries = [];
		this.droids = [this.arena.player];

		// reset level map data
		this.background = [];
		this.collision = [];

		// physics bodies array
		let bodies = [this.arena.player.body];

		// add rows
		[...Array(this.height)].map(row => this.background.push([]));
		xSection.selectNodes(`./Layer[@id="background"]/i`).map((xTile, col) => {
			let row = Math.floor(col / this.width);
			this.background[row].push(xTile.getAttribute("id"));
		});

		// console.log( this.arena.viewport );
		let vX = this.arena.viewport.half.w - (this.arena.player.x * tile) + (tile >> 1),
			vY = this.arena.viewport.half.h - (this.arena.player.y * tile) + (tile >> 1);

		this.collision = [...Array(this.height)].map(row => ([...Array(this.width)].map(i => 0)));
		xSection.selectNodes(`./Layer[@id="collision"]/i`).map(xColl => {
			let x = +xColl.getAttribute("x"),
				y = +xColl.getAttribute("y");
			this.collision[y][x] = 1;

			let bX = (x * tile) + vX,
				bY = (y * tile) + vY;
			bodies.push(Matter.Bodies.rectangle(bX, bY, tile, tile, { isStatic: true }));
		});

		// physics setup
		Matter.Composite.add(this.engine.world, bodies);

		// run the engine
		Matter.Runner.run(this.runner, this.engine);
	}

	update(delta) {
		
	}

	render(ctx) {
		let assets = this.arena.assets,
			tile = this.arena.config.tile,
			viewport = this.arena.viewport,
			vX = viewport.x - viewport.half.w,
			vY = viewport.y - viewport.half.h,
			xMin = Math.floor(vX / tile),
			yMin = Math.floor(vY / tile),
			xMax = Math.ceil((vX + viewport.w) / tile),
			yMax = Math.ceil((vY + viewport.h) / tile);

		if (xMin < 0) xMin = 0;
		if (yMin < 0) yMin = 0;
		if (xMax > this.width) xMax = this.width;
		if (yMax > this.height) yMax = this.height;

		// normal draw if debug mode is < 3
		if (this.arena.debug.mode < 3) {
			ctx.save();
			// ctx.translate(viewport.half.w, viewport.half.h);

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

			ctx.restore();
		}
	}
}
