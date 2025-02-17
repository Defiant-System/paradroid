
// paradroid.editor

{
	init() {
		// fast references
		this.els = {
			// content: window.find("content"),
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
	},
	dispatch(event) {
		let APP = paradroid,
			Self = APP.editor,
			Spawn = event.spawn || Self.spawn,
			layers,
			tiles,
			value,
			margin, mX, mY,
			x, y, w, h,
			grid,
			tileEl,
			el;
		// console.log(event);
		switch (event.type) {
			case "spawn.open":
				// fast references
				Self.els.spawn = Spawn.find("content.editor");
				Self.els.content = Spawn.find("content.editor");

				// pan viewport events
				Self.els.viewport.on("mousedown mousemove mouseup", this.doPan);
				break;
			case "spawn.close":
				break;
			// custom events
			case "put-tile":
				el = $(event.target);
				value = el.parents(".viewport").data("show");
				if (event.shiftKey) {
					let tiles = event.el.find("b"),
						grid = Self.els.viewport.parent().hasClass("big-tiles") ? 32 : 8,
						x = Math.ceil(event.offsetX / grid) - 1,
						y = Math.ceil(event.offsetY / grid) - 1,
						w = +event.el.cssProp("--w"),
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
					return;
				}
				return Self.dispatch({ ...event, type: `put-${value}-tile` });

			case "put-background-tile":
				tiles = event.el.find("b");
				grid = Self.els.viewport.parent().hasClass("big-tiles") ? 32 : 8;
				w = +event.el.cssProp("--w");
				x = Math.ceil(event.offsetX / grid) - 1;
				y = Math.ceil(event.offsetY / grid) - 1;
				// apply palette cursor;
				Self.palette.cursor.map(sel => {
					let index = ((y + sel.y) * w) + (x + sel.x),
						el = tiles.get(index);
					el.prop({ className: sel.id });
				});
				break;
			case "put-collision-tile":
				event.el.find(".active").removeClass("active");
				el = $(event.target);

				mY = parseInt(event.el.cssProp("--y")) * 32,
				mX = parseInt(event.el.cssProp("--x")) * 32;
				margin = `${mY}px 0 0 ${mX}px`;

				if (["c1", "c4", "c5", "c6"].includes(el.prop("className").split(" ")[0])) {
					el.addClass("active");
					x = parseInt(el.cssProp("--x"), 10);
					y = parseInt(el.cssProp("--y"), 10);
					w = parseInt(el.cssProp("--w"), 10);
					h = parseInt(el.cssProp("--h"), 10);
					// focus on active element
					Self.els.editBox.css({ "--x": `${x}px`, "--y": `${y}px`, "--w": `${w}px`, "--h": `${h}px`, margin });
				} else if (Self.palette.tile && Self.palette.tile.startsWith("c")) {
					x = x || event.offsetX;
	 				y = y || event.offsetY;
					w = ["c1", "c4"].includes(Self.palette.tile) ? 20 : 42;
					h = ["c1", "c4"].includes(Self.palette.tile) ? 20 : 42;
					// append new entry
					value = [];
					value.push(`--x: ${x}px;`);
					value.push(`--y: ${y}px;`);
					value.push(`--w: ${w}px;`);
					value.push(`--h: ${h}px;`);
					event.el.append(`<b class="${Self.palette.tile}" style="${value.join("")}"></b>`);
				} else {
					Self.els.editBox.attr({ style: "" });
					Self.els.viewport.find(".active").removeClass("active");
				}
				break;
			case "put-action-tile":
				grid = Self.els.viewport.parent().hasClass("big-tiles") ? 32 : 8;
				w = +event.el.cssProp("--w");
				x = Math.ceil(event.offsetX / grid) - 1;
				y = Math.ceil(event.offsetY / grid) - 1;
				value = `--x: ${x};--y: ${y};--w: ${Self.palette.cursor[0].w};--h: ${Self.palette.cursor[0].h};`;
				tileEl = event.el.find(`b.a1[style="${value}"]`);
				
				if (!Self.palette.tile) return;

				// append new entry
				if (tileEl.length < 1) tileEl = event.el.append(`<b class="a1" style="${value}"></b>`);
				
				Self.els.content.find(`input[name="action-coord"]`).val(`${x},${y},${Self.palette.cursor[0].w},${Self.palette.cursor[0].h}`);
				Self.els.content.find(`input[name="action-id"]`).val(tileEl.data("action"));
				break;
			case "put-los-tile":
				el = $(event.target);
				if (event.metaKey) return;

				switch (Self.palette.cursor) {
					case "refine":
						break;
					case "add":
						if (!el.parent().find(".segment.new").length) {
							if (el.hasClass("segment")) {
								let seg = {
										g: el.data("group"),
										w: +el.cssProp("--sw"),
										h: +el.cssProp("--sh"),
										x: +el.cssProp("--sx"),
										y: +el.cssProp("--sy"),
									},
									d = seg.w > 2 ? "h" : "w",
									add = {};
								if (seg.w > 2) {
									seg.x -= 2;
									seg.h = 0;
								}
								if (seg.h > 2) {
									seg.w = 0;
									seg.y -= 2;
								}
								add["x"] = seg.x + seg.w;
								add["y"] = seg.y + seg.h;
								add[d] = 4;
								
								if (event.offsetX < 5 && event.offsetY < 5) {
									add["x"] = seg.x + 2;
									add["y"] = seg.y + 2;
								}
								// append new segment
								value = `<div class="segment new" data-group="${seg.g}" style="--sx: ${add.x};--sy: ${add.y};--s${d}: ${add[d]};"></div>`;
								el = el.parent().append(value);
								// activate mouse events
								el.trigger("mousedown");
							} else {
								let add = {
										g: Math.max(0, ...el.find(".segment").map(e => +e.getAttribute("data-group"))) + 1,
										x: event.offsetX - 16,
										y: event.offsetY - 16,
										w: 4
									};
								// use even numbers
								add.x -= add.x % 2;
								add.y -= add.y % 2;
								value = `<div class="segment new" data-type="start" data-group="${add.g}" style="--sx: ${add.x};--sy: ${add.y};--sw: ${add.w};"></div>`;
								el = el.append(value);
								// activate mouse events
								el.trigger("mousedown");
							}
						}
						break;
					case "delete":
						if (el.hasClass("segment")) {
							el.nextAll(`.segment[data-group="${el.data("group")}"]`).remove();
							el.remove();
						}
						break;
				}
				break;
			case "put-lights-tile":
				el = $(event.target);
				if (el.find(".active").length) el.find(".active").removeClass("active");
				else if (el.hasClass("layer-lights") && !Self.light && !event.metaKey) {
					// insert new light bulb
					value = `<div class="spotlight" style="--x: ${event.offsetX}; --y: ${event.offsetY}; --r: 1;"><span class="handle"></span></div>`;
					el.append(value);
				}
				break;

			case "select-editor-layer":
				// change toolset
				Spawn.toolset = event.arg;
				// changes spawn content
				Self.els.spawn.data({ show: event.arg });
				// toggles layers depending on selected tab
				Self.els.viewport.data({ show: event.arg });
				// correct text for selectbox
				if (!event.origin) {
					let xMenu = window.bluePrint.selectSingleNode(`//Menu[@click="select-editor-layer"][@arg="${event.arg}"]`);
					Spawn.find(`.toolbar-selectbox_ .selectbox-selected_`).text(xMenu.getAttribute("name"));
				}
				break;
			case "select-bg-tile":
				el = $(event.target);
				event.el.find(".active").removeClass("active");
				el.addClass("active");
				// selected "tile"
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
				Self.els.content.find(".tiles .active").removeClass("active");
				if (Self.palette.tile) {
					Self.els.content.find(`.${Self.palette.tile}`).addClass("active");
				}
				// empty palette cursor / eraser
				Self.palette.cursor = [{ x: 0, y: 0, id: Self.palette.tile }];
				// update viewport cursor
				value = `<b class="${Self.palette.tile}" style="--x: 0; --y: 0;"></b>`;
				Self.els.cursor.html(value);
				// reset palette cursor
				delete Self.palette.cursorOrigo;
				break;

			case "select-col-tile":
				el = $(event.target);
				Self.palette.tile = el.prop("class").split(" ")[0];
				// update UI
				Self.els.content.find(".layer-collision .tiles .active").removeClass("active");
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

			case "select-action-tile":
				el = $(event.target);
				Self.palette.tile = el.prop("class").split(" ")[0];
				// update UI
				Self.els.content.find(".layer-action .tiles .active").removeClass("active");

				if (!Self.palette.tile.startsWith("a")) {
					delete Self.palette.tile;
					Self.els.cursor.html("");
					return;
				}

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

			case "toggle-overflow":
				el = Self.els.viewport;
				value = el.hasClass("show-overflow");
				el.toggleClass("show-overflow", value);
				Spawn.find(`.toolbar-tool_[data-click="toggle-overflow"]`).toggleClass("tool-active_", value);
				return !value;
			case "toggle-grid":
				el = Self.els.viewport.find(".layer-background");
				value = el.hasClass("hide-grid");
				el.toggleClass("hide-grid", value);
				Spawn.find(`.toolbar-tool_[data-click="toggle-grid"]`).toggleClass("tool-active_", value);
				return !value;

			case "render-level":
				if (!event.arg) return;
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
				// pre-process home positions of droids
				xSection.selectNodes(`./Layer[@id="droids"]/i`).map(xPatrol => {
					if (!xPatrol.getAttribute("patrol")) {
						xPatrol.setAttribute("patrol", "[[2,2]]");
					}
					JSON.parse(xPatrol.getAttribute("patrol")).map(p => {
						let xP = $.nodeFromString(`<i x="${p[0]}" y="${p[1]}"/>`);
						xPatrol.appendChild(xP);
					});
				});
				// update menu
				window.bluePrint.selectNodes(`//Menu[@check-group="game-level"][@is-checked]`).map(x => x.removeAttribute("is-checked"));
				window.bluePrint.selectSingleNode(`//Menu[@check-group="game-level"][@arg="${event.arg}"]`).setAttribute("is-checked", "1");
				// delete old level HTML
				layers = [".layer-background", ".layer-collision", ".layer-action", ".layer-los", ".layer-lights", ".layer-droids"];
				Self.els.viewport.find(layers.join(",")).remove();
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
				// render los layer
				window.render({
					template: "layer-los",
					match: `//Section[@id = "${event.arg}"]`,
					append: Self.els.viewport,
				});
				// render lights layer
				window.render({
					template: "layer-lights",
					match: `//Section[@id = "${event.arg}"]`,
					append: Self.els.viewport,
				});
				// render droids layer
				window.render({
					template: "layer-droids",
					match: `//Section[@id = "${event.arg}"]`,
					append: Self.els.viewport,
				});
				// render droids list in spawn
				window.render({
					template: "droids-list",
					match: `//Section[@id = "${event.arg}"]/Layer[@id="droids"]`,
					target: Self.els.content.find(`.droid-patrol .list`),
				});
				// prevent "see-through"
				el = Self.els.viewport.find(".layer-background");
				Self.els.viewport.find(".level-bg").css({
					background: xSection.getAttribute("color"),
					"--x": el.cssProp("--x"),
					"--y": el.cssProp("--y"),
					"--w": el.cssProp("--w"),
					"--h": el.cssProp("--h"),
				});
				el.css({ filter: xSection.getAttribute("filter") });
				break;
			case "grid-size":
				event.el.parent().find(".active").removeClass("active");
				event.el.addClass("active");
				
				Self.els.viewport.parent().removeClass("big-tiles small-tiles").addClass(event.arg === "1" ? "big-tiles" : "small-tiles");
				break;
			case "set-action-id":
				value = event.el.data("arg");
				Self.els.content.find(`input[name="action-id"]`).val(value);
				// update node
				Self.dispatch({ type: "update-action-tiles" });
				break;
			case "update-action-tiles":
			case "clear-action-tiles":
				let aId = Self.els.content.find(`input[name="action-id"]`).val(),
					[aX, aY, aW, aH] = Self.els.content.find(`input[name="action-coord"]`).val().split(",").map(i => +i),
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

			case "los-add-segment":
			case "los-delete-segment":
				Self.palette.cursor = event.type.split("-")[1];
				return true;

			case "lights-duplicate":
				el = Self.els.viewport.find(".layer-lights .active").clone(true);
				Self.els.viewport.find(".layer-lights").append(el);
				break;
			case "lights-delete":
				Self.els.viewport.find(".layer-lights .active").remove();
				break;
			case "toggle-lights-helpers":
				value = Self.els.viewport.find(".layer-lights").hasClass("hide-helpers");
				Self.els.viewport.find(".layer-lights").toggleClass("hide-helpers", value);
				return value;
			case "output-lights-pgn":
				value = [];
				Self.els.viewport.find(".layer-lights .spotlight").map(light => {
					let el = $(light),
						x = +el.cssProp("--x"),
						y = +el.cssProp("--y"),
						r = +el.cssProp("--r");
					value.push(`<i x="${x}" y="${y}" r="${r}"/>`);
				});
				console.log( value.join("\n") );
				break;

			case "output-los-pgn":
				tiles = [];
				let prev;
				Self.els.viewport.find(".layer-los .segment").map(seg => {
					let el = $(seg),
						x = +el.cssProp("--sx"),
						y = +el.cssProp("--sy"),
						w = +el.cssProp("--sw"),
						h = +el.cssProp("--sh"),
						t = w > 2 ? "w" : "h",
						d = 1,
						g = +el.data("group"),
						group = tiles[g-1];
					// reset prev when "new" group
					if (el.data("type") === "start") prev = undefined;
					// first make groups
					if (!group || group.constructor !== Array) {
						tiles[g-1] = [];
						group = tiles[g-1];
					}
					if (prev) {
						switch (true) {
							case el.data("type") === "end": d = 0; break; // up
							case t === "h" && y + h - prev.y <= 2: d = 0; break; // up
							case t === "h" && prev.w > 2: d = 2; break; // down
							case t === "w" && x + w - prev.x <= 2: d = 3; break; // right
							default: d = 1; // left
						}
					}
					prev = { x, y, w, h, t };
					group.push(`<i d="${d}" x="${x}" y="${y}" ${t}="${w > 2 ? w : h}"/>`);
				});
				value = tiles.map(g => `<walls>\n\t${g.join("\n\t")}\n</walls>`);
				console.log( value.join("\n") );
				break;

			case "show-droid-patrol":
				el = $(event.target);
				let row = el.parents("?.row");
				if (!row.hasClass("row")) return;
				event.el.find(".active").removeClass("active");
				row.addClass("active");

				value = row.find("span").get(2).html();
				if (!value) return;
				// reset active patrol point
				Self.els.viewport.find(`.layer-droids .patrol-group.active`).removeClass("active");
				// make patrol polygon active
				let patrolPoint = Self.els.viewport.find(`.layer-droids .patrol-group[data-nr="${row.find("span").get(0).html().slice(1)}"]`);
				// if (patrolPoint.hasClass("active")) return;
				patrolPoint.addClass("active");

				if (el.index() === 1) {
					let pEl = Self.els.viewport.find(`.layer-droids`),
						gEl = pEl.find(`.patrol-group.active`);
					gEl.find(".patrol-point").get(0).css({
						"--x": (+pEl.cssProp("--x") - 11) * -1,
						"--y": (+pEl.cssProp("--y") - 8) * -1,
					});
					return;
				}

				value = JSON.parse(value);
				[x, y] = value[0].map(i => +i);
				layers = [".layer-background", ".level-bg", ".layer-collision", ".layer-action", ".layer-los", ".layer-lights", ".layer-droids"];
				Self.els.viewport.find(layers.join(",")).css({ "--y": 7-y, "--x": 11-x });
				break;
			case "redraw-patrol-lines":
				let svgEl = Self.els.viewport.find(`.layer-droids .patrol-group[data-nr="${event.value}"] svg`),
					points = Self.els.viewport.find(`.layer-droids .patrol-group[data-nr="${event.value}"] .patrol-point`),
					arr = [],
					lines = [];
				// remove old lines
				svgEl.find(`line`).remove();
				// iterate patrol points
				points.map((elem, i, r) => {
					let el = $(elem),
						next = i < r.length - 1 ? points.get(i+1) : points.get(0),
						x1 = +el.cssProp("--x"),
						y1 = +el.cssProp("--y"),
						x2 = +next.cssProp("--x"),
						y2 = +next.cssProp("--y");
					arr.push([x1, y1]);
					lines.push(`<line x1="${x1*32}" y1="${y1*32}" x2="${x2*32}" y2="${y2*32}"/>`);
				});
				// replace SVG element
				svgEl.replace(`<svg viewBox="0 0 100 100">${lines.join("")}</svg>`);
				// update spawn window
				Self.els.content.find(`.droid-patrol .row[data-nr="${event.value}"] span:nth-child(3)`).html(JSON.stringify(arr));
				break;
			case "select-patrol-droid":
				// console.log(event);
				break;
			case "center-patrol-point":
				let pEl = Self.els.viewport.find(`.layer-droids`),
					gEl = pEl.find(`.patrol-group.active`);
				gEl.find(".patrol-point").get(0).css({
					"--x": (+pEl.cssProp("--x") - 11) * -1,
					"--y": (+pEl.cssProp("--y") - 8) * -1,
				});
				break;
			case "delete-patrol-point":
				el = Self.els.viewport.find(`.patrol-point.active`);
				value = el.parent().data("nr");
				// remove point
				el.remove();
				// update lines
				Self.dispatch({ type: "redraw-patrol-lines", value });
				break;
			case "output-patrol-pgn":
				value = [];
				Self.els.viewport.find(`.layer-droids .patrol-group`).map(elem => {
					let el = $(elem),
						patrol = el.find(".patrol-point").map(pp => {
							let ppEl = $(pp);
							return [+ppEl.cssProp("--x"), +ppEl.cssProp("--y")];
						});
					value.push(`<i nr="${el.data("nr")}" id="${el.data("id")}" patrol="${JSON.stringify(patrol)}"/>`);
				});
				console.log(value.join("\n"));
				break;

			case "col-duplicate-active":
				// remove active
				el = Self.els.viewport.find(".layer-collision .active").removeClass("active").clone(true);
				Self.els.viewport.find(".layer-collision").append(el);
				// hide editbox
				Self.els.editBox.attr({ "style": "" });
				break;
			case "col-delete-active":
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
	dragEditbox(event) {
		let APP = paradroid,
			Self = APP.editor,
			Drag = Self.drag,
			data = {};
		switch (event.type) {
			case "mousedown":
				let doc = $(document),
					tgt = $(event.target),
					boxEl = Self.els.editBox,
					colEl = Self.els.viewport.find(".layer-collision"),
					actEl = colEl.find(".active");
				if (!actEl.length || tgt[0] === colEl[0]) return;

				let [a, resize] = event.target.className.split(" "),
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
				// drag info
				Self.drag = { doc, actEl, resize, boxEl, click, offset };
				// auto-trigger mousemove event
				Self.dispatch({ type: "mousemove", clientX: event.clientX, clientY: event.clientY });
				// cover app view
				APP.els.content.addClass("cover");
				// bind event handlers
				Self.drag.doc.on("mousemove mouseup", Self.dragEditbox);
				break;
			case "mousemove":
				let dY = event.clientY - Drag.click.y,
					dX = event.clientX - Drag.click.x;
				
				data.css = {
					top: Drag.offset.act.top,
					left: Drag.offset.act.left,
					width: Drag.offset.act.width,
					height: Drag.offset.act.height,
				};

				switch (Drag.resize) {
					case "w":
						break;
					case "s":
						data.css.height += dY;
						data.css.height -= (data.css.height % 2);
						break;
					default:
						data.css.top = dY - Drag.offset.pEl.y + Drag.offset.box.top;
						data.css.left = dX - Drag.offset.pEl.x + Drag.offset.box.left;
				}
				// snap
				data.css.top -= (data.css.top % 2);
				data.css.left -= (data.css.left % 2);
				// UI update
				Drag.boxEl.css(data.css);
				Drag.actEl.css(data.css);
				// save values in drag object
				Drag.data = data;
				break;
			case "mouseup":
				data["--x"] = `${Drag.data.css.left + (Drag.data.css.width / 2)}px`;
				data["--y"] = `${Drag.data.css.top + (Drag.data.css.height / 2)}px`;
				data["--w"] = `${Drag.data.css.width}px`;
				data["--h"] = `${Drag.data.css.height}px`;

				Drag.actEl.attr({ style: "" }).css(data);
				// Drag.boxEl.css({ "--x": "", "--y": "", "--w": "", "--h": "" });
				// uncover app view
				APP.els.content.removeClass("cover");
				// unbind event handlers
				Self.drag.doc.off("mousemove mouseup", Self.dragEditbox);
				break;
		}
	},
	doSegment(event) {
		let APP = paradroid,
			Self = APP.editor,
			Segment = Self.segment,
			data = {};
		switch (event.type) {
			case "mousedown":
				let el = $(event.target);
				if (el.hasClass("new") && !Segment) {
					let offset = el.offset(),
						click = {
							x: -event.layerX,
							y: -event.layerY,
						},
						seg = {
							w: +el.cssProp("--sw"),
							h: +el.cssProp("--sh"),
							x: +el.cssProp("--sx"),
							y: +el.cssProp("--sy"),
							d: +el.cssProp("--sw") > 2 ? "w" : "h",
						};
					// new segment object
					Self.segment = { el, offset, click, seg };
					// UI class for parent element
					el.parent().addClass("new-added");
				} else if (Segment) {
					let g = Segment.el.data("group"),
						siblings = Segment.el.parent().find(`.segment[data-group="${g}"]`),
						first = siblings.get(0);
					if (siblings.length > 1 && Segment.el.cssProp("--sx") == first.cssProp("--sx") && Segment.el.cssProp("--sy") == first.cssProp("--sy")) {
						Segment.el.data({ type: "end" });
					}
					// reset parent element
					Segment.el.parent().removeClass("new-added");
					// end segment
					delete Self.segment;
					// reset new segment
					setTimeout(() => Segment.el.removeClass("new"), 200);
				}
				break;
			case "mousemove":
				if (Segment) {
					let dx = event.clientX - Segment.click.x,
						dy = event.clientY - Segment.click.y,
						dv = `--s${Segment.seg.d}`;
					// snap
					dx -= dx % 2;
					dy -= dy % 2;

					if (Segment.seg.d === "w") {
						if (dx > 0) data[dv] = dx;
						else {
							data["--sx"] = Segment.seg.x + dx;
							data["--sw"] = dx * -1;
						}
					} else {
						if (dy > 0) data[dv] = dy;
						else {
							data["--sy"] = Segment.seg.y + dy;
							data["--sh"] = dy * -1;
						}
					}

					// UI update
					Segment.el.css(data);
				}
				break;
			case "mouseup":
				break;
		}
	},
	doLight(event) {
		let APP = paradroid,
			Self = APP.editor,
			Light = Self.light;
		switch (event.type) {
			case "mousedown":
				let tgt = $(event.target);
				if (tgt.hasClass("layer-lights")) return;
				tgt.parents(".layer-lights").find(".active").removeClass("active");

				let doc = $(document),
					el = tgt.parents("?.spotlight").addClass("active"),
					type = tgt.hasClass("handle") ? "resize" : "move",
					offset = {
						x: +el.cssProp("--x"),
						y: +el.cssProp("--y"),
						r: +el.cssProp("--r") * 60,
					},
					click = {
						x: event.clientX,
						y: event.clientY,
					};
				// drag light info
				Self.light = { doc, el, type, click, offset };

				// cover app view
				APP.els.content.addClass("cover");
				// bind event handlers
				Self.light.doc.on("mousemove mouseup", Self.doLight);
				break;
			case "mousemove":
				let dY = event.clientY - Light.click.y,
					dX = event.clientX - Light.click.x,
					data = {};
				switch (Light.type) {
					case "move":
						data["--y"] = dY + Light.offset.y;
						data["--x"] = dX + Light.offset.x;
						break;
					case "resize":
						let r = dX + Light.offset.r
						data["--r"] = +(Math.min(Math.max(r, 10), 60) / 60).toFixed(2);
						break;
				}
				// UI update
				Light.el.css(data);
				break;
			case "mouseup":
				// uncover app view
				APP.els.content.removeClass("cover");
				// unbind event handlers
				Self.light.doc.off("mousemove mouseup", Self.doLight);
				// reset "light" object
				delete Self.light;
				break;
		}
	},
	doPatrol(event) {
		let APP = paradroid,
			Self = APP.editor,
			Patrol = Self.patrol;
		switch (event.type) {
			case "mousedown":
				let el = $(event.target).parents("?.patrol-point");
				if (!el.length) {
					let pEl = Self.els.viewport.find(`.layer-droids .patrol-group.active`),
						arr = pEl.find(".patrol-point").map(elem => {
							let el = $(elem);
							return { x: +el.cssProp("--x"), y: +el.cssProp("--y") };
						}),
						newPoint = {
							x: Math.round(event.offsetX / 32),
							y: Math.round(event.offsetY / 32),
						};
					
					arr.push(newPoint);
					arr = Utils.sortPointsCW(arr);
					let newStr = arr.map((p, i) => {
							let droidEl = i === 0 ? `<span class="droid" data-id="${pEl.data("id")}"><b></b></span>` : "";
							return `<span class="patrol-point" style="--x: ${p.x}; --y: ${p.y};">${droidEl}</span>`;
						});
					pEl.find(".patrol-point").remove();
					pEl.append(newStr.join(""));
					// continue with new point element
					el = pEl.find(`.patrol-point[style="--x: ${newPoint.x}; --y: ${newPoint.y};"]`);
					// console.log(el);
				}
				// make active
				el.addClass("active");
				// make list row active
				if (!el.parent().hasClass("active")) {
					let nr = el.parent().data("nr");
					Self.els.content.find(`.droid-patrol .row[data-nr="${nr}"] span:nth-child(1)`).trigger("click");
				}

				let doc = $(document),
					offset = {
						"--x": +el.cssProp("--x"),
						"--y": +el.cssProp("--y"),
					},
					click = {
						x: event.clientX,
						y: event.clientY,
					};
				// drag light info
				Self.patrol = { doc, el, click, offset };

				// cover app view
				APP.els.content.addClass("cover");
				// bind event handlers
				Self.patrol.doc.on("mousemove mouseup", Self.doPatrol);
				break;
			case "mousemove":
				let dY = event.clientY - Patrol.click.y,
					dX = event.clientX - Patrol.click.x,
					data = {
						"--y": Math.round(dY / 32) + Patrol.offset["--y"],
						"--x": Math.round(dX / 32) + Patrol.offset["--x"],
					};
				// UI update
				Patrol.el.css(data);
				break;
			case "mouseup":
				// uncover app view
				APP.els.content.removeClass("cover");
				// unbind event handlers
				Self.patrol.doc.off("mousemove mouseup", Self.doPatrol);
				// redraw patrol lines
				Self.dispatch({ type: "redraw-patrol-lines", value: Patrol.el.parent().data("nr") });
				// reset "light" object
				delete Self.patrol;
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

				// dispatch if event is is intended for others
				if (!event.metaKey) {
					switch (Self.els.viewport.data("show")) {
						case "collision": return Self.dragEditbox(event);
						case "lights": return Self.doLight(event);
						case "los": return Self.doSegment(event);
						case "droids": return Self.doPatrol(event);
					}
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
				} else if (event.target.classList.contains("layer-los")) {
					return Self.doSegment(event);
				} else if (event.target.classList.contains("layer-lights")) {
					return; // Self.doLight(event);
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
						x = Math.round(Pan.moved.left / Pan.data.tile),
						layers = [".level-bg", ".layer-collision", ".layer-action", ".layer-los", ".layer-lights", ".layer-droids"];
					Pan.el.css({ top: "", left: "", "--y": y, "--x": x });
					Self.els.viewport.find(layers.join(",")).css({ "--y": y, "--x": x });
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
