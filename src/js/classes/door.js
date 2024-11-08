
class Door {
	constructor(cfg) {
		let { arena, type, x, y } = cfg,
			tile = arena.config.tile,
			pX = (x * tile) + (tile >> 1),
			pY = (y * tile) + (tile >> 1);
		
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

		let bodies = [],
			args,
			slider;
		// door frame "start"
		args = (type === "h") ? [pX, pY - tile + 5, 54, 10] : [pX - tile + 5, pY, 10, 54];
		bodies.push(Matter.Bodies.rectangle(...args, { isStatic: true }));

		// door frame "end"
		args = (type === "h") ? [pX, pY + tile - 5, 54, 10] : [pX + tile - 5, pY, 10, 54];
		bodies.push(Matter.Bodies.rectangle(...args, { isStatic: true }));

		args = (type === "h") ? [pX, pY, 24, 44] : [pX, pY, 44, 24];
		slider = Matter.Bodies.rectangle(...args, { isStatic: true });
		bodies.push(slider);

		// console.log( slider );

		Matter.Composite.add(arena.map.engine.world, bodies);
	}

	update(delta) {

	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport,
			tile = arena.config.tile,
			x = ((this.x - .5) * tile) + viewport.x,
			y = ((this.y - .5) * tile) + viewport.y,
			frame = 128 + (this.frame.index * 64),
			args = [arena.assets["big-map"].img, frame, 256, 64, 64, 0, 0, 64, 64],
			isVert = this.type === "v";

		// frames for vertical door
		if (isVert) args[2] = 320;

		ctx.save();
		ctx.translate(x, y);

		// normal draw if debug mode is < 3
		if (arena.debug.mode < 3) {
			ctx.drawImage(...args);
		}

		// if debug mode on, draw extras
		// if (arena.debug.mode > 0) {
		// 	args = isVert ? [0, 16, 64, 32] : [16, 0, 32, 64];
		// 	ctx.fillStyle = "#00000066";
		// 	ctx.fillRect(...args);
		// }

		ctx.restore();
	}
}
