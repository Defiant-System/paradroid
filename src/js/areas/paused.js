
// paradroid.paused

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
		};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.paused,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// custom events
			case "init-view":
				break;
			case "create-state":
				let state = defaultSettings.state,
					arena = APP.mobile.arena;
				if (arena.player.health > 0) {
					state.map = arena.map.id;
					state.player.id = arena.player.id;
					state.player.health = arena.player.health;
					state.player.x = arena.player.x;
					state.player.y = arena.player.y;
					// save "killed" droids
					state.cleared = {};
					window.bluePrint.selectNodes(`//Section/Layer[@id="droids"]/i[@dead]`).map(xDroid => {
						let sId = xDroid.parentNode.parentNode.getAttribute("id");
						if (!state.cleared[sId]) state.cleared[sId] = [];
						state.cleared[sId].push(+xDroid.getAttribute("nr"));
					});
				}
				// console.log(state);
				APP.settings.state = state;
				break;
			case "toggle-music":
			case "toggle-sound-fx":
			case "toggle-controls":
				// forward event
				APP.start.dispatch(event);
				break;
		}
	}
}
