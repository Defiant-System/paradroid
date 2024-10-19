
class Droid {
	constructor(cfg) {
		let { arena, id, x, y } = cfg;

		this.arena = arena;
		this.id = id;
		this.pos = { x, y };
		this.tile = { x, y };

		let adjust = {
			"001": { a: 1, b: 1, c: 0 },
			"123": { a: 0, b: -2, c: -1 },
			"139": { a: 1, b: -1, c: -1 },
			"247": { a: 1, b: 1, c: 0 },
			"249": { a: 1, b: 1, c: 1 },
			"296": { a: 2, b: 2, c: 2 },
			"302": { a: 0, b: 0, c: 0 },
			"329": { a: 1, b: 1, c: 1 },
			"420": { a: -1, b: -1, c: -1 },
			"476": { a: 1, b: 0, c: -1 },
			"493": { a: 0, b: 0, c: 0 },
			"516": { a: 2, b: 0, c: -2 },
			"571": { a: 2, b: 2, c: 0 },
			"598": { a: 0, b: 0, c: 0 },
			"614": { a: 2, b: 0, c: -2 },
			"615": { a: 0, b: -2, c: -2 },
			"629": { a: 0, b: 0, c: 0 },
			"711": { a: 2, b: 2, c: 0 },
			"742": { a: 1, b: 0, c: 0 },
			"751": { a: 2, b: 2, c: 0 },
			"821": { a: 1, b: 2, c: 0 },
			"834": { a: 0, b: 0, c: 0 },
			"883": { a: -1, b: -1, c: -1 },
			"999": { a: 0, b: 0, c: 0 },
		};

		this.digits = this.id.toString().split("").map((x, i) => {
			return {
				x: +x * 28,
				l: (i * 15) + adjust[this.id][String.fromCharCode(97+i)],
			};
		});
	}

	move(x, y) {

	}

	update() {

	}

	render(ctx) {
		let assets = this.arena.assets,
			digits = this.digits;

		ctx.save();
		ctx.translate(100, 100);

		// top + bottom caps
		ctx.drawImage(assets["droid"].img,
			0, 0, 90, 90,
			0, 0, 45, 45
		);
		// digits
		ctx.drawImage(assets["digits"].img,
			this.digits[0].x, 0, 28, 32,
			this.digits[0].l, 15, 14, 16
		);
		ctx.drawImage(assets["digits"].img,
			this.digits[1].x, 0, 28, 32,
			this.digits[1].l, 15, 14, 16
		);
		ctx.drawImage(assets["digits"].img,
			this.digits[2].x, 0, 28, 32,
			this.digits[2].l, 15, 14, 16
		);
		
		ctx.restore();
	}
}
