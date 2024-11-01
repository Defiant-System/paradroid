
class Door {
	constructor(cfg) {
		let { arena, type, x, y, w, h } = cfg,
			size = arena.tiles.size,
			oX = arena.viewport.half.w - size,
			oY = arena.viewport.half.h - size;
		
		this.arena = arena;
		this.type = type;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.pos = new Point(oX + (x * size), oY + (y * size));

		this.state = "close";
		// this.state = "open";
		// this.state = "opening";
		// this.state = "closing";

		this.frame = {
			index: 0,
			last: 30,
			speed: 30,
		};
	}

	update(delta) {
		let dist = this.arena.map.droids[0].pos.distance(this.pos);
		if (dist < 64 && this.state !== "open") this.state = "opening";
		else if (dist > 64 && this.state !== "close") this.state = "closing";

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

		if (this.type === "v") args[2] = 320;

		ctx.save();
		ctx.translate(x, y);
		ctx.drawImage(...args);
		ctx.restore();
	}
}
