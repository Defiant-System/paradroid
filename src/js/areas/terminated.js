
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
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// custom events
			case "put-tile":
				break;
		}
	}
}
