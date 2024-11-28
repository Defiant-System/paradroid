
class Arena {
	constructor(cvs) {
		// set dimensions of canvas
		let { width, height } = cvs.offset();
		width = width || +cvs.attr("width");
		height = height || +cvs.attr("height");
		this.width = width;
		this.height = height;
		this.cvs = cvs.attr({ width, height });
		this.ctx = cvs[0].getContext("2d", { willReadFrequently: true });

		// config
		this.config = {
			tile: 32,
			char: 45,
			speed: 5,
		};
		this.center = {
			x: Math.round(this.width / this.config.tile) / 2,
			y: Math.round(this.height / this.config.tile) / 2,
		};
		// color palette
		this.colors = {};

		this.debug = {
			mode: 0,
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
				{ id: "tiny-map", width: 112, height: 112, src: "~/icons/tiles-7.png" },
				{ id: "big-map",  width: 512, height: 512, src: "~/icons/tiles-32.png" },
				{ id: "droid",    width: 405, height: 45, src: "~/icons/droid.png" },
				{ id: "digits",   width: 140, height: 16, src: "~/icons/droid-digits.png" },
			],
			loadAssets = () => {
				let item = assets.pop(),
					img = new Image();
				img.src = item.src;
				img.onload = () => {
					if (item.id === "big-map") {
						// save original (to be used later with level filter)
						this.assets.original = img;
						this.copy = Utils.createCanvas(img.width, img.height);
					}
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
		// map
		this.map = new Map({ arena: this });
		// create "001"
		this.player = new Player({ arena: this, id: "001" });
	}

	setFilter(cfg) {
		let { color, filter } = cfg;
		this.colors.base = color;
		this.colors.dark = Color.mixColors(this.colors.base, "#000000", .75).slice(0,7);
		this.colors.light = Color.mixColors(this.colors.base, "#ffffff", .65).slice(0,7);
		// update player droids blur color
		this.player.blur.color = Color.mixColors(this.colors.base, "#000000", .5).slice(0,7);

		this.copy.cvs.attr({ width: this.assets.original.width });
		this.copy.ctx.filter = filter;
		this.copy.ctx.drawImage(this.assets.original, 0, 0);
		this.assets["big-map"].img = this.copy.cvs[0];
	}

	setDebug(mode) {
		this.debug.mode = mode;
	}

	setState(state) {
		// change debug state
		if (state.debug) this.debug.mode = state.debug.mode;

		let mapState = { droids: [], ...state.map };
		// move player / "001"
		this.player.spawn(state.player);
		// center viewport
		this.viewport.center();
		// set map state
		this.map.setState(mapState);
		//this.render();

		// start "loop"
		this.fpsControl.start();
	}

	update(delta) {
		this.map.update(delta);
		// this.player.update(delta);
	}

	drawFps(ctx) {
		let fps = this.fpsControl ? this.fpsControl._log : [];
		ctx.save();
		ctx.translate(this.width - 109, 0);
		// draw box
		ctx.fillStyle = "rgba(0,200,100,0.5)";
		ctx.fillRect(5, 5, 100, 40);
		ctx.fillStyle = "rgba(80,255,80,0.5)";
		ctx.fillRect(7, 7, 96, 11);
		ctx.fillStyle = "rgba(255,255,255,0.6)";
		// loop log
		for (let i=0; i<96; i++) {
			let bar = fps[i];
			if (!bar) break;
			let p = bar/90;
			if (p > 1) p = 1;
			ctx.fillRect(102 - i, 43, 1, -24 * p);
		}
		// write fps
		ctx.fillStyle = "#000";
		ctx.font = "9px Arial";
		ctx.textAlign = "left";
		ctx.fillText('FPS: '+ fps[0], 8, 17);
		// restore state
		ctx.restore();
	}

	render() {
		// clear canvas
		this.cvs.attr({ width: this.width });

		this.viewport.center();
		this.map.render(this.ctx);

		if (this.debug.mode >= 1) {
			let bodies = Matter.Composite.allBodies(this.map.engine.world);

			this.ctx.save();
			this.ctx.translate(this.viewport.x, this.viewport.y);
		    this.ctx.lineWidth = 1;
		    this.ctx.fillStyle = "#33669977";
		    this.ctx.strokeStyle = "#113355cc";
			this.ctx.beginPath();
			bodies.map(body => {
				this.ctx.moveTo(body.vertices[0].x, body.vertices[0].y);
				body.vertices.slice(1).map(v => this.ctx.lineTo(v.x, v.y));
				this.ctx.lineTo(body.vertices[0].x, body.vertices[0].y);
			});
		    this.ctx.fill();
		    this.ctx.stroke();
			this.ctx.restore();
		}

		// for debug row at bottom
		this.debug.elCoords.html(`${this.player.x}, ${this.player.y}`);
		this.drawFps(this.ctx);
	}
}
