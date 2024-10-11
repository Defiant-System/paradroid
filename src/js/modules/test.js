
let Test = {
	init(APP) {
		// return;

		APP.edit.dispatch({ type: "render-level" });
		APP.edit.dispatch({ type: "output-pgn" });

	}
};
