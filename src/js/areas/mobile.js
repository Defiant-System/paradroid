
// paradroid.mobile

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			cvs: window.find(".mobile-view canvas.game"),
		};
		// create arena
		this.arena = new Arena(this.els.cvs);
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.mobile,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// system events
			case "window.keydown":
				switch (event.char) {
					case "esc":
						APP.dispatch({ type: "show-view", arg: "lift" });
						break;
					case "w":
					case "up": Self.arena.player.input.up.pressed = true; break;
					case "s":
					case "down": Self.arena.player.input.down.pressed = true; break;
					case "a":
					case "left": Self.arena.player.input.left.pressed = true; break;
					case "d":
					case "right": Self.arena.player.input.right.pressed = true; break;
					case "p":
						if (Self.arena.fpsControl._stopped) Self.arena.fpsControl.start();
						else Self.arena.fpsControl.stop();
						break;
				}
				break;
			case "window.keyup":
				switch (event.char) {
					case "w":
					case "up": Self.arena.player.input.up.pressed = false; break;
					case "s":
					case "down": Self.arena.player.input.down.pressed = false; break;
					case "a":
					case "left": Self.arena.player.input.left.pressed = false; break;
					case "d":
					case "right": Self.arena.player.input.right.pressed = false; break;
				}
				break;
			// custom events
			case "restore-state":
			case "go-to-section":
				// set view
				APP.dispatch({ type: "show-view", arg: "mobile" });

				let ship = APP.lift.els.el.find(`.ship`),
					sectionEl = ship.find(`.section[data-id="${event.state.map.id}"]`);
				// set ship active level attribute
				ship.data({ "active-level": sectionEl.data("level") });
				// level colors
				let background = sectionEl.cssProp("--fg"),
					filter = sectionEl.cssProp("--filter") || "",
					percentage = 1 - event.state.map.clear,
					power = event.state.player.power;

				// adjust hud with new color
				APP.hud.dispatch({ type: "set-level-data", background, percentage, power });

				Self.els.cvs.parent().css({ background });
				Self.els.cvs.css({ filter });
				// change arena
				Self.arena.setState(event.state);
				break;
			case "set-debug-mode":
				Self.arena.setDebug(+event.arg);
				break;
		}
	}
}
