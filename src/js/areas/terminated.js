
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
			// system events
			case "window.keydown":
				// reset css/view
				Self.els.content.cssSequence("leave", "transitionend", el => {
					// reset element
					el.removeClass("leave");
					// flag will restart the game
					APP.mobile._started = false;
					// animate / switch to view
					APP.dispatch({ type: "show-view", arg: "start", anim: "none" });
				});
				break;
			// gamepad events
			case "gamepad.down":
				Self.dispatch({ type: "window.keydown", char: "return" });
				break;
			// custom events
			case "init-view":
				// console.log(event);
				break;
		}
	}
}
