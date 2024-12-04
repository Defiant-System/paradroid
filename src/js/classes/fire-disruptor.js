
class Disruptor {
	constructor(cfg) {
		let { arena, owner, lineWidth, amplitude } = cfg,
			target = arena.player.target;

		this.arena = arena;
		this.owner = owner;
		this._fx = true;
		this.color = `#fff`;
		this.speed = 0.04;
		this.lineWidth = lineWidth || 5;
		this.amplitude = amplitude || 0.65;
		// this.start = owner.position.clone();
		// this.end = new Point(target.x, target.y);
		this.start = new Point(100, 100);
		this.end = new Point(300, 300);
		this.points = [];
		this.off = 0;
		this.ttl = 50;
		this.children = [];
		this.simplexNoise = new SimplexNoise;

		// if (this.lineWidth === 5) {
		// 	// thinner child lines
		// 	this.children = [...Array(2)].map(i => new Disruptor({ arena, owner, lineWidth: 4, amplitude: 0.65 }));
		// }

		// add to map entries
		this.arena.map.addItem(this);
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
			isChild = this.lineWidth < 5,
			length = this.start.distance(this.end),
			step = Math.max(length / 2, 25),
			normal = this.end.clone().subtract(this.start).normalize().scale(length / step),
			radian = normal.direction(),
			sinv   = _sin(radian),
			cosv   = _cos(radian),
			points = this.points = [],
			off    = this.off += Utils.random(this.speed, this.speed * 0.1),
			waveWidth = (isChild ? length * 1.5 : length) * this.amplitude;

		// count down ttl (Time To Live)
		if (!isChild && this.ttl-- <= 0) {
			let index = this.arena.map.entries.indexOf(this);
			this.arena.map.entries.splice(index, 1);
		}
		
		for (let i=0, len=step; i<len; i++) {
			let n = i / 60,
				av = waveWidth * this.noise(n - off, 0) * 0.5,
				ax = sinv * av,
				ay = cosv * av,
				bv = waveWidth * this.noise(n + off, 0) * 0.5,
				bx = sinv * bv,
				by = cosv * bv,
				m = _sin((_pi * (i / (len - 1)))),
				x = this.start.x + normal.x * i + (ax - bx) * m,
				y = this.start.y + normal.y * i - (ay - by) * m;
			points.push(new Point(x, y));
		}
		points.push(this.end.clone());

		this.children.map(child => child.update(delta));
	}

	render(ctx) {
		let points = this.points || [],
			len = points.length;

		// Blur
		ctx.save();
		ctx.globalCompositeOperation = "screen";
		ctx.fillStyle   = "#1155";
		// ctx.shadowColor = "#ddf";
		// ctx.shadowBlur  = 23;
		ctx.beginPath();

		points.map((point, i) => {
			let d = len > 1 ? point.distance(points[i === len - 1 ? i - 1 : i + 1]) : 0;
			ctx.moveTo(point.x + d, point.y);
			ctx.arc(point.x, point.y, d, 0, Math.TAU, false);
		});
		ctx.fill();
		ctx.restore();

		// electric
		ctx.save();
		ctx.lineWidth = Utils.random(this.lineWidth, 0.5);
		ctx.strokeStyle = this.color;
		ctx.beginPath();
		points.map((point, i) => ctx[i === 0 ? "moveTo" : "lineTo"](point.x, point.y));
		ctx.stroke();
		ctx.restore();
		

		if (this.lineWidth === 5) {
			ctx.save();
			ctx.globalCompositeOperation = "screen";
			ctx.fillStyle   = "#fff";
			// start dot
			ctx.beginPath();
			ctx.arc(this.start.x, this.start.y, 4, 0, Math.TAU);
			ctx.fill();

			// end dot
			ctx.beginPath();
			ctx.arc(this.end.x, this.end.y, 4, 0, Math.TAU);
			ctx.fill();
			ctx.restore();
		}

		// Draw children
		if (this.children) {
			this.children.map(child => child.render(ctx));
		}
	}
}
