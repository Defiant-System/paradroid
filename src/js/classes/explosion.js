
class Explosion {
	constructor(cfg) {
		let { arena, owner, x, y } = cfg;

		this.arena = arena
		this.owner = owner
		this.sprite = arena.assets["explosion"].img;
		this.frame = {
			index: 0,
			last: 30,
			speed: 30,
		};
		
		// update tile position
		let position = new Point(x, y),
			tile = this.arena.config.tile;
		this.x = Math.round(position.x / tile);
		this.y = Math.round(position.y / tile);
		this.position = position;
		
		// add entity to entries list
		this.arena.map.entries.push(this);
	}

	update(delta) {
		this.frame.last -= delta;
		if (this.frame.last < 0) {
			this.frame.last = (this.frame.last + this.frame.speed) % this.frame.speed;
			this.frame.index++;
			if (this.frame.index > 30) {
				let index = this.arena.map.entries.indexOf(this);
				this.arena.map.entries.splice(index, 1);
			}
		}
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport,
			w = 64,
			f = this.frame.index * w,
			pX = this.position.x + arena.viewport.x - 32,
			pY = this.position.y + arena.viewport.y - 32;
		
		ctx.save();
		ctx.translate(pX, pY);
		ctx.globalCompositeOperation = "lighter";
		ctx.drawImage(this.sprite,
				f, 0, w, w,
				0, 0, w, w
			);
		ctx.restore();
	}
}
