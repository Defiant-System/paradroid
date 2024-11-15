
// paradroid.console

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			el: window.find(".console-view"),
			bp: window.find(".blueprint"),
		};

		this.droids = ["123", "139", "247", "296", "598", "999"];
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.console,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// system events
			case "window.keydown":
				let active = Self.els.el.find(".option.active"),
					options = Self.els.el.find(".option"),
					index = active.index();
				switch (event.char) {
					case "return":
						active.trigger("click");
						break;
					// case "up":
					// 	active.removeClass("active");
					// 	index = Math.max(index - 1, 0);
					// 	options.get(index).addClass("active");
					// 	break;
					// case "down":
					// 	active.removeClass("active");
					// 	index = Math.min(index + 1, options.length-1);
					// 	options.get(index).addClass("active");
					// 	break;
					case "left":
						value = Self.els.bp.css("background-image").toString().match(/bp-(\d{3})/i)[1];
						index = Self.droids.indexOf(value);
						index--;
						if (index < 0) index = Self.droids.length-1;
						value = Self.droids[index];
						Self.els.bp.css({ "background-image": `url("~/icons/bp-${value}.png")` });
						break;
					case "right":
						value = Self.els.bp.css("background-image").toString().match(/bp-(\d{3})/i)[1];
						index = Self.droids.indexOf(value);
						index++;
						if (index > Self.droids.length-1) index = 0;
						value = Self.droids[index];
						Self.els.bp.css({ "background-image": `url("~/icons/bp-${value}.png")` });
						break;
				}
				break;
			// custom events
			case "select-view":
				Self.els.el.find(".option.active").removeClass("active");
				// make lift active
				el = $(event.target).addClass("active");
				
				switch (el.data("view")) {
					case "player":
						APP.dispatch({
							type: "switch-to-view",
							arg: "mobile",
							done: () => {
								// droid-FX
								APP.mobile.els.droidFx.cssSequence("fast-focus", "animationend", el => el.removeClass("fast-focus"));
							}
						});
						break;
					case "droids": break;
					case "level": break;
					case "ship": break;
				}
				break;
		}
	}
}
