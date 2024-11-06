
class Droid {
	constructor(cfg) {
		let { arena, id, x, y, patrol } = cfg;

		this.arena = arena;
		this.id = id;
		// droid tile coords
		this.x = x || 0;
		this.y = y || 0;
		this.pos = { x: 0, y: 0 };
		// radius
		this.r = 20;

		// droid "spining" sprite
		this.sprites = {
			bg: arena.assets["droid"].img,
			digits: arena.assets["digits"].img,
		};
		// paint digits on droid
		this.digits = this.id.toString().split("").map((x, i) => {
			return {
				x: +x * 28,
				l: (i * 15) + Utils.digits[this.id][i],
			};
		});
		// used to animate droid "spin"
		this.frame = {
			index: 0,
			last: 80,
			speed: 80,
		};
	}

	update(delta) {
		
	}

	render(ctx) {
		
	}
}
