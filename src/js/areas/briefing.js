
// paradroid.briefing

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			el: window.find("briefing-view"),
		};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.briefing,
			el;
		// console.log(event);
		switch (event.type) {
			// custom events
			case "goto-start":
				// play sound fx
				window.audio.play("click");
				// reset css/view
				Self.els.content.cssSequence("leave", "transitionend", el => {
					// reset element
					el.removeClass("leave");
					// animate / switch to view
					APP.dispatch({ type: "switch-to-view", arg: "start" });
				});
				break;
			case "show-controls":
				Self.els.el.find(".page.controls").trigger("click");
				break;
			case "select-page":
				el = $(event.target);
				if (!el.hasClass("page") || el.hasClass("active")) return;
				event.el.find(".active").removeClass("active");
				el.addClass("active");
				// play sound fx
				window.audio.play("ring");
				break;
		}
	}
}
