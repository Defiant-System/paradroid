
class Arena {
	constructor(cvs) {
		this.win = {
			width: window.innerWidth,
			height: window.innerHeight,
		};

		// files config
		let size = 32,
			char = 96;
		this.tiles = {
			size,
			char,
			x: Math.ceil(this.win.width/size) + 2,
			y: Math.ceil(this.win.height/size) + 2,
		};
		this.center = {
			x: Math.round(this.win.width/size) / 2,
			y: Math.round(this.win.height/size) / 2,
		};
		this.speed = 5;

		// set dimensions of canvas
		let { width, height } = cvs.offset();
		this.cvs = cvs.attr({ width, height });
		this.ctx = cvs[0].getContext("2d");

		// assets list
		let assets = [
				{ id: "tiny-map", width: 64, height: 32, src: "~/img/tiles-8.png" },
				{ id: "big-map",  width: 512, height: 256, src: "~/icons/tiles-32.png" },
				{ id: "droid",    width: 405, height: 45, src: "~/icons/droid.png" },
				{ id: "digits",   width: 140, height: 16, src: "~/icons/droid-digits.png" },
			],
			loadAssets = () => {
				let item = assets.pop(),
					img = new Image();
			    img.src = item.src;
			    img.onload = () => {
			    	// save reference to asset
			    	this.assets[item.id] = { item, img };
			    	// are we done yet?
				    assets.length ? loadAssets() : this.ready();
			    };
			};
		// asset lib
		this.assets = {};
		
		// load assets
		loadAssets();
	}

	ready() {
		// viewport
		this.viewport = new Viewport({ arena: this, x: 0, y: 0, w: this.win.width, h: this.win.height });
		// create "001"
		this.player = new Player({ arena: this, id: "001", x: 0, y: 0 });
		// map
		this.map = new Map({ arena: this, ...this.tiles });
		// this.map.layout();

		// this.render();
	}

	setState(state) {
		this.map.setState(state.map);
		// move player / "001"
		this.player.move(state["001"].x, state["001"].y);
		// re-render
		this.render();
	}

	update() {

	}

	render() {
		this.viewport.center();
		this.map.render(this.ctx);
		this.player.render(this.ctx);
	}
}
