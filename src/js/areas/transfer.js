
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
						event.el.parent().find(`svg g:nth-child(${index-1})`).removeClass("on");
					});
					// light up SVG group
					el.parent().find(`svg g:nth-child(${index-1})`).addClass("on");
					// update IO leds
					Self.els.ioLeds.find(`> div:nth-child(${index-1})`).removeClass("purple yellow").addClass(ammo.data("color"));
					// update CPU led
					Self.dispatch({ type: "update-winning-cpu" });
					// reduce ammo count
					ammo.data({ left: left - 1 });
					// reset active
					el.data({ active: left > 0 ? 1 : 0 });
				}
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
