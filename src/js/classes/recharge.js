
class Recharge {
	constructor(cfg) {
		let { arena, x, y, w, h } = cfg;
		
		this.arena = arena;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		this.angle = 0;
		this.freq = 0;
	}

	update(delta) {
		this.angle = (this.angle+2) % 360;
		this.freq += .03;
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport,
			size = arena.tiles.size,
			vX = viewport.x + ((this.arena.width - viewport.w) >> 1),
			vY = viewport.y + ((this.arena.height - viewport.h) >> 1),
			x = Math.round((this.x * size) - vX) + .5,
			y = Math.round((this.y * size) - vY) + .5,
			rad = (this.angle * Math.PI) / 180,
			args = [arena.assets["big-map"].img, 0, 257, 14, 14, -7, -7, 14, 14],
			r;

		ctx.save();
		ctx.fillStyle = "#ffccccaa";
		ctx.translate(x, y);

		// rotations
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

		// 1
		ctx.beginPath();
		r = Math.sin((this.freq + 2.0) * 5) + 4;
		ctx.arc(24, 7.5, r, 0, Math.TAU);
		ctx.fill();
		
		// 2
		ctx.beginPath();
		r = Math.sin((this.freq + 1.75) * 5) + 4;
		ctx.arc(40, 7.5, r, 0, Math.TAU);
		ctx.fill();
		
		// 3
		ctx.beginPath();
		r = Math.sin((this.freq + 1.0) * 5) + 4;
		ctx.arc(56, 24, r, 0, Math.TAU);
		ctx.fill();
		
		// 4
		ctx.beginPath();
		r = Math.sin((this.freq + 1.25) * 5) + 4;
		ctx.arc(56, 40, r, 0, Math.TAU);
		ctx.fill();
		
		// 5
		ctx.beginPath();
		r = Math.sin((this.freq + 0.75) * 5) + 4;
		ctx.arc(40, 56, r, 0, Math.TAU);
		ctx.fill();
		
		// 6
		ctx.beginPath();
		r = Math.sin((this.freq + 0.5) * 5) + 4;
		ctx.arc(24, 56, r, 0, Math.TAU);
		ctx.fill();
		
		// 7
		ctx.beginPath();
		r = Math.sin((this.freq + 0.25) * 5) + 4;
		ctx.arc(8, 40, r, 0, Math.TAU);
		ctx.fill();
		
		// 8
		ctx.beginPath();
		r = Math.sin((this.freq + 0.0) * 5) + 4;
		ctx.arc(8, 24, r, 0, Math.TAU);
		ctx.fill();

		ctx.restore();
	}
}

// 2b3391
// 71d0f6
