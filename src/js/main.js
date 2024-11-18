
@import "./classes/arena.js"
@import "./classes/map.js"
@import "./classes/viewport.js"
@import "./classes/point.js"
@import "./classes/droid.js"
@import "./classes/player.js"
@import "./classes/recharge.js"
@import "./classes/door.js"
@import "./classes/exit.js"
@import "./classes/console.js"

@import "./ext/matter.min.js"
@import "./ext/pathseg.js"
@import "./ext/astar.js"

@import "./modules/raycaster.js"
@import "./modules/utils.js"
@import "./modules/color.js"
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
			case "window.close":
				// stop "matter.js" runner
				Matter.Runner.stop(Self.mobile.arena.map.runner);
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
			case "switch-to-view":
				Self.els.content.cssSequence("fade-out", "transitionend", el => {
					// if (event.arg === "mobile") return;
					el.data({ show: event.arg })
						.cssSequence("fade-in", "transitionend", el => {
							el.removeClass("fade-out fade-in");
							// callback
							if (event.done) event.done();
						});
				});
				break;
			case "show-view":
				Self.els.content.data({ show: event.arg });
				Self.hud.dispatch({ type: "set-view-title" });

				if (event.arg === "start") {
					Self.start.dispatch({ type: "init-anim" });
				}

				if (Self.mobile.arena.map && event.arg === "editor") {
					Self.editor.dispatch({ type: "render-level", arg: Self.mobile.arena.map.id });
					setTimeout(() => {
						Self.editor.dispatch({ type: "toggle-overflow" });
						Self.editor.els.palette.find(`.tab-row span:nth(1)`).trigger("click");
					}, 100);
				}
				break;
			// proxy event
			case "set-player-droid":
			case "set-debug-mode":
				return Self.mobile.dispatch(event);
			// proxy event
			default:
				el = event.el;
				if (!el && event.origin) el = event.origin.el;
				if (el && el.length) {
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
	terminated: @import "./areas/terminated.js",
	transfer: @import "./areas/transfer.js",
};

window.exports = paradroid;
