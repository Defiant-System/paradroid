
let Test = {
	init(APP) {
		// return;

		APP.dispatch({ type: "show-view", arg: "mobile" });
		setTimeout(() => {
			let state = {
				"001": { x: 4, y: 6 },
				"map": {
					id: "b",
					droids: [
						{ id: "247", x: 2, y: 4 },
						{ id: "516", x: 1, y: 5 },
					],
				},
			};
			APP.mobile.dispatch({ type: "restore-state", state });
		}, 1000);
		return;

		APP.editor.dispatch({ type: "render-level", arg: "c" });
		APP.editor.els.palette.find(`.buttons span[data-arg=".25"]`).trigger("click");
		// APP.editor.dispatch({ type: "output-pgn" });

	}
};
