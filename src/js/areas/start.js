
// paradroid.start

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			el: window.find("content .start-view"),
		};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.start,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// custom events
			case "init-anim":
				Self.els.el.removeClass("no-anim").addClass("view-anim");
				break;
			case "toggle-music":
			case "toggle-sound-fx":
				value = event.el.hasClass("off");
				event.el.toggleClass("off", value);
				break;
		}
	}
}
