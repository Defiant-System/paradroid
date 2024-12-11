
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
			case "toggle-io-row":
				el = $(event.target);
				row = el.parent().parent().find(`svg g:nth(${el.index()})`);
				row.toggleClass("on", row.hasClass("on"));
				break;
		}
	}
}
