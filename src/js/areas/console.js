
// paradroid.console

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			el: window.find(".console-view"),
		};
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.console,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// custom events
			case "select-view":
				Self.els.el.find(".option.active").removeClass("active");
				// make lift active
				el = $(event.target).addClass("active");
				
				console.log( el.data("view") );
				break;
		}
	}
}
