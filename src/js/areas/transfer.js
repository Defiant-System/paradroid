
// paradroid.transfer

{
	init() {
		// fast references
		this.els = {
			el: window.find(".transfer-view"),
			board: window.find(".board"),
			cpu: window.find(".center .cpu"),
			ioLeds: window.find(".board .io-leds"),
			cbLeft: window.find(".board .left .io"),
			ammoLeft: window.find(".board .left .side .ammo"),
			droidLeft: window.find(".board .left .droid"),
			cbRight: window.find(".board .right .io"),
			droidRight: window.find(".board .right .droid"),
			ammoRight: window.find(".board .right .side .ammo"),
		};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.transfer,
			callback,
			available,
			index,
			ammo,
			group,
			left,
			right,
			winner,
			row,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// system events
			case "window.keydown":
				el = Self.els.board.find(".droid.player").parent().find(".io .toggler");
				index = +el.data("active");
				// keyboard input
				switch (event.char) {
					case "w":
					case "up":
						if (Self._gameStarted && !Self._chooseColor && index > 0) {
							available = el.find("> div:not(.active)").map(el => $(el).index()+1);
							index = available[available.indexOf(index) - 1];
							if (index) el.data({ active: index });
						}
						break;
					case "d":
					case "down":
						if (Self._gameStarted && !Self._chooseColor && index > 0) {
							available = el.find("> div:not(.active)").map(el => $(el).index()+1);
							index = available[available.indexOf(index) + 1];
							if (index) el.data({ active: index });
						}
						break;
					case "space":
					case "return":
						if (Self._chooseColor) APP.hud.dispatch({ type: "start-hacking-game" });
						else if (Self._gameStarted) Self.dispatch({ type: "toggle-io-row", el, index });
						break;
					case "a":
					case "left":
						if (Self._chooseColor) {
							let player = APP.mobile.arena.player.id,
								opponent = APP.mobile.arena.player.opponent;
							Self._playerColor = "yellow";
							Self.els.droidLeft.data({ id: player }).addClass("player");
							Self.els.ammoLeft.data({ left: 3 + +player[0] });
							Self.els.droidRight.data({ id: opponent.id }).removeClass("player");
							Self.els.ammoRight.data({ left: 3 + +opponent.id[0] });
						}
						break;
					case "d":
					case "right":
						if (Self._chooseColor) {
							let player = APP.mobile.arena.player.id,
								opponent = APP.mobile.arena.player.opponent;
							Self._playerColor = "purple";
							Self.els.droidLeft.data({ id: opponent.id }).removeClass("player");
							Self.els.ammoLeft.data({ left: 3 + +opponent.id[0] });
							Self.els.droidRight.data({ id: player }).addClass("player");
							Self.els.ammoRight.data({ left: 3 + +player[0] });
						}
						break;
				}
				break;
			// custom events
			case "init-view":
				// droid id's
				value = APP.mobile.arena.player.id;
				Self.els.droidLeft.data({ id: value }).addClass("player");
				Self.els.ammoLeft.data({ left: 3 + +value[0] });

				value = APP.mobile.arena.player.opponent.id;
				Self.els.droidRight.data({ id: value }).removeClass("player");
				Self.els.ammoRight.data({ left: 3 + +value[0] });

				// defaults
				Self._playerColor = "yellow";

				// TODO: remove
				// return Self.els.el.addClass("get-ready-title");

				// start hacking game
				Self.dispatch({ type: "new-hacking-game" });
				break;
			case "toggle-io-row":
				el = event.el;
				index = event.index;
				ammo = el.parent().parent().find(".ammo");
				left = +ammo.data("left");
				if (index > 1 && left > -1) {
					// light up active line
					el.find(`> div:nth-child(${index})`).cssSequence("active", "transitionend", el => {
						// reset switch start
						el.removeClass("active");
						// turn off SVG group
						group.removeClass("on joint-on");
						// console.log(group);
						group.find(".chip").removeClass("i1 i2 i3").addClass("joint");
						// group.find(`.socket.on`).removeClass("on").addClass("joint");
						// group.find(`line:not([join]), polyline:not([join])`).addClass("joint");
					});
					// light up SVG group
					group = el.parent().find(`svg g:nth-child(${index-1})`).addClass("on");
					group.find(`[sub="rep"], [sub="soc"]`).addClass("on");

					// join 1
					group.find("[join]").map(elem => {
						let line = $(elem),
							input = line.attr("join"),
							jLine = input === "i1" ? group : (input === "i2" ? group.prevAll("g").get(+line.attr("prev")) : group.nextAll("g").get(+line.attr("next"))),
							chip = jLine.find(".chip.joint");
						// handles join special scenario
						if (input === "i3") input = "i2";
						// add to chip inputs
						chip.addClass(input);
						// enable joint line
						if (chip.hasClass("i1") && chip.hasClass("i2")) {
							jLine.find(".joint").removeClass("joint");
							jLine.addClass("joint-on");
							// toggle IO led
							if (input === "i2") {
								Self.dispatch({ type: "toggle-io-led", group: jLine });
							}
						}
					});
					// toggle IO led
					Self.dispatch({ type: "toggle-io-led", group });
					// update CPU led
					Self.dispatch({ type: "update-winning-cpu" });
					// reduce ammo count
					ammo.data({ left: left - 1 });
					// reset active
					el.data({ active: left > 0 ? 1 : 0 });
				}
				break;
			case "toggle-io-led":
				// update IO leds
				event.group.find(".socket[data-pos]").map(elem => {
					let socket = $(elem);
					if (socket.hasClass("on")) {
						let index = socket.data("pos"),
							ledEl = Self.els.ioLeds.find(`> div:nth-child(${index})`),
							color = "";
						if (socket.cssProp("--color") === socket.cssProp("--yellow")) color = "yellow";
						if (socket.cssProp("--color") === socket.cssProp("--purple")) color = "purple";
						if (color) ledEl.removeClass("purple yellow").addClass(color);
					}
				});
				break;
			case "update-winning-cpu":
				left = Self.els.ioLeds.find(".yellow").length;
				right = Self.els.ioLeds.find(".purple").length;
				switch (true) {
					case (left === right): winner = "deadlock"; break;
					case (left > right): winner = "yellow"; break;
					case (left < right): winner = "purple"; break;
				}
				Self.els.cpu.data({ winner });
				break;
			case "generate-schemas":
				let side = event.side || "left",
					isLeft = side === "left",
					xBoard = window.bluePrint.selectNodes(`//CircuitBoard[@id="${side}"]/i`);
				// reset blueprint
				xBoard.map(x => x.removeAttribute("row"));
				// populate groups sets
				let groups = [[""]],
					schema = [];
				window.bluePrint.selectNodes(`//Groups/Set`).map(xSet => {
					let group = [];
					xSet.selectNodes(`./*[@row]`).map(xRow => {
						let id = xRow.getAttribute("row");
						group.push({ id })
					});
					groups.push(group);
				});
				// populate new schema set
				while (available = 12 - schema.length) {
					let selection = groups.filter(a => a.length <= available);
					let rndSet = selection[Utils.randomInt(0, selection.length)];
					schema.push(...rndSet);
				}
				// apply randomized schema set to xml nodes
				schema.map((r, i) => {
					if (r.id) xBoard[i].setAttribute("row", r.id);
				});

				if (isLeft) {
					// render right side as well
					Self.dispatch({ ...event, side: "right" });
					Self.dispatch({ type: "render-schemas" });
					// for debug / dev
					value = [];
					window.bluePrint.selectNodes(`//CircuitBoard`).map(x => value.push(x.xml));
					// console.log(value.join("\n"));
				}
				break;
			case "render-schemas":
				// delete "old" schema
				Self.els.cbLeft.find("svg").remove();
				// render circuit board HTML
				window.render({
					template: "circuit-board",
					match: `//CircuitBoard[@id="left"]`,
					append: Self.els.cbLeft,
				});
				// delete "old" schema
				Self.els.cbRight.find("svg").remove();
				// render circuit board HTML
				window.render({
					template: "circuit-board",
					match: `//CircuitBoard[@id="right"]`,
					append: Self.els.cbRight,
				});
				// mirror right circuit schema
				el = Self.els.cbRight.find("svg");
				// clone and loop children
				el.find(".purple, .yellow").map(item => {
					let str = item.className.baseVal;
					if (str.includes("yellow")) str = str.replace(/yellow/, "purple");
					else if (str.includes("purple")) str = str.replace(/purple/, "yellow");
					item.setAttribute("class", str);
				});
				el.find("g, line, circle, rect, polyline, polygon").map(item => {
					let mirror = i => {
							let r = (118 - i) + 129;
							if (i === 0 && r === 14) r = 12;
							return r;
						},
						[name, type] = item.className.baseVal.split(" "),
						points, val;
					switch (item.nodeName) {
						case "g":
							val = item.getAttribute("transform").replace(/\(33/, "(-3");
							item.setAttribute("transform", val);
							break;
						case "line":
							val = [+item.getAttribute("x1"), +item.getAttribute("x2")];
							item.setAttribute("x1", mirror(val[1]));
							item.setAttribute("x2", mirror(val[0]));
							break;
						case "circle":
							val = [+item.getAttribute("cx")];
							item.setAttribute("cx", mirror(val[0]));
							break;
						case "rect":
							val = [+item.getAttribute("x") + 14];
							item.setAttribute("x", mirror(val[0]));
							break;
						case "polyline":
						case "polygon":
							points = item.getAttribute("points").split(" ").map(p => p.split(",").map(i => +i)).reverse();
							points.map((p,i) => { p[0] = mirror(p[0]) });
							item.setAttribute("points", points.join(" "));
							break;
					}
				});
				break;
			case "new-hacking-game":
				// reset toggles
				Self.els.el.find(".toggler .active").removeClass("active");
				
				// generate circuit board
				Self.dispatch({ type: "generate-schemas" });
				// show "choose side" text
				Self.els.el.cssSequence("choose-side-title", "transitionend", el => {
					// reset element
					el.addClass("show-gloria").removeClass("choose-side-title");
					// choose color flag
					Self._chooseColor = true;
					// game ended
					Self._gameEnded = false;
					// start timer
					callback = () => Self.dispatch({ type: "start-hacking" });
					APP.hud.dispatch({ type: "choose-color", callback });
				});
				break;
			case "start-hacking":
				if (Self._gameEnded) return;
				// reset player droid
				Self.els.el.removeClass("show-gloria");
				// start hacking game
				delete Self._chooseColor;
				// get ready
				Self._gameStarted = false;

				// reset hud box
				callback = () => {
					// show "choose side" text
					Self.els.el.cssSequence("get-ready-title", "transitionend", el => {
						// reset element
						el.removeClass("get-ready-title");
						// game time
						Self._gameStarted = true;
						// start hacking game
						callback = () => Self.dispatch({ type: "finish-hacking" });
						APP.hud.dispatch({ type: "hacking-progress", callback });

						// create opponent AI
						el = Self.els.board.find(".droid:not(.player)");
						Self.AI = new HackerAI({ el, id: el.data("id"), owner: Self });
					});
				};
				APP.hud.dispatch({ type: "reset-choose-color", callback });
				break;
			case "finish-hacking":
				console.log(event);
				// game ended
				Self._gameEnded = true;
				// assess winner
				callback = () => {
					// reset view
					Self.els.el.removeClass("hidden");
					Self.els.el.find(`[data-id]`).data({ id: APP.mobile.arena.player.opponent.id });

					switch (Self.els.cpu.data("winner")) {
						case Self._playerColor:
							Self.els.el.cssSequence("finished finish-win", "transitionend", el => {
								Self.dispatch({ type: "reset-transfer-view" });
								// console.log("switch to mobile view");
								APP.mobile.arena.player.opponent.kill({ silent: true });
								APP.mobile.arena.player.setId(APP.mobile.arena.player.opponent.id);
								// start / resume game loop
								APP.mobile.dispatch({ type: "game-loop-resume" });
								// go to mobile view
								let done = () => Self.els.el.addClass("hidden");
								APP.dispatch({ type: "switch-to-view", arg: "mobile", done });
							});
							return;
						case "deadlock":
							Self.els.el.addClass("finished finish-deadlock");
							// show "choose side" text
							Self.els.el.cssSequence("deadlock-title", "transitionend", el => {
								Self.dispatch({ type: "reset-transfer-view" });
								// start hacking game
								Self.dispatch({ type: "new-hacking-game" });
							});
							return;
						default:
							Self.els.el.cssSequence("finished finish-loose", "transitionend", el => {
								Self.dispatch({ type: "reset-transfer-view" });

								console.log("demote player droid AND switch to mobile view");
							});
					}
					// value = Self.els.board.find(".droid:not(.player)").data("id");
					// Self.els.el.find(".finish").data({ id: value });
				};
				APP.hud.dispatch({ type: "reset-choose-color", callback });
				break;
			case "reset-transfer-view":
				// reset view
				Self.els.el.removeClass("show-gloria deadlock-title finished finish-win finish-loose finish-deadlock");
				// reset state
				delete Self._chooseColor;
				delete Self._gameStarted;
				delete Self._gameEnded;
				break;
		}
	}
}
