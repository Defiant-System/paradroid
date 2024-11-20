
// paradroid.editor

{
	init() {
		
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.editor,
			el;
		// console.log(event);
		switch (event.type) {
			case "spawn.open":
			case "spawn.close":
				break;
			// custom events
			case "select-editor-layer":
				console.log(event.arg);
				break;
		}
	}
}
