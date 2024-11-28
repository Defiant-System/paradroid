
// paradroid.mobile

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			droidFx: window.find(".mobile-view .droid-fx"),
			cvs: window.find(".mobile-view canvas.game"),
		};
		// create arena
		this.arena = new Arena(this.els.cvs);
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.mobile,
			Player = Self.arena.player,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// system events
			case "window.keydown":
				switch (event.char) {
					case "esc":
						// go to view
						APP.dispatch({ type: "show-view", arg: "lift" });
						break;
					case "w":
					case "up": Player.input.up.pressed = true; break;
					case "s":
					case "down": Player.input.down.pressed = true; break;
					case "a":
					case "left": Player.input.left.pressed = true; break;
					case "d":
					case "right": Player.input.right.pressed = true; break;

					case "shift":
						console.log("challenge droids");
						break;
					case "space":
						// Player.fire();
						console.log("fire");
						break;
					case "return":
						// don't do anything if not next to "something"
						if (!Player.nextTo) return;

						switch (Player.nextTo.id) {
							case "exit":
								APP.dispatch({
									type: "switch-to-view",
									arg: "lift",
									done: () => {
										let xPath = `//Section[@id="${Player.nextTo.section.id}"]/Layer[@id="action"]/i[@x="${Player.nextTo.x}"][@y="${Player.nextTo.y}"]`,
											xLift = window.bluePrint.selectSingleNode(xPath);
										// console.log( xLift.getAttribute("lift") );
										APP.lift.dispatch({
											type: "enter-lift",
											section: Player.nextTo.section.id,
											lift: xLift.getAttribute("lift")
										});
									}
								});
								break;
							case "console":
								APP.dispatch({
									type: "switch-to-view",
									arg: "console",
									done: () => {
										// pause game loop
										Self.dispatch({ type: "game-loop-pause" });
										// initiate console view post animation transition
										APP.console.dispatch({ type: "init-view" });
									}
								});
								break;
						}
						break;
					case "p":
						if (Self.arena.fpsControl._stopped) Self.dispatch({ type: "game-loop-resume" });
						else Self.dispatch({ type: "game-loop-pause" });
						break;
				}
				break;
			case "window.keyup":
				switch (event.char) {
					case "w":
					case "up": Player.input.up.pressed = false; break;
					case "s":
					case "down": Player.input.down.pressed = false; break;
					case "a":
					case "left": Player.input.left.pressed = false; break;
					case "d":
					case "right": Player.input.right.pressed = false; break;
				}
				break;
			// custom events
			case "game-loop-pause":
				if (Self.arena.map) {
					Matter.Runner.stop(APP.mobile.arena.map.runner);
					Self.arena.fpsControl.stop();
				}
				break;
			case "game-loop-resume":
				if (Self.arena.map) {
					// run the engine
					Matter.Runner.run(Self.arena.map.runner, Self.arena.map.engine);
					Self.arena.fpsControl.start();
				}
				break;
			case "restore-state":
			case "go-to-section":
				// set view
				APP.dispatch({ type: "show-view", arg: "mobile" });

				let ship = APP.lift.els.el.find(`.ship`),
					sectionEl = ship.find(`.section[data-id="${event.state.map.id}"]`),
					xSection = window.bluePrint.selectSingleNode(`//Section[@id="${event.state.map.id}"]`);
				// set ship active level attribute
				ship.data({ "active-level": sectionEl.data("level") });
				// level colors
				let background = xSection.getAttribute("color"),
					filter = xSection.getAttribute("filter") || "none",
					percentage = 1 - (event.state.map.clear || 0),
					power = event.state.player ? event.state.player.power : undefined;

				// set debug mode, if provided
				if (event.state.debug) Self.els.content.data({ debug: event.state.debug.mode });
				// adjust hud with new color
				APP.hud.dispatch({ type: "set-level-data", background, percentage, power });
				// canvas background color
				Self.els.cvs.parent().css({ background });
				// droid-FX
				Self.els.droidFx.cssSequence("fast-focus", "animationend", el => el.removeClass("fast-focus"));

				let func = (state, cfg) => {
						// this prevents setting state if not completly ready
						if (!Self.arena.map) return setTimeout(() => func(state, cfg), 100);
						// change color spectrum of level
						Self.arena.setFilter(cfg);
						// change arena
						Self.arena.setState(state, cfg);
					};
				// try setting new state
				func(event.state, { color: background, filter });
				break;
			case "level-lights-off":
				value = "#555";
				Self.els.cvs.parent().css({ background: value });
				Self.arena.setFilter({ color: value, filter: "grayscale(1) brightness(0.7) contrast(0.75)", });
				break;
			case "set-player-droid":
				Player.setId(event.arg);
				break;
			case "set-debug-mode":
				Self.els.content.data({ debug: event.arg });
				Self.arena.setDebug(+event.arg);
				break;
		}
	}
}
