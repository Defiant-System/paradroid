
class Player extends Droid {
	constructor(cfg) {
		super(cfg);

		// this.speed = .0015;
		this.isPlayer = true;
		this.isVisible = true;
		this.transfer = {
			value: 0,
		};
		// satellites
		this.satellite = {
			// ellipse radius
			vel: new Point(0, 0),
			rX: 20,
			rY: 17,
			list: [
				{ speed: 0.0015, rotateAngle: Math.PI },
				{ speed: 0.0015, rotateAngle: Math.PI * 1/3 },
				{ speed: 0.0015, rotateAngle: Math.PI * -1/3 },
			]
		};
		// a little bit blur
		this.blur = {
			color: "#00000055",
			size: 3,
		};
		// update label
		this.body.label = "player";

		// add crosshair
		this.crosshair = new Crosshair(cfg);

		this.input = {
			up:    { pressed: false, force: { x: 0, y: -1 } },
			left:  { pressed: false, force: { x: -1, y: 0 } },
			down:  { pressed: false, force: { x: 0, y: 1 } },
			right: { pressed: false, force: { x: 1, y: 0 } },
		};

		// create white versions of sprites
		Object.keys(this.sprites).map(k => {
			this.sprites[k] = this.assetToWhite(this.sprites[k]);
		});
	}

	assetToWhite(sprite) {
		// for BG sprite
		let w = sprite.width,
			h = sprite.height,
			{ cvs, ctx } = Utils.createCanvas(w, h);
		// draw orignal droid sprite
		ctx.drawImage(sprite, 0, 0);
		// change droid color
		ctx.globalCompositeOperation = "source-atop";
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, w, h);
		// replace sprite
		return cvs[0];
	}

	demote() {
		if (this.id === "001") {
			// remove this droid from map
			let index = this.arena.map.droids.indexOf(this);
			this.arena.map.droids.splice(index, 1)[0];
			this.health = -1;
			// wait until explosion animation is done
			setTimeout(() => {
				// player droid killed - show "game over"
				this.APP.mobile.dispatch({ type: "player-droid-destroyed" });
			}, 1500);
		} else {
			// demote player droid to "001"
			setTimeout(() => this.setId("001"), 100);
		}
	}

	setState(item) {
		let APP = paradroid;
		// console.log( item );
		switch (item.id) {
			case "recharge":
				if (this.health !== this._health) {
					// recharge player health
					this.health = this._health;
					// update player health bar
					this.APP.hud.dispatch({ type: "progress-update", health: 1 });
				}
				break;
			case "exit":
			case "console":
				this.nextTo = item;
				break;
			case "clear":
				delete this.nextTo;
				break;
			case "transfer":
				this.transfer.active = item.active;
				break;
		}
	}

	spawn(cfg) {
		super.spawn(cfg);
	}

	update(delta, time) {
		// USER input
		let force = { x: 0, y: 0 };
		for (let key in this.input) {
			if (this.input[key].pressed) {
				let f = this.input[key].force;
				if (!f) return;
				if (f.x != 0) force.x = f.x;
				if (f.y != 0) force.y = f.y;
			}
		}
		this.move(force);

		// transfer mode (satellite radius)
		if (this.transfer.active) {
			if (this.transfer.value === 0) {
				// reset sattelite cener
				this.satellite.center = this.position.clone();
			}
			this.transfer.value += .1;
			if (this.transfer.value > 1) this.transfer.value = 1;
		} else if (this.transfer.value > 0) {
			this.transfer.value -= .1;
			if (this.transfer.value < 0) this.transfer.value = 0;
		}

		if (this.transfer.value > 0) {
			let satellite = this.satellite,
				dir = satellite.center.subtract(this.position),
				val = this.transfer.value * 8;
			dir = dir.normalize().multiply(1.85);
			satellite.center = satellite.center.subtract(dir);
			satellite.vel = dir;
			// calculate satellite positions
			satellite.list.map(sat => {
				sat.currentAngle = (time * sat.speed) + sat.rotateAngle;
				sat.x = satellite.vel.x + ((satellite.rX + val) * Math.cos(sat.currentAngle));
				sat.y = satellite.vel.y + ((satellite.rY + val) * Math.sin(sat.currentAngle));
			});
		}

		// update crosshair
		this.crosshair.update(delta, time);

		super.update(delta);
	}

	render(ctx) {
		super.render(ctx);

		if (this.transfer.value > 0) {
			let arena = this.arena,
				satellite = this.satellite,
				val = this.transfer.value * 8,
				cX = arena.viewport.half.w,
				cY = arena.viewport.half.h - 1;
			// Draw the satellite
			ctx.save();
			ctx.translate(cX, cY);
			ctx.lineWidth = 2;
			ctx.strokeStyle = "#fff";
			// three strokes
			satellite.list.map(sat => {
				// mist
				ctx.save();
				ctx.translate(sat.x, sat.y);
				ctx.rotate(sat.currentAngle);
				ctx.drawImage(arena.assets.mist.img, -7, -15, 14, 30);
				ctx.restore();
				// line
				ctx.beginPath();
				ctx.ellipse(satellite.vel.x,
					satellite.vel.y,
					satellite.rX + val,
					satellite.rY + val,
					0,
					sat.currentAngle - .5,
					sat.currentAngle + .5);
				ctx.stroke();
			});
			ctx.restore();
		}

		// render crosshair
		this.crosshair.render(ctx);
	}
}
