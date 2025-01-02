
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
@import "./classes/hacker-ai.js"

@import "./classes/explosion.js"
@import "./classes/sparks.js"
@import "./classes/missile.js"
@import "./classes/electric.js"
@import "./classes/simplexnoise.js"
@import "./classes/fire.js"
@import "./classes/sonic.js"

@import "./ext/matter.min.js"
@import "./ext/pathseg.js"

@import "./modules/utils.js"
@import "./modules/test.js"


// import libs
const {
	createREGL,
	Finder,
	Shifter,
	Raycaster,
	Color,
} = await window.fetch("~/js/bundle.js");

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
		// proxy editor (spawn) events
		if (event.spawn) return Self.editor.dispatch(event);
		// console.log(event.type);
		switch (event.type) {
			// system events
			case "window.init":
				break;
			case "window.focus":
				// resume "matter.js" runner
				Self.mobile.dispatch({ type: "game-loop-resume" });
				break;
			case "window.blur":
			case "window.close":
				// stop "matter.js" runner
				Self.mobile.dispatch({ type: "game-loop-pause" });
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
				Self.els.content.find(`.${event.arg}-view`).removeClass("hidden");
				// init view in the background
				Self[event.arg].dispatch({ type: "init-view" });
				// reset css/view
				Self.els.content.cssSequence("fade-out", "transitionend", el => {
					// return;
					// fade in view
					el.data({ show: event.arg })
						.cssSequence("fade-in", "transitionend", el => {
							el.removeClass("fade-out fade-in");
							// remove "no-anim" flag
							Self.els.content.removeAttr("data-anim");
							// callback
							if (event.done) event.done();
						});
				});
				break;
			case "show-view":
				// hide current
				name = Self.els.content.data("show");
				Self.els.content.find(`.${name}-view`).addClass("hidden");

				Self.els.content.data({ show: event.arg, anim: event.anim });
				Self.els.content.find(`.${event.arg}-view`).removeClass("hidden");
				Self.hud.dispatch({ type: "set-view-title" });

				switch (event.arg) {
					case "start":
						Self.start.els.el.removeClass("no-anim view-anim");
						setTimeout(() => Self.start.dispatch({ ...event, type: "init-anim" }), 100);
						break;
					case "console":
						Self.console.dispatch({ type: "init-view" });
						break;
					case "editor":
						if (Self.mobile.arena.map) {
							Self.editor.spawn = window.open("editor");
							// default render for editor
							Self.editor.dispatch({ type: "render-level", arg: Self.mobile.arena.map.id });
							Self.editor.dispatch({ type: "toggle-overflow" });
						}
						break;
					case "lift":
					case "mobile":
					case "terminated":
					case "transfer":
						// view animation
						Self.dispatch({
							type: "switch-to-view",
							arg: event.arg
						});
						break;
				}
				break;
			case "play-song":
				window.audio.play(event.arg);
				break;
			case "stop-song":
				window.audio.stop(event.arg);
				break;
			// proxy event
			case "toggle-lights":
				return Self.mobile.dispatch(event);
			case "generate-schemas":
				return Self.transfer.dispatch(event);
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
	briefing: @import "./areas/briefing.js",
	editor: @import "./areas/editor.js",
	hud: @import "./areas/hud.js",
	lift: @import "./areas/lift.js",
	mobile: @import "./areas/mobile.js",
	console: @import "./areas/console.js",
	terminated: @import "./areas/terminated.js",
	transfer: @import "./areas/transfer.js",
};

window.exports = paradroid;
