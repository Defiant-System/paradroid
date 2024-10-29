
let Test = {
	init(APP) {
		// return;
		
		// LIFT View
		APP.dispatch({ type: "show-view", arg: "lift" });
		APP.lift.els.el.find(".lift").get(0).trigger("click");
		return;

		// return APP.dispatch({ type: "show-view", arg: "start" });
		// return APP.dispatch({ type: "show-view", arg: "console" });

		// // EDITOR
		// APP.dispatch({ type: "show-view", arg: "editor" });
		// APP.editor.dispatch({ type: "render-level", arg: "1" });
		// return;

		// APP.editor.els.palette.find(`.tab-row span:nth(2)`).trigger("click");
		// APP.editor.els.palette.find(`.tiles[data-click="select-action-tile"] b[data-size="2x2"]`).trigger("click");
		// // APP.editor.els.palette.find(`.buttons span[data-arg=".25"]`).trigger("click");
		// // APP.editor.dispatch({ type: "output-pgn" });

		// // setTimeout(() => APP.editor.els.palette.find(`.buttons span[data-click="output-collision-pgn"]`).trigger("click"), 300);
		// return;


		return setTimeout(() => {
			let state = {
					"001": { x: 2, y: 1 },
					"map": {
						id: "19",
						// droids: [
						// 	{ id: "247", x: 14, y: 7 },
						// 	{ id: "516", x: 1, y: 5 },
						// ],
					},
				};
			APP.mobile.dispatch({ type: "restore-state", state });
			// pause test
			// setTimeout(() => APP.mobile.arena.fpsControl.stop(), 2500);
		}, 300);

	}
};
