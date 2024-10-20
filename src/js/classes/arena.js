
class Arena {
	constructor(cvs) {
		// set dimensions of canvas
		let { width, height } = cvs.offset();
		this.width = width;
		this.height = height;
		this.cvs = cvs.attr({ width, height });
		this.ctx = cvs[0].getContext("2d", { willReadFrequently: true });

		// config
		this.speed = 5;
		this.tiles = {
			size: 32,
			char: 45,
		};
		this.center = {
			x: Math.round(this.width / this.tiles.size) / 2,
			y: Math.round(this.height / this.tiles.size) / 2,
		};

		this.input = {
			up: { pressed: false, x: 0, y: -this.speed },
			left: { pressed: false, x: -this.speed, y: 0 },
			down: { pressed: false, x: 0, y: this.speed },
			right: { pressed: false, x: this.speed, y: 0 },
		};

		this.debug = {
			on: true,
			elFps: window.find(".debug .fps span"),
			elCoords: window.find(".debug .coords span"),
		};

		// create FPS controller
		let Self = this;
		this.fpsControl = karaqu.FpsControl({
			fps: 60,
			callback(time=0, delta=0) {
				Self.update(delta);
				Self.render();
			}
		});

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
		this.viewport = new Viewport({ arena: this, x: 0, y: 0, w: this.width, h: this.height });
		// create "001"
		this.player = new Player({ arena: this, id: "001", x: 0, y: 0 });
		// map
		this.map = new Map({ arena: this, ...this.tiles });
		// this.map.layout();
	}

	setState(state) {
		// temporary; this prevents setting state if not completly ready
		if (!this.map) return setTimeout(() => this.setState(state), 100);

		this.map.setState(state.map);
		// move player / "001"
		this.player.spawn(state["001"].x, state["001"].y);

		// re-render
		// this.render();

		this.fpsControl.start();
	}

	update(delta) {
		this.map.update(delta);
		this.player.update(delta);
	}

	render() {
		// clear canvas
		this.cvs.attr({ width: this.width });

		this.viewport.center();
		this.map.render(this.ctx);
		this.player.render(this.ctx);

		if (this.debug.on) {
			this.debug.elFps.html(`60`);
			this.debug.elCoords.html(`1, 1`);
		}
	}
}
