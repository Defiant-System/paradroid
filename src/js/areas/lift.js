
// paradroid.lift

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			el: window.find(".lift-view"),
		};
		// elevator data
		this.elevator = {};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.lift,
			sections,
			index,
			el;
		// console.log(event);
		switch (event.type) {
			// system events
			case "window.keydown":
				switch (event.char) {
					case "return":
						let lift = Self.els.el.find(".lift.active"),
							xSection = window.bluePrint.selectSingleNode(`//Section[@id="${Self.elevator.section}"]`),
							xExit = xSection.selectSingleNode(`./Layer[@id="action"]/*[@action="exit"][@lift="${lift.data("id")}"]`),
							exit = {
								x: +xExit.getAttribute("x"),
								y: +xExit.getAttribute("y"),
							},
							state = { player: exit, map: { id: Self.elevator.section } };
						APP.mobile.dispatch({ type: "go-to-section", state });
						break;
					case "up":
						el = Self.els.el.find(".lift.active");
						sections = el.data("sections").split(",");
						index = sections.indexOf(el.data("section"));
						if (!sections[index-1]) return;
						// select section
						Self.dispatch({ type: "select-level", lift: el.data("id"), section: sections[index-1] });
						// play sound fx
						window.audio.play("lift-move");
						break;
					case "down":
						el = Self.els.el.find(".lift.active");
						sections = el.data("sections").split(",");
						index = sections.indexOf(el.data("section"));
						if (!sections[index+1]) return;
						// select section
						Self.dispatch({ type: "select-level", lift: el.data("id"), section: sections[index+1] });
						// play sound fx
						window.audio.play("lift-move");
						break;
					// temp for dev purposes
					case "left":
						el = Self.els.el.find(".lift.active");
						index = +el.data("id");
						Self.els.el.find(`.lift[data-id="${index-1}"]`).trigger("click");
						// play sound fx
						window.audio.play("lift-enter");
						break;
					case "right":
						el = Self.els.el.find(".lift.active");
						index = +el.data("id");
						Self.els.el.find(`.lift[data-id="${index+1}"]`).trigger("click");
						// play sound fx
						window.audio.play("lift-enter");
						break;
				}
				break;
			// custom events
			case "select-lift":
				el = $(event.target);
				if (!el.hasClass("lift")) return;
				Self.els.el.find(".lift.active").removeClass("active");
				el.addClass("active");
				// select level
				Self.dispatch({ type: "select-level", lift: el.data("id"), section: el.data("section") });
				break;
			case "select-level":
				// get lift
				el = Self.els.el.find(`.lift[data-id="${event.lift}"]`);
				el.data({ section: event.section });

				el = Self.els.el.find(`.section[data-id="${event.section}"]`);
				Self.els.el.find(`.ship`).data({ "active-level": el.data("level") });
				// save level information
				Self.elevator.level = el.data("level");
				Self.elevator.section = event.section;
				Self.elevator.lift = event.lift;
				break;
		}
	}
}
