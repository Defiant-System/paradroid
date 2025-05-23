
class Console {
	constructor(cfg) {
		let { arena, section, x, y, w, h } = cfg,
			tile = arena.config.tile,
			pX = (x + .5) * tile,
			pY = (y + .5) * tile;
		
		this.arena = arena;
		this.section = section;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.pos = new Point(pX, pY);

		// "aura" borealis
		this.aura = {
			color: [255, 200, 50],
			strength: .65,
			radius: 100,
		};
	}

	update(delta) {
		let dist = this.pos.distance(this.arena.player.body.position);
		if (dist < 32) {
			let info = { x: this.x, y: this.y, w: this.w, h: this.h };
			this.arena.player.setState({ id: "console", section: this.section, ...info });
			this.active = true;
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
		if (arena.debug.mode < 2) {
			ctx.save();
			ctx.translate(x, y);

			if (this.active) {
				let hT = tile >> 1,
					aura = this.aura,
					radialGradient = ctx.createRadialGradient(hT, hT, 0, hT, hT, aura.radius);
				radialGradient.addColorStop(0, `rgba(${aura.color.join(",")}, ${aura.strength})`);
				radialGradient.addColorStop(1, `rgba(${aura.color.join(",")}, 0)`);

				ctx.save();
				ctx.globalCompositeOperation = "hue";
				ctx.translate(-hT, -hT);
				ctx.beginPath();
				ctx.fillStyle = radialGradient;
				ctx.arc(hT, hT, aura.radius, 0, Math.TAU);
				ctx.fill();
				ctx.restore();
			}
			
			ctx.restore();
		}
	}
}
