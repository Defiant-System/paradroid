
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

		let args = (type === "h") ? [pX, pY, 24, 64] : [pX, pY, 64, 24];
		this.body = Matter.Bodies.rectangle(...args, { isStatic: true, friction: 0 });
		this.isAdded = true;
		// add door to physical world
		Matter.Composite.add(arena.map.engine.world, this.body);

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
		let arena = this.arena;
		let playerDist = [];
		let dist = arena.map.droids.map(droid => {
			let dd = this.pos.distance(droid.body.position);
			if (droid.isPlayer && dd < 380 && this.state !== "open") playerDist.push(this);
			return dd;
		});
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
						delete this.isAdded;
						Matter.Composite.remove(arena.map.engine.world, this.body);
						if (playerDist.includes(this)) {
							// play sound fx
							window.audio.play("door-open");
						}
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
						if (!this.isAdded) {
							this.isAdded = true;
							Matter.Composite.add(arena.map.engine.world, this.body);
						}
						if (playerDist.includes(this)) {
							// play sound fx
							window.audio.play("door-open");
						}
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
			args = [arena.bgAsset.img, frame, 256, 64, 64, 0, 0, 64, 64],
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
