
let Test = {
	init(APP) {
		// return;

		// return APP.dispatch({ type: "show-view", arg: "terminated" });


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
		 * START View
		APP.dispatch({ type: "show-view", arg: "start" });
		setTimeout(() => APP.start.dispatch({ type: "init-anim" }), 400);
		return;
		 */


		/*
		 * CONSOLE View
		APP.dispatch({ type: "show-view", arg: "console" });
		APP.console.dispatch({ type: "show-droid", value: "999" });
		return;
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
		APP.editor.dispatch({ type: "render-level", arg: "1" });

		APP.editor.els.palette.find(`.tab-row span:nth(1)`).trigger("click");
		// APP.editor.els.palette.find(`.tiles[data-click="select-col-tile"] b[data-size="1x1"]`).trigger("click");
		// // APP.editor.els.palette.find(`.buttons span[data-arg=".25"]`).trigger("click");
		APP.editor.dispatch({ type: "toggle-overflow" });

		// setTimeout(() => APP.els.content.find(`.layer-collision .c1`).get(3).trigger("click"), 500);

		// // APP.editor.dispatch({ type: "output-pgn" });
		return;

		// // setTimeout(() => APP.editor.els.palette.find(`.buttons span[data-click="output-collision-pgn"]`).trigger("click"), 300);
		// return;
		 */


		return setTimeout(() => {
			let state = {
					// map: { id: 1, clear: .15 }, player: { id: "001", x: 25, y: 9, power: .25 }, debug: { mode: 1 },
					// map: { id: 2, clear: .25 }, player: { id: "302", x: 35, y: 15, power: .35 }, debug: { mode: 0 },
					// map: { id: 10, clear: .35 }, player: { x: 5, y: 3, power: .35 }, debug: { mode: 0 },
					// map: { id: 1, clear: .1 }, player: { x: 23, y: 7, power: .5 }, debug: { mode: 1 },
					// map: { id: 2, clear: .1 }, player: { x: 35, y: 14, power: .5 }, debug: { mode: 1 },
					// map: { id: 3, clear: .5 }, player: { x: 19, y: 15, power: .5 }, debug: { mode: 0 },
					// map: { id: 4, clear: .1 }, player: { x: 33, y: 5, power: .25 }, debug: { mode: 0 },
					map: { id: 19, clear: .1 }, player: { x: 6, y: 5, power: .25 }, debug: { mode: 1 },
				};
			APP.mobile.dispatch({ type: "restore-state", state });

			// setTimeout(() => {
			// 	APP.els.content.find(".mobile-view .droid-fx").cssSequence("fast-focus", "animationend", el => {
			// 		el.removeClass("fast-focus");
			// 	});
			// }, 500);

			// pause test
			// setTimeout(() => APP.mobile.arena.fpsControl.stop(), 1500);
			// setTimeout(() => APP.mobile.dispatch({ type: "level-lights-off" }), 1500);
			// setTimeout(() => APP.mobile.dispatch({ type: "window.keydown", char: "return" }), 400);
			// setTimeout(() => Matter.Runner.stop(APP.mobile.arena.map.runner), 1500);
		}, 100);

	}
};
