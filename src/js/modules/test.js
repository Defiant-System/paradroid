
let Test = {
	init(APP) {
		// return;

		// let pos = new Point(100, 100),
		// 	vel = new Point(10, 0);
		// console.log( pos.clone().subtract(vel).normalize() );
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
		// setTimeout(() => APP.start.els.el.find(`.option:nth-child(1) .box-title`).trigger("click"), 600);
		return;
		 */

		
		/*
		 * BRIEFING View
		APP.dispatch({ type: "show-view", arg: "briefing" });
		return;
		 */

		
		// view animation
		// setTimeout(() => APP.dispatch({ type: "switch-to-view", arg: "transfer" }), 100);
		// setTimeout(() => APP.dispatch({ type: "switch-to-view", arg: "terminated" }), 100);
		// return;

		/*
		 * TRANSFER View
		APP.dispatch({ type: "show-view", arg: "transfer", anim: "none" });
		setTimeout(() => APP.transfer.dispatch({ type: "render-schemas" }), 50);
		// setTimeout(() => APP.transfer.dispatch({ type: "generate-schemas" }), 50);
		// setTimeout(() => APP.transfer.dispatch({ type: "new-hacking-game" }), 50);
		// setTimeout(() => APP.transfer.dispatch({ type: "start-hacking" }), 1500);

		// setTimeout(() => APP.transfer.els.ioLeds.find("div").get(0).addClass("flicker"), 250);
		// setTimeout(() => APP.transfer.els.cpu.data({ winner: "flicker" }), 250);
		// setTimeout(() => APP.transfer.chooseColor = true, 150);

		let el = APP.transfer.els.cbLeft.find(`.toggler`);
		setTimeout(() => APP.transfer.dispatch({ type: "toggle-io-row", el, index: 2 }), 150);
		setTimeout(() => APP.transfer.dispatch({ type: "toggle-io-row", el, index: 4 }), 350);
		return;

		// setTimeout(() => APP.transfer.dispatch({ type: "toggle-io-row", el, index: 7 }), 1100);
		// setTimeout(() => APP.transfer.dispatch({ type: "toggle-io-row", el, index: 6 }), 1100);
		// setTimeout(() => APP.transfer.dispatch({ type: "toggle-io-row", el, index: 9 }), 1000);

		setTimeout(() => {
			let el = APP.transfer.els.board.find(".droid:not(.player)"),
				owner = APP.transfer,
				order = [2, 6];
			APP.transfer.AI = new HackerAI({ el, id: el.data("id"), owner, order });
			// APP.transfer.AI.setOrder([2, 6]);
		}, 1000);
		return;
		 */


		/*
		 * CONSOLE View
		APP.mobile.arena = { player: { id: 598 } };
		APP.dispatch({ type: "show-view", arg: "console" });
		// setTimeout(() => APP.console.dispatch({ type: "init-view", id: "598" }), 600);
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
		 */
		return setTimeout(() => {
			let spawn = window.open("editor");

			APP.dispatch({ type: "show-view", arg: "editor" });
			APP.editor.dispatch({ type: "render-level", arg: 6, spawn });
			// APP.editor.dispatch({ type: "toggle-overflow", spawn });
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


		return setTimeout(() => {
			let state = {
					// map: { id: 14, clear: .15 }, player: { id: "711", x: 20, y: 16, power: .35 }, debug: { mode: 0 },
					// map: { id: 16, clear: .1 }, player: { id: "711", x: 17, y: 15, power: .5 }, debug: { mode: 0 },
					// map: { id: 2, clear: .25 }, player: { id: "302", x: 35, y: 15, power: .35 }, debug: { mode: 0 },
					// map: { id: 6, clear: .1 }, player: { id: "001", x: 33, y: 28, power: .35 }, debug: { mode: 0 },
					// map: { id: 1, clear: .1 }, player: { id: "001", x: 25, y: 9, power: .35 }, debug: { mode: 0 },
					// map: { id: 2, clear: .1 }, player: { x: 35, y: 14, power: .5 }, debug: { mode: 1 },
					// map: { id: 10, clear: .5 }, player: { x: 4, y: 7, power: .5 }, debug: { mode: 0 },
					map: { id: 11, clear: .1 }, player: { x: 6, y: 9, power: .85 }, debug: { mode: 0 },
					// map: { id: 5, clear: .1 }, player: { id: "001", x: 3, y: 3, power: .25 }, debug: { mode: 0 },
				};
			APP.mobile.dispatch({ type: "restore-state", state });

			// setTimeout(() => APP.mobile.dispatch({ type: "toggle-lights" }), 800);
			// setTimeout(() => APP.mobile.arena.map.droids[1].setPath(), 600);
			// setTimeout(() => APP.mobile.arena.player.fire(), 600);

			// setTimeout(() => {
			// 	APP.dispatch({ type: "show-view", arg: "console" });
			// 	APP.console.dispatch({ type: "show-view", arg: "droid" });

			// 	// setTimeout(() => APP.console.dispatch({ type: "window.keydown", char: "right" }), 300);
			// }, 300);

			// setTimeout(() => {
			// 	APP.els.content.find(".mobile-view .droid-fx").cssSequence("fast-focus", "animationend", el => {
			// 		el.removeClass("fast-focus");
			// 	});
			// }, 500);

			// pause test
			// setTimeout(() => APP.mobile.dispatch({ type: "game-loop-pause" }), 500);
			// setTimeout(() => APP.mobile.dispatch({ type: "level-lights-off" }), 1500);
			// setTimeout(() => APP.mobile.dispatch({ type: "window.keydown", char: "return" }), 400);
			// setTimeout(() => Matter.Runner.stop(APP.mobile.arena.map.runner), 1500);

		}, 300);

	}
};
