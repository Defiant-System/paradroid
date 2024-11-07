
@import "./classes/arena.js"
@import "./classes/map.js"
@import "./classes/viewport.js"

@import "./classes/droid.js"
@import "./classes/player.js"


@import "./modules/utils.js"
@import "./modules/matter.min.js"
@import "./modules/astar.js"
@import "./modules/test.js"


const Matter = window.Matter;

const paradroid = {
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
		};

		// init all sub-objects
		Object.keys(this)
			.filter(i => typeof this[i].init === "function")
			.map(i => this[i].init(this));

		// DEV-ONLY-START
		Test.init(this);
		// DEV-ONLY-END
	},
	dispatch(event) {
		let Self = paradroid,
			name,
			el;
		// console.log(event.type);
		switch (event.type) {
			// system events
			case "window.init":
			case "window.focus":
			case "window.blur":
				break;
			case "window.keydown":
			case "window.keyup":
				name = Self.els.content.data("show");
				Self[name].dispatch(event);
				break;
			// custom events
			case "open-help":
				karaqu.shell("fs -u '~/help/index.md'");
				break;
			case "show-view":
				Self.els.content.data({ show: event.arg });
				Self.hud.dispatch({ type: "set-view-title" });
				break;
			// proxy event
			default:
				el = event.el;
				if (!el && event.origin) el = event.origin.el;
				if (el) {
					let pEl = el.parents(`?div[data-area]`);
					if (pEl.length) {
						name = pEl.data("area");
						return Self[name].dispatch(event);
					}
				}
		}
	},
	start: @import "./areas/start.js",
	editor: @import "./areas/editor.js",
	hud: @import "./areas/hud.js",
	lift: @import "./areas/lift.js",
	mobile: @import "./areas/mobile.js",
	console: @import "./areas/console.js",
	more: @import "./areas/more.js",
	transfer: @import "./areas/transfer.js",
};

window.exports = paradroid;
