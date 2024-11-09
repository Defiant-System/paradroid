
class Arena {
	constructor(cvs) {
		// set dimensions of canvas
		let { width, height } = cvs.offset();
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

		this.debug = {
			mode: 0,
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
					if (item.id === "big-map") {
						// save original (to be used later with level filter)
						this.assets.original = img;
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

	setFilter(filter) {
		let org = this.assets.original,
			{ cvs, ctx } = Utils.createCanvas(org.width, org.height);
		ctx.filter = filter;
		ctx.drawImage(org, 0, 0);
		this.assets["big-map"].img = cvs[0];
	}

	setDebug(mode) {
		this.debug.mode = mode;
	}

	setState(state) {
		// temporary; this prevents setting state if not completly ready
		if (!this.map) return setTimeout(() => this.setState(state), 100);

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
		this.player.update(delta);
	}

	render() {
		// clear canvas
		this.cvs.attr({ width: this.width });

		this.viewport.center();
		this.map.render(this.ctx);
		this.player.render(this.ctx);


		if (this.debug.mode > 0) {
			let bodies = Matter.Composite.allBodies(this.map.engine.world);

			this.ctx.save();
			this.ctx.translate(this.viewport.x, this.viewport.y);
		    this.ctx.lineWidth = 1;
		    this.ctx.fillStyle = "#33669977";
		    this.ctx.strokeStyle = "#113355cc";
			this.ctx.beginPath();
			bodies.map(body => {
				this.ctx.moveTo(body.vertices[0].x, body.vertices[0].y);
				body.vertices.slice(1).map(vertices => {
					this.ctx.lineTo(vertices.x, vertices.y);
				});
				this.ctx.lineTo(body.vertices[0].x, body.vertices[0].y);
			});
		    this.ctx.fill();
		    this.ctx.stroke();
			this.ctx.restore();
		}

		// for debug row at bottom
		this.debug.elFps.html(this.fpsControl._fps);
		this.debug.elCoords.html(`${this.player.x}, ${this.player.y}`);
	}
}
