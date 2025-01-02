
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
				value = event.anim === "none" ? "no-anim" : "view-anim";
				Self.els.el.removeClass("no-anim").addClass(value);
				break;
			case "show-briefing":
				APP.dispatch({ type: "switch-to-view", arg: "briefing" });
				break;
			case "start-game":
				console.log(event);
				break;
			case "toggle-music":
				value = event.el.hasClass("off");
				
				// play/pause chiptune
				if (value) window.audio.play("cydonian");
				else window.audio.stop("cydonian");

				event.el.toggleClass("off", value);
				break;
			case "toggle-sound-fx":
				value = event.el.hasClass("off");
				event.el.toggleClass("off", value);
				break;
		}
	}
}
