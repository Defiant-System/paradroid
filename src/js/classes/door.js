
class Door {
	constructor(cfg) {
		let { arena, section, type, x, y } = cfg,
			tile = arena.config.tile,
			pX = (x + .5) * tile,
			pY = (y + .5) * tile;
		
		this.name = "door";
		this.arena = arena;
		this.section = section;
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

	get vertices() {
		let v = [],
			s = 18 - ((4 - this.frame.index) * 11);
		// sliding door
		if (this.type === "h") {
			v.push([this.pos.x - 11, this.pos.y + s]);
			v.push([this.pos.x + 11, this.pos.y + s]);
			v.push([this.pos.x + 11, this.pos.y + 24]);
			v.push([this.pos.x - 11, this.pos.y + 24]);
		} else {
			v.push([this.pos.x + s, this.pos.y - 11]);
			v.push([this.pos.x + 24, this.pos.y - 11]);
			v.push([this.pos.x + 24, this.pos.y + 10]);
			v.push([this.pos.x + s, this.pos.y + 10]);
		}
		return v;
	}

	update(delta) {
		let dist = this.arena.map.droids.map(droid => this.pos.distance(droid.body.position));
		let closest = Math.min(...dist);
		// if closest droid is within range, open door
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
			tile = arena.config.tile,
			x = Math.floor(this.pos.x - tile + viewport.x),
			y = Math.floor(this.pos.y - tile + viewport.y),
			frame = 128 + (this.frame.index * 64),
			args = [arena.assets["big-map"].img, frame, 256, 64, 64, 0, 0, 64, 64],
			isVert = this.type === "v";

		// frames for vertical door
		if (isVert) args[2] = 320;

		// normal draw if debug mode is < 2
		if (arena.debug.mode < 2) {
			ctx.save();
			ctx.translate(x, y);
			ctx.drawImage(...args);
			ctx.restore();
		}
	}
}
