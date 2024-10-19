
class Arena {
	constructor(cvs) {
		this.win = {
			width: window.innerWidth,
			height: window.innerHeight,
		};

		// files config
		this.tiles = {
			size: 32,
			char: 96,
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

		// assets list
		let assets = [
				{ width: 64, height: 32, id: "tiny-map", src: "~/icons/tiles-8.png", },
				{ width: 512, height: 256, id: "big-map", src: "~/icons/tiles-32.png", },
				{ width: 405, height: 45, id: "droid", src: "~/icons/droid.png", },
				{ width: 150, height: 17, id: "digits", src: "~/icons/droid-digits.png", },
			],
			loadAssets = () => {
				let item = assets.pop();
				console.log(item.id);
				// let img = new Image;
			    // img.src = cfg.map;
			    // img.onload = () => {
			    // 	this._img = img;
			    // 	if (typeof cfg.ready === "function") cfg.ready();
			    // };

			    if (assets.length) loadAssets();
			    else this.ready();
			};

		this.assets = [];
		
		// load assets
		loadAssets();
	}

	ready() {
		return console.log("ready");
		// viewport
		this.viewport = new Viewport({ arena: this, x: 0, y: 0, w: this.win.width, h: this.win.height });
		// create "001"
		this.player = new Player({ arena: this, x: 0, y: 0 });
		// map
		this.map = new Map({ arena: this, ...this.tiles });
		this.map.layout("a");

		this.render();
	}

	update() {

	}

	render() {
		this.viewport.center();
		this.map.render(this.ctx);

		// this.ctx.drawImage(
		// 	this.player
		// );
	}
}
