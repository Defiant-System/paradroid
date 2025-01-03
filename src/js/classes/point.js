
class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	distance(point) {
		var myX = this.x - point.x;
        var myY = this.y - point.y;
        return Math.sqrt(myX * myX + myY * myY);			
	}

	direction(point) {
		var myX = point ? point.x - this.x : this.x,
			myY = point ? point.y - this.y : this.y;
   		return Math.atan2(myY, myX);
	}

	moveTowards(point, step) {
		let angle = this.direction(point);
		this.x += Math.cos(angle) * step;
		this.y += Math.sin(angle) * step;
		return this;
	}

	limit(scalar) {
		return this.normalize().multiply(Math.min(this.magnitude(), scalar));
	}

	abs() {
		this.x = Math.abs(this.x);
		this.y = Math.abs(this.y);
		return this;
	}

	dot(p) {
		return this.x * p.x + this.y * p.y;
	}

	magnitude() {
		var x = this.x,
			y = this.y;
		return Math.sqrt(x * x + y * y);
	}

	setMagnitude(n) {
		return this.normalize().multiply(n);
	}

	scale(s) {
		this.x *= s;
		this.y *= s;
        return this;
	}

	normalize() { 
		var m = this.magnitude();
		if (m > 0) this.divide(m);
        return this;
	}

	norm() { 
		var m = this.magnitude();
		if (m > 0) return this.divide(m);
        return this;
	}

	add(point) {
		if (point.constructor === Number) point = { x: point, y: point };
		return new Point(this.x + point.x, this.y + point.y);
	}

	subtract(point) {
		if (point.constructor === Number) point = { x: point, y: point };
		return new Point(this.x - point.x, this.y - point.y);
	}

	multiply(value) {
		return new Point(this.x * value, this.y * value);
	}

	divide(value) {
		return new Point(this.x / value, this.y / value);
	}

	empty() {
		this.x = 0;
		this.y = 0;
		return this;
	}

	clone() {
		return new Point(this.x, this.y);
	}

	copy(point) {
		this.x = point.x;
		this.y = point.y;
		return this;
	}

	toString() {
		return `${this.x}, ${this.y}`
	}
}
