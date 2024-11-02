
class Door {
	constructor(cfg) {
		let { arena, type, x, y } = cfg,
			size = arena.tiles.size,
			pX = arena.viewport.half.w + (x * size),
			pY = arena.viewport.half.h + (y * size);
		
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
		this.arena.map.droids.map(droid => {
			let dist = droid.pos.distance(this.pos);
			if (dist < 64 && this.state !== "open") this.state = "opening";
			else if (dist > 64 && this.state !== "close") this.state = "closing";
		});

		switch (this.state) {
			case "opening":
				this.frame.last -= delta;
				if (this.frame.last < 0) {
					this.frame.index++;
					this.frame.last = (this.frame.last + this.frame.speed) % this.frame.speed;

					if (this.frame.index >= 4) {
						this.state = "open";
						this.frame.index = 4;
					}
				}
				break;
			case "closing":
				this.frame.last -= delta;
				if (this.frame.last < 0) {
					this.frame.index--;
					this.frame.last = (this.frame.last + this.frame.speed) % this.frame.speed;

					if (this.frame.index <= 0) {
						this.state = "close";
						this.frame.index = 0;
					}
				}
				break;
		}
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport,
			size = arena.tiles.size,
			vX = viewport.x + ((this.arena.width - viewport.w) >> 1),
			vY = viewport.y + ((this.arena.height - viewport.h) >> 1),
			x = Math.round((this.x * size) - vX),
			y = Math.round((this.y * size) - vY),
			frame = 128 + (this.frame.index * 64),
			args = [arena.assets["big-map"].img, frame, 256, 64, 64, 0, 0, 64, 64];

		// frames for vertical door
		if (this.type === "v") args[2] = 320;

		ctx.save();
		ctx.translate(x, y);
		ctx.drawImage(...args);
		ctx.restore();
	}
}
