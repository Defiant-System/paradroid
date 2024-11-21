
// paradroid.console

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			el: window.find(".console-view"),
			bp: window.find(".blueprint"),
			info: window.find(".info"),
		};

		// get droid ID's from xml data
		this.droids = window.bluePrint.selectNodes(`//Droid[@id]`).map(x => x.getAttribute("id"));
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.console,
			options,
			index,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// system events
			case "window.keydown":
				switch (event.char) {
					case "return":
						APP.dispatch({
							type: "switch-to-view",
							arg: "mobile",
							done: () => {
								// droid-FX
								APP.mobile.els.droidFx.cssSequence("fast-focus", "animationend", el => el.removeClass("fast-focus"));
							}
						});
						break;
					case "up":
						Self.dispatch({ type: "show-view", arg: -1 });
						break;
					case "down":
						Self.dispatch({ type: "show-view", arg: 1 });
						break;
					case "left":
						options = Self.els.el.find(".option.active .sub[data-step]");
						if (options.length) {
							Self.dispatch({ type: options.data("step"), arg: -1 });
						}
						break;
					case "right":
						options = Self.els.el.find(".option.active .sub[data-step]");
						if (options.length) {
							Self.dispatch({ type: options.data("step"), arg: 1 });
						}
						break;
				}
				break;
			// custom events
			case "init-view":
				value = APP.mobile.arena.player.id;
				// update left side menu; first option icon
				Self.els.el.find(`.menu .option .droid`).data({ id: value });
				// default blueprint; set to active player droid ID
				Self.dispatch({ type: "show-droid", value });
				// toggle if player droid
				Self.els.el.find(".return-exit").addClass("hidden");
				break;
			case "select-droid":
				if (event.arg === -1) {
					value = Self.els.bp.css("background-image").toString().match(/bp-(\d{3})/i)[1];
					index = Self.droids.indexOf(value);
					index--;
					if (index < 0) index = 0;
					value = Self.droids[index];
					// show info for droid
					Self.dispatch({ type: "show-droid", value });
				} else {
					value = Self.els.bp.css("background-image").toString().match(/bp-(\d{3})/i)[1];
					index = Self.droids.indexOf(value);
					index++;
					if (index > Self.droids.length-1) index = Self.droids.length-1;
					value = Self.droids[index];
					// show info for droid
					Self.dispatch({ type: "show-droid", value });
				}
				break;
			case "show-droid":
				let xNode = window.bluePrint.selectSingleNode(`//Droid[@id="${event.value}"]`),
					xWeapon = window.bluePrint.selectSingleNode(`//Weapon[@id="${xNode.getAttribute("weapon")}"]`);
				Self.els.bp.css({ "background-image": `url("~/icons/bp-${event.value}.png")` });
				Self.els.info.find(".unit").html(`Unit ${event.value}`);
				Self.els.info.find(".type").html(xNode.selectSingleNode(`./i[@id="type"]`).textContent);
				Self.els.info.find(".weight").html(xNode.getAttribute("weight") +" KG");
				Self.els.info.find(".weapon").html(xWeapon.selectSingleNode(`./i[@id="name"]`).textContent);
				Self.els.info.find(".speed").html(xNode.getAttribute("speed") +" M/S");
				Self.els.info.find(".notes").html(xNode.selectSingleNode(`./i[@id="notes"]`).textContent);
				// update left side menu; second option - active droid ID
				Self.els.el.find(`.menu .sub span.active`).removeClass("active");
				Self.els.el.find(`.menu .sub span:contains("${event.value}")`).addClass("active");
				// toggle if player droid
				value = APP.mobile.arena.player.id === event.value;
				Self.els.el.find(".player-droid").toggleClass("hidden", value);
				break;
			case "show-view":
				index = Self.els.el.find(".option.active").removeClass("active").index();
				if (event.arg == +event.arg) {
					index += event.arg;
					el = Self.els.el.find(`.option`).get(index);
				} else {
					el = Self.els.el.find(`.option[data-view="${event.arg}"]`);
				}
				// menu item
				el.addClass("active");
				// view body
				Self.els.el.data({ view: el.data("view") });

				if (el.data("view") === "player") {
					// show user droid, if first option
					value = APP.mobile.arena.player.id;
					Self.dispatch({ type: "show-droid", value });
				}
				// toggle if first menu option
				value = index === 0 && event.arg !== "droid";
				Self.els.el.find(".return-exit").toggleClass("hidden", value);
				break;
			// case "select-view":
			// 	el = Self.els.el.find(".option.active");
			// 	options = Self.els.el.find(".option");
			// 	// update UI
			// 	el.removeClass("active");
			// 	index = Math.clamp(el.index() + event.arg, 0, options.length - 1);
			// 	options.get(index).addClass("active");
			// 	break;
			// case "select-view1":
			// 	Self.els.el.find(".option.active").removeClass("active");
			// 	// make lift active
			// 	el = $(event.target).addClass("active");
				
			// 	switch (el.data("view")) {
			// 		case "player":
			// 			APP.dispatch({
			// 				type: "switch-to-view",
			// 				arg: "mobile",
			// 				done: () => {
			// 					// droid-FX
			// 					APP.mobile.els.droidFx.cssSequence("fast-focus", "animationend", el => el.removeClass("fast-focus"));
			// 				}
			// 			});
			// 			break;
			// 		case "droids": break;
			// 		case "level": break;
			// 		case "ship": break;
			// 	}
			// 	break;
		}
	}
}
