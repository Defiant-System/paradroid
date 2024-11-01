
class Recharge {
	constructor(cfg) {
		let { arena, x, y, w, h } = cfg;
		
		this.arena = arena;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.angle = 0;
	}

	update(delta) {
		this.angle = (this.angle+2) % 360;
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport,
			size = arena.tiles.size,
			vX = viewport.x + ((this.arena.width - viewport.w) >> 1),
			vY = viewport.y + ((this.arena.height - viewport.h) >> 1),
			x = (this.x * size) - vX,
			y = (this.y * size) - vY,
			w = this.w * size,
			h = this.h * size,
			rad = (this.angle * Math.PI) / 180,
			args = [arena.assets["big-map"].img, 16, 273, 14, 14, -7.5, -7.5, 14, 14];

		// console.log(x, y, viewport.x, viewport.y);
		// ctx.save();
		// ctx.fillStyle = "#69d";
		// ctx.fillRect(x, y, w, h);
		// ctx.restore();

		ctx.save();
		ctx.fillStyle = "#fff";
		ctx.translate(x, y);
		
		ctx.save();
		ctx.translate(24, 24);
		ctx.rotate(rad);
		ctx.drawImage(...args);
		ctx.restore();

		ctx.save();
		ctx.translate(40, 24);
		ctx.rotate(rad);
		ctx.drawImage(...args);
		ctx.restore();

		ctx.save();
		ctx.translate(24, 40);
		ctx.rotate(rad);
		ctx.drawImage(...args);
		ctx.restore();

		ctx.save();
		ctx.translate(40, 40);
		ctx.rotate(rad);
		ctx.drawImage(...args);
		ctx.restore();

		ctx.beginPath();
		ctx.arc(24, 7.5, 5, 0, Math.TAU);
		ctx.fill();
		
		ctx.beginPath();
		ctx.arc(40, 7.5, 5, 0, Math.TAU);
		ctx.fill();

		ctx.restore();
	}
}

// 2b3391
// 71d0f6
