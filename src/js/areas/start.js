
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
				Self.els.el.addClass("view-anim");
				break;
		}
	}
}
