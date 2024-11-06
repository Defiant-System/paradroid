
class Map {
	constructor(cfg) {
		let { arena } = cfg;
		// parent object
		this.arena = arena;
		// items on the map
		this.entries = [];
		this.droids = [];

		// physics engine
		this.engine = Matter.Engine.create();
		// no gravity since it is top-down 2d
		this.engine.world.gravity.y = 0;
	}

	setState(state) {
		let tile = this.arena.config.tile,
			xSection = window.bluePrint.selectSingleNode(`//Data/Section[@id="${state.id}"]`);
		// dimensions of this level map
		this.width = +xSection.getAttribute("width");
		this.height = +xSection.getAttribute("height");
		this.w = this.width * tile;
		this.h = this.height * tile;

		// reset map arrays
		this.entries = [];
		this.droids = [this.arena.player];

		// reset level map data
		this.background = [];
		this.collision = [];

		// player physics body
		this.arena.player.body = Matter.Bodies.circle(390, 250, 17);

		// physics bodies array
		let bodies = [this.arena.player.body];

		// add rows
		[...Array(this.height)].map(row => this.background.push([]));
		xSection.selectNodes(`./Layer[@id="background"]/i`).map((xTile, col) => {
			let row = Math.floor(col / this.width);
			this.background[row].push(xTile.getAttribute("id"));
		});

		// console.log( this.arena.viewport );
		this.collision = [...Array(this.height)].map(row => ([...Array(this.width)].map(i => 0)));
		xSection.selectNodes(`./Layer[@id="collision"]/i`).map(xColl => {
			let x = +xColl.getAttribute("x"),
				y = +xColl.getAttribute("y");
			this.collision[y][x] = 1;

			let bX = (x * tile) + 261,
				bY = (y * tile) + 123;
			bodies.push(Matter.Bodies.rectangle(bX, bY, tile, tile, { isStatic: true }));
		});

		// physics setup
		Matter.Composite.add(this.engine.world, bodies);
	}

	update(delta) {
		
	}

	render(ctx) {
		let assets = this.arena.assets,
			tile = this.arena.config.tile,
			viewport = this.arena.viewport,
			xMin = Math.floor(viewport.x / tile),
			yMin = Math.floor(viewport.y / tile),
			xMax = Math.ceil((viewport.x + viewport.w) / tile),
			yMax = Math.ceil((viewport.y + viewport.h) / tile),
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
						oX = Math.floor(l * tile),
						oY = Math.floor(t * tile),
						tX = Math.floor((x * tile) - vX),
						tY = Math.floor((y * tile) - vY);

					ctx.drawImage(
						assets["big-map"].img,
						oX, oY, tile, tile,
						tX, tY, tile, tile
					);
				}
			}
		}

		if (this.arena.debug.mode > 0) {
			let bodies = Matter.Composite.allBodies(this.engine.world);

			ctx.beginPath();
			bodies.map(body => {
				ctx.moveTo(body.vertices[0].x, body.vertices[0].y);
				body.vertices.slice(1).map(vertices => {
					ctx.lineTo(vertices.x, vertices.y);
				});
				ctx.lineTo(body.vertices[0].x, body.vertices[0].y);
			});
		    ctx.lineWidth = 2;
		    ctx.strokeStyle = '#f00';
		    ctx.stroke();
		}
	}
}
