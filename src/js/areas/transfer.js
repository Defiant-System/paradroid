
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
			el;
		// console.log(event);
		switch (event.type) {
			// custom events
			case "render-circuit-board":
				// render circuit board HTML
				window.render({
					template: "circuit-board-left",
					match: `//CircuitBoard`,
					target: Self.els.cbLeft,
				});
				// window.render({
				// 	template: "circuit-board-right",
				// 	match: `//CircuitBoard`,
				// 	target: Self.els.cbRight,
				// });
				break;
		}
	}
}
