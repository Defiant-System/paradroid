
// paradroid.terminated

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
		};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.terminated,
			el;
		// console.log(event);
		switch (event.type) {
			// custom events
			case "window.keydown":
				// reset css/view
				Self.els.content.cssSequence("leave", "transitionend", el => {
					// reset element
					el.removeClass("leave");
					// animate / switch to view
					APP.dispatch({ type: "show-view", arg: "start" });
				});
				break;
		}
	}
}
