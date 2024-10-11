
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
			selection: [
				{ x: 0, y: 0, id: "m42" },
				{ x: 1, y: 0, id: "m43" },
				{ x: 0, y: 1, id: "m50" },
				{ x: 1, y: 1, id: "m51" },
			],
		};
		// pan viewport level
		this.els.viewport.on("mousedown mousemove mouseup", this.doPan);
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.edit,
			el;
		// console.log(event);
		switch (event.type) {
			// custom events
			case "put-tile":
				if (event.metaKey) {
					// activate "PAN"
					return;
				} else if (event.metaKey) {
					Self.dispatch({ ...event, type: "select-tile" });
				} else {
					let levelEl = $(event.target),
						tiles = levelEl.find("b"),
						grid = parseInt(levelEl.cssProp("--tile"), 10),
						w = +levelEl.cssProp("--w"),
						l = Math.ceil(event.offsetX / grid) - 1,
						t = Math.ceil(event.offsetY / grid) - 1;
					// apply palette selection;
					Self.palette.selection.map(sel => {
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

				tiles.push(`<Level id="a" width="12" height="6">\n`);
				Self.els.viewport.find(`.level b`).map(tile => {
					let id = tile.className ? `id="${tile.className.split(" ")[0]}"` : "";
					tiles.push(`<i ${id}/>`);
				});
				tiles.push(`\n</Level>`);

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
				if (event.button != 1) return;

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
					if (Math.abs(Drag.data.top - top) > threshold || Math.abs(Drag.data.top - top) > threshold) {
						// save drag details
						Drag.moved = { top, left, };
					}
				} else if (event.target.classList.contains("level")) {
					let el = $(event.target),
						tile = parseInt(el.cssProp("--tile"), 10),
						l = Math.ceil(event.offsetX / tile),
						t = Math.ceil(event.offsetY / tile);
					Self.els.cursor.css({ "--t": t, "--l": l });
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
