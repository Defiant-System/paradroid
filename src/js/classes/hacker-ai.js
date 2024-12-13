
class HackerAI {
	constructor(cfg) {
		let { id, el, owner } = cfg;

		this.id = id;
		this.el = el;
		this.owner = owner;
		this.pEl = el.parent();

		// create FPS controller
		let Self = this;
		this.fpsControl = karaqu.FpsControl({
			fps: 6,
			autoplay: true,
			callback(time, delta) {
				Self.tick();
			}
		});
		// this.fpsControl.start();
	}

	setOrder(arr) {
		this.order = arr;
	}

	chooseConn() {
		if (this.order) {
			this.target = this.order.shift();
		} else {
			let available = this.pEl.find(".io .toggler > div:not(.active)").map(el => $(el).index()+1);
			// remove first / entry position
			available = available.slice(1);
			// set target
			this.target = available[Utils.randomInt(0, available.length)];
		}
	}

	gotoConn() {
		let toggler = this.pEl.find(".io .toggler"),
			index = +toggler.data("active");
		if (index < this.target) {
			toggler.data({ active: index + 1 });
		} else {
			// trigger connection row
			this.owner.dispatch({ type: "toggle-io-row", el: toggler, index });
			// if there are more "ammo", reset and go again
			let ammo = toggler.parent().parent().find(".ammo");
			if (+ammo.data("left") >= 0) delete this.target;
			else this.fpsControl.stop();
		}
	}

	tick() {
		if (!this.target) this.chooseConn();
		else this.gotoConn();
	}
}
