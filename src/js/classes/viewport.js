
class Viewport {
	constructor(cfg) {
		let { arena, x, y, w, h } = cfg;
		
		this.arena = arena;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		// screen shake options
		this.shake = {
			maxAngle: 35,
			maxOffsetX: 50,
			maxOffsetY: 50,
			duration: 30, // The amount of updates until trauma goes from 1 to 0

			angle: 0,
			offsetX: 0,
			offsetY: 0,
			currentTrauma: 0,

			anglePerlin: new SimplexNoise,
			offsetXPerlin: new SimplexNoise,
			offsetYPerlin: new SimplexNoise,
			traumaReductionPerUpdate: .03, // (1 / duration)
		};

		// mid point of viewport
		this.half = { w: w >> 1, h: h >> 1 };
	}

	addShake(trauma) {
		this.shake.currentTrauma = Math.min(this.shake.currentTrauma + trauma, 1);
	}

	update(delta, time) {
		if (this.shake.currentTrauma < .01) {
			this.shake.angle = 0;
			this.shake.offsetX = 0;
			this.shake.offsetY = 0;
			this.shake.currentTrauma = 0;
			return;
		}

		let shake = this.shake.currentTrauma ** 2;
		this.shake.angle = this.shake.maxAngle * shake * this.shake.anglePerlin.noise2D(time, 1);
		this.shake.offsetX = this.shake.maxOffsetX * shake * this.shake.offsetXPerlin.noise2D(time, 1);
		this.shake.offsetY = this.shake.maxOffsetY * shake * this.shake.offsetYPerlin.noise2D(time, 1);

		this.shake.currentTrauma = Math.max(this.shake.currentTrauma - this.shake.traumaReductionPerUpdate, 0);
	}

	center() {
		let arena = this.arena,
			centerX = this.half.w - arena.player.body.position.x + this.shake.offsetX,
			centerY = this.half.h - arena.player.body.position.y + this.shake.offsetY;
		this.scroll(centerX, centerY);
	}

	scroll(x, y) {
		this.x = x;
		this.y = y;
	}
}
