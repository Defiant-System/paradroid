
class Disruptor {
	constructor(cfg) {
		let { arena, owner, color, lineWidth, amplitude } = cfg,
			vPoint = { x: arena.viewport.x, y: arena.viewport.y },
			origin = arena.player.position.clone().add(vPoint),
			target = arena.player.target.clone().add(vPoint);

		this.arena = arena;
		this.owner = owner;
		this._fx = true; // map renders this last
		this.speed = 0.04;
		this.color = color || "#fff";
		this.lineWidth = lineWidth || 4;
		this.amplitude = amplitude || 0.65;
		this.origin = origin;
		this.target = target;
		// this.origin = new Point(100, 100);
		// this.end = new Point(300, 300);
		this.points = [];
		this.ttl = 21;
		this.simplexNoise = new SimplexNoise;

		let angle = origin.direction(target);
		this.origin.x += Math.cos(angle) * 23;
		this.origin.y += Math.sin(angle) * 23;

		if (this.lineWidth === 4) {
			// thinner child lines
			this.children = [...Array(2)].map(i => new Disruptor({ arena, owner, color: "#fff8", lineWidth: 2, amplitude: 0.75 }));
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
		let _sin = Math.sin,
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
			points.push(new Point(x, y));
		}
		points.push(this.target.clone());

		// count down ttl (Time To Live)
		if (this.children) {
			this.children.map(child => child.update(delta));
			if (this.ttl-- <= 0) {
				let index = this.arena.map.entries.indexOf(this);
				this.arena.map.entries.splice(index, 1);
			}
		}
	}

	render(ctx) {
		let points = this.points || [],
			len = points.length;
		// Blur
		// ctx.save();
		// ctx.globalCompositeOperation = "screen";
		// ctx.fillStyle   = "#fff2";
		// ctx.beginPath();
		// points.map((point, i) => {
		// 	let d = len > 1 ? point.distance(points[i === len - 1 ? i - 1 : i + 1]) : 0;
		// 	ctx.moveTo(point.x + d, point.y);
		// 	ctx.arc(point.x, point.y, d, 0, Math.TAU);
		// });
		// ctx.fill();
		// ctx.restore();

		// electric
		ctx.save();
		ctx.lineWidth = Utils.random(this.lineWidth, 0.5);
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
