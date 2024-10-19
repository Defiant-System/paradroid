
// paradroid.mobile

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			cvs: window.find(".mobile-view canvas.game"),
		};
		// create arena
		this.arena = new Arena(this.els.cvs);
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.mobile,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// system events
			case "window.keydown":
				switch (event.char) {
					case "w":
					case "up": Self.arena.input.up.pressed = true; break;
					case "s":
					case "down": Self.arena.input.down.pressed = true; break;
					case "a":
					case "left": Self.arena.input.left.pressed = true; break;
					case "d":
					case "right": Self.arena.input.right.pressed = true; break;
					case "p":
						Self.arena.fpsControl.stop();
						break;
				}
				break;
			case "window.keyup":
				switch (event.char) {
					case "w":
					case "up": Self.arena.input.up.pressed = false; break;
					case "s":
					case "down": Self.arena.input.down.pressed = false; break;
					case "a":
					case "left": Self.arena.input.left.pressed = false; break;
					case "d":
					case "right": Self.arena.input.right.pressed = false; break;
				}
				break;
			// custom events
			case "restore-state":
				Self.arena.setState(event.state);
				break;
		}
	}
}
