
class Sonic extends Laser {
	constructor(cfg) {
		super(cfg);

		let { arena, owner, type, angle, speed } = cfg;

		this.type = "sonic";
		this.asset = arena.assets[this.type];
		this.offset = {
				x: this.asset.img.width >> 1,
				y: this.asset.img.height >> 1,
			};
		this.freq = 0;
		this.trail = [];

		this.speed = speed || .015;
		let vX = Math.cos(angle) * this.speed,
 			vY = Math.sin(angle) * this.speed;
		this.force = new Point(vX, vY);
	}

	update(delta) {
		super.update(delta);
		this.freq += .25;

		if (this.trail) {
			// prepend position to trail
			let w = (Math.sin(this.freq) * (this.asset.img.width / 1.5)) + 10,
				oX = w >> 1,
				x = this.position.x,
				y = this.position.y;
			this.trail.unshift({ x, y, w, oX });
			// trim trail log
			this.trail.splice(11, 11);
		}
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport;

		if (this.trail.length) {
			this.trail
				.filter((r, i) => [0, 3, 5, 7, 9].includes(i))
				.map(ring => {
					let x = ring.x + viewport.x,
						y = ring.y + viewport.y;
					ctx.save();
					ctx.translate(x, y);
					ctx.rotate(this.angle);
					ctx.drawImage(this.asset.img, -ring.oX, -ring.oX, ring.w, ring.w);
					ctx.restore();
				});
		}
	}
}
