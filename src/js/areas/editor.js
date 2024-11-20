
// paradroid.editor

{
	init() {
		
	},
	dispatch(event) {
		let APP = paradroid,
			Spawn = event.spawn || APP.editor,
			el;
		// console.log(event);
		switch (event.type) {
			case "spawn.open":
			case "spawn.close":
				break;
			// custom events
			case "select-editor-layer":
				// change toolset
				Spawn.toolset = event.arg;
				// console.log(event.arg);
				break;
		}
	}
}
