
class Map {
	constructor(cfg) {
		let { arena } = cfg;

	    this.arena = arena;
	    this.data = {
	    	droids: [],
	    };

		// sample droid
		this.data.droids.push(new Droid({ arena, id: "247", x: 6, y: 4 }));
	}

	setState(state) {
		let { id, droids } = state;
		let xLevel = window.bluePrint.selectSingleNode(`//Data/Level[@id="${id}"]`);
		// dimensions of this level map
		this.width = +xLevel.getAttribute("width");
		this.height = +xLevel.getAttribute("height");
		
		// reset level map layout
		this.layout = [];

		// add rows
		[...Array(this.height)].map(row => this.layout.push([]));

		xLevel.selectNodes(`./i`).map((xTile, col) => {
			let row = Math.floor(col / this.width);
			this.layout[row].push(xTile.getAttribute("id"));
		});

		// update droids array
		this.droids = droids;
	}

	update(delta) {
		this.data.droids.map(droid => droid.update(delta));
	}

	render(ctx) {
		let win = this.arena.win,
			assets = this.arena.assets,
			size = this.arena.tiles.size,
			viewport = this.arena.viewport,
		
			x_min = Math.floor(viewport.x / size),
			y_min = Math.floor(viewport.y / size),
			x_max = Math.ceil((viewport.x + viewport.w) / size),
			y_max = Math.ceil((viewport.y + viewport.h) / size);

		if (x_min < 0) x_min = 0;
		if (y_min < 0) y_min = 0;
		if (x_max > this.width) x_max = this.width;
		if (y_max > this.height) y_max = this.height;
        // console.log( viewport.x, viewport.y );

		for (let y = y_min; y < y_max; y++) {
			for (let x = x_min; x < x_max; x++) {
				let col = this.layout[y][x];
				if (!col) continue;

				let [a, t, l] = col.split("").map(i => parseInt(i, 16)),
					oX = l * size,
					oY = t * size,
					tX = Math.floor((x * size) - viewport.x + (win.width / 2) - (viewport.w / 2)),
					tY = Math.floor((y * size) - viewport.y + (win.height / 2) - (viewport.h / 2));

				ctx.drawImage(
					assets["big-map"].img,
					oX, oY, size, size,
					tX, tY, size, size
				);
			}
		}

		// draw droids
		this.data.droids.map(droid => droid.render(ctx));
	}
}
