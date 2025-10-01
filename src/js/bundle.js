
@import "./ext/regl.js"
@import "./ext/astar.js"
@import "./ext/pathseg.js"

@import "./modules/raycaster.js"
@import "./modules/shifter.js"
@import "./modules/color.js"
@import "./modules/utils.js"

@import "./classes/point.js"
@import "./classes/hacker-ai.js"
@import "./classes/explosion.js"
@import "./classes/sparks.js"
@import "./classes/missile.js"
@import "./classes/electric.js"
@import "./classes/simplexnoise.js"
@import "./classes/fire.js"
@import "./classes/sonic.js"

let Matter = (() => {
	@import "./ext/matter.min.js"
	return module.exports;
})();


module.exports = {
	createREGL,
	Finder,
	Shifter,
	Raycaster,
	Color,
	Matter,

	Point,
	HackerAI,
	Explosion,
	Sparks,
	Missile,
	Electric,
	SimplexNoise,
	Fire,
	Sonic,

	Utils,
};
