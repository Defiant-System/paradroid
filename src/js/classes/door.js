
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
			stepIndex: 0,
			step: [
				{ s: 1, l: 0 },
				{ s: .7, l: 10},
				{ s: .45, l: 18 },
				{ s: .3, l: 22 },
				{ s: .12, l: 29 },
			],
		};

		let bodies = [],
			args,
			slider;
		// door frame "start"
		args = (type === "h") ? [pX, pY - tile + 4, 50, 8] : [pX - tile + 4, pY, 8, 50];
		bodies.push(Matter.Bodies.rectangle(...args, { isStatic: true }));

		// door frame "end"
		args = (type === "h") ? [pX, pY + tile - 4, 50, 8] : [pX + tile - 4, pY, 8, 50];
		bodies.push(Matter.Bodies.rectangle(...args, { isStatic: true }));

		args = (type === "h") ? [pX, pY, 24, 64] : [pX, pY, 64, 24];
		this.slider = Matter.Bodies.rectangle(...args, { isStatic: true });
		bodies.push(this.slider);
		// set center sliding door
		Matter.Body.setCentre(this.slider, { x: 32, y: 0 }, true);

		// console.log( slider );
		// Matter.Body.scale(this.slider, .85, 1);
		this.slide(2);

		Matter.Composite.add(arena.map.engine.world, bodies);
	}

	slide(i) {
		let step = this.frame.step[i],
			scale = [1, 1];
		
		if (this.type === "h") {
			scale[1] = 1 - (i / 4);
		} else {
			scale[0] = 1 - (i / 4);
		}

		Matter.Body.scale(this.slider, scale[0], scale[1]);
		// save step index
		this.frame.stepIndex = i;
	}

	update(delta) {
		let dist = this.arena.map.droids.map(droid => this.pos.distance(droid.body.position));
		let closest = Math.min(...dist);
		// if closest droid is within range, open door
		if (closest < 64 && this.state !== "open") this.state = "opening";
		else if (closest > 64 && this.state !== "close") this.state = "closing";

		if (["opening", "closing"].includes(this.state) && this.frame.index !== this.frame.stepIndex) {
			// this.slide(this.frame.index);
		}

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

		ctx.restore();
	}
}
