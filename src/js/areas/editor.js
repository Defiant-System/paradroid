
// paradroid.editor

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			viewport: window.find(".viewport"),
			editBox: window.find(".edit-box"),
			cursor: window.find(".cursor"),
		};
		// palette details
		this.palette = {
			cursor: [{ x: 0, y: 0, id: "" }],
		};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.editor,
			Spawn = event.spawn,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			case "spawn.open":
				// fast references
				Self.els.spawn = Spawn.find("content.editor");
				break;
			case "spawn.close":
				break;
			// custom events
			case "select-editor-layer":
				// change toolset
				Spawn.toolset = event.arg;
				// changes spawn content
				Self.els.spawn.data({ show: event.arg });
				// toggles layers depending on selected tab
				Self.els.viewport.data({ show: event.arg });
				break;
			case "select-bg-tile":
				el = $(event.target);
				event.el.find(".active").removeClass("active");
				el.addClass("active");
				break;
			case "toggle-overflow":
				el = Self.els.viewport;
				value = el.hasClass("show-overflow");
				el.toggleClass("show-overflow", value);
				Spawn.find(`.toolbar-tool_[data-click="toggle-overflow"]`).toggleClass("tool-active_", value);
				return !value;
			case "toggle-grid":
				el = Self.els.viewport.find(".layer-background");
				value = el.hasClass("hide-grid");
				el.toggleClass("hide-grid", value);
				Spawn.find(`.toolbar-tool_[data-click="toggle-grid"]`).toggleClass("tool-active_", value);
				return !value;

			case "render-level":
				if (!event.arg) return;
				// if active level; save modifications
				if (Self.xSection) {
					let nodes = Self.dispatch({ type: "output-pgn", arg: "get-nodes" }),
						xBg = Self.xSection.selectSingleNode(`./Layer[@id="background"]`),
						xCol = Self.xSection.selectSingleNode(`./Layer[@id="collision"]`),
						xAct = Self.xSection.selectSingleNode(`./Layer[@id="action"]`);
					// delete old background data
					while (xBg.hasChildNodes()) {
						xBg.removeChild(xBg.firstChild);
					}
					// delete old collision data
					while (xCol.hasChildNodes()) {
						xCol.removeChild(xCol.firstChild);
					}
					// delete old action data
					while (xAct.hasChildNodes()) {
						xAct.removeChild(xAct.firstChild);
					}
					// insert new tiles
					nodes.map(x => xBg.appendChild(x));
					// save "position"
					el = Self.els.viewport.find(".layer-background");
					Self.xSection.setAttribute("y", +el.css("--y"));
					Self.xSection.setAttribute("x", +el.css("--x"));
				}
				// check if level has tile nodes
				let xSection = window.bluePrint.selectSingleNode(`//Section[@id = "${event.arg}"]`),
					xBg = xSection.selectSingleNode(`./Layer[@id="background"]`),
					sectionEl = APP.lift.els.el.find(`.ship .section[data-id="${event.arg}"]`);
				if (!xBg.selectNodes(`./i`).length) {
					let nodes = [],
						len = +xSection.getAttribute("height") * +xSection.getAttribute("width");
					while (len--) { nodes.push(`<i />`); }
					// insert nodes
					$.xmlFromString(`<data>${nodes.join("")}</data>`)
						.selectNodes(`/data/i`).map(x => xBg.appendChild(x));
				}
				// save reference to current
				Self.xSection = xSection;
				// update menu
				window.bluePrint.selectNodes(`//Menu[@check-group="game-level"][@is-checked]`).map(x => x.removeAttribute("is-checked"));
				window.bluePrint.selectSingleNode(`//Menu[@check-group="game-level"][@arg="${event.arg}"]`).setAttribute("is-checked", "1");
				// delete old level HTML
				Self.els.viewport.find(".layer-background").remove();
				Self.els.viewport.find(".layer-collision").remove();
				Self.els.viewport.find(".layer-action").remove();
				Self.els.viewport.find(".layer-los").remove();
				// render + append HTML
				window.render({
					template: "layer-background",
					match: `//Section[@id = "${event.arg}"]`,
					append: Self.els.viewport,
				});
				// render collision layer
				window.render({
					template: "layer-collision",
					match: `//Section[@id = "${event.arg}"]`,
					append: Self.els.viewport,
				});
				// render action layer
				window.render({
					template: "layer-action",
					match: `//Section[@id = "${event.arg}"]`,
					append: Self.els.viewport,
				});
				// render los layer
				window.render({
					template: "layer-los",
					match: `//Section[@id = "${event.arg}"]`,
					append: Self.els.viewport,
				});
				// prevent "see-through"
				el = Self.els.viewport.find(".layer-background");
				Self.els.viewport.find(".level-bg").css({
					background: sectionEl.data("color"),
					"--x": el.cssProp("--x"),
					"--y": el.cssProp("--y"),
					"--w": el.cssProp("--w"),
					"--h": el.cssProp("--h"),
				});
				el.css({ filter: sectionEl.data("filter") });
				break;
		}
	}
}
