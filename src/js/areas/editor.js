
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

		this.groups = {
			"m02": [{ x: 0, y: 0, id: "m02" }, { x: 1, y: 0, id: "m03" }, { x: 0, y: 1, id: "m12" }, { x: 1, y: 1, id: "m13" }],
			"m04": [{ x: 0, y: 0, id: "m04" }, { x: 1, y: 0, id: "m05" }, { x: 0, y: 1, id: "m14" }, { x: 1, y: 1, id: "m15" }],
			"m06": [{ x: 0, y: 0, id: "m06" }, { x: 1, y: 0, id: "m07" }, { x: 0, y: 1, id: "m16" }, { x: 1, y: 1, id: "m17" }],

			"m0c": [{ x: 0, y: 0, id: "m0c" }, { x: 1, y: 0, id: "m0d" }, { x: 0, y: 1, id: "m1c" }, { x: 1, y: 1, id: "m1d" }],
			"m0e": [{ x: 0, y: 0, id: "m0e" }, { x: 1, y: 0, id: "m0f" }, { x: 0, y: 1, id: "m1e" }, { x: 1, y: 1, id: "m1f" }],
			"m20": [{ x: 0, y: 0, id: "m20" }, { x: 1, y: 0, id: "m21" }, { x: 0, y: 1, id: "m30" }, { x: 1, y: 1, id: "m31" }],
			"m22": [{ x: 0, y: 0, id: "m22" }, { x: 1, y: 0, id: "m23" }, { x: 0, y: 1, id: "m32" }, { x: 1, y: 1, id: "m33" }],

			"m2e": [{ x: 0, y: 0, id: "m2e" }, { x: 1, y: 0, id: "m2f" }, { x: 0, y: 1, id: "m3e" }, { x: 1, y: 1, id: "m3f" }],
			"m40": [{ x: 0, y: 0, id: "m40" }, { x: 1, y: 0, id: "m41" }, { x: 0, y: 1, id: "m50" }, { x: 1, y: 1, id: "m51" }],
			"m42": [{ x: 0, y: 0, id: "m42" }, { x: 1, y: 0, id: "m43" }, { x: 0, y: 1, id: "m52" }, { x: 1, y: 1, id: "m53" }],
			"m44": [{ x: 0, y: 0, id: "m44" }, { x: 1, y: 0, id: "m45" }, { x: 0, y: 1, id: "m54" }, { x: 1, y: 1, id: "m55" }],

			"m46": [{ x: 0, y: 0, id: "m46" }, { x: 1, y: 0, id: "m47" }, { x: 0, y: 1, id: "m56" }, { x: 1, y: 1, id: "m57" }],
			"m48": [{ x: 0, y: 0, id: "m48" }, { x: 1, y: 0, id: "m49" }, { x: 0, y: 1, id: "m58" }, { x: 1, y: 1, id: "m59" }],
			"m4a": [{ x: 0, y: 0, id: "m4a" }, { x: 1, y: 0, id: "m4b" }, { x: 0, y: 1, id: "m5a" }, { x: 1, y: 1, id: "m5b" }],
			"m4c": [{ x: 0, y: 0, id: "m4c" }, { x: 1, y: 0, id: "m4d" }, { x: 0, y: 1, id: "m5c" }, { x: 1, y: 1, id: "m5d" }],

			"m60": [{ x: 0, y: 0, id: "m60" }, { x: 1, y: 0, id: "m61" }, { x: 0, y: 1, id: "m70" }, { x: 1, y: 1, id: "m71" }],
			"m68": [{ x: 0, y: 0, id: "m68" }, { x: 1, y: 0, id: "m69" }, { x: 0, y: 1, id: "m78" }, { x: 1, y: 1, id: "m79" }],
			"m6a": [{ x: 0, y: 0, id: "m6a" }, { x: 1, y: 0, id: "m6b" }, { x: 0, y: 1, id: "m7a" }, { x: 1, y: 1, id: "m7b" }],
			"m6c": [{ x: 0, y: 0, id: "m6c" }, { x: 1, y: 0, id: "m6d" }, { x: 0, y: 1, id: "m7c" }, { x: 1, y: 1, id: "m7d" }],
		};

		// pan viewport events
		this.els.viewport.on("mousedown mousemove mouseup", this.doPan);
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.editor,
			Spawn = event.spawn,
			tiles,
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
				// grouped tiles
				if (Self.groups[Self.palette.tile]) {
					Self.palette.cursorOrigo = { x: 0, y: 0 };
					Self.palette.cursor = [...Self.groups[Self.palette.tile]];
					// insert viewport cursor tiles
					value = Self.palette.cursor.map(c => `<b class="${c.id}" style="--x: ${c.x}; --y: ${c.y};"></b>`);
					Self.els.cursor.html(value.join(""));
					return;
				}
				// update UI
				Self.els.palette.find(".tiles .active").removeClass("active");
				if (Self.palette.tile) {
					Self.els.palette.find(`.${Self.palette.tile}`).addClass("active");
				}
				// empty palette cursor / eraser
				Self.palette.cursor = [{ x: 0, y: 0, id: Self.palette.tile }];
				// update viewport cursor
				value = `<b class="${Self.palette.tile}" style="--x: 0; --y: 0;"></b>`;
				Self.els.cursor.html(value);
				// reset palette cursor
				delete Self.palette.cursorOrigo;
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
				let layers = [".layer-background", ".layer-collision", ".layer-action", ".layer-los", ".layer-lights"];
				Self.els.viewport.find(layers.join(",")).remove();
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
				// render lights layer
				window.render({
					template: "layer-lights",
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
			case "grid-size":
				event.el.parent().find(".active").removeClass("active");
				event.el.addClass("active");
				
				Self.els.viewport.parent().removeClass("big-tiles small-tiles").addClass(event.arg === "1" ? "big-tiles" : "small-tiles");
				break;
			case "set-action-id":
				value = event.el.data("arg");
				Self.els.palette.find(`input[name="action-id"]`).val(value);
				// update node
				Self.dispatch({ type: "update-action-tiles" });
				break;
			case "update-action-tiles":
			case "clear-action-tiles":
				let aId = Self.els.palette.find(`input[name="action-id"]`).val(),
					[aX, aY, aW, aH] = Self.els.palette.find(`input[name="action-coord"]`).val().split(",").map(i => +i),
					aEl = Self.els.viewport.find(`.layer-action b.a1[style="--x: ${aX};--y: ${aY};--w: ${aW};--h: ${aH};"]`),
					xNode = Self.xSection.selectSingleNode(`./Layer[@id="action"]/i[@x="${aX}"][@y="${aY}"][@w="${aW}"][@h="${aH}"]`);
				
				if (event.type === "clear-action-tiles") {
					// clear DOM
					aEl.remove();
					// clear from xml
					if (xNode) xNode.parentNode.removeChild(xNode);
					// console.log( Self.xSection );
				} else {
					let xLayer = Self.xSection.selectSingleNode(`./Layer[@id="action"]`),
						xAction = $.nodeFromString(`<i x="${aX}" y="${aY}" w="${aW}" h="${aH}" action="${aId}"/>`);
					xLayer.appendChild(xAction);
					// update UI element attribute
					aEl.data({ action: aId });
				}
				break;
			case "duplicate-active":
				// remove active
				el = Self.els.viewport.find(".layer-collision .active").removeClass("active").clone(true);
				Self.els.viewport.find(".layer-collision").append(el);
				// hide editbox
				Self.els.editBox.attr({ "style": "" });
				break;
			case "delete-active":
				// remove active
				Self.els.viewport.find(".layer-collision .active").remove();
				// hide editbox
				Self.els.editBox.attr({ "style": "" });
				break;
			case "output-collision-pgn":
				tiles = [];
				Self.els.viewport.find(`.layer-collision b`).map(tile => {
					let tEl = $(tile),
						x = parseInt(tEl.cssProp("--x"), 10),
						y = parseInt(tEl.cssProp("--y"), 10),
						w = parseInt(tEl.cssProp("--w"), 10),
						h = parseInt(tEl.cssProp("--h"), 10),
						id = tile.className.split(" ")[0],
						attr = [];
					attr.push(`x="${x}"`);
					attr.push(`y="${y}"`);

					switch (id) {
						case "c1":
						case "c4":
							attr.push(`w="${w}"`);
							attr.push(`h="${h}"`);
							break;
						case "c5":
							attr = [`x="${x+1}"`, `y="${y-1}"`];
							break;
						case "c6":
							attr = [`x="${x-1}"`, `y="${y-1}"`];
							break;
					}
					tiles.push(`<i id="${id}" ${attr.join(" ")}/>`);
				});
				console.log(tiles.join("\n"));
				break;
			case "output-action-pgn":
				tiles = [];
				Self.els.viewport.find(`.layer-action b`).map(tile => {
					let tEl = $(tile),
						x = tEl.cssProp("--x"),
						y = tEl.cssProp("--y"),
						w = tEl.cssProp("--w"),
						h = tEl.cssProp("--h");
					tiles.push(`<i x="${x}" y="${y}" w="${w}" h="${h}" action="${tEl.data("action")}"/>`);
				});
				console.log(tiles.join("\n"));
				break;
			case "output-pgn":
				tiles = [];
				// tiles.push(`<Section id="a" width="12" height="6">\n`);
				Self.els.viewport.find(`.layer-background b`).map(tile => {
					let id = tile.className ? `id="${tile.className.split(" ")[0]}"` : "";
					tiles.push(`<i ${id}/>`);
				});
				// tiles.push(`\n</Section>`);

				if (event.arg === "get-nodes") return $.xmlFromString(`<data>${tiles.join("")}</data>`).selectNodes("//i");
				console.log(tiles.join(""));
				break;
		}
	},
	doPan(event) {
		let APP = paradroid,
			Self = APP.editor,
			Pan = Self.pan;
		switch (event.type) {
			case "mousedown":
				if (event.button != 0) return;
				// prevent default behaviour
				event.preventDefault();

				let el = Self.els.viewport.find(".layer-background"),
					offset = el.offset(".viewport"),
					data = {
						...offset,
						y: +el.cssProp("--y"),
						x: +el.cssProp("--x"),
						tile: parseInt(el.cssProp("--tile"), 10),
					},
					click = {
						y: event.clientY - offset.top,
						x: event.clientX - offset.left,
					};
				// save drag details
				Self.pan = { el, data, click };
				// hide cursor
				if (event.metaKey) {
					Self.els.viewport.addClass("hide-cursor");
					Self.els.editBox.addClass("hidden");
				}
				break;
			case "mousemove":
				if (Pan) {
					let threshold = Pan.data.tile >> 1,
						top = event.clientY - Pan.click.y,
						left = event.clientX - Pan.click.x;
					Pan.el.css({ top, left, });
					// save drag details
					if (Math.abs(Pan.data.top - top) > threshold || Math.abs(Pan.data.left - left) > threshold) {
						Pan.moved = { top, left, };
					}
				// } else if (event.target.classList.contains("level")) {
				} else if (event.target.classList.contains("layer-collision")) {
					Self.els.cursor.css({ "--t": 0, "--l": 0, "--tx": 1, "--ty": 1 });
				} else {
					if (event.shiftKey) return;

					let el = $(event.target),
						tile = parseInt(el.cssProp("--tile"), 10),
						tx = +el.cssProp("--x") - 1,
						ty = +el.cssProp("--y") - 1,
						l = Math.ceil(event.offsetX / tile),
						t = Math.ceil(event.offsetY / tile);
					Self.els.cursor.css({ "--t": t, "--l": l, "--tx": tx, "--ty": ty });
				}
				break;
			case "mouseup":
				if (Pan && Pan.moved) {
					let y = Math.round(Pan.moved.top / Pan.data.tile),
						x = Math.round(Pan.moved.left / Pan.data.tile);
					Pan.el.css({ top: "", left: "", "--y": y, "--x": x });
					Self.els.viewport.find(".level-bg").css({ "--y": y, "--x": x });
					Self.els.viewport.find(".layer-collision").css({ "--y": y, "--x": x });
					Self.els.viewport.find(".layer-action").css({ "--y": y, "--x": x });
					Self.els.editBox.css({ margin: `${y * Pan.data.tile}px 0 0 ${x * Pan.data.tile}px` });
				} else if (Pan) {
					Pan.el.css({ top: "", left: "" });
				}
				// reset drag data
				delete Self.pan;
				// show cursor
				Self.els.viewport.removeClass("hide-cursor");
				Self.els.editBox.removeClass("hidden");
				break;
		}
	}
}
