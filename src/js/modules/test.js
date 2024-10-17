
let Test = {
	init(APP) {
		// return;

		APP.edit.dispatch({ type: "render-level", arg: "a" });
		APP.edit.els.palette.find(`.buttons span[data-arg=".25"]`).trigger("click");
		// APP.edit.dispatch({ type: "output-pgn" });

	}
};
