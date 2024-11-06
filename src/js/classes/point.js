
class Point {
	constructor(x, y) {
		this._x = x;
		this._y = y;
	}

	get x() {
		return this._x;
	}

	set x(v) {
		this._x = v;
	}

	get y() {
		return this._y;
	}

	set y(v) {
		this._y = v;
	}

	distance(point) {
		var myX = this._x - point._x;
        var myY = this._y - point._y;
        return Math.sqrt(myX * myX + myY * myY);			
	}

	direction(point) {
		var myX = point ? point._x - this._x : this._x,
			myY = point ? point._y - this._y : this._y;
   		return Math.atan2(myY, myX);
	}

	moveTowards(point, step) {
		let angle = this.direction(point);
		this._x += Math.cos(angle) * step;
		this._y += Math.sin(angle) * step;
		return this;
	}

	abs() {
		this._x = Math.abs(this._x);
		this._y = Math.abs(this._y);
		return this;
	}

	dot(p) {
		return this.x * p.x + this.y * p.y;
	}

	magnitude() {
		return Math.sqrt(this._x * this._x + this._y * this._y);
	}

	setMagnitude(n) {
		return this.normalize().multiply(n);
	}

	normalize(thickness) { 
		var length = Math.sqrt(this._x * this._x + this._y * this._y),
			myInversed = 1 / length;
		this._x *= myInversed,
		this._y *= myInversed;
		return this;
	}

	add(point) {
		return new Point(this._x + point._x, this._y + point._y);
	}

	subtract(point) {
		return new Point(this._x - point._x, this._y - point._y);
	}

	multiply(value) {
		return new Point(this._x * value, this._y * value);
	}

	divide(value) {
		return new Point(this._x / value, this._y / value);
	}

	empty() {
		this._x = 0;
		this._y = 0;
		return this;
	}

	clone() {
		return new Point(this._x, this._y);
	}

	copy(point) {
		this._x = point._x;
		this._y = point._y;
		return this;
	}

	toString() {
		return `${this._x}, ${this._y}`
	}
}
