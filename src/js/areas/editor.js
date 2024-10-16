
// paradroid.editor

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			palette: window.find(".tile-palette"),
			viewport: window.find(".viewport"),
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

		// pan viewport level
		this.els.viewport.on("mousedown mousemove mouseup", this.doPan);
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.editor,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// custom events
			case "put-tile":
				if (event.metaKey) {
					// activate "PAN"
					return;
				} else if (event.shiftKey) {
					let levelEl = $(event.target),
						tiles = levelEl.find("b"),
						grid = parseInt(levelEl.cssProp("--tile"), 10),
						x = Math.ceil(event.offsetX / grid) - 1,
						y = Math.ceil(event.offsetY / grid) - 1,
						w = +levelEl.cssProp("--w"),
						id = tiles.get((y * w) + x).prop("class").split(" ")[0];
					// build custom palette cursor
					if (!Self.palette.cursorOrigo) {
						Self.palette.cursorOrigo = { x, y, id };
						Self.palette.cursor = [];
					}
					// adjust position relative to origo
					x -= Self.palette.cursorOrigo.x;
					y -= Self.palette.cursorOrigo.y;
					Self.palette.cursor.push({ x, y, id });
					// insert viewport cursor tiles
					value = Self.palette.cursor.map(c => `<b class="${c.id}" style="--x: ${c.x}; --y: ${c.y};"></b>`);
					Self.els.cursor.html(value.join(""));
				} else {
					let levelEl = $(event.target),
						tiles = levelEl.find("b"),
						grid = parseInt(levelEl.cssProp("--tile"), 10),
						w = +levelEl.cssProp("--w"),
						l = Math.ceil(event.offsetX / grid) - 1,
						t = Math.ceil(event.offsetY / grid) - 1;
					// apply palette cursor;
					Self.palette.cursor.map(sel => {
						let index = ((t + sel.y) * w) + (l + sel.x),
							el = tiles.get(index);
						el.prop({ className: sel.id });
					});
				}
				break;
			case "select-tile":
				el = $(event.target);
				Self.palette.tile = el.prop("class").split(" ")[0];
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
				Self.els.palette.find(".active").removeClass("active");
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
			case "cursor-eraser":
				// empty palette cursor / eraser
				Self.palette.tile = "";
				Self.palette.cursor = [{ x: 0, y: 0, id: Self.palette.tile }];
				// update viewport cursor
				value = `<b class="${Self.palette.tile}" style="--x: 0; --y: 0;"></b>`;
				Self.els.cursor.html(value);
				// reset palette cursor
				delete Self.palette.cursorOrigo;
				break;
			case "toggle-overflow":
				el = Self.els.viewport;
				el.toggleClass("show-overflow", el.hasClass("show-overflow"));
				break;
			case "toggle-grid":
				el = Self.els.viewport.find(".level");
				el.toggleClass("hide-grid", el.hasClass("hide-grid"));
				break;
			case "toggle-bg":
				el = Self.els.viewport.find(".level");
				el.toggleClass("hide-bg", el.hasClass("hide-bg"));
				break;
			case "render-level":
				// if active level; save modifications
				if (Self.xLevel) {
					let nodes = Self.dispatch({ type: "output-pgn", arg: "get-nodes" });
					// delete old data
					while (Self.xLevel.hasChildNodes()) {
						Self.xLevel.removeChild(Self.xLevel.firstChild);
					}
					// insert new tiles
					nodes.map(x => Self.xLevel.appendChild(x));
					// save "position"
					el = Self.els.viewport.find(".level");
					Self.xLevel.setAttribute("y", +el.css("--y"));
					Self.xLevel.setAttribute("x", +el.css("--x"));
				}
				// check if level has tile nodes
				let xLevel = window.bluePrint.selectSingleNode(`//Level[@id = "${event.arg}"]`);
				if (!xLevel.selectNodes("./i").length) {
					let nodes = [],
						len = +xLevel.getAttribute("height") * +xLevel.getAttribute("width");
					while (len--) { nodes.push(`<i />`); }
					// insert nodes
					$.xmlFromString(`<data>${nodes.join("")}</data>`)
						.selectNodes(`/data/i`).map(x => xLevel.appendChild(x));
				}
				// save reference to current
				Self.xLevel = xLevel;
				// update menu
				window.bluePrint.selectNodes(`//Menu[@check-group="game-level"][@is-checked]`).map(x => x.removeAttribute("is-checked"));
				window.bluePrint.selectSingleNode(`//Menu[@check-group="game-level"][@arg="${event.arg}"]`).setAttribute("is-checked", "1");
				// delete old level HTML
				Self.els.viewport.find(".level").remove();
				// render + append HTML
				window.render({
					template: "level",
					match: `//Level[@id = "${event.arg}"]`,
					append: Self.els.viewport,
				});
				break;
			case "grid-size":
				event.el.parent().find(".active").removeClass("active");
				event.el.addClass("active");
				
				Self.els.viewport.parent().removeClass("big-tiles small-tiles").addClass(event.arg === "1" ? "big-tiles" : "small-tiles");
				break;
			case "output-pgn":
				let tiles = [];

				// tiles.push(`<Level id="a" width="12" height="6">\n`);
				Self.els.viewport.find(`.level b`).map(tile => {
					let id = tile.className ? `id="${tile.className.split(" ")[0]}"` : "";
					tiles.push(`<i ${id}/>`);
				});
				// tiles.push(`\n</Level>`);

				if (event.arg === "get-nodes") return $.xmlFromString(`<data>${tiles.join("")}</data>`).selectNodes("//i");
				console.log(tiles.join(""));
				break;
		}
	},
	doPan(event) {
		let APP = paradroid,
			Self = APP.editor,
			Drag = Self.drag;
		switch (event.type) {
			case "mousedown":
				if (event.button != 0) return;

				// prevent default behaviour
				event.preventDefault();

				let el = Self.els.viewport.find(".level"),
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
				Self.drag = { el, data, click };
				// hide cursor
				Self.els.viewport.addClass("hide-cursor");
				break;
			case "mousemove":
				if (Drag) {
					let threshold = Drag.data.tile >> 1,
						top = event.clientY - Drag.click.y,
						left = event.clientX - Drag.click.x;
					Drag.el.css({ top, left, });
					// save drag details
					if (Math.abs(Drag.data.top - top) > threshold || Math.abs(Drag.data.left - left) > threshold) {
						Drag.moved = { top, left, };
					}
				} else if (event.target.classList.contains("level")) {
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
				if (Drag && Drag.moved) {
					let y = Math.round(Drag.moved.top / Drag.data.tile),
						x = Math.round(Drag.moved.left / Drag.data.tile);
					Drag.el.css({ top: "", left: "", "--y": y, "--x": x });
				} else if (Drag) {
					Drag.el.css({ top: "", left: "" });
				}
				// reset drag data
				delete Self.drag;
				// show cursor
				Self.els.viewport.removeClass("hide-cursor");
				break;
		}
	}
}
