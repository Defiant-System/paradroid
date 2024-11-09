
// paradroid.hud

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			el: window.find(".hud-view"),
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
				value = event.percentage !== undefined ? event.percentage : 1;
				Self.els.el.find(".left .box").css({
					"--val": `${(value * 100) | 1}%`,
					"--c1": event.background,
				});

				value = event.power !== undefined ? event.power : 1;
				Self.els.el.find(".right .box").css({
					"--val": `${(value * 100) | 1}%`,
				});
				break;
		}
	}
}
