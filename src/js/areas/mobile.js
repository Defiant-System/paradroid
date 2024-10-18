
// paradroid.mobile

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			cvs: window.find(".mobile-view canvas.game"),
		};
		// create arena
		this.arena = new Arena(this.els.cvs);
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.mobile,
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
