
// paradroid.lift

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			el: window.find(".lift-view"),
		};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.lift,
			levels,
			index,
			el;
		// console.log(event);
		switch (event.type) {
			// system events
			case "window.keydown":
				switch (event.char) {
					case "up":
						el = Self.els.el.find(".lift.active");
						levels = el.data("levels").split(",");
						index = levels.indexOf(el.data("deck"));
						if (!levels[index-1]) return;
						// console.log(`current: ${levels[index]} - go up: ${levels[index-1]}`);
						console.log(`Level: ${levels[index-1]}`);
						el.data({ deck: levels[index-1] });
						break;
					case "down":
						el = Self.els.el.find(".lift.active");
						levels = el.data("levels").split(",");
						index = levels.indexOf(el.data("deck"));
						if (!levels[index+1]) return;
						// console.log(`current: ${levels[index]} - go down: ${levels[index+1]}`);
						console.log(`Level: ${levels[index+1]}`);
						el.data({ deck: levels[index+1] });
						break;
					// temp for dev purposes
					case "left":
						el = Self.els.el.find(".lift.active");
						index = +el.data("id");
						Self.els.el.find(`.lift[data-id="${index-1}"]`).trigger("click");
						break;
					case "right":
						el = Self.els.el.find(".lift.active");
						index = +el.data("id");
						Self.els.el.find(`.lift[data-id="${index+1}"]`).trigger("click");
						break;
				}
				break;
			// custom events
			case "select-lift":
				el = $(event.target);
				if (!el.hasClass("lift")) return;
				Self.els.el.find(".lift.active").removeClass("active");
				el.addClass("active");

				console.log(`Level: ${el.data("deck")}`);
				break;
		}
	}
}
