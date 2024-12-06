
class Electric {
	constructor(cfg) {
		let { arena, owner, color, lineWidth, droid, amplitude } = cfg,
			vPoint = { x: arena.viewport.x, y: arena.viewport.y },
			origin = arena.player.position.clone().add(vPoint),
			target = droid.position.add({ x: arena.viewport.x, y: arena.viewport.y });
		
		this.arena = arena;
		this.owner = owner;
		this._fx = true; // map renders this last
		this.speed = 0.2;
		this.color = color || "#fff";
		this.lineWidth = lineWidth || 2;
		this.amplitude = amplitude || 0.7;
		this.origin = origin.moveTowards(target, 23);
		this.target = target.moveTowards(origin, 23);
		this.droid = droid;
		this.points = [];
		this.ttl = 12;
		this.simplexNoise = new SimplexNoise;

		if (this.lineWidth === 2) {
			// thinner child lines
			this.children = [...Array(2)].map(i => new Electric({ ...cfg, color: `${color}9`, lineWidth: 1, amplitude: 0.8 }));
			// add to map entries
			this.arena.map.addItem(this);
		}
	}

	noise(v) {
		let amp = 1,
			sum = 0,
			f = 1;
		for (let i=0; i<6; ++i) {
			amp *= 0.5;
			sum += amp * (this.simplexNoise.noise2D(v * f, 0) + 1) * 0.5;
			f *= 2;
		}
		return sum;
	}

	update(delta) {
		let arena = this.arena,
			_sin = Math.sin,
			_cos = Math.cos,
			_pi = Math.PI,
			length = this.origin.distance(this.target),
			step = Math.max(length / 2, 25),
			normal = this.target.clone().subtract(this.origin).norm().scale(length / step),
			radian = normal.direction(),
			sinv   = _sin(radian),
			cosv   = _cos(radian),
			points = this.points = [],
			off    = Utils.random(this.speed, this.speed * 0.1),
			waveWidth = (!this.children ? length * 1.5 : length) * this.amplitude;

		for (let i=0, len=step; i<len; i++) {
			let n = i / 60,
				av = waveWidth * this.noise(n - off, 0) * 0.5,
				ax = sinv * av,
				ay = cosv * av,
				bv = waveWidth * this.noise(n + off, 0) * 0.5,
				bx = sinv * bv,
				by = cosv * bv,
				m = _sin((_pi * (i / (len - 1)))),
				x = this.origin.x + normal.x * i + (ax - bx) * m,
				y = this.origin.y + normal.y * i - (ay - by) * m;
			points.push({ x, y });
		}
		points.push(this.target.clone());

		// freeze droid while being "zapped"
		this.droid.freeze = true;

		// count down ttl (Time To Live)
		if (this.children) {
			this.children.map(child => child.update(delta));
			if (this.ttl-- <= 0) {
				let index = arena.map.entries.indexOf(this);
				arena.map.entries.splice(index, 1);
				// unfreeze droid
				this.droid.freeze = false;
			}
		}
	}

	render(ctx) {
		let points = this.points || [],
			len = points.length;
		// electric
		ctx.save();
		ctx.lineWidth = this.lineWidth;
		ctx.strokeStyle = this.color;
		ctx.beginPath();
		points.map((point, i) => ctx[i === 0 ? "moveTo" : "lineTo"](point.x, point.y));
		ctx.stroke();
		ctx.restore();
		
		if (this.children) {
			// ctx.save();
			// // ctx.globalCompositeOperation = "screen";
			// ctx.fillStyle   = "#fff";
			// // start dot
			// ctx.beginPath();
			// ctx.arc(this.origin.x, this.origin.y, 4, 0, Math.TAU);
			// ctx.fill();

			// // end dot
			// ctx.beginPath();
			// ctx.arc(this.target.x, this.target.y, 4, 0, Math.TAU);
			// ctx.fill();
			// ctx.restore();

			// Draw children
			this.children.map(child => child.render(ctx));
		}
	}
}
