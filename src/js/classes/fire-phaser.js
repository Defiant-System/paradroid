
class Phaser extends Laser {
	constructor(cfg) {
		super(cfg);

		let { arena, owner, type, angle, speed } = cfg;

		this.type = "phaser";
		this.asset = arena.assets[this.type];
		this.offset = {
				x: this.asset.img.width >> 1,
				y: this.asset.img.height >> 1,
			};
	}
}
