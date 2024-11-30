
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
	}

	update(delta) {
		super.update(delta);
	}

	render(ctx) {
		super.render(ctx);
	}
}
