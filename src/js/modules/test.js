
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
		APP.dispatch({ type: "show-view", arg: "start", anim: "none" });
		setTimeout(() => APP.start.els.el.find(`.option:nth-child(1) .box-title`).trigger("click"), 600);
		return;
		 */


		/*
		 * CONSOLE View
		APP.dispatch({ type: "show-view", arg: "console" });
		setTimeout(() => APP.console.dispatch({ type: "init-view" }), 600);
		// APP.console.dispatch({ type: "show-droid", value: "999" });
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
		return setTimeout(() => {
			let spawn = window.open("editor");

			APP.dispatch({ type: "show-view", arg: "editor" });
			APP.editor.dispatch({ type: "render-level", arg: 11, spawn });
			APP.editor.dispatch({ type: "toggle-overflow", spawn });
			APP.editor.dispatch({ type: "select-editor-layer", arg: "droids", spawn });

			// setTimeout(() => spawn.find(`.layer-background b.m06`).trigger("click"), 500);
			// setTimeout(() => window.find(`.layer-collision b.c4`).get(2).trigger("click"), 500);
			// setTimeout(() => spawn.find(`.tiles b[data-size="2x2"]`).trigger("click"), 500);

			// setTimeout(() => spawn.find(`.toolbar-tool_[data-click="los-add-segment"]`).trigger("click"), 500);
			// setTimeout(() => APP.editor.dispatch({ type: "output-los-pgn" }), 700);
			// setTimeout(() => APP.els.content.find(`.layer-los div`).get(3).trigger("click"), 500);
			// setTimeout(() => console.log( APP.els.content.find(`.layer-los .segment`).get(3)[] ), 500);

			// APP.editor.dispatch({ type: "output-pgn" });
		}, 100);
		 */


		return setTimeout(() => {
			let state = {
					// map: { id: 14, clear: .15 }, player: { id: "711", x: 20, y: 16, power: .35 }, debug: { mode: 0 },
					// map: { id: 16, clear: .1 }, player: { id: "711", x: 17, y: 15, power: .5 }, debug: { mode: 0 },
					// map: { id: 2, clear: .25 }, player: { id: "302", x: 35, y: 15, power: .35 }, debug: { mode: 0 },
					map: { id: 7, clear: .35 }, player: { x: 50, y: 3, power: .35 }, debug: { mode: 0 },
					// map: { id: 2, clear: .1 }, player: { x: 35, y: 14, power: .5 }, debug: { mode: 1 },
					// map: { id: 3, clear: .5 }, player: { x: 19, y: 15, power: .5 }, debug: { mode: 0 },
					// map: { id: 4, clear: .1 }, player: { x: 33, y: 5, power: .25 }, debug: { mode: 0 },
					// map: { id: 17, clear: .1 }, player: { id: "711", x: 32, y: 22, power: .25 }, debug: { mode: 0 },
				};
			APP.mobile.dispatch({ type: "restore-state", state });

			// setTimeout(() => APP.mobile.arena.player.fire(), 600);

			// setTimeout(() => {
			// 	APP.dispatch({ type: "show-view", arg: "console" });
			// 	APP.console.dispatch({ type: "show-view", arg: "ship" });
			// }, 600);

			// setTimeout(() => {
			// 	APP.els.content.find(".mobile-view .droid-fx").cssSequence("fast-focus", "animationend", el => {
			// 		el.removeClass("fast-focus");
			// 	});
			// }, 500);

			// pause test
			// setTimeout(() => APP.mobile.dispatch({ type: "game-loop-pause" }), 1500);
			// setTimeout(() => APP.mobile.dispatch({ type: "level-lights-off" }), 1500);
			// setTimeout(() => APP.mobile.dispatch({ type: "window.keydown", char: "return" }), 400);
			// setTimeout(() => Matter.Runner.stop(APP.mobile.arena.map.runner), 1500);

		}, 100);

	}
};
