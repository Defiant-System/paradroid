
class Map {
	constructor(cfg) {
		let { arena } = cfg;
		// parent object
	    this.arena = arena;
	    // items on the map
	    this.entries = [];
	}

	setState(state) {
		let size = this.arena.tiles.size,
			xSection = window.bluePrint.selectSingleNode(`//Data/Section[@id="${state.id}"]`);
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

		// add item classses
		xSection.selectNodes(`./Layer[@id="action"]/i`).map((xItem, index) => {
			let x = +xItem.getAttribute("x"),
				y = +xItem.getAttribute("y"),
				w = +xItem.getAttribute("w"),
				h = +xItem.getAttribute("h"),
				action = xItem.getAttribute("action");
			switch (action) {
				case "door-h":
				case "door-v":
					let type = action.split("-")[1];
					this.entries.push(new Door({ arena: this.arena, type, x, y, w, h }));
					break;
				case "recharge":
					this.entries.push(new Recharge({ arena: this.arena, x, y, w, h }));
					break;
			}
		});
	}

	update(delta) {
		this.entries.map(item => item.update(delta));
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

		// normal draw if debug mode is < 3
		if (this.arena.debug.mode < 3) {
			for (let y = yMin; y < yMax; y++) {
				for (let x = xMin; x < xMax; x++) {
					let col = this.background[y][x];
					if (!col) continue;

					let [a, t, l] = col.split("").map(i => parseInt(i, 16)),
						oX = Math.round(l * size),
						oY = Math.round(t * size),
						tX = Math.round((x * size) - vX),
						tY = Math.round((y * size) - vY);

					ctx.drawImage(
						assets["big-map"].img,
						oX, oY, size, size,
						tX, tY, size, size
					);
				}
			}
		}

		// draw entries
		this.entries.map(entry => {
			if (entry.x >= xMin-1 && entry.x <= xMax && entry.y >= yMin-1 && entry.y <= yMax) entry.render(ctx);
		});

		// if debug mode on, draw walls / extras
		if (this.arena.debug.mode > 0) {
			ctx.save();
			ctx.fillStyle = "#00000066";
			this.arena.map.collision.map((row, cY) => {
				row.map((cell, cX) => {
					let wX = Math.round((cX * size) - viewport.x),
						wY = Math.round((cY * size) - viewport.y);
					if (cell > 0) ctx.fillRect(wX, wY, size, size);
				});
			});
			ctx.restore();
		}
	}
}
