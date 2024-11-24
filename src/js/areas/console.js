
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
		// minimap canvas
		let cvs = this.els.el.find("canvas.minimap");
		this.minimap = {
			cvs,
			ctx: cvs[0].getContext("2d"),
			width: +cvs.attr("width"),
			height: +cvs.attr("height"),
		};
		// get droid ID's from xml data
		this.droids = window.bluePrint.selectNodes(`//Droid[@id]`).map(x => x.getAttribute("id"));
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.console,
			xNode,
			xWeapon,
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
								// reset console - "default" to first view
								Self.dispatch({ type: "show-view", arg: "player" });
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
					// check if droid is "enabled"
					el = Self.els.el.find(`.option[data-view="droid"] .sub span:contains("${value}")`);
					if (el.hasClass("disabled")) return;
					// show info for droid
					Self.dispatch({ type: "show-droid", value });
				}
				break;
			case "show-droid":
				xNode = window.bluePrint.selectSingleNode(`//Droid[@id="${event.value}"]`);
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
				options = Self.els.el.find(`.option`);
				index = Self.els.el.find(".option.active").index();
				if (event.arg == +event.arg) {
					index += event.arg;
					// menu option does not exist
					if (isNaN(index) || index < 0 || index > options.length-1) return;
					el = options.get(index);
				} else {
					el = Self.els.el.find(`.option[data-view="${event.arg}"]`);
				}
				// menu item
				el.parent().find(".option.active").removeClass("active");
				el.addClass("active");
				// view body
				Self.els.el.data({ view: el.data("view") });

				// toggle if first menu option
				value = index === 0 && event.arg !== "droid";
				Self.els.el.find(".return-exit").toggleClass("hidden", value);

				// view specific actions
				switch (el.data("view")) {
					case "player":
						// show user droid, if first option
						value = APP.mobile.arena.player.id;
						Self.dispatch({ type: "show-droid", value });
						break;
					case "droid":
						// show user droid, if first option
						value = APP.mobile.arena.player.id;
						el = Self.els.el.find(`.option[data-view="droid"] .sub span:contains("${value}")`);
						// droids after player droid are "disabled"
						el.nextAll("span").addClass("disabled");
						break;
					case "level":
						Self.drawMinimap(APP.mobile.arena.map.id);
						break;
					case "ship":
						// make active floor activew visually
						Self.dispatch({ type: "select-level", index: APP.mobile.arena.map.id });
						break;
				}
				break;
			case "select-level":
				el = Self.els.el.find(`.view-ship .section.active`);
				index = event.index || +el.data("id") + event.arg;
				xNode = window.bluePrint.selectSingleNode(`//Section[@id="${index}"]`);
				if (!xNode) return;
				el.removeClass("active");
				Self.els.el.find(`.view-ship .section[data-id="${index}"]`)
					.addClass("active")
					.css({
						"--color": xNode.getAttribute("color"),
						"--filter": xNode.getAttribute("filter") || "none",
					});
				break;
		}
	},
	drawMinimap(id) {
		let APP = paradroid,
			assets = APP.mobile.arena.assets,
			player = APP.mobile.arena.player,
			{ cvs, ctx, width, height } = this.minimap,
			xSection = window.bluePrint.selectSingleNode(`//Data/Section[@id="${id}"]`),
			sWidth = +xSection.getAttribute("width"),
			sHeight = +xSection.getAttribute("height"),
			tile = 7,
			oX = (width - (sWidth * tile)) >> 1,
			oY = (height - (sHeight * tile)) >> 1,
			background = [];

		// minor tweak - aligns mininmap to grid
		oX -= (oX % 15) - 15;
		oY -= (oY % 15) + 1;
		// clear canvas
		cvs.attr({ width });
		// update level info on parent element
		cvs.parent().data({ level: id })
			.css({ "--pX": player.x, "--pY": player.y, "--oX": `${oX}px`, "--oY": `${oY}px`, });

		ctx.save();
		ctx.translate(oX, oY);
		xSection.selectNodes(`./Layer[@id="background"]/i`).map((xTile, c) => {
			if (!xTile.getAttribute("id")) return;
			let col = c % sWidth,
				row = Math.floor(c / sWidth),
				[a, t, l] = xTile.getAttribute("id").split("").map(i => parseInt(i, 16)),
				oX = l * tile,
				oY = t * tile,
				tX = col * tile,
				tY = row * tile;

			ctx.drawImage(
				assets["tiny-map"].img,
				oX, oY, tile, tile,
				tX, tY, tile, tile
			);
		});
		ctx.restore();
	}
}
