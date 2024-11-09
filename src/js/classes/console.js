
class Console {
	constructor(cfg) {
		let { arena, x, y, w, h } = cfg,
			tile = arena.config.tile,
			pX = (x + .5) * tile,
			pY = (y + .5) * tile;
		
		this.arena = arena;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.pos = new Point(pX, pY);

		// "aura" borealis
		this.aura = {
			color: [50, 255, 255],
			strength: .5,
			radius: 100,
		};
	}

	update(delta) {
		let dist = this.pos.distance(this.arena.player.body.position);
		if (dist < 32) {
			this.active = true;
			this.arena.player.setState({ id: "console" });
		} else if (this.active) {
			delete this.active;
			this.arena.player.setState({ id: "clear" });
		}
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport,
			tile = arena.config.tile,
			x = this.pos.x + viewport.x,
			y = this.pos.y + viewport.y;

		// normal draw if debug mode is < 3
		if (arena.debug.mode < 3) {
			ctx.save();
			ctx.translate(x, y);

			if (this.active) {
				let hT = tile >> 1,
					r = this.aura.radius,
					radialGradient = ctx.createRadialGradient(hT, hT, 0, hT, hT, r);
				radialGradient.addColorStop(0, `rgba(${this.aura.color.join(",")}, ${this.aura.strength})`);
				radialGradient.addColorStop(1, `rgba(${this.aura.color.join(",")}, 0)`);

				ctx.save();
				ctx.translate(-hT, -hT);
				ctx.fillStyle = radialGradient;
				ctx.arc(hT, hT, r, 0, Math.TAU);
				ctx.fill();
				ctx.restore();
			}
			
			ctx.restore();
		}
	}
}
