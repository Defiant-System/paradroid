
// paradroid.start

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			el: window.find("content .start-view"),
		};
		// music info
		this.tune = { name: "tune-1" };
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
				el.toggleClass("off", value);
				// play sound fx
				window.audio.play("click");
				
				if (!Self.tune.song) {
					let opt = {
							onend: e => {
								if (!Self.tune.song) return;

								let [a, b] = Self.tune.name.split("-");
								b = (+b) + 1;
								// next tune
								if (b > 4) b = 1;
								Self.tune.name = "tune-"+ b;
								// play next song
								playSong();
							}
						},
						playSong = () => window.audio.play(Self.tune.name, opt).then(song => Self.tune.song = song);
					playSong();
				} else {
					Self.tune.song.stop();
					delete Self.tune.song;
				}
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
			case "toggle-controls":
				el = Self.els.content.find(`.bar[data-click="toggle-controls"]`);
				value = el.hasClass("off");
				el.toggleClass("off", value);
				// toggle controls
				APP.hud.els.controls.toggleClass("off", value);
				// play sound fx
				window.audio.play("click");
				break;
		}
	}
}
