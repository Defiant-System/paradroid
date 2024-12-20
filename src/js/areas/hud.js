
// paradroid.hud

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			el: window.find(".hud-view"),
			barLeft: window.find(".left"),
			barRight: window.find(".right"),
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
			case "set-view-title":
				if (event.name) value = event.name;
				else {
					el = Self.els.content.find(`> div[data-area="${Self.els.content.data("show")}"]`);
					value = el.data("name");
				}
				if (value) Self.els.el.find(".view-title").html(value);
				break;
			case "set-level-data":
				el = Self.els.el.find(".left .box");
				value = event.percentage !== undefined ? event.percentage : parseInt(el.cssProp("--val"), 10) / 100;
				el.css({
					"--val": `${value * 100}%`,
					"--c1": event.background,
				});
				// update power if value is provided
				if (event.power !== undefined) {
					Self.dispatch({ ...event, type: "set-power" });
				}
				break;
			case "set-power":
				Self.els.el.find(".right .box").css({
					"--val": `${event.power * 100}%`,
				});
				break;
			case "choose-color":
				Self.els.barRight.addClass("hidden");
				Self.els.barLeft
					.addClass("choose-color")
					.cssSequence("timer", "transitionend", el => event.callback());
				break;
			case "reset-choose-color":
				// reset hud
				Self.els.barRight.removeClass("hidden");
				Self.els.barLeft.removeClass("choose-color timer")
					.cssSequence("reset", "transitionend", el => el.removeClass("reset"));
				break;
		}
	}
}
