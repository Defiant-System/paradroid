
let Test = {
	init(APP) {
		// return;
		return APP.dispatch({ type: "show-view", arg: "mobile" });

		APP.dispatch({ type: "show-view", arg: "mobile" });
		return setTimeout(() => {
			let state = {
					"001": { x: 2, y: 1 },
					"map": {
						id: "b",
						droids: [
							// { id: "247", x: 14, y: 7 },
							// { id: "516", x: 1, y: 5 },
						],
					},
				};
			APP.mobile.dispatch({ type: "restore-state", state });
			// pause test
			// setTimeout(() => APP.mobile.arena.fpsControl.stop(), 2500);
		}, 300);
		

		APP.editor.dispatch({ type: "render-level", arg: "c" });
		APP.editor.els.palette.find(`.buttons span[data-arg=".25"]`).trigger("click");
		// APP.editor.dispatch({ type: "output-pgn" });

	}
};
