
class Crosshair {
	constructor(cfg) {
		let { arena, x, y } = cfg;

		// tile coords
		this.x = x || 0;
		this.y = y || 0;
		this.rotation = 0;
		this.angle = Math.PI / 180;
		this.target = { x: 0, y: 0, visible: false };

		// crosshair sprite
		this.sprites = {
			outer: arena.assets["crosshair-1"].img,
			inner: arena.assets["crosshair-2"].img,
		};
	}

	follow(event) {
		let visible = event.target && event.target.classList.contains("game");
		this.target = {
			visible,
			x: event.offsetX,
			y: event.offsetY,
		};
	}

	update(delta) {
		this.rotation += .5;
	}

	render(ctx) {
		let arena = this.arena,
			pX = this.target.x,
			pY = this.target.y;

		if (this.target.visible) {
			ctx.save();
			ctx.translate(pX, pY);
			ctx.drawImage(this.sprites.outer, -24, -24);

			ctx.rotate(this.rotation * this.angle);
			ctx.drawImage(this.sprites.inner, -24, -24);
			ctx.restore();
		}
	}
}
