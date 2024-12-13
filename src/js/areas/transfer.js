
// paradroid.transfer

{
	init() {
		// fast references
		this.els = {
			board: window.find(".board"),
			cpu: window.find(".center .cpu"),
			ioLeds: window.find(".board .io-leds"),
			cbLeft: window.find(".board .left .io"),
			cbRight: window.find(".board .right .io"),
		};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.transfer,
			available,
			index,
			ammo,
			group,
			left,
			right,
			winner,
			row,
			el;
		// console.log(event);
		switch (event.type) {
			// system events
			case "window.keydown":
				el = Self.els.board.find(".droid.player").parent().find(".io .toggler");
				index = +el.data("active");
				switch (event.char) {
					case "w":
					case "up":
						if (index > 0) {
							available = el.find("> div:not(.active)").map(el => $(el).index()+1);
							index = available[available.indexOf(index) - 1];
							if (index) el.data({ active: index });
						}
						break;
					case "d":
					case "down":
						if (index > 0) {
							available = el.find("> div:not(.active)").map(el => $(el).index()+1);
							index = available[available.indexOf(index) + 1];
							if (index) el.data({ active: index });
						}
						break;
					case "space":
					case "return":
						Self.dispatch({ type: "toggle-io-row", el, index });
						break;
				}
				break;
			// custom events
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
						group.removeClass("on");
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
							if (input === "i2") Self.dispatch({ type: "toggle-io-led", group: jLine });
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
							color = socket.cssProp("--color") === socket.cssProp("--yellow") ? "yellow" : "purple";
						Self.els.ioLeds.find(`> div:nth-child(${index})`).removeClass("purple yellow").addClass(color);
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
			case "new-hacking-game":
				// delete "old" schema
				Self.els.cbLeft.find("svg").remove();
				// render circuit board HTML
				window.render({
					template: "circuit-board-left",
					match: `//CircuitBoard[@id="left"]`,
					append: Self.els.cbLeft,
				});

				// delete "old" schema
				Self.els.cbRight.find("svg").remove();
				// render circuit board HTML
				window.render({
					template: "circuit-board-left",
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
				// temp disable
				// return;
				// create opponent AI
				el = Self.els.board.find(".droid:not(.player)");
				// create opponent AI
				Self.AI = new HackerAI({ el, id: el.data("id"), owner: Self });
				break;
		}
	}
}
