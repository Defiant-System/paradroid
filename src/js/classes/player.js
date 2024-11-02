
// Droid "001"
class Player extends Droid {
	constructor(cfg) {
		super(cfg);

		this.light = {
			radius: 100,
		};
		this.speed = .75;
		this.tile = {
			x: 0,
			y: 0,
		};
	}

	spawn(x, y) {
		let arena = this.arena,
			size = arena.tiles.size,
			oX = arena.viewport.half.w - size,
			oY = arena.viewport.half.h - size;
		this.tile.x = x;
		this.tile.y = y;
		this.pos.x = oX + (x * size);
		this.pos.y = oY + (y * size);
	}

	setState(state) {
		console.log( state.id );
		switch (state.id) {
			case "exit": break;
			case "charge": break;
			case "console": break;
		}
	}

	move(vel) {
		let arena = this.arena,
			size = arena.tiles.size,
			map = arena.map.collision,
			point = vel.multiply(this.speed),
			viewX = (arena.viewport.half.w - size),
			viewY = (arena.viewport.half.h - size),
			newPos = {
				x: Math.floor((this.pos.x - viewX + point.x + (point.x > 0 ? size : 0)) / size),
				y: Math.floor((this.pos.y - viewY + point.y + (point.y > 0 ? size : 0)) / size),
			},
			tile;

		if (point.x !== 0) {
			tile = map[this.tile.y][newPos.x] || map[this.tile.y+1][newPos.x];
			if (tile !== 1) {
				this.pos.x += point.x;
			} else {
				this.pos.x = point.x > 0
							? Math.max(viewX - 1 + ((newPos.x - 1) * size), this.pos.x)
							: Math.min(viewX + 1 + ((newPos.x + 1) * size), this.pos.x);
			}
		}

		if (point.y !== 0) {
			tile = map[newPos.y][this.tile.x] || map[newPos.y][this.tile.x+1];
			if (tile !== 1) {
				this.pos.y += point.y;
			} else {
				this.pos.y = point.y > 0
							? Math.max(viewY - 1 + ((newPos.y - 1) * size), this.pos.y)
							: Math.min(viewY + 1 + ((newPos.y + 1) * size), this.pos.y);
			}
		}
		this.tile.x = Math.floor((this.pos.x - viewX) / size);
		this.tile.y = Math.floor((this.pos.y - viewY) / size);
	}

	update(delta) {
		let arena = this.arena,
			step = new Point(0, 0);

		// check input
		for (let key in arena.input) {
			if (arena.input[key].pressed) {
				step = step.add(arena.input[key].move);
			}
		}
		
		if (step.x !== 0 || step.y !== 0) {
			this.move(step);
		}

		super.update(delta);
	}

	render(ctx) {
		super.render(ctx);
	}
}
