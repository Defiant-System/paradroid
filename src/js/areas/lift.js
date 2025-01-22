
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
						// pause game loop
						// APP.mobile.dispatch({ type: "game-loop-resume" });
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
					case "w":
					case "up":
						el = Self.els.el.find(".lift.active");
						sections = el.data("sections").split(",");
						index = sections.indexOf(el.data("section"));
						if (!sections[index-1]) return;
						// select section
						Self.dispatch({ type: "select-level", lift: el.data("id"), section: sections[index-1] });
						// play sound fx
						window.audio.play("swipe");
						break;
					case "s":
					case "down":
						el = Self.els.el.find(".lift.active");
						sections = el.data("sections").split(",");
						index = sections.indexOf(el.data("section"));
						if (!sections[index+1]) return;
						// select section
						Self.dispatch({ type: "select-level", lift: el.data("id"), section: sections[index+1] });
						// play sound fx
						window.audio.play("swipe");
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
			// gamepad events
			case "gamepad.stick":
				let x = event.value[0],
					y = event.value[1];
				if (event.stick === "left") {
					switch (true) {
						case y < 0: Self.dispatch({ type: "window.keydown", char: "up" }); break;
						case y > 0: Self.dispatch({ type: "window.keydown", char: "down" }); break;
						// case x < 0: Self.dispatch({ type: "window.keydown", char: "left" }); break;
						// case x > 0: Self.dispatch({ type: "window.keydown", char: "right" }); break;
					}
				}
				break;
			case "gamepad.down":
				switch (event.button) {
					case "b0": // x - enter
						Self.dispatch({ type: "window.keydown", char: "return" });
						break;
					case "b9": // options - toggle pause
						APP.hud.dispatch({ type: "toggle-play-pause" });
						break;
				}
				break;
			case "gamepad.up":
				// anything todo?
				break;
			// custom events
			case "init-view":
				// quick show controls for this view
				Self.els.content.find(".view-controls").data({ view: "lift" });

				Self.els.el.find(`.deck .section`).map(elem => {
					let el = $(elem),
						xPath = `//Data/Section[@level="${el.data("level")}"]/Layer[@id="droids"]/i[not(@dead)]`,
						xDroids = window.bluePrint.selectNodes(xPath);
					el.toggleClass("cleared", xDroids.length);
				});
				break;
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
				Self.els.el.find(".lift.active").removeClass("active");
				el = Self.els.el.find(`.lift[data-id="${event.lift}"]`);
				el.addClass("active").data({ section: event.section });

				// section node
				xSection = window.bluePrint.selectSingleNode(`//Section[@id="${event.section}"]`);

				el = Self.els.el.find(`.section[data-id="${event.section}"]`);
				Self.els.el.find(`.ship`)
					.data({ "active-level": el.data("level") })
					.css({
						"--color": xSection.getAttribute("color"),
						"--filter": xSection.getAttribute("filter"),
					});
				// update hud details about level
				let xDroids = xSection.selectNodes(`./Layer[@id="droids"]/i`),
					xAlive = xSection.selectNodes(`./Layer[@id="droids"]/i[not(@dead)]`);
				APP.hud.dispatch({
					type: "set-level-data",
					background: xSection.getAttribute("color"),
					percentage: xAlive.length / xDroids.length,
				});
				// save level information
				Self.elevator.level = el.data("level");
				Self.elevator.section = event.section;
				Self.elevator.lift = event.lift;
				break;
		}
	}
}
