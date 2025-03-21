
class Explosion {
	constructor(cfg) {
		let { arena, x, y } = cfg;

		this.arena = arena;
		this.sprite = arena.assets["explosion"].img;
		this.frame = {
			index: 0,
			last: 30,
			speed: 30,
		};
		
		this.angle = 0;
		// this ensures this to be rendered on top
		this._fx = true;

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
		this.angle += .5;
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
			pX = this.position.x + arena.viewport.x,
			pY = this.position.y + arena.viewport.y;
		
		ctx.save();
		ctx.translate(pX, pY);
		ctx.rotate((this.angle * Math.PI) / 180);
		// ctx.globalCompositeOperation = "lighter";
		ctx.drawImage(this.sprite,
				f, 0, w, w,
				-32, -32, w, w
			);
		ctx.restore();
	}
}
