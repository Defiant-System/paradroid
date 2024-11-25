
class Recharge {
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
		this.angle = 0;
		this.freq = 0;

		// "aura" borealis
		this.aura = {
			color: [50, 255, 50],
			strength: .35,
			radius: 100,
		};
	}

	update(delta) {
		let dist = this.pos.distance(this.arena.player.body.position);
		if (dist < 32) {
			let info = { x: this.x, y: this.y };
			this.arena.player.setState({ id: "recharge", section: this.section, ...info });
			this.active = true;
		} else if (this.active) {
			delete this.active;
			this.arena.player.setState({ id: "clear" });
		}

		this.angle = (this.angle+2) % 360;
		this.freq += .03;
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport,
			tile = arena.config.tile,
			x = this.pos.x - tile + viewport.x,
			y = this.pos.y - tile + viewport.y,
			rad = (this.angle * Math.PI) / 180,
			args = [arena.assets["big-map"].img, 0, 257, 14, 14, -7, -7, 14, 14],
			r;

		ctx.save();
		ctx.fillStyle = arena.colors.light +"cc";
		ctx.translate(x, y);

		// normal draw if debug mode is < 2
		if (arena.debug.mode < 2) {
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

			if (this.active) {
				let hT = tile >> 1,
					r = this.aura.radius,
					radialGradient = ctx.createRadialGradient(hT, hT, 0, hT, hT, r);
				radialGradient.addColorStop(0, `rgba(${this.aura.color.join(",")}, ${this.aura.strength})`);
				radialGradient.addColorStop(1, `rgba(${this.aura.color.join(",")}, 0)`);

				ctx.save();
				ctx.translate(hT, hT);
				ctx.fillStyle = radialGradient;
				ctx.arc(hT, hT, r, 0, Math.TAU);
				ctx.fill();
				ctx.restore();
			}
		}

		// if debug mode on, draw extras
		if (arena.debug.mode >= 1) {
			ctx.save();
			ctx.lineWidth = 3;
			ctx.strokeStyle = "#00000066";
			ctx.beginPath();
			ctx.roundRect(5, 5, 54, 54, 8);
			ctx.stroke();
			ctx.restore();
		}

		ctx.restore();
	}
}
