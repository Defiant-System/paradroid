
// paradroid.hud

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			el: window.find(".hud-view"),
			barLeft: window.find(".left"),
			barRight: window.find(".right"),
			btnRight: window.find(".right .cube-title"),
			progress: window.find(".progress"),
		};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.hud,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// custom events
			case "toggle-play-pause":
				el = Self.els.btnRight;
				value = el.text();
				el.html(el.data("toggle"));
				el.data({ toggle: value });
				if (Self.els.barRight.hasClass("paused") && !event.pause) {
					Self.els.barRight.removeClass("paused");
					// resume game
					APP.mobile.dispatch({ type: "game-loop-resume" });
				} else {
					Self.els.barRight.addClass("paused");
					// pause game
					APP.mobile.dispatch({ type: "game-loop-pause" });
				}
				break;
			case "set-view-title":
				if (event.name) value = event.name;
				else {
					el = Self.els.content.find(`> div[data-area="${Self.els.content.data("show")}"]`);
					value = el.data("name");
				}
				if (value) Self.els.el.find(".view-title").html(value);
				break;
			case "set-level-data":
				el = Self.els.barLeft.find(".box");
				value = event.percentage !== undefined ? event.percentage : parseInt(el.cssProp("--val"), 10) / 100;
				el.css({
					"--val": `${value * 100}%`,
					"--c1": event.background,
				});
				break;
			case "progress-update":
				if (event.level !== undefined) Self.els.progress.find(`.box-track[data-id="level"]`).css({ "--val": event.level });
				if (event.health !== undefined) Self.els.progress.find(`.box-track[data-id="health"]`).css({ "--val": event.health });
				if (event.reject !== undefined) {
					// el = Self.els.progress.find(`.box-track[data-id="reject"]`);
					// // set speed
					// el.css({ "--speed": event.reject +"ms" });
					// setTimeout(() => el.css({ "--val": 0 }), 310);
				}

				// all droids killed - turn off lights
				if (event.level === 0) APP.mobile.dispatch({ type: "toggle-lights", off: true });
				break;
			case "choose-color":
				Self.els.barLeft
					.addClass("choose-color")
					.cssSequence("color-timer", "transitionend", el => {
						event.callback();
					});
				break;
			case "hacking-progress":
				Self.els.barLeft
					.removeClass("choose-color color-timer")
					.addClass("hacking-game")
					.cssSequence("hack-timer", "transitionend", el => {
						event.callback();
					});
				break;
			case "reset-choose-color":
				// reset hud
				Self.els.barLeft
					.removeClass("choose-color color-timer hacking-game hack-timer")
					.cssSequence("reset", "transitionend", el => {
						el.removeClass("reset");
						event.callback();
					});
				break;
		}
	}
}
