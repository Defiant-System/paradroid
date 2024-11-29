
class Exit {
	constructor(cfg) {
		let { arena, section, x, y } = cfg,
			tile = arena.config.tile,
			pX = (x + .5) * tile,
			pY = (y + .5) * tile;
		
		this.arena = arena;
		this.section = section;
		this.x = x;
		this.y = y;
		this.pos = new Point(pX, pY);

		// "aura" borealis
		this.aura = {
			color: [255, 100, 255],
			strength: 1,
			radius: 100,
		};
	}

	update(delta) {
		let dist = this.pos.distance(this.arena.player.body.position);
		if (dist < 32) {
			let info = { x: this.x, y: this.y };
			this.arena.player.setState({ id: "exit", section: this.section, ...info });
			this.active = true;
		} else if (this.active) {
			delete this.active;
			this.arena.player.setState({ id: "clear" });
		}
	}

	render(ctx) {
		if (this.active) {
			let arena = this.arena,
				viewport = arena.viewport,
				x = this.pos.x + viewport.x,
				y = this.pos.y + viewport.y,
				hT = arena.config.tile >> 1,
				aura = this.aura,
				radialGradient = ctx.createRadialGradient(hT, hT, 0, hT, hT, aura.radius);
			radialGradient.addColorStop(0, `rgba(${aura.color.join(",")}, ${aura.strength})`);
			radialGradient.addColorStop(1, `rgba(${aura.color.join(",")}, 0)`);

			ctx.save();
			ctx.globalCompositeOperation = "hard-light";
			ctx.translate(x-hT, y-hT);
			ctx.beginPath();
			ctx.fillStyle = radialGradient;
			ctx.arc(hT, hT, aura.radius, 0, Math.TAU);
			ctx.fill();
			ctx.restore();
		}
	}
}
