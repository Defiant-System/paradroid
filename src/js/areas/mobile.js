
// paradroid.mobile

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			droidFx: window.find(".mobile-view .droid-fx"),
			cvs: window.find(".mobile-view canvas.game"),
			el: window.find(".mobile-view"),
		};
		// create arena
		this.arena = new Arena(this.els.cvs);
		// bind event handlers
		this.els.cvs.on("mousedown", this.doFire);
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.mobile,
			Player = Self.arena.player,
			xSection,
			name,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// system events
			case "window.keydown":
				switch (event.char) {
					case "esc":
						// go to view lift (for dev purpose)
						if (event.shiftKey) {
							APP.dispatch({ type: "show-view", arg: "lift" });
						}
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
						Player.setState({ id: "transfer", active: true });
						break;
					case "return":
						// don't do anything if not next to "something"
						if (!Player.nextTo) return;

						switch (Player.nextTo.id) {
							case "exit":
								let xPath = `//Section[@id="${Player.nextTo.section.id}"]/Layer[@id="action"]/i[@x="${Player.nextTo.x}"][@y="${Player.nextTo.y}"]`,
									xLift = window.bluePrint.selectSingleNode(xPath);
								// make sure to select correct lift & section
								APP.lift.dispatch({
									type: "select-level",
									lift: xLift.getAttribute("lift"),
									section: Player.nextTo.section.id
								});

								// pause game loop
								Self.dispatch({ type: "game-loop-pause" });
								// animate / switch to view
								APP.dispatch({
									type: "switch-to-view",
									arg: "lift",
									done: () => {
										APP.lift.dispatch({
											type: "enter-lift",
											section: Player.nextTo.section.id,
											lift: xLift.getAttribute("lift"),
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
						APP.hud.dispatch({ type: "toggle-play-pause" });
						// if (Self.arena.fpsControl._stopped) Self.dispatch({ type: "game-loop-resume" });
						// else Self.dispatch({ type: "game-loop-pause" });
						break;

					// test key for screen shake
					case "space":
						// Self.arena.viewport.addShake(1);
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
					case "shift":
						Player.setState({ id: "transfer", pressed: false });
						break;
					// case "space":
					// 	Player.setState({ id: "fire", pressed: false });
					// 	break;
				}
				break;
			// custom events
			case "init-view":
				APP.mobile.dispatch({
					type: "restore-state",
					state: { map: { id: 1, clear: 0 }, player: { id: "001", x: 25, y: 9 }, debug: { mode: 0 } },
				});
				break;
			case "game-loop-pause":
				if (Self.arena.map && !Self.arena.fpsControl._stopped) {
					Matter.Runner.stop(APP.mobile.arena.map.runner);
					Self.arena.fpsControl.stop();
				}
				break;
			case "game-loop-resume":
				if (Self.arena.map && Self.arena.fpsControl._stopped && Self.arena.map.walls) {
					// run the engine
					Self.arena.fpsControl.start();
				}
				break;
			case "init-transfer-view":
				Self.dispatch({ type: "game-loop-pause" });

				// TODO: switch to transer view
				console.log( Self.arena.player.opponent.id );
				break;
			case "restore-state":
			case "go-to-section":
				let ship = APP.lift.els.el.find(`.ship`),
					sectionEl = ship.find(`.section[data-id="${event.state.map.id}"]`);
				xSection = window.bluePrint.selectSingleNode(`//Section[@id="${event.state.map.id}"]`);
				// set ship active level attribute
				ship.data({ "active-level": sectionEl.data("level") });
				// level colors
				let background = xSection.getAttribute("color"),
					filter = xSection.getAttribute("filter") || "none",
					percentage = 1 - (event.state.map.clear || 0);
				// reset player mode
				Self.arena.player.transfer.active = false;
				// set debug mode, if provided
				if (event.state.debug) Self.els.content.data({ debug: event.state.debug.mode });
				// adjust hud with new color
				APP.hud.dispatch({ type: "set-level-data", background, percentage });
				// canvas background color
				Self.els.el.css({ background });
				// droid-FX
				Self.els.droidFx.cssSequence("fast-focus", "animationend", el => el.removeClass("fast-focus"));

				let func = (state, cfg) => {
						// this prevents setting state if not completly ready
						if (!Self.arena.map) return setTimeout(() => func(state, cfg), 100);
						// change color spectrum of level
						Self.arena.setFilter(cfg);
						// change arena
						Self.arena.setState(state, cfg);
						// start / resume game loop
						Self.dispatch({ type: "game-loop-resume" });
					};
				// try setting new state
				func(event.state, { color: background, filter, percentage });
				break;
			case "toggle-lights":
				value = !!Self.arena.led.floor ? 0 : 1;
				if (event.off) value = 1;
				name = value ? "lights-off" : "lights-on";

				let animDone = () => {
						// reset element
						Self.els.el.removeClass("lights-off lights-on");
						// switch asset map / turn on "floor led lights"
						Self.arena.setLights({ clear: value });
						// restore bg color + filter
						if (!value) {
							// update arena base background color
							Self.els.el.css({ background: Self.arena.colors.base });
							// set level colors
							Self.arena.setFilter({
								color: Self.arena.colors.base,
								filter: Self.arena.copy.ctx.filter,
							});
						}
					};

				// transition to dark
				if (Self.els.droidFx.hasClass("fast-focus")) animDone()
				else Self.els.el.cssSequence(name, "transitionend", animDone);
				break;
			case "player-droid-destroyed":
				// reset css/view
				Self.els.content.cssSequence("leave", "transitionend", el => {
					// reset element
					el.removeClass("leave");
					// pause game loop
					Self.dispatch({ type: "game-loop-pause" });
					// show game over view
					APP.dispatch({ type: "switch-to-view", arg: "terminated" });
				});
				break;
			case "set-player-droid":
				Player.setId(event.arg);
				break;
			case "set-debug-mode":
				Self.els.content.data({ debug: event.arg });
				Self.arena.setDebug(+event.arg);
				break;
		}
	},
	doFire(event) {
		let APP = paradroid,
			Self = APP.mobile,
			Fire = Self.fire;
		// Player.fire();
		switch (event.type) {
			case "mousedown":
				if (event.button !== 0) return;
				// prevent default event
				event.preventDefault();

				let doc = $(document),
					el = $(event.target),
					player = Self.arena.player,
					click = {
						x: event.clientX - event.offsetX + (el.width() >> 1),
						y: event.clientY - event.offsetY + (el.height() >> 1),
					};
				// shooting flag
				player.fire.shooting = true;
				// reference to object
				Self.fire = { el, doc, player, click };

				// auto trigger "mousemove"
				Self.doFire({ type: "mousemove", clientX: event.clientX, clientY: event.clientY });
				// cover app window
				APP.els.content.addClass("cover");
				// bind event handlers
				Self.fire.doc.on("mousemove mouseup", Self.doFire);
				break;
			case "mousemove":
				let x = event.clientX - Fire.click.x,
					y = event.clientY - Fire.click.y;
				Fire.player.setDirection(x, y);
				break;
			case "mouseup":
				// shooting flag
				Fire.player.fire.shooting = false;
				// cover app window
				APP.els.content.removeClass("cover");
				// bind event handlers
				Self.fire.doc.off("mousemove mouseup", Self.doFire);
				break;
		}
	}
}
