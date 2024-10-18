
class Map {
	constructor(cfg) {
	    this.arena = cfg.arena;
	    this.data = {};

	    let img = new Image;
	    img.src = cfg.map;
	    img.onload = () => {
	    	this._img = img;
	    	if (typeof cfg.ready === "function") cfg.ready();
	    };
	}

	layout(id) {
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
	}

	update() {
		
	}

	render(ctx) {
		let win = this.arena.win,
			size = this.arena.tiles.size,
			viewport = this.arena.viewport;
		let x_min = Math.floor(viewport.x / size);
		let y_min = Math.floor(viewport.y / size);
		let x_max = Math.ceil((viewport.x + viewport.w) / size);
		let y_max = Math.ceil((viewport.y + viewport.h) / size);

		if (x_min < 0) x_min = 0;
		if (y_min < 0) y_min = 0;
		if (x_max > this.width) x_max = this.width;
		if (y_max > this.height) y_max = this.height;

		ctx.fillStyle = "red";
		ctx.fillRect(20, 20, size, size);

		for (let y = y_min; y < y_max; y++) {
			for (let x = x_min; x < x_max; x++) {
				// let value  = this.layout[y][x] - 1;
				// let tile_x = Math.floor((x * config.size.tile) - viewport.x + (config.win.width / 2) - (viewport.w / 2));
				// let tile_y = Math.floor((y * config.size.tile) - viewport.y + (config.win.height / 2) - (viewport.h / 2));

				let [a,t,l] = this.layout[y][x].split("").map(i => parseInt(i, 16)),
					o_x = l * size,
					o_y = t * size,
					tile_x = Math.floor((x * size) - viewport.x + (win.width / 2) - (viewport.w / 2)),
					tile_y = Math.floor((y * size) - viewport.y + (win.height / 2) - (viewport.h / 2));

				ctx.drawImage(
					this._img,
					o_x,
					o_y,
					size,
					size,
					tile_x,
					tile_y,
					size,
					size
				);
			}
		}
	}
}
