
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
				el = Self.els.el.find(".lift.active");
				levels = el.data("decks").split(",");
				index = levels.indexOf(el.data("deck"));
				switch (event.char) {
					case "up":
						console.log(`current: ${levels[index]} - go: ${levels[index-1]}`);
						el.data({ deck: levels[index-1] });
						break;
					case "down":
						console.log(`current: ${levels[index]} - go: ${levels[index+1]}`);
						el.data({ deck: levels[index+1] });
						break;
				}
				break;
			// custom events
			case "select-lift":
				el = $(event.target);
				if (!el.hasClass("lift")) return;
				Self.els.el.find(".lift.active").removeClass("active");
				el.addClass("active");
				break;
		}
	}
}
