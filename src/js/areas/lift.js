
// paradroid.lift

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			el: window.find(".lift-view"),
			el: window.find(".lift-view"),
		};
		// elevator data
		this.elevator = {};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.lift,
			xSection,
			sections,
			index,
			el;
		// console.log(event);
		switch (event.type) {
			// system events
			case "window.keydown":
				switch (event.char) {
					case "return":
						// section node
						xSection = window.bluePrint.selectSingleNode(`//Section[@id="${Self.elevator.section}"]`);
						// info about level
						let lift = Self.els.el.find(".lift.active"),
							xExit = xSection.selectSingleNode(`./Layer[@id="action"]/*[@action="exit"][@lift="${lift.data("id")}"]`),
							exit = {
								x: +xExit.getAttribute("x") + 1,
								y: +xExit.getAttribute("y") + 1,
							},
							state = { player: exit, map: { id: +Self.elevator.section } };
						// stop/pause loop
						APP.mobile.arena.fpsControl.start();
						// smooth transition to view
						APP.dispatch({
							type: "switch-to-view",
							arg: "mobile",
							done: () => {
								// go to view
								APP.mobile.dispatch({ type: "go-to-section", state });
							}
						});
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
						if (event.shiftKey) {
							el = Self.els.el.find(".lift.active");
							index = +el.data("id") - 1;
							Self.dispatch({ type: "select-lift", el: Self.els.el.find(`.lift[data-id="${index}"]`) });
						}
						break;
					case "right":
						if (event.shiftKey) {
							el = Self.els.el.find(".lift.active");
							index = +el.data("id") + 1;
							Self.dispatch({ type: "select-lift", el: Self.els.el.find(`.lift[data-id="${index}"]`) });
						}
						break;
				}
				break;
			// custom events
			case "enter-lift":
				Self.els.el.find(".lift.active").removeClass("active");
				// get lift element
				el = Self.els.el.find(`.lift[data-id="${event.lift}"]`);
				// make lift active
				el.addClass("active");
				// make lift section active
				el.data({ section: event.section });
				// save level information
				Self.elevator.level = Self.els.el.find(`.section[data-id="${event.section}"]`).data("level");
				Self.elevator.section = event.section;
				Self.elevator.lift = event.lift;
				// show lift view
				// APP.dispatch({ type: "show-view", arg: "lift" });
				break;
			case "select-lift":
				if (!event.el.hasClass("lift")) return;
				Self.els.el.find(".lift.active").removeClass("active");
				event.el.addClass("active");
				// select level
				Self.dispatch({ type: "select-level", lift: event.el.data("id"), section: event.el.data("section") });
				break;
			case "select-level":
				// get lift
				el = Self.els.el.find(`.lift[data-id="${event.lift}"]`);
				el.data({ section: event.section });

				// section node
				xSection = window.bluePrint.selectSingleNode(`//Section[@id="${event.section}"]`);

				el = Self.els.el.find(`.section[data-id="${event.section}"]`);
				Self.els.el.find(`.ship`)
					.data({ "active-level": el.data("level") })
					.css({
						"--color": xSection.getAttribute("color"),
						"--filter": xSection.getAttribute("filter"),
					});
				// save level information
				Self.elevator.level = el.data("level");
				Self.elevator.section = event.section;
				Self.elevator.lift = event.lift;
				break;
		}
	}
}
