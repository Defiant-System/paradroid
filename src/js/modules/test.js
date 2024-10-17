
let Test = {
	init(APP) {
		// return;

		return APP.dispatch({ type: "show-view", arg: "mobile" });

		APP.editor.dispatch({ type: "render-level", arg: "c" });
		APP.editor.els.palette.find(`.buttons span[data-arg=".25"]`).trigger("click");
		// APP.editor.dispatch({ type: "output-pgn" });

	}
};
