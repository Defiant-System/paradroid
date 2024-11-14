
// paradroid.editor

{
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			palette: window.find(".tile-palette"),
			viewport: window.find(".viewport"),
			editBox: window.find(".edit-box"),
			cursor: window.find(".cursor"),
		};
		// palette details
		this.palette = {
			cursor: [{ x: 0, y: 0, id: "" }],
		};

		this.groups = {
			"m02": [{ x: 0, y: 0, id: "m02" }, { x: 1, y: 0, id: "m03" }, { x: 0, y: 1, id: "m12" }, { x: 1, y: 1, id: "m13" }],
			"m04": [{ x: 0, y: 0, id: "m04" }, { x: 1, y: 0, id: "m05" }, { x: 0, y: 1, id: "m14" }, { x: 1, y: 1, id: "m15" }],
			"m06": [{ x: 0, y: 0, id: "m06" }, { x: 1, y: 0, id: "m07" }, { x: 0, y: 1, id: "m16" }, { x: 1, y: 1, id: "m17" }],

			"m0c": [{ x: 0, y: 0, id: "m0c" }, { x: 1, y: 0, id: "m0d" }, { x: 0, y: 1, id: "m1c" }, { x: 1, y: 1, id: "m1d" }],
			"m0e": [{ x: 0, y: 0, id: "m0e" }, { x: 1, y: 0, id: "m0f" }, { x: 0, y: 1, id: "m1e" }, { x: 1, y: 1, id: "m1f" }],
			"m20": [{ x: 0, y: 0, id: "m20" }, { x: 1, y: 0, id: "m21" }, { x: 0, y: 1, id: "m30" }, { x: 1, y: 1, id: "m31" }],
			"m22": [{ x: 0, y: 0, id: "m22" }, { x: 1, y: 0, id: "m23" }, { x: 0, y: 1, id: "m32" }, { x: 1, y: 1, id: "m33" }],

			"m2e": [{ x: 0, y: 0, id: "m2e" }, { x: 1, y: 0, id: "m2f" }, { x: 0, y: 1, id: "m3e" }, { x: 1, y: 1, id: "m3f" }],
			"m40": [{ x: 0, y: 0, id: "m40" }, { x: 1, y: 0, id: "m41" }, { x: 0, y: 1, id: "m50" }, { x: 1, y: 1, id: "m51" }],
			"m42": [{ x: 0, y: 0, id: "m42" }, { x: 1, y: 0, id: "m43" }, { x: 0, y: 1, id: "m52" }, { x: 1, y: 1, id: "m53" }],
			"m44": [{ x: 0, y: 0, id: "m44" }, { x: 1, y: 0, id: "m45" }, { x: 0, y: 1, id: "m54" }, { x: 1, y: 1, id: "m55" }],

			"m46": [{ x: 0, y: 0, id: "m46" }, { x: 1, y: 0, id: "m47" }, { x: 0, y: 1, id: "m56" }, { x: 1, y: 1, id: "m57" }],
			"m48": [{ x: 0, y: 0, id: "m48" }, { x: 1, y: 0, id: "m49" }, { x: 0, y: 1, id: "m58" }, { x: 1, y: 1, id: "m59" }],
			"m4a": [{ x: 0, y: 0, id: "m4a" }, { x: 1, y: 0, id: "m4b" }, { x: 0, y: 1, id: "m5a" }, { x: 1, y: 1, id: "m5b" }],
			"m4c": [{ x: 0, y: 0, id: "m4c" }, { x: 1, y: 0, id: "m4d" }, { x: 0, y: 1, id: "m5c" }, { x: 1, y: 1, id: "m5d" }],

			"m60": [{ x: 0, y: 0, id: "m60" }, { x: 1, y: 0, id: "m61" }, { x: 0, y: 1, id: "m70" }, { x: 1, y: 1, id: "m71" }],
			"m68": [{ x: 0, y: 0, id: "m68" }, { x: 1, y: 0, id: "m69" }, { x: 0, y: 1, id: "m78" }, { x: 1, y: 1, id: "m79" }],
			"m6a": [{ x: 0, y: 0, id: "m6a" }, { x: 1, y: 0, id: "m6b" }, { x: 0, y: 1, id: "m7a" }, { x: 1, y: 1, id: "m7b" }],
			"m6c": [{ x: 0, y: 0, id: "m6c" }, { x: 1, y: 0, id: "m6d" }, { x: 0, y: 1, id: "m7c" }, { x: 1, y: 1, id: "m7d" }],
		};

		// pan viewport level
		this.els.viewport.on("mousedown mousemove mouseup", this.doPan);
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.editor,
			value,
			tiles,
			el;
		// console.log(event);
		switch (event.type) {
			// custom events
			case "select-layer":
				el = $(event.target);
				value = el.index();
				if (!el.parent().hasClass("tab-row")) return;
				Self.els.palette.find(".tab-row span.active").removeClass("active");
				Self.els.palette.find(".tab-body.active").removeClass("active");
				Self.els.palette.find(`.tab-row span:nth(${value})`).addClass("active");
				Self.els.palette.find(`.tab-body:nth(${value})`).addClass("active");
				// toggles layers depending on selected tab
				Self.els.viewport.data({ show: el.data("arg") });
				break;
			case "put-tile":
				if (event.metaKey) {
					// activate "PAN"
					return;
				} else if (event.shiftKey) {
					let levelEl = $(event.target),
						tiles = levelEl.find("b"),
						grid = parseInt(levelEl.cssProp("--tile"), 10),
						x = Math.ceil(event.offsetX / grid) - 1,
						y = Math.ceil(event.offsetY / grid) - 1,
						w = +levelEl.cssProp("--w"),
						id = tiles.get((y * w) + x).prop("class").split(" ")[0];
					// build custom palette cursor
					if (!Self.palette.cursorOrigo) {
						Self.palette.cursorOrigo = { x, y, id };
						Self.palette.cursor = [];
					}
					// adjust position relative to origo
					x -= Self.palette.cursorOrigo.x;
					y -= Self.palette.cursorOrigo.y;
					Self.palette.cursor.push({ x, y, id });
					// insert viewport cursor tiles
					value = Self.palette.cursor.map(c => `<b class="${c.id}" style="--x: ${c.x}; --y: ${c.y};"></b>`);
					Self.els.cursor.html(value.join(""));
				} else if (Self.palette.tile && Self.palette.tile.startsWith("a")) {
					let levelEl = $(event.target),
						grid = parseInt(levelEl.cssProp("--tile"), 10),
						tW = +levelEl.cssProp("--w"),
						l = Math.ceil(event.offsetX / grid) - 1,
						t = Math.ceil(event.offsetY / grid) - 1,
						{ w, h } = Self.palette.cursor[0],
						tile = levelEl.find(`b.a1[style="--x: ${l};--y: ${t};--w: ${w};--h: ${h};"]`);
					
					if (tile.length < 1) {
						// append new entry
						tile = levelEl.append(`<b class="a1" style="--x: ${l};--y: ${t};--w: ${w};--h: ${h};"></b>`);
					}

					Self.els.palette.find(`input[name="action-coord"]`).val(`${l},${t},${w},${h}`);
					Self.els.palette.find(`input[name="action-id"]`).val(tile.data("action"));

				} else if (Self.els.viewport.data("show") === "collision") {
					let targetEl = $(event.target),
						colEl = Self.els.viewport.find(".layer-collision"),
						mY = parseInt(colEl.cssProp("--y")) * 32,
						mX = parseInt(colEl.cssProp("--x")) * 32;
					targetEl.parent().find(".active").removeClass("active");
					
					switch (true) {
						case targetEl.hasClass("c1"):
						case targetEl.hasClass("c4"):
							targetEl.addClass("active");

							Self.els.editBox.removeClass("no-resize").css({
								"--x": targetEl.cssProp("--x"),
								"--y": targetEl.cssProp("--y"),
								"--w": targetEl.cssProp("--w"),
								"--h": targetEl.cssProp("--h"),
								margin: `${mY}px 0 0 ${mX}px`,
							});
							break;
						case targetEl.hasClass("c2"):
							targetEl.addClass("active");

							Self.els.editBox.removeClass("no-resize").css({
								"--x": targetEl.cssProp("--x"),
								"--y": targetEl.cssProp("--y"),
								"--w": "46px",
								"--h": "46px",
								margin: `${mY}px 0 0 ${mX}px`,
							});
							break;
						case targetEl.hasClass("c3"):
							targetEl.addClass("active");

							Self.els.editBox.addClass("no-resize").css({
								"--x": targetEl.cssProp("--x"),
								"--y": targetEl.cssProp("--y"),
								"--w": "17px",
								"--h": "17px",
								margin: `${mY}px 0 0 ${mX}px`,
							});
							break;
						case targetEl.hasClass("c5"):
						case targetEl.hasClass("c6"):
							targetEl.addClass("active");

							Self.els.editBox.addClass("no-resize").css({
								"--x": targetEl.cssProp("--x"),
								"--y": targetEl.cssProp("--y"),
								"--w": "42px",
								"--h": "42px",
								margin: `${mY}px 0 0 ${mX}px`,
							});
							break;
						default:
							// hide edit-box
							Self.els.editBox.attr({ "style": "" });

							// insert new item if selected in "palette"
							if (Self.els.palette.find(`.tiles[data-click="select-col-tile"] .active`).length) {
								value = [];
								value.push(`--x: ${event.offsetX}px;`);
								value.push(`--y: ${event.offsetY}px;`);
								if (["c1", "c4"].includes(Self.palette.tile)) {
									value.push(`--w: 20px;`);
									value.push(`--h: 20px;`);
								}
								// add item
								targetEl.append(`<b class="${Self.palette.tile}" style="${value.join("")}"></b>`);
							}
					}

				} else {
					let levelEl = $(event.target),
						tiles = levelEl.find("b"),
						grid = parseInt(levelEl.cssProp("--tile"), 10),
						w = +levelEl.cssProp("--w"),
						l = Math.ceil(event.offsetX / grid) - 1,
						t = Math.ceil(event.offsetY / grid) - 1;
					// apply palette cursor;
					Self.palette.cursor.map(sel => {
						let index = ((t + sel.y) * w) + (l + sel.x),
							el = tiles.get(index);
						el.prop({ className: sel.id });
					});
				}
				break;
			case "select-action-tile":
				el = $(event.target);
				Self.palette.tile = el.prop("class").split(" ")[0];
				// update UI
				Self.els.palette.find(".tiles .active").removeClass("active");
				el.addClass("active");

				let [cX, cY] = [0, 0],
					[cW, cH] = el.data("size") ? el.data("size").split("x").map(i => +i) : [1, 1];

				// empty palette cursor / eraser
				Self.palette.cursorOrigo = { x: 0, y: 0 };
				Self.palette.cursor = [{ x: cX, y: cY, w: cW, h: cH }];

				// update viewport cursor
				value = `<b class="a1" style="--x: ${cX}; --y: ${cY}; --w: ${cW}; --h: ${cH};"></b>`;
				Self.els.cursor.html(value);
				break;
			case "select-col-tile":
				el = $(event.target);
				Self.palette.tile = el.prop("class").split(" ")[0];
				// update UI
				Self.els.palette.find(".tiles .active").removeClass("active");
				el.addClass("active");
				// empty palette cursor / eraser
				Self.palette.cursorOrigo = { x: 0, y: 0 };
				Self.palette.cursor = [];
				// apply cursor
				if (el.data("size")) {
					let [cX, cY] = el.data("size").split("x").map(i => +i);
					for (let y=0; y<cY; y++) {
						for (let x=0; x<cX; x++) {
							Self.palette.cursor.push({ x, y, id: Self.palette.tile });
						}
					}
				}
				// update viewport cursor
				value = Self.palette.cursor.map(c => `<b class="${c.id}" style="--x: ${c.x}; --y: ${c.y};"></b>`);
				Self.els.cursor.html(value);
				break;
			case "select-bg-tile":
				el = $(event.target);
				Self.palette.tile = el.prop("class").split(" ")[0];
				// grouped tiles
				if (Self.groups[Self.palette.tile]) {
					Self.palette.cursorOrigo = { x: 0, y: 0 };
					Self.palette.cursor = [...Self.groups[Self.palette.tile]];
					// insert viewport cursor tiles
					value = Self.palette.cursor.map(c => `<b class="${c.id}" style="--x: ${c.x}; --y: ${c.y};"></b>`);
					Self.els.cursor.html(value.join(""));
					return;
				}
				// update UI
				Self.els.palette.find(".tiles .active").removeClass("active");
				if (Self.palette.tile) {
					Self.els.palette.find(`.${Self.palette.tile}`).addClass("active");
				}
				// empty palette cursor / eraser
				Self.palette.cursor = [{ x: 0, y: 0, id: Self.palette.tile }];
				// update viewport cursor
				value = `<b class="${Self.palette.tile}" style="--x: 0; --y: 0;"></b>`;
				Self.els.cursor.html(value);
				// reset palette cursor
				delete Self.palette.cursorOrigo;
				break;
			case "cursor-eraser":
				// empty palette cursor / eraser
				Self.palette.tile = "";
				Self.palette.cursor = [{ x: 0, y: 0, id: Self.palette.tile }];
				// update viewport cursor
				value = `<b class="${Self.palette.tile}" style="--x: 0; --y: 0;"></b>`;
				Self.els.cursor.html(value);
				// reset palette cursor
				delete Self.palette.cursorOrigo;
				break;
			case "toggle-overflow":
				el = Self.els.viewport;
				el.toggleClass("show-overflow", el.hasClass("show-overflow"));
				break;
			case "toggle-grid":
				el = Self.els.viewport.find(".layer-background");
				el.toggleClass("hide-grid", el.hasClass("hide-grid"));
				break;
			case "render-level":
				// if active level; save modifications
				if (Self.xSection) {
					let nodes = Self.dispatch({ type: "output-pgn", arg: "get-nodes" }),
						xBg = Self.xSection.selectSingleNode(`./Layer[@id="background"]`),
						xCol = Self.xSection.selectSingleNode(`./Layer[@id="collision"]`),
						xAct = Self.xSection.selectSingleNode(`./Layer[@id="action"]`);
					// delete old background data
					while (xBg.hasChildNodes()) {
						xBg.removeChild(xBg.firstChild);
					}
					// delete old collision data
					while (xCol.hasChildNodes()) {
						xCol.removeChild(xCol.firstChild);
					}
					// delete old action data
					while (xAct.hasChildNodes()) {
						xAct.removeChild(xAct.firstChild);
					}
					// insert new tiles
					nodes.map(x => xBg.appendChild(x));
					// save "position"
					el = Self.els.viewport.find(".layer-background");
					Self.xSection.setAttribute("y", +el.css("--y"));
					Self.xSection.setAttribute("x", +el.css("--x"));
				}
				// check if level has tile nodes
				let xSection = window.bluePrint.selectSingleNode(`//Section[@id = "${event.arg}"]`),
					xBg = xSection.selectSingleNode(`./Layer[@id="background"]`),
					sectionEl = APP.lift.els.el.find(`.ship .section[data-id="${event.arg}"]`);
				if (!xBg.selectNodes(`./i`).length) {
					let nodes = [],
						len = +xSection.getAttribute("height") * +xSection.getAttribute("width");
					while (len--) { nodes.push(`<i />`); }
					// insert nodes
					$.xmlFromString(`<data>${nodes.join("")}</data>`)
						.selectNodes(`/data/i`).map(x => xBg.appendChild(x));
				}
				// save reference to current
				Self.xSection = xSection;
				// update menu
				window.bluePrint.selectNodes(`//Menu[@check-group="game-level"][@is-checked]`).map(x => x.removeAttribute("is-checked"));
				window.bluePrint.selectSingleNode(`//Menu[@check-group="game-level"][@arg="${event.arg}"]`).setAttribute("is-checked", "1");
				// delete old level HTML
				Self.els.viewport.find(".layer-background").remove();
				Self.els.viewport.find(".layer-collision").remove();
				Self.els.viewport.find(".layer-action").remove();
				// render + append HTML
				window.render({
					template: "layer-background",
					match: `//Section[@id = "${event.arg}"]`,
					append: Self.els.viewport,
				});
				// render collision layer
				window.render({
					template: "layer-collision",
					match: `//Section[@id = "${event.arg}"]`,
					append: Self.els.viewport,
				});
				// render action layer
				window.render({
					template: "layer-action",
					match: `//Section[@id = "${event.arg}"]`,
					append: Self.els.viewport,
				});
				// prevent "see-through"
				el = Self.els.viewport.find(".layer-background");
				Self.els.viewport.find(".level-bg").css({
					background: sectionEl.data("color"),
					"--x": el.cssProp("--x"),
					"--y": el.cssProp("--y"),
					"--w": el.cssProp("--w"),
					"--h": el.cssProp("--h"),
				});
				el.css({ filter: sectionEl.data("filter") });
				break;
			case "grid-size":
				event.el.parent().find(".active").removeClass("active");
				event.el.addClass("active");
				
				Self.els.viewport.parent().removeClass("big-tiles small-tiles").addClass(event.arg === "1" ? "big-tiles" : "small-tiles");
				break;
			case "set-action-id":
				value = event.el.data("arg");
				Self.els.palette.find(`input[name="action-id"]`).val(value);
				// update node
				Self.dispatch({ type: "update-action-tiles" });
				break;
			case "update-action-tiles":
			case "clear-action-tiles":
				let aId = Self.els.palette.find(`input[name="action-id"]`).val(),
					[aX, aY, aW, aH] = Self.els.palette.find(`input[name="action-coord"]`).val().split(",").map(i => +i),
					aEl = Self.els.viewport.find(`.layer-action b.a1[style="--x: ${aX};--y: ${aY};--w: ${aW};--h: ${aH};"]`),
					xNode = Self.xSection.selectSingleNode(`./Layer[@id="action"]/i[@x="${aX}"][@y="${aY}"][@w="${aW}"][@h="${aH}"]`);
				
				if (event.type === "clear-action-tiles") {
					// clear DOM
					aEl.remove();
					// clear from xml
					if (xNode) xNode.parentNode.removeChild(xNode);
					// console.log( Self.xSection );
				} else {
					let xLayer = Self.xSection.selectSingleNode(`./Layer[@id="action"]`),
						xAction = $.nodeFromString(`<i x="${aX}" y="${aY}" w="${aW}" h="${aH}" action="${aId}"/>`);
					xLayer.appendChild(xAction);
					// update UI element attribute
					aEl.data({ action: aId });
				}
				break;
			case "duplicate-active":
				// remove active
				el = Self.els.viewport.find(".layer-collision .active").removeClass("active").clone(true);
				Self.els.viewport.find(".layer-collision").append(el);
				// hide editbox
				Self.els.editBox.attr({ "style": "" });
				break;
			case "delete-active":
				// remove active
				Self.els.viewport.find(".layer-collision .active").remove();
				// hide editbox
				Self.els.editBox.attr({ "style": "" });
				break;
			case "output-collision-pgn":
				tiles = [];
				Self.els.viewport.find(`.layer-collision b`).map(tile => {
					let tEl = $(tile),
						x = parseInt(tEl.cssProp("--x"), 10),
						y = parseInt(tEl.cssProp("--y"), 10),
						w = parseInt(tEl.cssProp("--w"), 10),
						h = parseInt(tEl.cssProp("--h"), 10),
						id = tile.className.split(" ")[0],
						attr = [];
					attr.push(`x="${x}"`);
					attr.push(`y="${y}"`);

					switch (id) {
						case "c1":
						case "c4":
							attr.push(`w="${w}"`);
							attr.push(`h="${h}"`);
							break;
						case "c5":
							attr = [`x="${x+1}"`, `y="${y-1}"`];
							break;
						case "c6":
							attr = [`x="${x-1}"`, `y="${y-1}"`];
							break;
					}
					tiles.push(`<i id="${id}" ${attr.join(" ")}/>`);
				});
				console.log(tiles.join("\n"));
				break;
			case "output-action-pgn":
				tiles = [];
				Self.els.viewport.find(`.layer-action b`).map(tile => {
					let tEl = $(tile),
						x = tEl.cssProp("--x"),
						y = tEl.cssProp("--y"),
						w = tEl.cssProp("--w"),
						h = tEl.cssProp("--h");
					tiles.push(`<i x="${x}" y="${y}" w="${w}" h="${h}" action="${tEl.data("action")}"/>`);
				});
				console.log(tiles.join("\n"));
				break;
			case "output-pgn":
				tiles = [];
				// tiles.push(`<Section id="a" width="12" height="6">\n`);
				Self.els.viewport.find(`.layer-background b`).map(tile => {
					let id = tile.className ? `id="${tile.className.split(" ")[0]}"` : "";
					tiles.push(`<i ${id}/>`);
				});
				// tiles.push(`\n</Section>`);

				if (event.arg === "get-nodes") return $.xmlFromString(`<data>${tiles.join("")}</data>`).selectNodes("//i");
				console.log(tiles.join(""));
				break;
		}
	},
	doDrag(event) {
		let APP = paradroid,
			Self = APP.editor,
			Drag = Self.drag,
			data = {};
		switch (event.type) {
			case "mousedown":
				let tgt = $(event.target),
					actEl = Self.els.viewport.find(".layer-collision .active");
				if (tgt[0] !== actEl[0] && tgt.nodeName() == "b") {
					actEl.removeClass("active");
					Self.els.editBox.attr({ "style": "" });
					return;
				}
				if (tgt.hasClass("layer-collision") || tgt.hasClass("viewport")) {
					Self.els.viewport.find(".layer-collision .active").removeClass("active");
					Self.els.editBox.css({ top: "", left: "", width: "", height: "" });
					return;
				}

				// do not drag until editbox is "active"
				if (!Self.els.editBox.is(":visible") || !actEl.length) return;

				let doc = $(document),
					[a, resize] = event.target.className.split(" "),
					colEl = Self.els.viewport.find(".layer-collision"),
					boxEl = Self.els.editBox,
					type = actEl.prop("className").split(" ")[0],
					snap = {
						c1: {
							y1Mod: 4, y1Add: -1,
							x1Mod: 4, x1Add: -2,
							y2Mod: 4, y2Add: -1,
							x2Mod: 4, x2Add: -2,
						},
						c2: {
							y1Mod: 16, y1Add: 8,
							x1Mod: 16, x1Add: 8,
							y2Mod: 16, y2Add: 0,
							x2Mod: 16, x2Add: 0,
						},
						c3: {
							y1Mod: 2, y1Add: 1,
							x1Mod: 2, x1Add: 1,
							y2Mod: 2, y2Add: 1,
							x2Mod: 2, x2Add: 1,
						},
						c4: {
							y1Mod: 4, y1Add: -1,
							x1Mod: 4, x1Add: -2,
							y2Mod: 4, y2Add: -1,
							x2Mod: 4, x2Add: -2,
						},
						c5: {
							y1Mod: 4, y1Add: 0,
							x1Mod: 4, x1Add: 0,
							y2Mod: 4, y2Add: 0,
							x2Mod: 4, x2Add: 0,
						},
						c6: {
							y1Mod: 4, y1Add: 0,
							x1Mod: 4, x1Add: 0,
							y2Mod: 4, y2Add: 0,
							x2Mod: 4, x2Add: 0,
						}
					},
					offset = {
						box: boxEl.offset(),
						act: actEl.offset(),
						pEl: {
							x: (+colEl.cssProp("--x") * 32),
							y: (+colEl.cssProp("--y") * 32),
						}
					},
					click = {
						x: event.clientX,
						y: event.clientY,
					};
				// choose snap values
				snap = snap[type];
				// drag info
				Self.drag = { doc, actEl, type, resize, snap, boxEl, click, offset };
				// cover app view
				APP.els.content.addClass("cover");
				// bind event handlers
				Self.drag.doc.on("mousemove mouseup", Self.doDrag);
				break;
			case "mousemove":
				let dY = event.clientY - Drag.click.y,
					dX = event.clientX - Drag.click.x;
				switch (Drag.resize) {
					case "w":
						data.boxEl = { width: dX + Drag.offset.box.width };
						data.actEl = { width: dX + Drag.offset.box.width };
						data.boxEl.width -= (data.boxEl.width % 4);
						data.actEl.width -= (data.actEl.width % 4);
						data.boxEl.width = Math.max(data.boxEl.width, 20);
						data.actEl.width = Math.max(data.actEl.width, 20);
						break;
					case "s":
						data.boxEl = { height: dY + Drag.offset.box.height };
						data.actEl = { height: dY + Drag.offset.box.height };
						data.boxEl.height -= (data.boxEl.height % 4);
						data.actEl.height -= (data.actEl.height % 4);
						data.boxEl.height = Math.max(data.boxEl.height, 20);
						data.actEl.height = Math.max(data.actEl.height, 20);
						break;
					default: // move
						data.boxEl = {
							top: dY - Drag.offset.pEl.y + Drag.offset.box.top,
							left: dX - Drag.offset.pEl.x + Drag.offset.box.left,
						};
						data.actEl = {
							top: dY - Drag.offset.pEl.y + Drag.offset.box.top,
							left: dX - Drag.offset.pEl.x + Drag.offset.box.left,
						};
						// snap
						data.boxEl.top -= (data.boxEl.top % Drag.snap.y1Mod) + Drag.snap.y1Add;
						data.boxEl.left -= (data.boxEl.left % Drag.snap.x1Mod) + Drag.snap.x1Add;
						data.actEl.top -= (data.actEl.top % Drag.snap.y2Mod) + Drag.snap.y2Add;
						data.actEl.left -= (data.actEl.left % Drag.snap.x2Mod) + Drag.snap.x2Add;
				}
				Drag.boxEl.css(data.boxEl);
				Drag.actEl.css(data.actEl);
				break;
			case "mouseup":
				data = {
					x: parseInt(Drag.actEl.css("left"), 10) + (Drag.actEl.width() / 2),
					y: parseInt(Drag.actEl.css("top"), 10) + (Drag.actEl.height() / 2),
					w: Drag.actEl.width(),
					h: Drag.actEl.height(),
				};
				if (Drag.actEl.hasClass("c3")) {
					data.x -= 2;
					data.y -= 2;
				}
				if (Drag.actEl.hasClass("c5")) {
					data.x += 6;
					data.y += 6;
				}
				if (Drag.actEl.hasClass("c6")) {
					data.x -= 8;
					data.y += 6;
				}

				Drag.actEl.css({
					"--x": `${data.x}px`,
					"--y": `${data.y}px`,
					"--w": `${data.w}px`,
					"--h": `${data.h}px`,
				});
				// clear drag properties
				Drag.actEl.css({ top: "", left: "", width: "", height: "" });
				// uncover app view
				APP.els.content.removeClass("cover");
				// unbind event handlers
				Self.drag.doc.off("mousemove mouseup", Self.doDrag);
				break;
		}
	},
	doPan(event) {
		let APP = paradroid,
			Self = APP.editor,
			Pan = Self.pan;
		switch (event.type) {
			case "mousedown":
				if (event.button != 0) return;

				// prevent default behaviour
				event.preventDefault();

				if (Self.els.viewport.data("show") === "collision" && !event.metaKey) {
					return Self.doDrag(event);
				}

				let el = Self.els.viewport.find(".layer-background"),
					offset = el.offset(".viewport"),
					data = {
						...offset,
						y: +el.cssProp("--y"),
						x: +el.cssProp("--x"),
						tile: parseInt(el.cssProp("--tile"), 10),
					},
					click = {
						y: event.clientY - offset.top,
						x: event.clientX - offset.left,
					};
				// save drag details
				Self.pan = { el, data, click };
				// hide cursor
				if (event.metaKey) {
					Self.els.viewport.addClass("hide-cursor");
					Self.els.editBox.addClass("hidden");
				}
				break;
			case "mousemove":
				if (Pan) {
					let threshold = Pan.data.tile >> 1,
						top = event.clientY - Pan.click.y,
						left = event.clientX - Pan.click.x;
					Pan.el.css({ top, left, });
					// save drag details
					if (Math.abs(Pan.data.top - top) > threshold || Math.abs(Pan.data.left - left) > threshold) {
						Pan.moved = { top, left, };
					}
				// } else if (event.target.classList.contains("level")) {
				} else if (event.target.classList.contains("layer-collision")) {
					Self.els.cursor.css({ "--t": 0, "--l": 0, "--tx": 1, "--ty": 1 });
				} else {
					if (event.shiftKey) return;

					let el = $(event.target),
						tile = parseInt(el.cssProp("--tile"), 10),
						tx = +el.cssProp("--x") - 1,
						ty = +el.cssProp("--y") - 1,
						l = Math.ceil(event.offsetX / tile),
						t = Math.ceil(event.offsetY / tile);
					Self.els.cursor.css({ "--t": t, "--l": l, "--tx": tx, "--ty": ty });
				}
				break;
			case "mouseup":
				if (Pan && Pan.moved) {
					let y = Math.round(Pan.moved.top / Pan.data.tile),
						x = Math.round(Pan.moved.left / Pan.data.tile);
					Pan.el.css({ top: "", left: "", "--y": y, "--x": x });
					Self.els.viewport.find(".level-bg").css({ "--y": y, "--x": x });
					Self.els.viewport.find(".layer-collision").css({ "--y": y, "--x": x });
					Self.els.viewport.find(".layer-action").css({ "--y": y, "--x": x });
					Self.els.editBox.css({ margin: `${y * Pan.data.tile}px 0 0 ${x * Pan.data.tile}px` });
				} else if (Pan) {
					Pan.el.css({ top: "", left: "" });
				}
				// reset drag data
				delete Self.pan;
				// show cursor
				Self.els.viewport.removeClass("hide-cursor");
				Self.els.editBox.removeClass("hidden");
				break;
		}
	}
}
