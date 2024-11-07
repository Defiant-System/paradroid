
class Player extends Droid {
	constructor(cfg) {
		super(cfg);

		// aurora borealis
		this.light = {
			strength: .325,
			radius: 100,
		};
		this.speed = .75;
		this.isPlayer = true;

		this.input = {
			up:    { pressed: false, force: { x: 0, y: -1 } },
			left:  { pressed: false, force: { x: -1, y: 0 } },
			down:  { pressed: false, force: { x: 0, y: 1 } },
			right: { pressed: false, force: { x: 1, y: 0 } },
		};

		// create white versions of sprites
		Object.keys(this.sprites).map(k => {
			// for BG sprite
			let w = this.sprites[k].width,
				h = this.sprites[k].height,
				{ cvs, ctx } = Utils.createCanvas(w, h);
			// draw orignal droid sprite
			ctx.drawImage(this.sprites[k], 0, 0);
			// change droid color
			ctx.globalCompositeOperation = "source-atop";
			ctx.fillStyle = "#fff";
			ctx.fillRect(0, 0, w, h);
			// replace sprite
			this.sprites[k] = cvs[0];
		});
	}

	update(delta) {
		let force = { x: 0, y: 0 };
		// check input
		for (let key in this.input) {
			if (this.input[key].pressed) {
				let f = this.input[key].force;
				force = { ...force, ...f };
			}
		}

		force.x = this.body.mass * force.x * 0.0025;
		force.y = this.body.mass * force.y * 0.0025;
		Matter.Body.applyForce(this.body, this.body.position, force);

		// let viewport = this.arena.viewport,
		// 	size = this.arena.config.tile;
		// this.pos.x = (this.body.position.x - viewport.x);
		// this.pos.y = (this.body.position.y - viewport.y);
		// this.x = Math.floor(this.pos.x / size);
		// this.y = Math.floor(this.pos.y / size);
		// console.log( this.x, this.y );

		super.update(delta);
	}

	render(ctx) {
		// render droid
		super.render(ctx);
	}
}
