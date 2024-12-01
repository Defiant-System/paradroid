
class Exterminator {
	constructor(cfg) {
		let { arena, owner } = cfg;

		let target = { x: 150, y: 150 },
			missiles = 6,
			inc = 360 / missiles,
			a = 0;
		[...Array(missiles)].map(m => {
			let angle = a * Math.PI / 180;
			new Missile({ arena, owner, target, angle });
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
