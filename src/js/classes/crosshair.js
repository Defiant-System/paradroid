
class Crosshair {
	constructor(cfg) {
		let { arena, x, y } = cfg;

		// tile coords
		this.x = x || 0;
		this.y = y || 0;
		this.angle = 0;

		// crosshair sprite
		this.sprites = {
			outer: arena.assets["crosshair-1"].img,
			inner: arena.assets["crosshair-2"].img,
		};
	}

	update(delta) {
		this.angle += .5;
	}

	render(ctx) {
		let arena = this.arena,
			pX = 200,
			pY = 200;

		ctx.save();
		ctx.translate(pX, pY);
		ctx.drawImage(this.sprites.outer, -24, -24);

		ctx.rotate((this.angle * Math.PI) / 180);
		ctx.drawImage(this.sprites.inner, -24, -24);
		ctx.restore();
	}
}
