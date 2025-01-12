
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
				// reset css/view
				Self.els.content.cssSequence("leave", "transitionend", el => {
					// reset element
					el.removeClass("leave");
					// reset start view
					Self.els.el.removeClass("no-anim").addClass("view-anim");
					// animate / switch to view
					APP.dispatch({ type: "switch-to-view", arg: "briefing" });
				});
				break;
			case "start-game":
				// reset css/view
				Self.els.content.cssSequence("leave", "transitionend", el => {
					// reset start view
					Self.els.el.removeClass("no-anim").addClass("view-anim");
					// reset game
					APP.mobile.dispatch({ type: "reset-game-player" });
					// animate / switch to view
					APP.dispatch({ type: "switch-to-view", arg: "mobile", done() { el.removeClass("leave"); } });
				});
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
