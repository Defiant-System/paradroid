
// paradroid.transfer

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			cbLeft: window.find(".board .left .io"),
			cbRight: window.find(".board .right .io"),
		};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.transfer,
			value,
			row,
			el;
		// console.log(event);
		switch (event.type) {
			// custom events
			case "render-circuit-board":
				// delete "old" schema
				Self.els.cbLeft.find("svg").remove();
				// render circuit board HTML
				window.render({
					template: "circuit-board-left",
					match: `//CircuitBoard`,
					append: Self.els.cbLeft,
				});

				// window.render({
				// 	template: "circuit-board-right",
				// 	match: `//CircuitBoard`,
				// 	append: Self.els.cbRight,
				// });
				break;
			case "mirror-schema":
				// delete "old" schema
				Self.els.cbRight.find("svg").remove();
				// clone and loop children
				el = event.svg.clone(true);
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
						case "polyline":
							points = item.getAttribute("points").split(" ").map(p => p.split(",").map(i => +i)).reverse();
							points.map((p,i) => { p[0] = mirror(p[0]) });
							// console.log("12,-22 162,-22 187,-2 195,-2");
							// console.log(points.join(" "));
							item.setAttribute("points", points.join(" "));
							break;
						case "circle":
							val = [+item.getAttribute("cx")];
							item.setAttribute("cx", mirror(val[0]));
							// if (name === "switch") item.setAttribute("cx", 253);
							// else if (name === "void") item.setAttribute("cx", 202);
							break;
						case "rect":
							val = [+item.getAttribute("x") + 14];
							item.setAttribute("x", mirror(val[0]));
							// if (name === "socket") item.setAttribute("x", 0);
							// else if (name === "chip") item.setAttribute("x", 195);
							break;
						case "polygon":
							if (name === "gpu") {
								points = item.getAttribute("points").split(" ").map(p => p.split(",").map(i => +i)).reverse();
								points.map((p,i) => { p[0] = mirror(p[0]) });
								// points = [[85,-7], [95,-7], [100,-2], [100,7], [85,7]];
								item.setAttribute("points", points.join(" "));
							}
							break;
					}
				});
				Self.els.cbRight.append(el);
				break;
			case "toggle-io-row":
				el = $(event.target);
				row = el.parent().parent().find(`svg g:nth(${el.index()})`);
				row.toggleClass("on", row.hasClass("on"));
				break;
		}
	}
}
