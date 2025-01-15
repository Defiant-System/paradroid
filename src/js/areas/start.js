
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
				// play sound fx
				window.audio.play("click");
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
				// play sound fx
				window.audio.play("click");
				// reset css/view
				Self.els.content.cssSequence("leave", "transitionend", el => {
					// reset start view
					Self.els.el.removeClass("no-anim").addClass("view-anim");
					// animate / switch to view
					APP.dispatch({ type: "switch-to-view", arg: "mobile", done() { el.removeClass("leave"); } });
				});
				break;
			case "toggle-music":
				el = Self.els.content.find(`.bar[data-click="toggle-music"]`);
				value = el.hasClass("off");
				
				if (!Self.song) {
					let opt = {
						onend: e => {
							// turn "off" button
							Self.els.content.find(`.bar[data-click="toggle-music"]`).addClass("off");
							// reset reference
							delete Self.song;
						}
					};
					window.audio.play("tune-1", opt).then(song => Self.song = song);
				} else {
					Self.song.stop();
					delete Self.song;
				}

				// play sound fx
				window.audio.play("click");

				el.toggleClass("off", value);
				break;
			case "toggle-sound-fx":
				el = Self.els.content.find(`.bar[data-click="toggle-sound-fx"]`);
				value = el.hasClass("off");
				el.toggleClass("off", value);
				// toggle "mute"
				window.audio.mute = !value;
				// play sound fx
				window.audio.play("click");
				break;
		}
	}
}
