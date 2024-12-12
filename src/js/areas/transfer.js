
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

				// Self.els.cbLeft.find(".stream").map(item => {
				// 	item.setAttribute("style", `--length: -${item.getTotalLength() * .5};`);
				// });

				// window.render({
				// 	template: "circuit-board-right",
				// 	match: `//CircuitBoard`,
				// 	append: Self.els.cbRight,
				// });
				break;
			case "set-line-length":
				break;
			case "mirror-schema":
				// delete "old" schema
				Self.els.cbRight.find("svg").remove();
				// clone and loop children
				el = event.svg.clone(true);
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
