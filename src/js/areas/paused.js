
// paradroid.paused

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
		};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.paused,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// custom events
			case "init-view":
				break;
			case "toggle-music":
			case "toggle-sound-fx":
			case "toggle-controls":
				// forward event
				APP.start.dispatch(event);
				break;
		}
	}
}
