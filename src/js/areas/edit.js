
// paradroid.edit

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
			cursor: [
				{ x: 0, y: 0, id: "" },
				// { x: 0, y: 0, id: "m42" },
				// { x: 1, y: 0, id: "m43" },
				// { x: 0, y: 1, id: "m50" },
				// { x: 1, y: 1, id: "m51" },
			],
		};
		// pan viewport level
		this.els.viewport.on("mousedown mousemove mouseup", this.doPan);
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.edit,
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
			Self = APP.edit,
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
