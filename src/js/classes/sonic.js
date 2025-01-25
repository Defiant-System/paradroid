
class Sonic extends Fire {
	constructor(cfg) {
		super(cfg);

		let { arena, owner, type, angle, speed } = cfg;

		this.type = "sonic";
		this.asset = arena.assets[this.type];
		this.width = 5;
		this.trail = [];

		this.speed = speed || .0000105;
		let vX = Math.cos(angle) * this.speed,
 			vY = Math.sin(angle) * this.speed;
		this.force = new Point(vX, vY);
	}

	update(delta) {
		super.update(delta);
		if (this.width < 60) this.width += 4;

		if (this.trail) {
			// prepend position to trail
			let w = this.width,
				oX = w >> 1,
				x = this.position.x,
				y = this.position.y;
			this.trail.unshift({ x, y, w, oX });
			// trim trail log
			this.trail.splice(9, 9);
		}
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport;

		if (this.trail.length) {
			this.trail
				.filter((r, i) => [0, 3, 5, 7, 9].includes(i))
				.map((ring, i) => {
					let x = ring.x + viewport.x,
						y = ring.y + viewport.y;
					ctx.save();
					ctx.globalAlpha = 1-(i/5);
					ctx.translate(x, y);
					ctx.rotate(this.angle);
					ctx.drawImage(this.owner.sprites.sonic, -ring.oX, -ring.oX, ring.w, ring.w);
					ctx.restore();
				});
		}
	}
}
