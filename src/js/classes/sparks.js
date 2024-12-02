
class Sparks {
	constructor(cfg) {
		let { arena, owner, x, y, count } = cfg;

		this.arena = arena
		this.owner = owner
		this.parts = [];
		this.gravity = 1.65;
		this.alpha = 1;
		this.trailLen = 5;
		this.decay = Utils.random(.02, .035);
		
		// update tile position
		let position = new Point(x, y),
			tile = this.arena.config.tile;
		this.x = Math.round(position.x / tile);
		this.y = Math.round(position.y / tile);

		let len = count || 3;
		while (len--) {
			let vX = Utils.random(-1.5, 1.5),
				vY = Utils.random(-1.5, 1.5),
				angle = Utils.random(-2, -1);
			this.parts.push({
				pos: position.clone(),
				vel: new Point(vX, vY),
				trail: [],
				angle,
			});
		}

		// add entity to entries list
		this.arena.map.entries.push(this);
	}

	update(delta) {
		let m = delta/16;
		this.parts.map(p => {
			p.pos.x += p.vel.x + Math.cos(p.angle) * m;
			p.pos.y += p.vel.y + Math.sin(p.angle) * m + this.gravity;

			// prepend position to trail
			p.trail.unshift([p.pos.x, p.pos.y]);
			let [x2, y2] = p.trail[5] || [p.pos.x, p.pos.y];
			p.x2 = x2;
			p.y2 = y2;
			// trim trail log
			p.trail.splice(this.trailLen, this.trailLen);
		});

		// remove parts if fade is < zero
		this.alpha -= this.decay;
		if (this.alpha < 0) {
			let index = this.arena.map.entries.indexOf(this);
			this.arena.map.entries.splice(index, 1);
		}
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport;
		if (arena.debug.mode < 2) {
			ctx.save();
			ctx.lineWidth = 3;
			ctx.strokeStyle = "#fff9";
			ctx.globalAlpha = this.alpha;
			this.parts.map(p => {
				let x1 = p.pos.x + viewport.x,
					y1 = p.pos.y + viewport.y,
					x2 = p.x2 + viewport.x,
					y2 = p.y2 + viewport.y;
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.stroke();
			});
			ctx.restore();
		}
	}
}
