
let Test = {
	init(APP) {
		// return;

		// return APP.dispatch({ type: "show-view", arg: "more" });
		// return APP.dispatch({ type: "show-view", arg: "start" });
		// return APP.dispatch({ type: "show-view", arg: "console" });

		/*
		 * Finder algorithm
		var graph = new Finder.Graph([
			[1,1,1,1],
			[0,1,1,0],
			[0,0,1,1]
		]);
		var start = graph.grid[0][0];
		var end = graph.grid[2][2];
		var result = Finder.astar.search(graph, start, end);
		console.log( result );
		 */

		
		/*
		 * LIFT View
		APP.dispatch({ type: "show-view", arg: "lift" });
		APP.lift.els.el.find(".lift").get(0).trigger("click");
		return;
		 */

		/*
		 * EDITOR
		APP.dispatch({ type: "show-view", arg: "editor" });
		APP.editor.dispatch({ type: "render-level", arg: "14" });

		APP.editor.els.palette.find(`.tab-row span:nth(1)`).trigger("click");
		APP.editor.els.palette.find(`.tiles[data-click="select-col-tile"] b[data-size="2x2"]`).trigger("click");
		// // APP.editor.els.palette.find(`.buttons span[data-arg=".25"]`).trigger("click");
		APP.editor.dispatch({ type: "toggle-overflow" });
		// // APP.editor.dispatch({ type: "output-pgn" });
		return;
		 */

		// // setTimeout(() => APP.editor.els.palette.find(`.buttons span[data-click="output-collision-pgn"]`).trigger("click"), 300);
		// return;


		return setTimeout(() => {
			let state = {
					map: { id: 1, clear: .15 }, player: { id: "001", x: 35, y: 9, power: .25 }, debug: { mode: 0 },
					// map: { id: 11, clear: .35 }, player: { x: 5, y: 3, power: .35 }, debug: { mode: 0 },
					// map: { id: 4, clear: .1 }, player: { x: 33, y: 5, power: .25 }, debug: { mode: 0 },
					// map: { id: 3, clear: .5 }, player: { x: 19, y: 15, power: .5 }, debug: { mode: 0 },
				};
			APP.mobile.dispatch({ type: "restore-state", state });
			// pause test
			// setTimeout(() => APP.mobile.arena.fpsControl.stop(), 1500);
			// setTimeout(() => APP.mobile.dispatch({ type: "level-lights-off" }), 1500);
			// setTimeout(() => Matter.Runner.stop(APP.mobile.arena.map.runner), 1500);
		}, 100);

	}
};
