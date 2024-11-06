
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

	spawn(x, y) {
		let size = this.arena.config.tile;
		// tile coords
		this.x = x;
		this.y = y;
		this.pos.x = x * size;
		this.pos.y = y * size;
	}

	update(delta) {
		super.update(delta);
	}

	render(ctx) {
		// render droid
		super.render(ctx);
	}
}
