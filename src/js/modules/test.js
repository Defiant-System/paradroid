
let Test = {
	init(APP) {
		return;

		// APP.start.dispatch({ type: "start-game" });
		// return true;

		/*
		 * START View
		APP.dispatch({ type: "show-view", arg: "start", anim: "none" });
		setTimeout(() => APP.start.els.el.find(`.option:nth-child(4) .box-title`).trigger("click"), 600);
		return true;
		 */

		
		/*
		 * TERMINATED View
		APP.dispatch({ type: "show-view", arg: "terminated" });
		return true;
		 */

		
		/*
		 * BRIEFING View
		APP.dispatch({ type: "show-view", arg: "briefing" });
		return true;
		 */

		
		/*
		 * FINISHED View
		APP.dispatch({ type: "show-view", arg: "finished" });
		return true;
		 */


		/*
		 * TRANSFER View
		APP.mobile.arena = {
			player: {
				id: "247",
				opponent: { id: "999" }
			}
		};
		APP.dispatch({ type: "show-view", arg: "transfer", anim: "none" });
		
		// setTimeout(() => APP.hud.dispatch({ type: "toggle-play-pause" }), 5000);
		// setTimeout(() => APP.transfer.dispatch({ type: "render-schemas" }), 50);
		// setTimeout(() => APP.transfer.dispatch({ type: "generate-schemas" }), 50);
		// setTimeout(() => APP.transfer.dispatch({ type: "new-hacking-game" }), 50);
		// setTimeout(() => APP.transfer.dispatch({ type: "start-hacking" }), 500);
		// return true;

		// setTimeout(() => APP.transfer.els.ioLeds.find("div").get(0).addClass("flicker"), 250);
		// setTimeout(() => APP.transfer.els.cpu.data({ winner: "flicker" }), 250);
		// setTimeout(() => APP.transfer.chooseColor = true, 150);

		let el1 = APP.transfer.els.cbLeft.find(`.toggler`);
		// setTimeout(() => APP.transfer.dispatch({ type: "toggle-io-row", el: el1, index: 2 }), 1500);
		return true;
		
		let el2 = APP.transfer.els.cbRight.find(`.toggler`);
		// setTimeout(() => APP.transfer.dispatch({ type: "toggle-io-row", el: el2, index: 2 }), 2500);
		// setTimeout(() => APP.transfer.dispatch({ type: "toggle-io-row", el: el2, index: 3 }), 2000);

		setTimeout(() => APP.transfer.dispatch({ type: "toggle-io-row", el: el2, index: 8 }), 3000);
		setTimeout(() => APP.transfer.dispatch({ type: "toggle-io-row", el: el2, index: 9 }), 1500);
		
		// setTimeout(() => APP.transfer.dispatch({ type: "toggle-io-row", el: el2, index: 5 }), 2500);
		// setTimeout(() => APP.transfer.dispatch({ type: "toggle-io-row", el: el2, index: 11 }), 3000);
		return true;

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
		return true;
		 */


		/*
		 * CONSOLE View
		APP.mobile.arena = { player: { id: "001" }, map: { id: 1 }, fpsControl: { _stopped: true } };
		APP.mobile.arena.colors = { base: "#f90" };
		APP.dispatch({ type: "show-view", arg: "console" });
		setTimeout(() => {
			// APP.console.dispatch({ type: "init-view", id: "001" });
			APP.console.dispatch({ type: "show-view", arg: 1 });
		}, 600);
		return true;
		 */


		/*
		 * LIFT View
		APP.dispatch({ type: "show-view", arg: "lift" });
		// APP.lift.els.el.find(".lift").get(0).trigger("click");
		return true;
		 */


		/*
		 * EDITOR
		return setTimeout(() => {
			let spawn = window.open("editor");

			APP.dispatch({ type: "show-view", arg: "editor" });
			APP.editor.dispatch({ type: "render-level", arg: 6, spawn });
			// APP.editor.dispatch({ type: "toggle-overflow", spawn });
			APP.editor.dispatch({ type: "select-editor-layer", arg: "droids", spawn });

			setTimeout(() => spawn.find(`.layer-droids .list .row`).get(0).trigger("click"), 500);
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
					cleared: {
						// "4": [1],
						// "16": [1, 2, 3, 4, 5, 6, 7, 8, 9],
					},
					// map: { id: 1, dead: [1,2,3,4,5,7] }, player: { id: "001", x: 27, y: 25 }, debug: { mode: 1 },
					// map: { id: 1 }, player: { id: "001", x: 25, y: 9 }, debug: { mode: 1 },
					// map: { id: 4 }, player: { id: "001", x: 7, y: 4, health: 100 }, debug: { mode: 0 },
					map: { id: 1 }, player: { id: "001", x: 13, y: 7 }, debug: { mode: 0 },
					// map: { id: 1 }, player: { id: "999", x: 35, y: 15 }, debug: { mode: 0 },
					// map: { id: 16 }, player: { id: "711", x: 16, y: 9 }, debug: { mode: 0 },
					// map: { id: 11 }, player: { id: "001", x: 5, y: 9 }, debug: { mode: 0 },
					// map: { id: 9 }, player: { id: "001", x: 3, y: 5 }, debug: { mode: 0 },
					
					// map: { id: 20 }, player: { id: "001", x: 3, y: 3 }, debug: { mode: 1 },
				};

			// set view
			// APP.dispatch({ type: "show-view", arg: "mobile", start: false });
			// APP.mobile.dispatch({ type: "restore-state", state });

			// setTimeout(() => APP.mobile.arena.player.dealDamage(30), 2000);
			// setTimeout(() => APP.mobile.arena.player.setId(493), 14000);

			setTimeout(() => {
				APP.mobile.arena = { player: { id: "999", opponent: { id: "999" } } };
				APP.dispatch({ type: "show-view", arg: "transfer" });
			}, 1000);
		

			// setTimeout(() => APP.hud.dispatch({ type: "toggle-play-pause" }), 1500);
			// setTimeout(() => APP.mobile.dispatch({ type: "ship-cleared" }), 500);
			
			// setTimeout(() => APP.mobile.arena.player.setId("614"), 1500);

			// setTimeout(() => APP.mobile.dispatch({ type: "toggle-lights" }), 1500);
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
			// setTimeout(() => APP.mobile.dispatch({ type: "player-droid-destroyed" }), 700);
			// setTimeout(() => APP.mobile.dispatch({ type: "level-lights-off" }), 1500);
			// setTimeout(() => APP.mobile.dispatch({ type: "window.keydown", char: "return" }), 400);
			// setTimeout(() => Matter.Runner.stop(APP.mobile.arena.map.runner), 1500);

		}, 300);

	}
};
