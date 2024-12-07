
let Shifter = (() => {
	"use strict";
	
	let DOTS = 50e3, // 100k-200k seems reasonable
		shaderConfig = { // these affect the shaders; changing them does *not* require updating buffers
			alpha: 0.15,
			speed: 3.5,
			spread: 0.2,
			chromaticblur: 0.005,
		},
		shape = [],
		jitter = Array.from({ length: DOTS }, () => Math.random()),
		tick = 0,
		step = 0,
		draw,
		regl;

	let Shifter = {
		init(cfg) {
			// prepare Regl
			regl = createREGL({ canvas: cfg.cvs[0] });
			shape.push(regl.buffer(DOTS));
			shape.push(regl.buffer(DOTS));
			// save config
			this.cvs = cfg.cvs;
			this.width = +cfg.cvs.attr("width");
			this.height = +cfg.cvs.attr("height");
		},
		async shift(cfg) {
			// callback
			this.done = cfg.done;
			// image storage
			this.bank = {};
			// load images
			await this.loadImage(`~/icons/bp-${cfg.from}.png`);
			await this.loadImage(`~/icons/bp-${cfg.to}.png`);
			// prepare regl anim
			draw = this.prepareRegl();

			this.start();
		},
		start() {
			step = tick >= 73 ? -1 : 1;
			// start anim
			let loop = regl.frame(() => {
				tick += step;
				
				if (tick > 73 || tick < 0) {
					loop.cancel();
					regl.clear({color: [0, 0, 0, 1], depth: 1});
					return this.done()
				}

				this.redraw();
			});
		},
		loadImage(url) {
			return new Promise(resolve => {
				let img = new Image;
				img.onload = () => {
					let cvs = document.createElement("canvas"),
						ctx = cvs.getContext("2d"),
						num = Object.keys(this.bank).length,
						len = DOTS * 2,
						data = [],
						x = 322,
						y = 78,
						w = 510,
						h = 510,
						rX = 1-((700-w)/w),
						rY = 1-((700-h)/h);
					cvs.width = w;
					cvs.height = h;
					// draw image
					ctx.translate(-x, -y);
					ctx.drawImage(img, 0, 0);

					let imageData = ctx.getImageData(0, 0, w, h),
						pixels = imageData.data,
						j = 0,
						xtra = 0;
					for (let i=0, il=pixels.length; i<il; i+=4) {
						if (pixels[i+3] <= 192) continue;
						let k = i/4,
							pX = ((k % w) / (w*rX)) - rX,
							pY = .75 - ((k / h) / (h*rY));
						data[j++] = pX;
						data[j++] = pY;
					}
					while (j < len) {
						data[j++] = data[xtra++];
						data[j++] = data[xtra++];
					}
					
					shape[num]({ data });

					// save reference
					this.bank[url] = { cvs, ctx };
					// done
					resolve();
				};
				img.src = url;
			});
		},
		redraw(a,b,c) {
			regl.clear({color: [0, 0, 0, 0], depth: 1});
			// Chromatic blur: draw blue, cyan, green, orange, red versions of each point,
			// and have them added together using blending so they'll be white if they're
			// all present. The sums of R, G, B should be roughly equal to get white.
			let chromaticblur = 0.1 * shaderConfig.chromaticblur;
			draw({ u_color: [0.1, 0.1, 0.1], u_chromaticblur: 0 });
			draw({ u_color: [0.2, 0.2, 0.2], u_chromaticblur: 1 * chromaticblur });
			draw({ u_color: [0.3, 0.3, 0.3], u_chromaticblur: 2 * chromaticblur });
			// draw({ u_color: [0.1, 0.1, 0.1], u_chromaticblur: 3 * chromaticblur });
			// draw({ u_color: [0.1, 0.1, 0.1], u_chromaticblur: 4 * chromaticblur });
		},
		prepareRegl() {
			/* Here's the GLSL shader magic — it's just a linear interpolation between the two positions */
			return regl({
				frag: `
					precision highp float;
					uniform vec3 u_color;
					uniform float u_alpha;
					void main () {
						gl_FragColor = vec4(u_color * u_alpha, u_alpha);
					}`,
				
				vert: `
					precision highp float;
					uniform float u_tick, u_chromaticblur, u_spread, u_speed;
					attribute float a_jitter;
					attribute vec2 a_position1, a_position2;
					void main () {
						float phase = 0.75 * (1.0 + cos(u_speed * (u_tick + u_chromaticblur) + a_jitter * u_spread));
						phase = smoothstep(0.1, 0.9, phase);
						gl_PointSize = 1.15;
						gl_Position = vec4(mix(a_position1, a_position2, phase), 0, 1);
					}`,

				// additive — we want to draw many points in the same place and have them add together
				depth: { enable: false, },
				blend: { enable: true, func: { src: 'one', dst: 'one' }, },
				attributes: {
					a_jitter: jitter,
					a_position1: shape[0],
					a_position2: shape[1],
				},
				uniforms: {
					// TODO: instead of multiplying these by some value, it'd probably be better to
					// have a min and max value for each parameter, but right now they're all hard-coded
					// to be 0-1 or 1-20
					u_alpha: () => shaderConfig.alpha,
					u_speed: () => shaderConfig.speed,
					u_spread: () => Math.PI * 2 * shaderConfig.spread,
					u_color: regl.prop('u_color'),
					u_chromaticblur: regl.prop('u_chromaticblur'),
					u_tick: () => tick / 1e2,
					// u_time: context => context.time,
				},
				count: DOTS,
				primitive: 'points',
			});
		}
	};

	return Shifter;

})();
