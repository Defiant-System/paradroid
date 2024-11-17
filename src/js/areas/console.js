
// paradroid.console

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			el: window.find(".console-view"),
			bp: window.find(".blueprint"),
			info: window.find(".info"),
		};

		this.droids = ["001", "123", "139", "247", "249", "296", "302",
						"329", "420", "476", "493", "516", "571",
						"598", "614", "615", "629", "711", "742",
						"751", "821", "834", "883", "999"];
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.console,
			xNode,
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
						// show info for droid
						Self.dispatch({ type: "show-droid", value });
						break;
					case "right":
						value = Self.els.bp.css("background-image").toString().match(/bp-(\d{3})/i)[1];
						index = Self.droids.indexOf(value);
						index++;
						if (index > Self.droids.length-1) index = 0;
						value = Self.droids[index];
						// show info for droid
						Self.dispatch({ type: "show-droid", value });
						break;
				}
				break;
			// custom events
			case "show-droid":
				xNode = window.bluePrint.selectSingleNode(`//Droid[@id="${event.value}"]`);
				Self.els.bp.css({ "background-image": `url("~/icons/bp-${event.value}.png")` });
				Self.els.info.find(".unit").html(`Unit ${event.value}`);
				Self.els.info.find(".type").html(xNode.selectSingleNode(`./i[@id="type"]`).textContent);
				Self.els.info.find(".weight").html(xNode.getAttribute("weight") +" KG");
				Self.els.info.find(".speed").html(xNode.getAttribute("speed") +" M/S");
				Self.els.info.find(".notes").html(xNode.selectSingleNode(`./i[@id="notes"]`).textContent);
				break;
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
