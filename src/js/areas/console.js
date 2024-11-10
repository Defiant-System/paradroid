
// paradroid.console

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			el: window.find(".console-view"),
		};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.console,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// system events
			case "window.keydown":
				let active = Self.els.el.find(".option.active"),
					options = Self.els.el.find(".option"),
					index = active.index();
				switch (event.char) {
					case "return":
						break;
					case "up":
						active.removeClass("active");
						index = Math.max(index - 1, 0);
						options.get(index).addClass("active");
						break;
					case "down":
						active.removeClass("active");
						index = Math.min(index + 1, options.length-1);
						options.get(index).addClass("active");
						break;
				}
				break;
			// custom events
			case "select-view":
				Self.els.el.find(".option.active").removeClass("active");
				// make lift active
				el = $(event.target).addClass("active");
				console.log( el.data("view") );
				break;
		}
	}
}
