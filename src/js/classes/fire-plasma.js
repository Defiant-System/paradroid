
class Plasma {
	constructor(cfg) {
		let { arena, owner } = cfg;

		let bullets = 16,
			inc = 360 / bullets,
			a = 0;
		[...Array(bullets)].map((e, i) => {
			let angle = a * Math.PI / 180;
			new Laser({ arena, owner, angle, speed: .00005, type: "plasma" });
			a += inc;
		});
	}

	update(delta) {
		// nothing to do
	}

	render(ctx) {
		// nothing to do
	}
}
