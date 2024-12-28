
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
				event.el.find(".active").removeClass("active");
				el = $(event.target).addClass("active");
				break;
		}
	}
}
