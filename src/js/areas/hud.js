
// paradroid.hud

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			el: window.find(".hud-view"),
			barLeft: window.find(".hud-view .left"),
			barRight: window.find(".hud-view .right"),
			btnRight: window.find(".hud-view .right .bar"),
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
				value = el.hasClass("paused");
				el.toggleClass("paused", value);
				// play sound fx
				window.audio.play("click");

				if (Self.els.barRight.hasClass("paused") && !event.pause) {
					Self.els.content.removeClass("paused");
					Self.els.barRight.removeClass("paused");
					// resume rejection bar
					el = Self.els.progress.find(`.box-track[data-id="reject"]`).find("b");
					el.css({ "top": "", "--speed": "" });
					// resume game
					APP.mobile.dispatch({ type: "game-loop-resume" });
					// start hacking game, if in transfer view
					if (APP.transfer.AI) APP.transfer.AI.fpsControl.start();
				} else {
					Self.els.content.addClass("paused");
					Self.els.barRight.addClass("paused");
					// stop rejection bar
					el = Self.els.progress.find(`.box-track[data-id="reject"]`).find("b");
					el.css({
						"top": el.prop("offsetTop"),
						"--speed": "9999s",
					});
					// pause game
					APP.mobile.dispatch({ type: "game-loop-pause" });
					// stop hacking game, if in transfer view
					if (APP.transfer.AI) APP.transfer.AI.fpsControl.stop();
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
				if (event.level !== undefined) {
					// update progress bar
					Self.els.progress.find(`.box-track[data-id="level"]`).css({ "--val": event.level });
					// update hud bar
					let xDroids = window.bluePrint.selectNodes(`//Section/Layer[@id="droids"]/i`),
						xAlive = window.bluePrint.selectNodes(`//Section/Layer[@id="droids"]/i[not(@dead)]`),
						percentage = xAlive.length / xDroids.length;
					// adjust hud with new color
					Self.els.barLeft.find(".box").css({ "--val": `${percentage * 100}%` });
					// are all droids killed?
					if (xAlive.length === 0) return APP.mobile.dispatch({ type: "ship-cleared" });
				}
				if (event.health !== undefined) {
					Self.els.progress.find(`.box-track[data-id="health"]`).css({ "--val": event.health });
				}
				if (event.reject !== undefined) {
					el = Self.els.progress.find(`.box-track[data-id="reject"]`);
					// set speed
					el.css({ "--val": "", "--speed": event.reject +"ms" });
					el.find(".box-bar").removeClass("rejection");
					setTimeout(() => {
						el.css({ "--val": 0 });
						el.find(".box-bar").cssSequence("rejection", "transitionend", barEl => {
							// reset element
							barEl.removeClass("rejection");
							el.css({ "--speed": "1ms", "--val": 1 });
							// time has run out - kill/demote player droid
							APP.mobile.arena.player.kill();
						});
					}, 310);
				}

				// all droids killed - turn off lights
				if (event.level === 0) APP.mobile.dispatch({ type: "toggle-lights", off: true });
				break;
			case "start-hacking-game":
				// reset hud box
				Self.els.barLeft.find(".box").css({ "--val": "" });
				// change purpose of hud
				Self.els.barLeft.removeClass("color-timer choose-color").addClass("end-color-timer");
				break;
			case "choose-color":
				// reset hud box
				Self.els.barLeft.find(".box").css({ "--val": "" });
				// change purpose of hud
						console.log(1);
				Self.els.barLeft
					.addClass("choose-color")
					.cssSequence("color-timer", "transitionend", el => {
						console.log(2);
						el.removeClass("choose-color color-timer");

						event.callback();
					});
				break;
			case "hacking-progress":
				// reset hud box
				Self.els.barLeft.find(".box").css({ "--val": "" });
				// change purpose of hud
				Self.els.barLeft
					.removeClass("choose-color color-timer")
					.addClass("hacking-game")
					.cssSequence("hack-timer", "transitionend", el => {
						event.callback();
					});
				break;
			case "reset-choose-color":
				// reset hud box
				Self.els.barLeft.find(".box").css({ "--val": "" });
				// reset hud
				Self.els.barLeft
					.removeClass("choose-color color-timer hacking-game hack-timer")
					.cssSequence("reset-bar", "transitionend", el => {
						el.removeClass("reset-bar end-color-timer");
						event.callback();
					});
				break;
		}
	}
}
