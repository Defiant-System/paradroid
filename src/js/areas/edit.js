
// paradroid.edit

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			palette: window.find(".tile-palette"),
			viewport: window.find(".viewport"),
		};
		// 
		this.palette = {
			tile: "m00",
		};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.edit,
			el;
		// console.log(event);
		switch (event.type) {
			// custom events
			case "put-tile":
				el = $(event.target);
				el.prop({ className: Self.palette.tile });
				break;
			case "select-tile":
				el = $(event.target);
				Self.palette.tile = el.prop("class").split(" ")[0];
				// update UI
				Self.els.palette.find(".active").removeClass("active");
				el.addClass("active");
				break;
			case "render-level":
				window.render({
					template: "level",
					match: "//Level[@id = 'a']",
					target: Self.els.viewport,
				});
				break;
			case "output-pgn":
				let tiles = [];

				tiles.push(`<Level id="a" width="12" height="6">`);
				Self.els.viewport.find(`.level b`).map(tile => {
					let id = tile.className ? `id="${tile.className.split(" ")[0]}"` : "";
					tiles.push(`\t<i ${id}/>`);
				});
				tiles.push(`</Level>`);

				console.log(tiles.join("\n"));
				break;
		}
	}
}
