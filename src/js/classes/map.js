
class Map {
	constructor(cfg) {
		let { arena } = cfg;

	    this.arena = arena;
	    this.data = {
	    	droids: [],
	    	tiles: {
	    		"m2a": { wall: true },
	    		"m3a": { wall: true },
	    	},
	    };

		// sample droid
		// this.data.droids.push(new Droid({ arena, id: "247", x: 6, y: 4 }));
	}

	setState(state) {
		let { id, droids } = state,
			size = this.arena.tiles.size,
			xSection = window.bluePrint.selectSingleNode(`//Data/Section[@id="${id}"]`);
		// dimensions of this level map
		this.width = +xSection.getAttribute("width");
		this.height = +xSection.getAttribute("height");
		this.w = this.width * size;
		this.h = this.height * size;
		
		// reset level map data
		this.background = [];
		this.collision = [];

		// add rows
		[...Array(this.height)].map(row => this.background.push([]));

		xSection.selectNodes(`./Layer[@id="background"]/i`).map((xTile, col) => {
			let row = Math.floor(col / this.width);
			this.background[row].push(xTile.getAttribute("id"));
		});

		this.collision = [...Array(this.height)].map(row => ([...Array(this.width)].map(i => 0)));
		xSection.selectNodes(`./Layer[@id="collision"]/i`).map(xColl => {
			let x = xColl.getAttribute("x"),
				y = xColl.getAttribute("y");
			this.collision[y][x] = 1;
		});
		// console.log(this.collision.join("\n"));

		// update droids array
		this.data.droids = droids.map(d => new Droid({ arena: this.arena, ...d }));
	}

	update(delta) {
		this.data.droids.map(droid => droid.update(delta));
	}

	render(ctx) {
		let assets = this.arena.assets,
			size = this.arena.tiles.size,
			viewport = this.arena.viewport,
			xMin = Math.floor(viewport.x / size),
			yMin = Math.floor(viewport.y / size),
			xMax = Math.ceil((viewport.x + viewport.w) / size),
			yMax = Math.ceil((viewport.y + viewport.h) / size),
			vX = viewport.x + ((this.arena.width - viewport.w) >> 1),
			vY = viewport.y + ((this.arena.height - viewport.h) >> 1);

		if (xMin < 0) xMin = 0;
		if (yMin < 0) yMin = 0;
		if (xMax > this.width) xMax = this.width;
		if (yMax > this.height) yMax = this.height;

		for (let y = yMin; y < yMax; y++) {
			for (let x = xMin; x < xMax; x++) {
				let col = this.background[y][x];
				if (!col) continue;

				let [a, t, l] = col.split("").map(i => parseInt(i, 16)),
					oX = l * size,
					oY = t * size,
					tX = Math.round((x * size) - vX),
					tY = Math.round((y * size) - vY);

				ctx.drawImage(
					assets["big-map"].img,
					oX, oY, size, size,
					tX, tY, size, size
				);
			}
		}
		// draw droids
		this.data.droids.map(droid => droid.render(ctx));

		// if debug mode on, draw extras
		if (this.arena.debug.on) {

		}
	}
}
