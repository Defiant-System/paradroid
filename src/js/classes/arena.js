
class Arena {
	constructor(cvs) {
		this.win = {
			width: window.innerWidth,
			height: window.innerHeight,
		};
		// files config
		this.tiles = {
			map: "~/img/tiles-big.png",
			size: 64,
			char: 96,
			ready: () => this.render(),
		};
		this.tiles.x = Math.ceil(this.win.width / this.tiles.size) + 2;
		this.tiles.y = Math.ceil(this.win.height / this.tiles.size) + 2;

		this.center = {
			x: Math.round(this.win.width / this.tiles.size) / 2,
			y: Math.round(this.win.height / this.tiles.size) / 2,
		};
		this.speed = 5;

		// set dimensions of canvas
		let { width, height } = cvs.offset();
		this.cvs = cvs.attr({ width, height });
		this.ctx = cvs[0].getContext("2d");

		// viewport
		this.viewport = new Viewport({ arena: this, x: 0, y: 0, w: this.win.width, h: this.win.height });

		// create "001"
		this.player = new Player({ arena: this, x: 4, y: 3 });

		// map
		this.map = new Map({ arena: this, ...this.tiles });
		this.map.layout("a");
	}

	update() {

	}

	render() {
		this.viewport.center();
		this.map.render(this.ctx);
	}
}
