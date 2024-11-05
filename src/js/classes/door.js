
class Door {
	constructor(cfg) {
		let { arena, type, x, y } = cfg,
			size = arena.tiles.size,
			pX = x * size,
			pY = y * size;
		
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
		let dist = [];
		this.arena.map.droids.map(droid => dist.push(droid.pos.distance(this.pos)));
		// if closest droid is within range, open door
		let closest = Math.min(...dist);
		// if (this.x === 28 && this.y === 6) console.log( dist );
		if (closest < 64 && this.state !== "open") this.state = "opening";
		else if (closest > 64 && this.state !== "close") this.state = "closing";

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
			vX = viewport.x + ((arena.width - viewport.w) >> 1),
			vY = viewport.y + ((arena.height - viewport.h) >> 1),
			x = Math.round((this.x * size) - vX),
			y = Math.round((this.y * size) - vY),
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
		if (arena.debug.mode > 0) {
			args = isVert ? [0, 16, 64, 32] : [16, 0, 32, 64];
			ctx.fillStyle = "#00000066";
			ctx.fillRect(...args);
		}

		ctx.restore();
	}
}
