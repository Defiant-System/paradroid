
class Exterminator {
	constructor(cfg) {
		let { arena, owner } = cfg;

		let target = arena.player.target,
			missiles = 7,
			inc = (Math.TAU * .8) / missiles,
			a = arena.player.dir + (Math.TAU * .65);
		// console.log( arena.player.dir );
		[...Array(missiles)].map(m => {
			let angle = a;
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
