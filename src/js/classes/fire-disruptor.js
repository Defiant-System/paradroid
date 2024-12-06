
class Disruptor {
	constructor(cfg) {
		let { arena, owner } = cfg,
			droids = arena.map.droids.filter(d => !d.isPlayer),
			bodies = Matter.Composite.allBodies(arena.map.engine.world),
			startPoint = {
				x: -(arena.viewport.x - arena.viewport.half.w),
				y: -(arena.viewport.y - arena.viewport.half.h),
			};
		
		// new Electric(cfg);

		droids.map(droid => {
			let target = droid.position,
				collisions = Matter.Query.ray(bodies, startPoint, target);
			// console.log( collisions.length, startPoint, target );
			// console.log( collisions );
			// if (collisions.length === 1) {
			// 	console.log( droid.id );
			// }
			new Electric({ ...cfg, target });
		});
	}

	update(delta) {
		// nothing to do
	}

	render(ctx) {
		// nothing to do
	}
}
