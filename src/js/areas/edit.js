
// paradroid.edit

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			palette: window.find(".tile-palette"),
			viewport: window.find(".viewport"),
		};
		// palette details
		this.palette = {
			selection: [{ x: 0, y: 0, id: "m00" }],
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
					el = $(event.target);
					el.prop({ className: Self.palette.tile });
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
					let top = event.clientY - Drag.click.y,
						left = event.clientX - Drag.click.x;
					Drag.el.css({ top, left, });
					// save drag details
					Drag.moved = { top, left, };
				} else if (event.target.nodeName === "B") {
					let el = $(event.target),
						offset = el.offset(".level"),
						x = event.offsetX + offset.top,
						y = event.offsetY + offset.left;
					console.log(x, y);
				}
				break;
			case "mouseup":
				if (Drag.moved) {
					let y = Math.round(Drag.moved.top / Drag.data.tile),
						x = Math.round(Drag.moved.left / Drag.data.tile);
					Drag.el.css({ top: "", left: "", "--y": y, "--x": x });
				}
				// reset drag data
				delete Self.drag;
				// show cursor
				Self.els.viewport.removeClass("hide-cursor");
				break;
		}
	}
}
