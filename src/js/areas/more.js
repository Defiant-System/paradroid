
// paradroid.more

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
		};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.more,
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
