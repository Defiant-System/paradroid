
class Door {
	constructor(cfg) {
		let { arena, type, x, y } = cfg,
			tile = arena.config.tile,
			pX = x * tile,
			pY = y * tile;
		
		this.arena = arena;
		this.type = type;
		this.x = x;
		this.y = y;

		this.pos = new Point(pX, pY);
		this.state = "close"; // open opening closing

		this.frame = {
			index: 0,
			last: 30,
			speed: 30,
		};
	}

	update(delta) {

	}

	render(ctx) {
		
	}
}
