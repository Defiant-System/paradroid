
// paradroid.briefing

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
		};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.briefing,
			el;
		// console.log(event);
		switch (event.type) {
			// custom events
			case "select-page":
				el = $(event.target);
				if (!el.hasClass("page") || el.hasClass("active")) return;
				event.el.find(".active").removeClass("active");
				el.addClass("active");
				break;
		}
	}
}
