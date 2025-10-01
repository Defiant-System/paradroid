let createREGL = (function () {
'use strict';

var isTypedArray = function (x) {
	return (
		x instanceof Uint8Array ||
		x instanceof Uint16Array ||
		x instanceof Uint32Array ||
		x instanceof Int8Array ||
		x instanceof Int16Array ||
		x instanceof Int32Array ||
		x instanceof Float32Array ||
		x instanceof Float64Array ||
		x instanceof Uint8ClampedArray
	)
};

var extend = function (base, opts) {
	var keys = Object.keys(opts);
	for (var i = 0; i < keys.length; ++i) {
		base[keys[i]] = opts[keys[i]];
	}
	return base
};

// Error checking and parameter validation.
//
// Statements for the form `check.someProcedure(...)` get removed by
// a browserify transform for optimized/minified bundles.
//
/* globals atob */
var endl = '\n';

// only used for extracting shader names.  if atob not present, then errors
// will be slightly crappier
function decodeB64 (str) {
	if (typeof atob !== 'undefined') {
		return atob(str)
	}
	return 'base64:' + str
}

function raise (message) {
	var error = new Error('(regl) ' + message);
	console.error(error);
	throw error
}

function check (pred, message) {
	if (!pred) {
		raise(message);
	}
}

function encolon (message) {
	if (message) {
		return ': ' + message
	}
	return ''
}

function checkParameter (param, possibilities, message) {
	if (!(param in possibilities)) {
		raise('unknown parameter (' + param + ')' + encolon(message) +
					'. possible values: ' + Object.keys(possibilities).join());
	}
}

function checkIsTypedArray (data, message) {
	if (!isTypedArray(data)) {
		raise(
			'invalid parameter type' + encolon(message) +
			'. must be a typed array');
	}
}

function checkTypeOf (value, type, message) {
	if (typeof value !== type) {
		raise(
			'invalid parameter type' + encolon(message) +
			'. expected ' + type + ', got ' + (typeof value));
	}
}

function checkNonNegativeInt (value, message) {
	if (!((value >= 0) &&
				((value | 0) === value))) {
		raise('invalid parameter type, (' + value + ')' + encolon(message) +
					'. must be a nonnegative integer');
	}
}

function checkOneOf (value, list, message) {
	if (list.indexOf(value) < 0) {
		raise('invalid value' + encolon(message) + '. must be one of: ' + list);
	}
}

var constructorKeys = [
	'gl',
	'canvas',
	'container',
	'attributes',
	'pixelRatio',
	'extensions',
	'optionalExtensions',
	'profile',
	'onDone'
];

function checkConstructor (obj) {
	Object.keys(obj).forEach(function (key) {
		if (constructorKeys.indexOf(key) < 0) {
			raise('invalid regl constructor argument "' + key + '". must be one of ' + constructorKeys);
		}
	});
}

function leftPad (str, n) {
	str = str + '';
	while (str.length < n) {
		str = ' ' + str;
	}
	return str
}

function ShaderFile () {
	this.name = 'unknown';
	this.lines = [];
	this.index = {};
	this.hasErrors = false;
}

function ShaderLine (number, line) {
	this.number = number;
	this.line = line;
	this.errors = [];
}

function ShaderError (fileNumber, lineNumber, message) {
	this.file = fileNumber;
	this.line = lineNumber;
	this.message = message;
}

function guessCommand () {
	var error = new Error();
	var stack = (error.stack || error).toString();
	var pat = /compileProcedure.*\n\s*at.*\((.*)\)/.exec(stack);
	if (pat) {
		return pat[1]
	}
	var pat2 = /compileProcedure.*\n\s*at\s+(.*)(\n|$)/.exec(stack);
	if (pat2) {
		return pat2[1]
	}
	return 'unknown'
}

function guessCallSite () {
	var error = new Error();
	var stack = (error.stack || error).toString();
	var pat = /at REGLCommand.*\n\s+at.*\((.*)\)/.exec(stack);
	if (pat) {
		return pat[1]
	}
	var pat2 = /at REGLCommand.*\n\s+at\s+(.*)\n/.exec(stack);
	if (pat2) {
		return pat2[1]
	}
	return 'unknown'
}

function parseSource (source, command) {
	var lines = source.split('\n');
	var lineNumber = 1;
	var fileNumber = 0;
	var files = {
		unknown: new ShaderFile(),
		0: new ShaderFile()
	};
	files.unknown.name = files[0].name = command || guessCommand();
	files.unknown.lines.push(new ShaderLine(0, ''));
	for (var i = 0; i < lines.length; ++i) {
		var line = lines[i];
		var parts = /^\s*\#\s*(\w+)\s+(.+)\s*$/.exec(line);
		if (parts) {
			switch (parts[1]) {
				case 'line':
					var lineNumberInfo = /(\d+)(\s+\d+)?/.exec(parts[2]);
					if (lineNumberInfo) {
						lineNumber = lineNumberInfo[1] | 0;
						if (lineNumberInfo[2]) {
							fileNumber = lineNumberInfo[2] | 0;
							if (!(fileNumber in files)) {
								files[fileNumber] = new ShaderFile();
							}
						}
					}
					break
				case 'define':
					var nameInfo = /SHADER_NAME(_B64)?\s+(.*)$/.exec(parts[2]);
					if (nameInfo) {
						files[fileNumber].name = (nameInfo[1]
								? decodeB64(nameInfo[2])
								: nameInfo[2]);
					}
					break
			}
		}
		files[fileNumber].lines.push(new ShaderLine(lineNumber++, line));
	}
	Object.keys(files).forEach(function (fileNumber) {
		var file = files[fileNumber];
		file.lines.forEach(function (line) {
			file.index[line.number] = line;
		});
	});
	return files
}

function parseErrorLog (errLog) {
	var result = [];
	errLog.split('\n').forEach(function (errMsg) {
		if (errMsg.length < 5) {
			return
		}
		var parts = /^ERROR\:\s+(\d+)\:(\d+)\:\s*(.*)$/.exec(errMsg);
		if (parts) {
			result.push(new ShaderError(
				parts[1] | 0,
				parts[2] | 0,
				parts[3].trim()));
		} else if (errMsg.length > 0) {
			result.push(new ShaderError('unknown', 0, errMsg));
		}
	});
	return result
}

function annotateFiles (files, errors) {
	errors.forEach(function (error) {
		var file = files[error.file];
		if (file) {
			var line = file.index[error.line];
			if (line) {
				line.errors.push(error);
				file.hasErrors = true;
				return
			}
		}
		files.unknown.hasErrors = true;
		files.unknown.lines[0].errors.push(error);
	});
}

function checkShaderError (gl, shader, source, type, command) {
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		var errLog = gl.getShaderInfoLog(shader);
		var typeName = type === gl.FRAGMENT_SHADER ? 'fragment' : 'vertex';
		checkCommandType(source, 'string', typeName + ' shader source must be a string', command);
		var files = parseSource(source, command);
		var errors = parseErrorLog(errLog);
		annotateFiles(files, errors);

		Object.keys(files).forEach(function (fileNumber) {
			var file = files[fileNumber];
			if (!file.hasErrors) {
				return
			}

			var strings = [''];
			var styles = [''];

			function push (str, style) {
				strings.push(str);
				styles.push(style || '');
			}

			push('file number ' + fileNumber + ': ' + file.name + '\n', 'color:red;text-decoration:underline;font-weight:bold');

			file.lines.forEach(function (line) {
				if (line.errors.length > 0) {
					push(leftPad(line.number, 4) + '|  ', 'background-color:yellow; font-weight:bold');
					push(line.line + endl, 'color:red; background-color:yellow; font-weight:bold');

					// try to guess token
					var offset = 0;
					line.errors.forEach(function (error) {
						var message = error.message;
						var token = /^\s*\'(.*)\'\s*\:\s*(.*)$/.exec(message);
						if (token) {
							var tokenPat = token[1];
							message = token[2];
							switch (tokenPat) {
								case 'assign':
									tokenPat = '=';
									break
							}
							offset = Math.max(line.line.indexOf(tokenPat, offset), 0);
						} else {
							offset = 0;
						}

						push(leftPad('| ', 6));
						push(leftPad('^^^', offset + 3) + endl, 'font-weight:bold');
						push(leftPad('| ', 6));
						push(message + endl, 'font-weight:bold');
					});
					push(leftPad('| ', 6) + endl);
				} else {
					push(leftPad(line.number, 4) + '|  ');
					push(line.line + endl, 'color:red');
				}
			});
			if (typeof document !== 'undefined' && !window.chrome) {
				styles[0] = strings.join('%c');
				console.log.apply(console, styles);
			} else {
				console.log(strings.join(''));
			}
		});

		check.raise('Error compiling ' + typeName + ' shader, ' + files[0].name);
	}
}

function checkLinkError (gl, program, fragShader, vertShader, command) {
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		var errLog = gl.getProgramInfoLog(program);
		var fragParse = parseSource(fragShader, command);
		var vertParse = parseSource(vertShader, command);

		var header = 'Error linking program with vertex shader, "' +
			vertParse[0].name + '", and fragment shader "' + fragParse[0].name + '"';

		if (typeof document !== 'undefined') {
			console.log('%c' + header + endl + '%c' + errLog,
				'color:red;text-decoration:underline;font-weight:bold',
				'color:red');
		} else {
			console.log(header + endl + errLog);
		}
		check.raise(header);
	}
}

function saveCommandRef (object) {
	object._commandRef = guessCommand();
}

function saveDrawCommandInfo (opts, uniforms, attributes, stringStore) {
	saveCommandRef(opts);

	function id (str) {
		if (str) {
			return stringStore.id(str)
		}
		return 0
	}
	opts._fragId = id(opts.static.frag);
	opts._vertId = id(opts.static.vert);

	function addProps (dict, set) {
		Object.keys(set).forEach(function (u) {
			dict[stringStore.id(u)] = true;
		});
	}

	var uniformSet = opts._uniformSet = {};
	addProps(uniformSet, uniforms.static);
	addProps(uniformSet, uniforms.dynamic);

	var attributeSet = opts._attributeSet = {};
	addProps(attributeSet, attributes.static);
	addProps(attributeSet, attributes.dynamic);

	opts._hasCount = (
		'count' in opts.static ||
		'count' in opts.dynamic ||
		'elements' in opts.static ||
		'elements' in opts.dynamic);
}

function commandRaise (message, command) {
	var callSite = guessCallSite();
	raise(message +
		' in command ' + (command || guessCommand()) +
		(callSite === 'unknown' ? '' : ' called from ' + callSite));
}

function checkCommand (pred, message, command) {
	if (!pred) {
		commandRaise(message, command || guessCommand());
	}
}

function checkParameterCommand (param, possibilities, message, command) {
	if (!(param in possibilities)) {
		commandRaise(
			'unknown parameter (' + param + ')' + encolon(message) +
			'. possible values: ' + Object.keys(possibilities).join(),
			command || guessCommand());
	}
}

function checkCommandType (value, type, message, command) {
	if (typeof value !== type) {
		commandRaise(
			'invalid parameter type' + encolon(message) +
			'. expected ' + type + ', got ' + (typeof value),
			command || guessCommand());
	}
}

function checkOptional (block) {
	block();
}

function checkFramebufferFormat (attachment, texFormats, rbFormats) {
	if (attachment.texture) {
		checkOneOf(
			attachment.texture._texture.internalformat,
			texFormats,
			'unsupported texture format for attachment');
	} else {
		checkOneOf(
			attachment.renderbuffer._renderbuffer.format,
			rbFormats,
			'unsupported renderbuffer format for attachment');
	}
}

var GL_CLAMP_TO_EDGE = 0x812F;

var GL_NEAREST = 0x2600;
var GL_NEAREST_MIPMAP_NEAREST = 0x2700;
var GL_LINEAR_MIPMAP_NEAREST = 0x2701;
var GL_NEAREST_MIPMAP_LINEAR = 0x2702;
var GL_LINEAR_MIPMAP_LINEAR = 0x2703;

var GL_BYTE = 5120;
var GL_UNSIGNED_BYTE = 5121;
var GL_SHORT = 5122;
var GL_UNSIGNED_SHORT = 5123;
var GL_INT = 5124;
var GL_UNSIGNED_INT = 5125;
var GL_FLOAT = 5126;

var GL_UNSIGNED_SHORT_4_4_4_4 = 0x8033;
var GL_UNSIGNED_SHORT_5_5_5_1 = 0x8034;
var GL_UNSIGNED_SHORT_5_6_5 = 0x8363;
var GL_UNSIGNED_INT_24_8_WEBGL = 0x84FA;

var GL_HALF_FLOAT_OES = 0x8D61;

var TYPE_SIZE = {};

TYPE_SIZE[GL_BYTE] =
TYPE_SIZE[GL_UNSIGNED_BYTE] = 1;

TYPE_SIZE[GL_SHORT] =
TYPE_SIZE[GL_UNSIGNED_SHORT] =
TYPE_SIZE[GL_HALF_FLOAT_OES] =
TYPE_SIZE[GL_UNSIGNED_SHORT_5_6_5] =
TYPE_SIZE[GL_UNSIGNED_SHORT_4_4_4_4] =
TYPE_SIZE[GL_UNSIGNED_SHORT_5_5_5_1] = 2;

TYPE_SIZE[GL_INT] =
TYPE_SIZE[GL_UNSIGNED_INT] =
TYPE_SIZE[GL_FLOAT] =
TYPE_SIZE[GL_UNSIGNED_INT_24_8_WEBGL] = 4;

function pixelSize (type, channels) {
	if (type === GL_UNSIGNED_SHORT_5_5_5_1 ||
			type === GL_UNSIGNED_SHORT_4_4_4_4 ||
			type === GL_UNSIGNED_SHORT_5_6_5) {
		return 2
	} else if (type === GL_UNSIGNED_INT_24_8_WEBGL) {
		return 4
	} else {
		return TYPE_SIZE[type] * channels
	}
}

function isPow2 (v) {
	return !(v & (v - 1)) && (!!v)
}

function checkTexture2D (info, mipData, limits) {
	var i;
	var w = mipData.width;
	var h = mipData.height;
	var c = mipData.channels;

	// Check texture shape
	check(w > 0 && w <= limits.maxTextureSize &&
				h > 0 && h <= limits.maxTextureSize,
				'invalid texture shape');

	// check wrap mode
	if (info.wrapS !== GL_CLAMP_TO_EDGE || info.wrapT !== GL_CLAMP_TO_EDGE) {
		check(isPow2(w) && isPow2(h),
			'incompatible wrap mode for texture, both width and height must be power of 2');
	}

	if (mipData.mipmask === 1) {
		if (w !== 1 && h !== 1) {
			check(
				info.minFilter !== GL_NEAREST_MIPMAP_NEAREST &&
				info.minFilter !== GL_NEAREST_MIPMAP_LINEAR &&
				info.minFilter !== GL_LINEAR_MIPMAP_NEAREST &&
				info.minFilter !== GL_LINEAR_MIPMAP_LINEAR,
				'min filter requires mipmap');
		}
	} else {
		// texture must be power of 2
		check(isPow2(w) && isPow2(h),
			'texture must be a square power of 2 to support mipmapping');
		check(mipData.mipmask === (w << 1) - 1,
			'missing or incomplete mipmap data');
	}

	if (mipData.type === GL_FLOAT) {
		if (limits.extensions.indexOf('oes_texture_float_linear') < 0) {
			check(info.minFilter === GL_NEAREST && info.magFilter === GL_NEAREST,
				'filter not supported, must enable oes_texture_float_linear');
		}
		check(!info.genMipmaps,
			'mipmap generation not supported with float textures');
	}

	// check image complete
	var mipimages = mipData.images;
	for (i = 0; i < 16; ++i) {
		if (mipimages[i]) {
			var mw = w >> i;
			var mh = h >> i;
			check(mipData.mipmask & (1 << i), 'missing mipmap data');

			var img = mipimages[i];

			check(
				img.width === mw &&
				img.height === mh,
				'invalid shape for mip images');

			check(
				img.format === mipData.format &&
				img.internalformat === mipData.internalformat &&
				img.type === mipData.type,
				'incompatible type for mip image');

			if (img.compressed) {
				// TODO: check size for compressed images
			} else if (img.data) {
				// check(img.data.byteLength === mw * mh *
				// Math.max(pixelSize(img.type, c), img.unpackAlignment),
				var rowSize = Math.ceil(pixelSize(img.type, c) * mw / img.unpackAlignment) * img.unpackAlignment;
				check(img.data.byteLength === rowSize * mh,
					'invalid data for image, buffer size is inconsistent with image format');
			} else if (img.element) {
				// TODO: check element can be loaded
			} else if (img.copy) {
				// TODO: check compatible format and type
			}
		} else if (!info.genMipmaps) {
			check((mipData.mipmask & (1 << i)) === 0, 'extra mipmap data');
		}
	}

	if (mipData.compressed) {
		check(!info.genMipmaps,
			'mipmap generation for compressed images not supported');
	}
}

function checkTextureCube (texture, info, faces, limits) {
	var w = texture.width;
	var h = texture.height;
	var c = texture.channels;

	// Check texture shape
	check(
		w > 0 && w <= limits.maxTextureSize && h > 0 && h <= limits.maxTextureSize,
		'invalid texture shape');
	check(
		w === h,
		'cube map must be square');
	check(
		info.wrapS === GL_CLAMP_TO_EDGE && info.wrapT === GL_CLAMP_TO_EDGE,
		'wrap mode not supported by cube map');

	for (var i = 0; i < faces.length; ++i) {
		var face = faces[i];
		check(
			face.width === w && face.height === h,
			'inconsistent cube map face shape');

		if (info.genMipmaps) {
			check(!face.compressed,
				'can not generate mipmap for compressed textures');
			check(face.mipmask === 1,
				'can not specify mipmaps and generate mipmaps');
		} else {
			// TODO: check mip and filter mode
		}

		var mipmaps = face.images;
		for (var j = 0; j < 16; ++j) {
			var img = mipmaps[j];
			if (img) {
				var mw = w >> j;
				var mh = h >> j;
				check(face.mipmask & (1 << j), 'missing mipmap data');
				check(
					img.width === mw &&
					img.height === mh,
					'invalid shape for mip images');
				check(
					img.format === texture.format &&
					img.internalformat === texture.internalformat &&
					img.type === texture.type,
					'incompatible type for mip image');

				if (img.compressed) {
					// TODO: check size for compressed images
				} else if (img.data) {
					check(img.data.byteLength === mw * mh *
						Math.max(pixelSize(img.type, c), img.unpackAlignment),
						'invalid data for image, buffer size is inconsistent with image format');
				} else if (img.element) {
					// TODO: check element can be loaded
				} else if (img.copy) {
					// TODO: check compatible format and type
				}
			}
		}
	}
}

var check$1 = extend(check, {
	optional: checkOptional,
	raise: raise,
	commandRaise: commandRaise,
	command: checkCommand,
	parameter: checkParameter,
	commandParameter: checkParameterCommand,
	constructor: checkConstructor,
	type: checkTypeOf,
	commandType: checkCommandType,
	isTypedArray: checkIsTypedArray,
	nni: checkNonNegativeInt,
	oneOf: checkOneOf,
	shaderError: checkShaderError,
	linkError: checkLinkError,
	callSite: guessCallSite,
	saveCommandRef: saveCommandRef,
	saveDrawInfo: saveDrawCommandInfo,
	framebufferFormat: checkFramebufferFormat,
	guessCommand: guessCommand,
	texture2D: checkTexture2D,
	textureCube: checkTextureCube
});

var VARIABLE_COUNTER = 0;

var DYN_FUNC = 0;

function DynamicVariable (type, data) {
	this.id = (VARIABLE_COUNTER++);
	this.type = type;
	this.data = data;
}

function escapeStr (str) {
	return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function splitParts (str) {
	if (str.length === 0) {
		return []
	}

	var firstChar = str.charAt(0);
	var lastChar = str.charAt(str.length - 1);

	if (str.length > 1 &&
			firstChar === lastChar &&
			(firstChar === '"' || firstChar === "'")) {
		return ['"' + escapeStr(str.substr(1, str.length - 2)) + '"']
	}

	var parts = /\[(false|true|null|\d+|'[^']*'|"[^"]*")\]/.exec(str);
	if (parts) {
		return (
			splitParts(str.substr(0, parts.index))
			.concat(splitParts(parts[1]))
			.concat(splitParts(str.substr(parts.index + parts[0].length)))
		)
	}

	var subparts = str.split('.');
	if (subparts.length === 1) {
		return ['"' + escapeStr(str) + '"']
	}

	var result = [];
	for (var i = 0; i < subparts.length; ++i) {
		result = result.concat(splitParts(subparts[i]));
	}
	return result
}

function toAccessorString (str) {
	return '[' + splitParts(str).join('][') + ']'
}

function defineDynamic (type, data) {
	return new DynamicVariable(type, toAccessorString(data + ''))
}

function isDynamic (x) {
	return (typeof x === 'function' && !x._reglType) ||
				 x instanceof DynamicVariable
}

function unbox (x, path) {
	if (typeof x === 'function') {
		return new DynamicVariable(DYN_FUNC, x)
	}
	return x
}

var dynamic = {
	DynamicVariable: DynamicVariable,
	define: defineDynamic,
	isDynamic: isDynamic,
	unbox: unbox,
	accessor: toAccessorString
};

/* globals requestAnimationFrame, cancelAnimationFrame */
var raf = {
	next: typeof requestAnimationFrame === 'function'
		? function (cb) { return requestAnimationFrame(cb) }
		: function (cb) { return setTimeout(cb, 16) },
	cancel: typeof cancelAnimationFrame === 'function'
		? function (raf) { return cancelAnimationFrame(raf) }
		: clearTimeout
};

/* globals performance */
var clock = (typeof performance !== 'undefined' && performance.now)
	? function () { return performance.now() }
	: function () { return +(new Date()) };

function createStringStore () {
	var stringIds = {'': 0};
	var stringValues = [''];
	return {
		id: function (str) {
			var result = stringIds[str];
			if (result) {
				return result
			}
			result = stringIds[str] = stringValues.length;
			stringValues.push(str);
			return result
		},

		str: function (id) {
			return stringValues[id]
		}
	}
}

// Context and canvas creation helper functions
function createCanvas (element, onDone, pixelRatio) {
	var canvas = document.createElement('canvas');
	extend(canvas.style, {
		border: 0,
		margin: 0,
		padding: 0,
		top: 0,
		left: 0
	});
	element.appendChild(canvas);

	if (element === document.body) {
		canvas.style.position = 'absolute';
		extend(element.style, {
			margin: 0,
			padding: 0
		});
	}

	function resize () {
		var w = window.innerWidth;
		var h = window.innerHeight;
		if (element !== document.body) {
			var bounds = element.getBoundingClientRect();
			w = bounds.right - bounds.left;
			h = bounds.bottom - bounds.top;
		}
		canvas.width = pixelRatio * w;
		canvas.height = pixelRatio * h;
		extend(canvas.style, {
			width: w + 'px',
			height: h + 'px'
		});
	}

	window.addEventListener('resize', resize, false);

	function onDestroy () {
		window.removeEventListener('resize', resize);
		element.removeChild(canvas);
	}

	resize();

	return {
		canvas: canvas,
		onDestroy: onDestroy
	}
}

function createContext (canvas, contextAttributes) {
	function get (name) {
		try {
			return canvas.getContext(name, contextAttributes)
		} catch (e) {
			return null
		}
	}
	return (
		get('webgl') ||
		get('experimental-webgl') ||
		get('webgl-experimental')
	)
}

function isHTMLElement (obj) {
	return (
		typeof obj.nodeName === 'string' &&
		typeof obj.appendChild === 'function' &&
		typeof obj.getBoundingClientRect === 'function'
	)
}

function isWebGLContext (obj) {
	return (
		typeof obj.drawArrays === 'function' ||
		typeof obj.drawElements === 'function'
	)
}

function parseExtensions (input) {
	if (typeof input === 'string') {
		return input.split()
	}
	check$1(Array.isArray(input), 'invalid extension array');
	return input
}

function getElement (desc) {
	if (typeof desc === 'string') {
		check$1(typeof document !== 'undefined', 'not supported outside of DOM');
		return document.querySelector(desc)
	}
	return desc
}

function parseArgs (args_) {
	var args = args_ || {};
	var element, container, canvas, gl;
	var contextAttributes = {};
	var extensions = [];
	var optionalExtensions = [];
	var pixelRatio = (typeof window === 'undefined' ? 1 : window.devicePixelRatio);
	var profile = false;
	var onDone = function (err) {
		if (err) {
			check$1.raise(err);
		}
	};
	var onDestroy = function () {};
	if (typeof args === 'string') {
		check$1(
			typeof document !== 'undefined',
			'selector queries only supported in DOM enviroments');
		element = document.querySelector(args);
		check$1(element, 'invalid query string for element');
	} else if (typeof args === 'object') {
		if (isHTMLElement(args)) {
			element = args;
		} else if (isWebGLContext(args)) {
			gl = args;
			canvas = gl.canvas;
		} else {
			check$1.constructor(args);
			if ('gl' in args) {
				gl = args.gl;
			} else if ('canvas' in args) {
				canvas = getElement(args.canvas);
			} else if ('container' in args) {
				container = getElement(args.container);
			}
			if ('attributes' in args) {
				contextAttributes = args.attributes;
				check$1.type(contextAttributes, 'object', 'invalid context attributes');
			}
			if ('extensions' in args) {
				extensions = parseExtensions(args.extensions);
			}
			if ('optionalExtensions' in args) {
				optionalExtensions = parseExtensions(args.optionalExtensions);
			}
			if ('onDone' in args) {
				check$1.type(
					args.onDone, 'function',
					'invalid or missing onDone callback');
				onDone = args.onDone;
			}
			if ('profile' in args) {
				profile = !!args.profile;
			}
			if ('pixelRatio' in args) {
				pixelRatio = +args.pixelRatio;
				check$1(pixelRatio > 0, 'invalid pixel ratio');
			}
		}
	} else {
		check$1.raise('invalid arguments to regl');
	}

	if (element) {
		if (element.nodeName.toLowerCase() === 'canvas') {
			canvas = element;
		} else {
			container = element;
		}
	}

	if (!gl) {
		if (!canvas) {
			check$1(
				typeof document !== 'undefined',
				'must manually specify webgl context outside of DOM environments');
			var result = createCanvas(container || document.body, onDone, pixelRatio);
			if (!result) {
				return null
			}
			canvas = result.canvas;
			onDestroy = result.onDestroy;
		}
		gl = createContext(canvas, contextAttributes);
	}

	if (!gl) {
		onDestroy();
		onDone('webgl not supported, try upgrading your browser or graphics drivers http://get.webgl.org');
		return null
	}

	return {
		gl: gl,
		canvas: canvas,
		container: container,
		extensions: extensions,
		optionalExtensions: optionalExtensions,
		pixelRatio: pixelRatio,
		profile: profile,
		onDone: onDone,
		onDestroy: onDestroy
	}
}

function createExtensionCache (gl, config) {
	var extensions = {};

	function tryLoadExtension (name_) {
		check$1.type(name_, 'string', 'extension name must be string');
		var name = name_.toLowerCase();
		var ext;
		try {
			ext = extensions[name] = gl.getExtension(name);
		} catch (e) {}
		return !!ext
	}

	for (var i = 0; i < config.extensions.length; ++i) {
		var name = config.extensions[i];
		if (!tryLoadExtension(name)) {
			config.onDestroy();
			config.onDone('"' + name + '" extension is not supported by the current WebGL context, try upgrading your system or a different browser');
			return null
		}
	}

	config.optionalExtensions.forEach(tryLoadExtension);

	return {
		extensions: extensions,
		restore: function () {
			Object.keys(extensions).forEach(function (name) {
				if (extensions[name] && !tryLoadExtension(name)) {
					throw new Error('(regl): error restoring extension ' + name)
				}
			});
		}
	}
}

function loop (n, f) {
	var result = Array(n);
	for (var i = 0; i < n; ++i) {
		result[i] = f(i);
	}
	return result
}

var GL_BYTE$1 = 5120;
var GL_UNSIGNED_BYTE$2 = 5121;
var GL_SHORT$1 = 5122;
var GL_UNSIGNED_SHORT$1 = 5123;
var GL_INT$1 = 5124;
var GL_UNSIGNED_INT$1 = 5125;
var GL_FLOAT$2 = 5126;

function nextPow16 (v) {
	for (var i = 16; i <= (1 << 28); i *= 16) {
		if (v <= i) {
			return i
		}
	}
	return 0
}

function log2 (v) {
	var r, shift;
	r = (v > 0xFFFF) << 4;
	v >>>= r;
	shift = (v > 0xFF) << 3;
	v >>>= shift; r |= shift;
	shift = (v > 0xF) << 2;
	v >>>= shift; r |= shift;
	shift = (v > 0x3) << 1;
	v >>>= shift; r |= shift;
	return r | (v >> 1)
}

function createPool () {
	var bufferPool = loop(8, function () {
		return []
	});

	function alloc (n) {
		var sz = nextPow16(n);
		var bin = bufferPool[log2(sz) >> 2];
		if (bin.length > 0) {
			return bin.pop()
		}
		return new ArrayBuffer(sz)
	}

	function free (buf) {
		bufferPool[log2(buf.byteLength) >> 2].push(buf);
	}

	function allocType (type, n) {
		var result = null;
		switch (type) {
			case GL_BYTE$1:
				result = new Int8Array(alloc(n), 0, n);
				break
			case GL_UNSIGNED_BYTE$2:
				result = new Uint8Array(alloc(n), 0, n);
				break
			case GL_SHORT$1:
				result = new Int16Array(alloc(2 * n), 0, n);
				break
			case GL_UNSIGNED_SHORT$1:
				result = new Uint16Array(alloc(2 * n), 0, n);
				break
			case GL_INT$1:
				result = new Int32Array(alloc(4 * n), 0, n);
				break
			case GL_UNSIGNED_INT$1:
				result = new Uint32Array(alloc(4 * n), 0, n);
				break
			case GL_FLOAT$2:
				result = new Float32Array(alloc(4 * n), 0, n);
				break
			default:
				return null
		}
		if (result.length !== n) {
			return result.subarray(0, n)
		}
		return result
	}

	function freeType (array) {
		free(array.buffer);
	}

	return {
		alloc: alloc,
		free: free,
		allocType: allocType,
		freeType: freeType
	}
}

var pool = createPool();

// zero pool for initial zero data
pool.zero = createPool();

var GL_SUBPIXEL_BITS = 0x0D50;
var GL_RED_BITS = 0x0D52;
var GL_GREEN_BITS = 0x0D53;
var GL_BLUE_BITS = 0x0D54;
var GL_ALPHA_BITS = 0x0D55;
var GL_DEPTH_BITS = 0x0D56;
var GL_STENCIL_BITS = 0x0D57;

var GL_ALIASED_POINT_SIZE_RANGE = 0x846D;
var GL_ALIASED_LINE_WIDTH_RANGE = 0x846E;

var GL_MAX_TEXTURE_SIZE = 0x0D33;
var GL_MAX_VIEWPORT_DIMS = 0x0D3A;
var GL_MAX_VERTEX_ATTRIBS = 0x8869;
var GL_MAX_VERTEX_UNIFORM_VECTORS = 0x8DFB;
var GL_MAX_VARYING_VECTORS = 0x8DFC;
var GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS = 0x8B4D;
var GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS = 0x8B4C;
var GL_MAX_TEXTURE_IMAGE_UNITS = 0x8872;
var GL_MAX_FRAGMENT_UNIFORM_VECTORS = 0x8DFD;
var GL_MAX_CUBE_MAP_TEXTURE_SIZE = 0x851C;
var GL_MAX_RENDERBUFFER_SIZE = 0x84E8;

var GL_VENDOR = 0x1F00;
var GL_RENDERER = 0x1F01;
var GL_VERSION = 0x1F02;
var GL_SHADING_LANGUAGE_VERSION = 0x8B8C;

var GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT = 0x84FF;

var GL_MAX_COLOR_ATTACHMENTS_WEBGL = 0x8CDF;
var GL_MAX_DRAW_BUFFERS_WEBGL = 0x8824;

var GL_TEXTURE_2D = 0x0DE1;
var GL_TEXTURE_CUBE_MAP = 0x8513;
var GL_TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;
var GL_TEXTURE0 = 0x84C0;
var GL_RGBA = 0x1908;
var GL_FLOAT$1 = 0x1406;
var GL_UNSIGNED_BYTE$1 = 0x1401;
var GL_FRAMEBUFFER = 0x8D40;
var GL_FRAMEBUFFER_COMPLETE = 0x8CD5;
var GL_COLOR_ATTACHMENT0 = 0x8CE0;
var GL_COLOR_BUFFER_BIT$1 = 0x4000;

var wrapLimits = function (gl, extensions) {
	var maxAnisotropic = 1;
	if (extensions.ext_texture_filter_anisotropic) {
		maxAnisotropic = gl.getParameter(GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT);
	}

	var maxDrawbuffers = 1;
	var maxColorAttachments = 1;
	if (extensions.webgl_draw_buffers) {
		maxDrawbuffers = gl.getParameter(GL_MAX_DRAW_BUFFERS_WEBGL);
		maxColorAttachments = gl.getParameter(GL_MAX_COLOR_ATTACHMENTS_WEBGL);
	}

	// detect if reading float textures is available (Safari doesn't support)
	var readFloat = !!extensions.oes_texture_float;
	if (readFloat) {
		var readFloatTexture = gl.createTexture();
		gl.bindTexture(GL_TEXTURE_2D, readFloatTexture);
		gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 1, 1, 0, GL_RGBA, GL_FLOAT$1, null);

		var fbo = gl.createFramebuffer();
		gl.bindFramebuffer(GL_FRAMEBUFFER, fbo);
		gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, readFloatTexture, 0);
		gl.bindTexture(GL_TEXTURE_2D, null);

		if (gl.checkFramebufferStatus(GL_FRAMEBUFFER) !== GL_FRAMEBUFFER_COMPLETE) readFloat = false;

		else {
			gl.viewport(0, 0, 1, 1);
			gl.clearColor(1.0, 0.0, 0.0, 1.0);
			gl.clear(GL_COLOR_BUFFER_BIT$1);
			var pixels = pool.allocType(GL_FLOAT$1, 4);
			gl.readPixels(0, 0, 1, 1, GL_RGBA, GL_FLOAT$1, pixels);

			if (gl.getError()) readFloat = false;
			else {
				gl.deleteFramebuffer(fbo);
				gl.deleteTexture(readFloatTexture);

				readFloat = pixels[0] === 1.0;
			}

			pool.freeType(pixels);
		}
	}

	// detect non power of two cube textures support (IE doesn't support)
	var isIE = typeof navigator !== 'undefined' && (/MSIE/.test(navigator.userAgent) || /Trident\//.test(navigator.appVersion) || /Edge/.test(navigator.userAgent));

	var npotTextureCube = true;

	if (!isIE) {
		var cubeTexture = gl.createTexture();
		var data = pool.allocType(GL_UNSIGNED_BYTE$1, 36);
		gl.activeTexture(GL_TEXTURE0);
		gl.bindTexture(GL_TEXTURE_CUBE_MAP, cubeTexture);
		gl.texImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X, 0, GL_RGBA, 3, 3, 0, GL_RGBA, GL_UNSIGNED_BYTE$1, data);
		pool.freeType(data);
		gl.bindTexture(GL_TEXTURE_CUBE_MAP, null);
		gl.deleteTexture(cubeTexture);
		npotTextureCube = !gl.getError();
	}

	return {
		// drawing buffer bit depth
		colorBits: [
			gl.getParameter(GL_RED_BITS),
			gl.getParameter(GL_GREEN_BITS),
			gl.getParameter(GL_BLUE_BITS),
			gl.getParameter(GL_ALPHA_BITS)
		],
		depthBits: gl.getParameter(GL_DEPTH_BITS),
		stencilBits: gl.getParameter(GL_STENCIL_BITS),
		subpixelBits: gl.getParameter(GL_SUBPIXEL_BITS),

		// supported extensions
		extensions: Object.keys(extensions).filter(function (ext) {
			return !!extensions[ext]
		}),

		// max aniso samples
		maxAnisotropic: maxAnisotropic,

		// max draw buffers
		maxDrawbuffers: maxDrawbuffers,
		maxColorAttachments: maxColorAttachments,

		// point and line size ranges
		pointSizeDims: gl.getParameter(GL_ALIASED_POINT_SIZE_RANGE),
		lineWidthDims: gl.getParameter(GL_ALIASED_LINE_WIDTH_RANGE),
		maxViewportDims: gl.getParameter(GL_MAX_VIEWPORT_DIMS),
		maxCombinedTextureUnits: gl.getParameter(GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS),
		maxCubeMapSize: gl.getParameter(GL_MAX_CUBE_MAP_TEXTURE_SIZE),
		maxRenderbufferSize: gl.getParameter(GL_MAX_RENDERBUFFER_SIZE),
		maxTextureUnits: gl.getParameter(GL_MAX_TEXTURE_IMAGE_UNITS),
		maxTextureSize: gl.getParameter(GL_MAX_TEXTURE_SIZE),
		maxAttributes: gl.getParameter(GL_MAX_VERTEX_ATTRIBS),
		maxVertexUniforms: gl.getParameter(GL_MAX_VERTEX_UNIFORM_VECTORS),
		maxVertexTextureUnits: gl.getParameter(GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS),
		maxVaryingVectors: gl.getParameter(GL_MAX_VARYING_VECTORS),
		maxFragmentUniforms: gl.getParameter(GL_MAX_FRAGMENT_UNIFORM_VECTORS),

		// vendor info
		glsl: gl.getParameter(GL_SHADING_LANGUAGE_VERSION),
		renderer: gl.getParameter(GL_RENDERER),
		vendor: gl.getParameter(GL_VENDOR),
		version: gl.getParameter(GL_VERSION),

		// quirks
		readFloat: readFloat,
		npotTextureCube: npotTextureCube
	}
};

function isNDArrayLike (obj) {
	return (
		!!obj &&
		typeof obj === 'object' &&
		Array.isArray(obj.shape) &&
		Array.isArray(obj.stride) &&
		typeof obj.offset === 'number' &&
		obj.shape.length === obj.stride.length &&
		(Array.isArray(obj.data) ||
			isTypedArray(obj.data)))
}

var values = function (obj) {
	return Object.keys(obj).map(function (key) { return obj[key] })
};

var flattenUtils = {
	shape: arrayShape$1,
	flatten: flattenArray
};

function flatten1D (array, nx, out) {
	for (var i = 0; i < nx; ++i) {
		out[i] = array[i];
	}
}

function flatten2D (array, nx, ny, out) {
	var ptr = 0;
	for (var i = 0; i < nx; ++i) {
		var row = array[i];
		for (var j = 0; j < ny; ++j) {
			out[ptr++] = row[j];
		}
	}
}

function flatten3D (array, nx, ny, nz, out, ptr_) {
	var ptr = ptr_;
	for (var i = 0; i < nx; ++i) {
		var row = array[i];
		for (var j = 0; j < ny; ++j) {
			var col = row[j];
			for (var k = 0; k < nz; ++k) {
				out[ptr++] = col[k];
			}
		}
	}
}

function flattenRec (array, shape, level, out, ptr) {
	var stride = 1;
	for (var i = level + 1; i < shape.length; ++i) {
		stride *= shape[i];
	}
	var n = shape[level];
	if (shape.length - level === 4) {
		var nx = shape[level + 1];
		var ny = shape[level + 2];
		var nz = shape[level + 3];
		for (i = 0; i < n; ++i) {
			flatten3D(array[i], nx, ny, nz, out, ptr);
			ptr += stride;
		}
	} else {
		for (i = 0; i < n; ++i) {
			flattenRec(array[i], shape, level + 1, out, ptr);
			ptr += stride;
		}
	}
}

function flattenArray (array, shape, type, out_) {
	var sz = 1;
	if (shape.length) {
		for (var i = 0; i < shape.length; ++i) {
			sz *= shape[i];
		}
	} else {
		sz = 0;
	}
	var out = out_ || pool.allocType(type, sz);
	switch (shape.length) {
		case 0:
			break
		case 1:
			flatten1D(array, shape[0], out);
			break
		case 2:
			flatten2D(array, shape[0], shape[1], out);
			break
		case 3:
			flatten3D(array, shape[0], shape[1], shape[2], out, 0);
			break
		default:
			flattenRec(array, shape, 0, out, 0);
	}
	return out
}

function arrayShape$1 (array_) {
	var shape = [];
	for (var array = array_; array.length; array = array[0]) {
		shape.push(array.length);
	}
	return shape
}

var arrayTypes = {
	"[object Int8Array]": 5120,
	"[object Int16Array]": 5122,
	"[object Int32Array]": 5124,
	"[object Uint8Array]": 5121,
	"[object Uint8ClampedArray]": 5121,
	"[object Uint16Array]": 5123,
	"[object Uint32Array]": 5125,
	"[object Float32Array]": 5126,
	"[object Float64Array]": 5121,
	"[object ArrayBuffer]": 5121
};

var int8 = 5120;
var int16 = 5122;
var int32 = 5124;
var uint8 = 5121;
var uint16 = 5123;
var uint32 = 5125;
var float = 5126;
var float32 = 5126;
var glTypes = {
	int8: int8,
	int16: int16,
	int32: int32,
	uint8: uint8,
	uint16: uint16,
	uint32: uint32,
	float: float,
	float32: float32
};

var dynamic$1 = 35048;
var stream = 35040;
var usageTypes = {
	dynamic: dynamic$1,
	stream: stream,
	"static": 35044
};

var arrayFlatten = flattenUtils.flatten;
var arrayShape = flattenUtils.shape;

var GL_STATIC_DRAW = 0x88E4;
var GL_STREAM_DRAW = 0x88E0;

var GL_UNSIGNED_BYTE$3 = 5121;
var GL_FLOAT$3 = 5126;

var DTYPES_SIZES = [];
DTYPES_SIZES[5120] = 1; // int8
DTYPES_SIZES[5122] = 2; // int16
DTYPES_SIZES[5124] = 4; // int32
DTYPES_SIZES[5121] = 1; // uint8
DTYPES_SIZES[5123] = 2; // uint16
DTYPES_SIZES[5125] = 4; // uint32
DTYPES_SIZES[5126] = 4; // float32

function typedArrayCode (data) {
	return arrayTypes[Object.prototype.toString.call(data)] | 0
}

function copyArray (out, inp) {
	for (var i = 0; i < inp.length; ++i) {
		out[i] = inp[i];
	}
}

function transpose (
	result, data, shapeX, shapeY, strideX, strideY, offset) {
	var ptr = 0;
	for (var i = 0; i < shapeX; ++i) {
		for (var j = 0; j < shapeY; ++j) {
			result[ptr++] = data[strideX * i + strideY * j + offset];
		}
	}
}

function wrapBufferState (gl, stats, config, attributeState) {
	var bufferCount = 0;
	var bufferSet = {};

	function REGLBuffer (type) {
		this.id = bufferCount++;
		this.buffer = gl.createBuffer();
		this.type = type;
		this.usage = GL_STATIC_DRAW;
		this.byteLength = 0;
		this.dimension = 1;
		this.dtype = GL_UNSIGNED_BYTE$3;

		this.persistentData = null;

		if (config.profile) {
			this.stats = {size: 0};
		}
	}

	REGLBuffer.prototype.bind = function () {
		gl.bindBuffer(this.type, this.buffer);
	};

	REGLBuffer.prototype.destroy = function () {
		destroy(this);
	};

	var streamPool = [];

	function createStream (type, data) {
		var buffer = streamPool.pop();
		if (!buffer) {
			buffer = new REGLBuffer(type);
		}
		buffer.bind();
		initBufferFromData(buffer, data, GL_STREAM_DRAW, 0, 1, false);
		return buffer
	}

	function destroyStream (stream$$1) {
		streamPool.push(stream$$1);
	}

	function initBufferFromTypedArray (buffer, data, usage) {
		buffer.byteLength = data.byteLength;
		gl.bufferData(buffer.type, data, usage);
	}

	function initBufferFromData (buffer, data, usage, dtype, dimension, persist) {
		var shape;
		buffer.usage = usage;
		if (Array.isArray(data)) {
			buffer.dtype = dtype || GL_FLOAT$3;
			if (data.length > 0) {
				var flatData;
				if (Array.isArray(data[0])) {
					shape = arrayShape(data);
					var dim = 1;
					for (var i = 1; i < shape.length; ++i) {
						dim *= shape[i];
					}
					buffer.dimension = dim;
					flatData = arrayFlatten(data, shape, buffer.dtype);
					initBufferFromTypedArray(buffer, flatData, usage);
					if (persist) {
						buffer.persistentData = flatData;
					} else {
						pool.freeType(flatData);
					}
				} else if (typeof data[0] === 'number') {
					buffer.dimension = dimension;
					var typedData = pool.allocType(buffer.dtype, data.length);
					copyArray(typedData, data);
					initBufferFromTypedArray(buffer, typedData, usage);
					if (persist) {
						buffer.persistentData = typedData;
					} else {
						pool.freeType(typedData);
					}
				} else if (isTypedArray(data[0])) {
					buffer.dimension = data[0].length;
					buffer.dtype = dtype || typedArrayCode(data[0]) || GL_FLOAT$3;
					flatData = arrayFlatten(
						data,
						[data.length, data[0].length],
						buffer.dtype);
					initBufferFromTypedArray(buffer, flatData, usage);
					if (persist) {
						buffer.persistentData = flatData;
					} else {
						pool.freeType(flatData);
					}
				} else {
					check$1.raise('invalid buffer data');
				}
			}
		} else if (isTypedArray(data)) {
			buffer.dtype = dtype || typedArrayCode(data);
			buffer.dimension = dimension;
			initBufferFromTypedArray(buffer, data, usage);
			if (persist) {
				buffer.persistentData = new Uint8Array(new Uint8Array(data.buffer));
			}
		} else if (isNDArrayLike(data)) {
			shape = data.shape;
			var stride = data.stride;
			var offset = data.offset;

			var shapeX = 0;
			var shapeY = 0;
			var strideX = 0;
			var strideY = 0;
			if (shape.length === 1) {
				shapeX = shape[0];
				shapeY = 1;
				strideX = stride[0];
				strideY = 0;
			} else if (shape.length === 2) {
				shapeX = shape[0];
				shapeY = shape[1];
				strideX = stride[0];
				strideY = stride[1];
			} else {
				check$1.raise('invalid shape');
			}

			buffer.dtype = dtype || typedArrayCode(data.data) || GL_FLOAT$3;
			buffer.dimension = shapeY;

			var transposeData = pool.allocType(buffer.dtype, shapeX * shapeY);
			transpose(transposeData,
				data.data,
				shapeX, shapeY,
				strideX, strideY,
				offset);
			initBufferFromTypedArray(buffer, transposeData, usage);
			if (persist) {
				buffer.persistentData = transposeData;
			} else {
				pool.freeType(transposeData);
			}
		} else if (data instanceof ArrayBuffer) {
			buffer.dtype = GL_UNSIGNED_BYTE$3;
			buffer.dimension = dimension;
			initBufferFromTypedArray(buffer, data, usage);
			if (persist) {
				buffer.persistentData = new Uint8Array(new Uint8Array(data));
			}
		} else {
			check$1.raise('invalid buffer data');
		}
	}

	function destroy (buffer) {
		stats.bufferCount--;

		for (var i = 0; i < attributeState.state.length; ++i) {
			var record = attributeState.state[i];
			if (record.buffer === buffer) {
				gl.disableVertexAttribArray(i);
				record.buffer = null;
			}
		}

		var handle = buffer.buffer;
		check$1(handle, 'buffer must not be deleted already');
		gl.deleteBuffer(handle);
		buffer.buffer = null;
		delete bufferSet[buffer.id];
	}

	function createBuffer (options, type, deferInit, persistent) {
		stats.bufferCount++;

		var buffer = new REGLBuffer(type);
		bufferSet[buffer.id] = buffer;

		function reglBuffer (options) {
			var usage = GL_STATIC_DRAW;
			var data = null;
			var byteLength = 0;
			var dtype = 0;
			var dimension = 1;
			if (Array.isArray(options) ||
					isTypedArray(options) ||
					isNDArrayLike(options) ||
					options instanceof ArrayBuffer) {
				data = options;
			} else if (typeof options === 'number') {
				byteLength = options | 0;
			} else if (options) {
				check$1.type(
					options, 'object',
					'buffer arguments must be an object, a number or an array');

				if ('data' in options) {
					check$1(
						data === null ||
						Array.isArray(data) ||
						isTypedArray(data) ||
						isNDArrayLike(data),
						'invalid data for buffer');
					data = options.data;
				}

				if ('usage' in options) {
					check$1.parameter(options.usage, usageTypes, 'invalid buffer usage');
					usage = usageTypes[options.usage];
				}

				if ('type' in options) {
					check$1.parameter(options.type, glTypes, 'invalid buffer type');
					dtype = glTypes[options.type];
				}

				if ('dimension' in options) {
					check$1.type(options.dimension, 'number', 'invalid dimension');
					dimension = options.dimension | 0;
				}

				if ('length' in options) {
					check$1.nni(byteLength, 'buffer length must be a nonnegative integer');
					byteLength = options.length | 0;
				}
			}

			buffer.bind();
			if (!data) {
				// #475
				if (byteLength) gl.bufferData(buffer.type, byteLength, usage);
				buffer.dtype = dtype || GL_UNSIGNED_BYTE$3;
				buffer.usage = usage;
				buffer.dimension = dimension;
				buffer.byteLength = byteLength;
			} else {
				initBufferFromData(buffer, data, usage, dtype, dimension, persistent);
			}

			if (config.profile) {
				buffer.stats.size = buffer.byteLength * DTYPES_SIZES[buffer.dtype];
			}

			return reglBuffer
		}

		function setSubData (data, offset) {
			check$1(offset + data.byteLength <= buffer.byteLength,
				'invalid buffer subdata call, buffer is too small. ' + ' Can\'t write data of size ' + data.byteLength + ' starting from offset ' + offset + ' to a buffer of size ' + buffer.byteLength);

			gl.bufferSubData(buffer.type, offset, data);
		}

		function subdata (data, offset_) {
			var offset = (offset_ || 0) | 0;
			var shape;
			buffer.bind();
			if (isTypedArray(data) || data instanceof ArrayBuffer) {
				setSubData(data, offset);
			} else if (Array.isArray(data)) {
				if (data.length > 0) {
					if (typeof data[0] === 'number') {
						var converted = pool.allocType(buffer.dtype, data.length);
						copyArray(converted, data);
						setSubData(converted, offset);
						pool.freeType(converted);
					} else if (Array.isArray(data[0]) || isTypedArray(data[0])) {
						shape = arrayShape(data);
						var flatData = arrayFlatten(data, shape, buffer.dtype);
						setSubData(flatData, offset);
						pool.freeType(flatData);
					} else {
						check$1.raise('invalid buffer data');
					}
				}
			} else if (isNDArrayLike(data)) {
				shape = data.shape;
				var stride = data.stride;

				var shapeX = 0;
				var shapeY = 0;
				var strideX = 0;
				var strideY = 0;
				if (shape.length === 1) {
					shapeX = shape[0];
					shapeY = 1;
					strideX = stride[0];
					strideY = 0;
				} else if (shape.length === 2) {
					shapeX = shape[0];
					shapeY = shape[1];
					strideX = stride[0];
					strideY = stride[1];
				} else {
					check$1.raise('invalid shape');
				}
				var dtype = Array.isArray(data.data)
					? buffer.dtype
					: typedArrayCode(data.data);

				var transposeData = pool.allocType(dtype, shapeX * shapeY);
				transpose(transposeData,
					data.data,
					shapeX, shapeY,
					strideX, strideY,
					data.offset);
				setSubData(transposeData, offset);
				pool.freeType(transposeData);
			} else {
				check$1.raise('invalid data for buffer subdata');
			}
			return reglBuffer
		}

		if (!deferInit) {
			reglBuffer(options);
		}

		reglBuffer._reglType = 'buffer';
		reglBuffer._buffer = buffer;
		reglBuffer.subdata = subdata;
		if (config.profile) {
			reglBuffer.stats = buffer.stats;
		}
		reglBuffer.destroy = function () { destroy(buffer); };

		return reglBuffer
	}

	function restoreBuffers () {
		values(bufferSet).forEach(function (buffer) {
			buffer.buffer = gl.createBuffer();
			gl.bindBuffer(buffer.type, buffer.buffer);
			gl.bufferData(
				buffer.type, buffer.persistentData || buffer.byteLength, buffer.usage);
		});
	}

	if (config.profile) {
		stats.getTotalBufferSize = function () {
			var total = 0;
			// TODO: Right now, the streams are not part of the total count.
			Object.keys(bufferSet).forEach(function (key) {
				total += bufferSet[key].stats.size;
			});
			return total
		};
	}

	return {
		create: createBuffer,

		createStream: createStream,
		destroyStream: destroyStream,

		clear: function () {
			values(bufferSet).forEach(destroy);
			streamPool.forEach(destroy);
		},

		getBuffer: function (wrapper) {
			if (wrapper && wrapper._buffer instanceof REGLBuffer) {
				return wrapper._buffer
			}
			return null
		},

		restore: restoreBuffers,

		_initBuffer: initBufferFromData
	}
}

var points = 0;
var point = 0;
var lines = 1;
var line = 1;
var triangles = 4;
var triangle = 4;
var primTypes = {
	points: points,
	point: point,
	lines: lines,
	line: line,
	triangles: triangles,
	triangle: triangle,
	"line loop": 2,
	"line strip": 3,
	"triangle strip": 5,
	"triangle fan": 6
};

var GL_POINTS = 0;
var GL_LINES = 1;
var GL_TRIANGLES = 4;

var GL_BYTE$2 = 5120;
var GL_UNSIGNED_BYTE$4 = 5121;
var GL_SHORT$2 = 5122;
var GL_UNSIGNED_SHORT$2 = 5123;
var GL_INT$2 = 5124;
var GL_UNSIGNED_INT$2 = 5125;

var GL_ELEMENT_ARRAY_BUFFER = 34963;

var GL_STREAM_DRAW$1 = 0x88E0;
var GL_STATIC_DRAW$1 = 0x88E4;

function wrapElementsState (gl, extensions, bufferState, stats) {
	var elementSet = {};
	var elementCount = 0;

	var elementTypes = {
		'uint8': GL_UNSIGNED_BYTE$4,
		'uint16': GL_UNSIGNED_SHORT$2
	};

	if (extensions.oes_element_index_uint) {
		elementTypes.uint32 = GL_UNSIGNED_INT$2;
	}

	function REGLElementBuffer (buffer) {
		this.id = elementCount++;
		elementSet[this.id] = this;
		this.buffer = buffer;
		this.primType = GL_TRIANGLES;
		this.vertCount = 0;
		this.type = 0;
	}

	REGLElementBuffer.prototype.bind = function () {
		this.buffer.bind();
	};

	var bufferPool = [];

	function createElementStream (data) {
		var result = bufferPool.pop();
		if (!result) {
			result = new REGLElementBuffer(bufferState.create(
				null,
				GL_ELEMENT_ARRAY_BUFFER,
				true,
				false)._buffer);
		}
		initElements(result, data, GL_STREAM_DRAW$1, -1, -1, 0, 0);
		return result
	}

	function destroyElementStream (elements) {
		bufferPool.push(elements);
	}

	function initElements (
		elements,
		data,
		usage,
		prim,
		count,
		byteLength,
		type) {
		elements.buffer.bind();
		if (data) {
			var predictedType = type;
			if (!type && (
					!isTypedArray(data) ||
				 (isNDArrayLike(data) && !isTypedArray(data.data)))) {
				predictedType = extensions.oes_element_index_uint
					? GL_UNSIGNED_INT$2
					: GL_UNSIGNED_SHORT$2;
			}
			bufferState._initBuffer(
				elements.buffer,
				data,
				usage,
				predictedType,
				3);
		} else {
			gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, byteLength, usage);
			elements.buffer.dtype = dtype || GL_UNSIGNED_BYTE$4;
			elements.buffer.usage = usage;
			elements.buffer.dimension = 3;
			elements.buffer.byteLength = byteLength;
		}

		var dtype = type;
		if (!type) {
			switch (elements.buffer.dtype) {
				case GL_UNSIGNED_BYTE$4:
				case GL_BYTE$2:
					dtype = GL_UNSIGNED_BYTE$4;
					break

				case GL_UNSIGNED_SHORT$2:
				case GL_SHORT$2:
					dtype = GL_UNSIGNED_SHORT$2;
					break

				case GL_UNSIGNED_INT$2:
				case GL_INT$2:
					dtype = GL_UNSIGNED_INT$2;
					break

				default:
					check$1.raise('unsupported type for element array');
			}
			elements.buffer.dtype = dtype;
		}
		elements.type = dtype;

		// Check oes_element_index_uint extension
		check$1(
			dtype !== GL_UNSIGNED_INT$2 ||
			!!extensions.oes_element_index_uint,
			'32 bit element buffers not supported, enable oes_element_index_uint first');

		// try to guess default primitive type and arguments
		var vertCount = count;
		if (vertCount < 0) {
			vertCount = elements.buffer.byteLength;
			if (dtype === GL_UNSIGNED_SHORT$2) {
				vertCount >>= 1;
			} else if (dtype === GL_UNSIGNED_INT$2) {
				vertCount >>= 2;
			}
		}
		elements.vertCount = vertCount;

		// try to guess primitive type from cell dimension
		var primType = prim;
		if (prim < 0) {
			primType = GL_TRIANGLES;
			var dimension = elements.buffer.dimension;
			if (dimension === 1) primType = GL_POINTS;
			if (dimension === 2) primType = GL_LINES;
			if (dimension === 3) primType = GL_TRIANGLES;
		}
		elements.primType = primType;
	}

	function destroyElements (elements) {
		stats.elementsCount--;

		check$1(elements.buffer !== null, 'must not double destroy elements');
		delete elementSet[elements.id];
		elements.buffer.destroy();
		elements.buffer = null;
	}

	function createElements (options, persistent) {
		var buffer = bufferState.create(null, GL_ELEMENT_ARRAY_BUFFER, true);
		var elements = new REGLElementBuffer(buffer._buffer);
		stats.elementsCount++;

		function reglElements (options) {
			if (!options) {
				buffer();
				elements.primType = GL_TRIANGLES;
				elements.vertCount = 0;
				elements.type = GL_UNSIGNED_BYTE$4;
			} else if (typeof options === 'number') {
				buffer(options);
				elements.primType = GL_TRIANGLES;
				elements.vertCount = options | 0;
				elements.type = GL_UNSIGNED_BYTE$4;
			} else {
				var data = null;
				var usage = GL_STATIC_DRAW$1;
				var primType = -1;
				var vertCount = -1;
				var byteLength = 0;
				var dtype = 0;
				if (Array.isArray(options) ||
						isTypedArray(options) ||
						isNDArrayLike(options)) {
					data = options;
				} else {
					check$1.type(options, 'object', 'invalid arguments for elements');
					if ('data' in options) {
						data = options.data;
						check$1(
								Array.isArray(data) ||
								isTypedArray(data) ||
								isNDArrayLike(data),
								'invalid data for element buffer');
					}
					if ('usage' in options) {
						check$1.parameter(
							options.usage,
							usageTypes,
							'invalid element buffer usage');
						usage = usageTypes[options.usage];
					}
					if ('primitive' in options) {
						check$1.parameter(
							options.primitive,
							primTypes,
							'invalid element buffer primitive');
						primType = primTypes[options.primitive];
					}
					if ('count' in options) {
						check$1(
							typeof options.count === 'number' && options.count >= 0,
							'invalid vertex count for elements');
						vertCount = options.count | 0;
					}
					if ('type' in options) {
						check$1.parameter(
							options.type,
							elementTypes,
							'invalid buffer type');
						dtype = elementTypes[options.type];
					}
					if ('length' in options) {
						byteLength = options.length | 0;
					} else {
						byteLength = vertCount;
						if (dtype === GL_UNSIGNED_SHORT$2 || dtype === GL_SHORT$2) {
							byteLength *= 2;
						} else if (dtype === GL_UNSIGNED_INT$2 || dtype === GL_INT$2) {
							byteLength *= 4;
						}
					}
				}
				initElements(
					elements,
					data,
					usage,
					primType,
					vertCount,
					byteLength,
					dtype);
			}

			return reglElements
		}

		reglElements(options);

		reglElements._reglType = 'elements';
		reglElements._elements = elements;
		reglElements.subdata = function (data, offset) {
			buffer.subdata(data, offset);
			return reglElements
		};
		reglElements.destroy = function () {
			destroyElements(elements);
		};

		return reglElements
	}

	return {
		create: createElements,
		createStream: createElementStream,
		destroyStream: destroyElementStream,
		getElements: function (elements) {
			if (typeof elements === 'function' &&
					elements._elements instanceof REGLElementBuffer) {
				return elements._elements
			}
			return null
		},
		clear: function () {
			values(elementSet).forEach(destroyElements);
		}
	}
}

var FLOAT = new Float32Array(1);
var INT = new Uint32Array(FLOAT.buffer);

var GL_UNSIGNED_SHORT$4 = 5123;

function convertToHalfFloat (array) {
	var ushorts = pool.allocType(GL_UNSIGNED_SHORT$4, array.length);

	for (var i = 0; i < array.length; ++i) {
		if (isNaN(array[i])) {
			ushorts[i] = 0xffff;
		} else if (array[i] === Infinity) {
			ushorts[i] = 0x7c00;
		} else if (array[i] === -Infinity) {
			ushorts[i] = 0xfc00;
		} else {
			FLOAT[0] = array[i];
			var x = INT[0];

			var sgn = (x >>> 31) << 15;
			var exp = ((x << 1) >>> 24) - 127;
			var frac = (x >> 13) & ((1 << 10) - 1);

			if (exp < -24) {
				// round non-representable denormals to 0
				ushorts[i] = sgn;
			} else if (exp < -14) {
				// handle denormals
				var s = -14 - exp;
				ushorts[i] = sgn + ((frac + (1 << 10)) >> s);
			} else if (exp > 15) {
				// round overflow to +/- Infinity
				ushorts[i] = sgn + 0x7c00;
			} else {
				// otherwise convert directly
				ushorts[i] = sgn + ((exp + 15) << 10) + frac;
			}
		}
	}

	return ushorts
}

function isArrayLike (s) {
	return Array.isArray(s) || isTypedArray(s)
}

var isPow2$1 = function (v) {
	return !(v & (v - 1)) && (!!v)
};

var GL_COMPRESSED_TEXTURE_FORMATS = 0x86A3;

var GL_TEXTURE_2D$1 = 0x0DE1;
var GL_TEXTURE_CUBE_MAP$1 = 0x8513;
var GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 = 0x8515;

var GL_RGBA$1 = 0x1908;
var GL_ALPHA = 0x1906;
var GL_RGB = 0x1907;
var GL_LUMINANCE = 0x1909;
var GL_LUMINANCE_ALPHA = 0x190A;

var GL_RGBA4 = 0x8056;
var GL_RGB5_A1 = 0x8057;
var GL_RGB565 = 0x8D62;

var GL_UNSIGNED_SHORT_4_4_4_4$1 = 0x8033;
var GL_UNSIGNED_SHORT_5_5_5_1$1 = 0x8034;
var GL_UNSIGNED_SHORT_5_6_5$1 = 0x8363;
var GL_UNSIGNED_INT_24_8_WEBGL$1 = 0x84FA;

var GL_DEPTH_COMPONENT = 0x1902;
var GL_DEPTH_STENCIL = 0x84F9;

var GL_SRGB_EXT = 0x8C40;
var GL_SRGB_ALPHA_EXT = 0x8C42;

var GL_HALF_FLOAT_OES$1 = 0x8D61;

var GL_COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83F0;
var GL_COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1;
var GL_COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2;
var GL_COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;

var GL_COMPRESSED_RGB_ATC_WEBGL = 0x8C92;
var GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL = 0x8C93;
var GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL = 0x87EE;

var GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8C00;
var GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG = 0x8C01;
var GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;
var GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 0x8C03;

var GL_COMPRESSED_RGB_ETC1_WEBGL = 0x8D64;

var GL_UNSIGNED_BYTE$5 = 0x1401;
var GL_UNSIGNED_SHORT$3 = 0x1403;
var GL_UNSIGNED_INT$3 = 0x1405;
var GL_FLOAT$4 = 0x1406;

var GL_TEXTURE_WRAP_S = 0x2802;
var GL_TEXTURE_WRAP_T = 0x2803;

var GL_REPEAT = 0x2901;
var GL_CLAMP_TO_EDGE$1 = 0x812F;
var GL_MIRRORED_REPEAT = 0x8370;

var GL_TEXTURE_MAG_FILTER = 0x2800;
var GL_TEXTURE_MIN_FILTER = 0x2801;

var GL_NEAREST$1 = 0x2600;
var GL_LINEAR = 0x2601;
var GL_NEAREST_MIPMAP_NEAREST$1 = 0x2700;
var GL_LINEAR_MIPMAP_NEAREST$1 = 0x2701;
var GL_NEAREST_MIPMAP_LINEAR$1 = 0x2702;
var GL_LINEAR_MIPMAP_LINEAR$1 = 0x2703;

var GL_GENERATE_MIPMAP_HINT = 0x8192;
var GL_DONT_CARE = 0x1100;
var GL_FASTEST = 0x1101;
var GL_NICEST = 0x1102;

var GL_TEXTURE_MAX_ANISOTROPY_EXT = 0x84FE;

var GL_UNPACK_ALIGNMENT = 0x0CF5;
var GL_UNPACK_FLIP_Y_WEBGL = 0x9240;
var GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL = 0x9241;
var GL_UNPACK_COLORSPACE_CONVERSION_WEBGL = 0x9243;

var GL_BROWSER_DEFAULT_WEBGL = 0x9244;

var GL_TEXTURE0$1 = 0x84C0;

var MIPMAP_FILTERS = [
	GL_NEAREST_MIPMAP_NEAREST$1,
	GL_NEAREST_MIPMAP_LINEAR$1,
	GL_LINEAR_MIPMAP_NEAREST$1,
	GL_LINEAR_MIPMAP_LINEAR$1
];

var CHANNELS_FORMAT = [
	0,
	GL_LUMINANCE,
	GL_LUMINANCE_ALPHA,
	GL_RGB,
	GL_RGBA$1
];

var FORMAT_CHANNELS = {};
FORMAT_CHANNELS[GL_LUMINANCE] =
FORMAT_CHANNELS[GL_ALPHA] =
FORMAT_CHANNELS[GL_DEPTH_COMPONENT] = 1;
FORMAT_CHANNELS[GL_DEPTH_STENCIL] =
FORMAT_CHANNELS[GL_LUMINANCE_ALPHA] = 2;
FORMAT_CHANNELS[GL_RGB] =
FORMAT_CHANNELS[GL_SRGB_EXT] = 3;
FORMAT_CHANNELS[GL_RGBA$1] =
FORMAT_CHANNELS[GL_SRGB_ALPHA_EXT] = 4;

function objectName (str) {
	return '[object ' + str + ']'
}

var CANVAS_CLASS = objectName('HTMLCanvasElement');
var CONTEXT2D_CLASS = objectName('CanvasRenderingContext2D');
var BITMAP_CLASS = objectName('ImageBitmap');
var IMAGE_CLASS = objectName('HTMLImageElement');
var VIDEO_CLASS = objectName('HTMLVideoElement');

var PIXEL_CLASSES = Object.keys(arrayTypes).concat([
	CANVAS_CLASS,
	CONTEXT2D_CLASS,
	BITMAP_CLASS,
	IMAGE_CLASS,
	VIDEO_CLASS
]);

// for every texture type, store
// the size in bytes.
var TYPE_SIZES = [];
TYPE_SIZES[GL_UNSIGNED_BYTE$5] = 1;
TYPE_SIZES[GL_FLOAT$4] = 4;
TYPE_SIZES[GL_HALF_FLOAT_OES$1] = 2;

TYPE_SIZES[GL_UNSIGNED_SHORT$3] = 2;
TYPE_SIZES[GL_UNSIGNED_INT$3] = 4;

var FORMAT_SIZES_SPECIAL = [];
FORMAT_SIZES_SPECIAL[GL_RGBA4] = 2;
FORMAT_SIZES_SPECIAL[GL_RGB5_A1] = 2;
FORMAT_SIZES_SPECIAL[GL_RGB565] = 2;
FORMAT_SIZES_SPECIAL[GL_DEPTH_STENCIL] = 4;

FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_S3TC_DXT1_EXT] = 0.5;
FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_S3TC_DXT1_EXT] = 0.5;
FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_S3TC_DXT3_EXT] = 1;
FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_S3TC_DXT5_EXT] = 1;

FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_ATC_WEBGL] = 0.5;
FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL] = 1;
FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL] = 1;

FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG] = 0.5;
FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG] = 0.25;
FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG] = 0.5;
FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG] = 0.25;

FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_ETC1_WEBGL] = 0.5;

function isNumericArray (arr) {
	return (
		Array.isArray(arr) &&
		(arr.length === 0 ||
		typeof arr[0] === 'number'))
}

function isRectArray (arr) {
	if (!Array.isArray(arr)) {
		return false
	}
	var width = arr.length;
	if (width === 0 || !isArrayLike(arr[0])) {
		return false
	}
	return true
}

function classString (x) {
	return Object.prototype.toString.call(x)
}

function isCanvasElement (object) {
	return classString(object) === CANVAS_CLASS
}

function isContext2D (object) {
	return classString(object) === CONTEXT2D_CLASS
}

function isBitmap (object) {
	return classString(object) === BITMAP_CLASS
}

function isImageElement (object) {
	return classString(object) === IMAGE_CLASS
}

function isVideoElement (object) {
	return classString(object) === VIDEO_CLASS
}

function isPixelData (object) {
	if (!object) {
		return false
	}
	var className = classString(object);
	if (PIXEL_CLASSES.indexOf(className) >= 0) {
		return true
	}
	return (
		isNumericArray(object) ||
		isRectArray(object) ||
		isNDArrayLike(object))
}

function typedArrayCode$1 (data) {
	return arrayTypes[Object.prototype.toString.call(data)] | 0
}

function convertData (result, data) {
	var n = data.length;
	switch (result.type) {
		case GL_UNSIGNED_BYTE$5:
		case GL_UNSIGNED_SHORT$3:
		case GL_UNSIGNED_INT$3:
		case GL_FLOAT$4:
			var converted = pool.allocType(result.type, n);
			converted.set(data);
			result.data = converted;
			break

		case GL_HALF_FLOAT_OES$1:
			result.data = convertToHalfFloat(data);
			break

		default:
			check$1.raise('unsupported texture type, must specify a typed array');
	}
}

function preConvert (image, n) {
	return pool.allocType(
		image.type === GL_HALF_FLOAT_OES$1
			? GL_FLOAT$4
			: image.type, n)
}

function postConvert (image, data) {
	if (image.type === GL_HALF_FLOAT_OES$1) {
		image.data = convertToHalfFloat(data);
		pool.freeType(data);
	} else {
		image.data = data;
	}
}

function transposeData (image, array, strideX, strideY, strideC, offset) {
	var w = image.width;
	var h = image.height;
	var c = image.channels;
	var n = w * h * c;
	var data = preConvert(image, n);

	var p = 0;
	for (var i = 0; i < h; ++i) {
		for (var j = 0; j < w; ++j) {
			for (var k = 0; k < c; ++k) {
				data[p++] = array[strideX * j + strideY * i + strideC * k + offset];
			}
		}
	}

	postConvert(image, data);
}

function getTextureSize (format, type, width, height, isMipmap, isCube) {
	var s;
	if (typeof FORMAT_SIZES_SPECIAL[format] !== 'undefined') {
		// we have a special array for dealing with weird color formats such as RGB5A1
		s = FORMAT_SIZES_SPECIAL[format];
	} else {
		s = FORMAT_CHANNELS[format] * TYPE_SIZES[type];
	}

	if (isCube) {
		s *= 6;
	}

	if (isMipmap) {
		// compute the total size of all the mipmaps.
		var total = 0;

		var w = width;
		while (w >= 1) {
			// we can only use mipmaps on a square image,
			// so we can simply use the width and ignore the height:
			total += s * w * w;
			w /= 2;
		}
		return total
	} else {
		return s * width * height
	}
}

function createTextureSet (
	gl, extensions, limits, reglPoll, contextState, stats, config) {
	// -------------------------------------------------------
	// Initialize constants and parameter tables here
	// -------------------------------------------------------
	var mipmapHint = {
		"don't care": GL_DONT_CARE,
		'dont care': GL_DONT_CARE,
		'nice': GL_NICEST,
		'fast': GL_FASTEST
	};

	var wrapModes = {
		'repeat': GL_REPEAT,
		'clamp': GL_CLAMP_TO_EDGE$1,
		'mirror': GL_MIRRORED_REPEAT
	};

	var magFilters = {
		'nearest': GL_NEAREST$1,
		'linear': GL_LINEAR
	};

	var minFilters = extend({
		'mipmap': GL_LINEAR_MIPMAP_LINEAR$1,
		'nearest mipmap nearest': GL_NEAREST_MIPMAP_NEAREST$1,
		'linear mipmap nearest': GL_LINEAR_MIPMAP_NEAREST$1,
		'nearest mipmap linear': GL_NEAREST_MIPMAP_LINEAR$1,
		'linear mipmap linear': GL_LINEAR_MIPMAP_LINEAR$1
	}, magFilters);

	var colorSpace = {
		'none': 0,
		'browser': GL_BROWSER_DEFAULT_WEBGL
	};

	var textureTypes = {
		'uint8': GL_UNSIGNED_BYTE$5,
		'rgba4': GL_UNSIGNED_SHORT_4_4_4_4$1,
		'rgb565': GL_UNSIGNED_SHORT_5_6_5$1,
		'rgb5 a1': GL_UNSIGNED_SHORT_5_5_5_1$1
	};

	var textureFormats = {
		'alpha': GL_ALPHA,
		'luminance': GL_LUMINANCE,
		'luminance alpha': GL_LUMINANCE_ALPHA,
		'rgb': GL_RGB,
		'rgba': GL_RGBA$1,
		'rgba4': GL_RGBA4,
		'rgb5 a1': GL_RGB5_A1,
		'rgb565': GL_RGB565
	};

	var compressedTextureFormats = {};

	if (extensions.ext_srgb) {
		textureFormats.srgb = GL_SRGB_EXT;
		textureFormats.srgba = GL_SRGB_ALPHA_EXT;
	}

	if (extensions.oes_texture_float) {
		textureTypes.float32 = textureTypes.float = GL_FLOAT$4;
	}

	if (extensions.oes_texture_half_float) {
		textureTypes['float16'] = textureTypes['half float'] = GL_HALF_FLOAT_OES$1;
	}

	if (extensions.webgl_depth_texture) {
		extend(textureFormats, {
			'depth': GL_DEPTH_COMPONENT,
			'depth stencil': GL_DEPTH_STENCIL
		});

		extend(textureTypes, {
			'uint16': GL_UNSIGNED_SHORT$3,
			'uint32': GL_UNSIGNED_INT$3,
			'depth stencil': GL_UNSIGNED_INT_24_8_WEBGL$1
		});
	}

	if (extensions.webgl_compressed_texture_s3tc) {
		extend(compressedTextureFormats, {
			'rgb s3tc dxt1': GL_COMPRESSED_RGB_S3TC_DXT1_EXT,
			'rgba s3tc dxt1': GL_COMPRESSED_RGBA_S3TC_DXT1_EXT,
			'rgba s3tc dxt3': GL_COMPRESSED_RGBA_S3TC_DXT3_EXT,
			'rgba s3tc dxt5': GL_COMPRESSED_RGBA_S3TC_DXT5_EXT
		});
	}

	if (extensions.webgl_compressed_texture_atc) {
		extend(compressedTextureFormats, {
			'rgb atc': GL_COMPRESSED_RGB_ATC_WEBGL,
			'rgba atc explicit alpha': GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL,
			'rgba atc interpolated alpha': GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL
		});
	}

	if (extensions.webgl_compressed_texture_pvrtc) {
		extend(compressedTextureFormats, {
			'rgb pvrtc 4bppv1': GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
			'rgb pvrtc 2bppv1': GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG,
			'rgba pvrtc 4bppv1': GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
			'rgba pvrtc 2bppv1': GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG
		});
	}

	if (extensions.webgl_compressed_texture_etc1) {
		compressedTextureFormats['rgb etc1'] = GL_COMPRESSED_RGB_ETC1_WEBGL;
	}

	// Copy over all texture formats
	var supportedCompressedFormats = Array.prototype.slice.call(
		gl.getParameter(GL_COMPRESSED_TEXTURE_FORMATS));
	Object.keys(compressedTextureFormats).forEach(function (name) {
		var format = compressedTextureFormats[name];
		if (supportedCompressedFormats.indexOf(format) >= 0) {
			textureFormats[name] = format;
		}
	});

	var supportedFormats = Object.keys(textureFormats);
	limits.textureFormats = supportedFormats;

	// associate with every format string its
	// corresponding GL-value.
	var textureFormatsInvert = [];
	Object.keys(textureFormats).forEach(function (key) {
		var val = textureFormats[key];
		textureFormatsInvert[val] = key;
	});

	// associate with every type string its
	// corresponding GL-value.
	var textureTypesInvert = [];
	Object.keys(textureTypes).forEach(function (key) {
		var val = textureTypes[key];
		textureTypesInvert[val] = key;
	});

	var magFiltersInvert = [];
	Object.keys(magFilters).forEach(function (key) {
		var val = magFilters[key];
		magFiltersInvert[val] = key;
	});

	var minFiltersInvert = [];
	Object.keys(minFilters).forEach(function (key) {
		var val = minFilters[key];
		minFiltersInvert[val] = key;
	});

	var wrapModesInvert = [];
	Object.keys(wrapModes).forEach(function (key) {
		var val = wrapModes[key];
		wrapModesInvert[val] = key;
	});

	// colorFormats[] gives the format (channels) associated to an
	// internalformat
	var colorFormats = supportedFormats.reduce(function (color, key) {
		var glenum = textureFormats[key];
		if (glenum === GL_LUMINANCE ||
				glenum === GL_ALPHA ||
				glenum === GL_LUMINANCE ||
				glenum === GL_LUMINANCE_ALPHA ||
				glenum === GL_DEPTH_COMPONENT ||
				glenum === GL_DEPTH_STENCIL) {
			color[glenum] = glenum;
		} else if (glenum === GL_RGB5_A1 || key.indexOf('rgba') >= 0) {
			color[glenum] = GL_RGBA$1;
		} else {
			color[glenum] = GL_RGB;
		}
		return color
	}, {});

	function TexFlags () {
		// format info
		this.internalformat = GL_RGBA$1;
		this.format = GL_RGBA$1;
		this.type = GL_UNSIGNED_BYTE$5;
		this.compressed = false;

		// pixel storage
		this.premultiplyAlpha = false;
		this.flipY = false;
		this.unpackAlignment = 1;
		this.colorSpace = GL_BROWSER_DEFAULT_WEBGL;

		// shape info
		this.width = 0;
		this.height = 0;
		this.channels = 0;
	}

	function copyFlags (result, other) {
		result.internalformat = other.internalformat;
		result.format = other.format;
		result.type = other.type;
		result.compressed = other.compressed;

		result.premultiplyAlpha = other.premultiplyAlpha;
		result.flipY = other.flipY;
		result.unpackAlignment = other.unpackAlignment;
		result.colorSpace = other.colorSpace;

		result.width = other.width;
		result.height = other.height;
		result.channels = other.channels;
	}

	function parseFlags (flags, options) {
		if (typeof options !== 'object' || !options) {
			return
		}

		if ('premultiplyAlpha' in options) {
			check$1.type(options.premultiplyAlpha, 'boolean',
				'invalid premultiplyAlpha');
			flags.premultiplyAlpha = options.premultiplyAlpha;
		}

		if ('flipY' in options) {
			check$1.type(options.flipY, 'boolean',
				'invalid texture flip');
			flags.flipY = options.flipY;
		}

		if ('alignment' in options) {
			check$1.oneOf(options.alignment, [1, 2, 4, 8],
				'invalid texture unpack alignment');
			flags.unpackAlignment = options.alignment;
		}

		if ('colorSpace' in options) {
			check$1.parameter(options.colorSpace, colorSpace,
				'invalid colorSpace');
			flags.colorSpace = colorSpace[options.colorSpace];
		}

		if ('type' in options) {
			var type = options.type;
			check$1(extensions.oes_texture_float ||
				!(type === 'float' || type === 'float32'),
				'you must enable the OES_texture_float extension in order to use floating point textures.');
			check$1(extensions.oes_texture_half_float ||
				!(type === 'half float' || type === 'float16'),
				'you must enable the OES_texture_half_float extension in order to use 16-bit floating point textures.');
			check$1(extensions.webgl_depth_texture ||
				!(type === 'uint16' || type === 'uint32' || type === 'depth stencil'),
				'you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures.');
			check$1.parameter(type, textureTypes,
				'invalid texture type');
			flags.type = textureTypes[type];
		}

		var w = flags.width;
		var h = flags.height;
		var c = flags.channels;
		var hasChannels = false;
		if ('shape' in options) {
			check$1(Array.isArray(options.shape) && options.shape.length >= 2,
				'shape must be an array');
			w = options.shape[0];
			h = options.shape[1];
			if (options.shape.length === 3) {
				c = options.shape[2];
				check$1(c > 0 && c <= 4, 'invalid number of channels');
				hasChannels = true;
			}
			check$1(w >= 0 && w <= limits.maxTextureSize, 'invalid width');
			check$1(h >= 0 && h <= limits.maxTextureSize, 'invalid height');
		} else {
			if ('radius' in options) {
				w = h = options.radius;
				check$1(w >= 0 && w <= limits.maxTextureSize, 'invalid radius');
			}
			if ('width' in options) {
				w = options.width;
				check$1(w >= 0 && w <= limits.maxTextureSize, 'invalid width');
			}
			if ('height' in options) {
				h = options.height;
				check$1(h >= 0 && h <= limits.maxTextureSize, 'invalid height');
			}
			if ('channels' in options) {
				c = options.channels;
				check$1(c > 0 && c <= 4, 'invalid number of channels');
				hasChannels = true;
			}
		}
		flags.width = w | 0;
		flags.height = h | 0;
		flags.channels = c | 0;

		var hasFormat = false;
		if ('format' in options) {
			var formatStr = options.format;
			check$1(extensions.webgl_depth_texture ||
				!(formatStr === 'depth' || formatStr === 'depth stencil'),
				'you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures.');
			check$1.parameter(formatStr, textureFormats,
				'invalid texture format');
			var internalformat = flags.internalformat = textureFormats[formatStr];
			flags.format = colorFormats[internalformat];
			if (formatStr in textureTypes) {
				if (!('type' in options)) {
					flags.type = textureTypes[formatStr];
				}
			}
			if (formatStr in compressedTextureFormats) {
				flags.compressed = true;
			}
			hasFormat = true;
		}

		// Reconcile channels and format
		if (!hasChannels && hasFormat) {
			flags.channels = FORMAT_CHANNELS[flags.format];
		} else if (hasChannels && !hasFormat) {
			if (flags.channels !== CHANNELS_FORMAT[flags.format]) {
				flags.format = flags.internalformat = CHANNELS_FORMAT[flags.channels];
			}
		} else if (hasFormat && hasChannels) {
			check$1(
				flags.channels === FORMAT_CHANNELS[flags.format],
				'number of channels inconsistent with specified format');
		}
	}

	function setFlags (flags) {
		gl.pixelStorei(GL_UNPACK_FLIP_Y_WEBGL, flags.flipY);
		gl.pixelStorei(GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL, flags.premultiplyAlpha);
		gl.pixelStorei(GL_UNPACK_COLORSPACE_CONVERSION_WEBGL, flags.colorSpace);
		gl.pixelStorei(GL_UNPACK_ALIGNMENT, flags.unpackAlignment);
	}

	// -------------------------------------------------------
	// Tex image data
	// -------------------------------------------------------
	function TexImage () {
		TexFlags.call(this);

		this.xOffset = 0;
		this.yOffset = 0;

		// data
		this.data = null;
		this.needsFree = false;

		// html element
		this.element = null;

		// copyTexImage info
		this.needsCopy = false;
	}

	function parseImage (image, options) {
		var data = null;
		if (isPixelData(options)) {
			data = options;
		} else if (options) {
			check$1.type(options, 'object', 'invalid pixel data type');
			parseFlags(image, options);
			if ('x' in options) {
				image.xOffset = options.x | 0;
			}
			if ('y' in options) {
				image.yOffset = options.y | 0;
			}
			if (isPixelData(options.data)) {
				data = options.data;
			}
		}

		check$1(
			!image.compressed ||
			data instanceof Uint8Array,
			'compressed texture data must be stored in a uint8array');

		if (options.copy) {
			check$1(!data, 'can not specify copy and data field for the same texture');
			var viewW = contextState.viewportWidth;
			var viewH = contextState.viewportHeight;
			image.width = image.width || (viewW - image.xOffset);
			image.height = image.height || (viewH - image.yOffset);
			image.needsCopy = true;
			check$1(image.xOffset >= 0 && image.xOffset < viewW &&
						image.yOffset >= 0 && image.yOffset < viewH &&
						image.width > 0 && image.width <= viewW &&
						image.height > 0 && image.height <= viewH,
						'copy texture read out of bounds');
		} else if (!data) {
			image.width = image.width || 1;
			image.height = image.height || 1;
			image.channels = image.channels || 4;
		} else if (isTypedArray(data)) {
			image.channels = image.channels || 4;
			image.data = data;
			if (!('type' in options) && image.type === GL_UNSIGNED_BYTE$5) {
				image.type = typedArrayCode$1(data);
			}
		} else if (isNumericArray(data)) {
			image.channels = image.channels || 4;
			convertData(image, data);
			image.alignment = 1;
			image.needsFree = true;
		} else if (isNDArrayLike(data)) {
			var array = data.data;
			if (!Array.isArray(array) && image.type === GL_UNSIGNED_BYTE$5) {
				image.type = typedArrayCode$1(array);
			}
			var shape = data.shape;
			var stride = data.stride;
			var shapeX, shapeY, shapeC, strideX, strideY, strideC;
			if (shape.length === 3) {
				shapeC = shape[2];
				strideC = stride[2];
			} else {
				check$1(shape.length === 2, 'invalid ndarray pixel data, must be 2 or 3D');
				shapeC = 1;
				strideC = 1;
			}
			shapeX = shape[0];
			shapeY = shape[1];
			strideX = stride[0];
			strideY = stride[1];
			image.alignment = 1;
			image.width = shapeX;
			image.height = shapeY;
			image.channels = shapeC;
			image.format = image.internalformat = CHANNELS_FORMAT[shapeC];
			image.needsFree = true;
			transposeData(image, array, strideX, strideY, strideC, data.offset);
		} else if (isCanvasElement(data) || isContext2D(data)) {
			if (isCanvasElement(data)) {
				image.element = data;
			} else {
				image.element = data.canvas;
			}
			image.width = image.element.width;
			image.height = image.element.height;
			image.channels = 4;
		} else if (isBitmap(data)) {
			image.element = data;
			image.width = data.width;
			image.height = data.height;
			image.channels = 4;
		} else if (isImageElement(data)) {
			image.element = data;
			image.width = data.naturalWidth;
			image.height = data.naturalHeight;
			image.channels = 4;
		} else if (isVideoElement(data)) {
			image.element = data;
			image.width = data.videoWidth;
			image.height = data.videoHeight;
			image.channels = 4;
		} else if (isRectArray(data)) {
			var w = image.width || data[0].length;
			var h = image.height || data.length;
			var c = image.channels;
			if (isArrayLike(data[0][0])) {
				c = c || data[0][0].length;
			} else {
				c = c || 1;
			}
			var arrayShape = flattenUtils.shape(data);
			var n = 1;
			for (var dd = 0; dd < arrayShape.length; ++dd) {
				n *= arrayShape[dd];
			}
			var allocData = preConvert(image, n);
			flattenUtils.flatten(data, arrayShape, '', allocData);
			postConvert(image, allocData);
			image.alignment = 1;
			image.width = w;
			image.height = h;
			image.channels = c;
			image.format = image.internalformat = CHANNELS_FORMAT[c];
			image.needsFree = true;
		}

		if (image.type === GL_FLOAT$4) {
			check$1(limits.extensions.indexOf('oes_texture_float') >= 0,
				'oes_texture_float extension not enabled');
		} else if (image.type === GL_HALF_FLOAT_OES$1) {
			check$1(limits.extensions.indexOf('oes_texture_half_float') >= 0,
				'oes_texture_half_float extension not enabled');
		}

		// do compressed texture  validation here.
	}

	function setImage (info, target, miplevel) {
		var element = info.element;
		var data = info.data;
		var internalformat = info.internalformat;
		var format = info.format;
		var type = info.type;
		var width = info.width;
		var height = info.height;
		var channels = info.channels;

		setFlags(info);

		if (element) {
			gl.texImage2D(target, miplevel, format, format, type, element);
		} else if (info.compressed) {
			gl.compressedTexImage2D(target, miplevel, internalformat, width, height, 0, data);
		} else if (info.needsCopy) {
			reglPoll();
			gl.copyTexImage2D(
				target, miplevel, format, info.xOffset, info.yOffset, width, height, 0);
		} else {
			var nullData = !data;
			if (nullData) {
				data = pool.zero.allocType(type, width * height * channels);
			}

			gl.texImage2D(target, miplevel, format, width, height, 0, format, type, data);

			if (nullData && data) {
				pool.zero.freeType(data);
			}
		}
	}

	function setSubImage (info, target, x, y, miplevel) {
		var element = info.element;
		var data = info.data;
		var internalformat = info.internalformat;
		var format = info.format;
		var type = info.type;
		var width = info.width;
		var height = info.height;

		setFlags(info);

		if (element) {
			gl.texSubImage2D(
				target, miplevel, x, y, format, type, element);
		} else if (info.compressed) {
			gl.compressedTexSubImage2D(
				target, miplevel, x, y, internalformat, width, height, data);
		} else if (info.needsCopy) {
			reglPoll();
			gl.copyTexSubImage2D(
				target, miplevel, x, y, info.xOffset, info.yOffset, width, height);
		} else {
			gl.texSubImage2D(
				target, miplevel, x, y, width, height, format, type, data);
		}
	}

	// texImage pool
	var imagePool = [];

	function allocImage () {
		return imagePool.pop() || new TexImage()
	}

	function freeImage (image) {
		if (image.needsFree) {
			pool.freeType(image.data);
		}
		TexImage.call(image);
		imagePool.push(image);
	}

	// -------------------------------------------------------
	// Mip map
	// -------------------------------------------------------
	function MipMap () {
		TexFlags.call(this);

		this.genMipmaps = false;
		this.mipmapHint = GL_DONT_CARE;
		this.mipmask = 0;
		this.images = Array(16);
	}

	function parseMipMapFromShape (mipmap, width, height) {
		var img = mipmap.images[0] = allocImage();
		mipmap.mipmask = 1;
		img.width = mipmap.width = width;
		img.height = mipmap.height = height;
		img.channels = mipmap.channels = 4;
	}

	function parseMipMapFromObject (mipmap, options) {
		var imgData = null;
		if (isPixelData(options)) {
			imgData = mipmap.images[0] = allocImage();
			copyFlags(imgData, mipmap);
			parseImage(imgData, options);
			mipmap.mipmask = 1;
		} else {
			parseFlags(mipmap, options);
			if (Array.isArray(options.mipmap)) {
				var mipData = options.mipmap;
				for (var i = 0; i < mipData.length; ++i) {
					imgData = mipmap.images[i] = allocImage();
					copyFlags(imgData, mipmap);
					imgData.width >>= i;
					imgData.height >>= i;
					parseImage(imgData, mipData[i]);
					mipmap.mipmask |= (1 << i);
				}
			} else {
				imgData = mipmap.images[0] = allocImage();
				copyFlags(imgData, mipmap);
				parseImage(imgData, options);
				mipmap.mipmask = 1;
			}
		}
		copyFlags(mipmap, mipmap.images[0]);

		// For textures of the compressed format WEBGL_compressed_texture_s3tc
		// we must have that
		//
		// "When level equals zero width and height must be a multiple of 4.
		// When level is greater than 0 width and height must be 0, 1, 2 or a multiple of 4. "
		//
		// but we do not yet support having multiple mipmap levels for compressed textures,
		// so we only test for level zero.

		if (mipmap.compressed &&
				(mipmap.internalformat === GL_COMPRESSED_RGB_S3TC_DXT1_EXT) ||
				(mipmap.internalformat === GL_COMPRESSED_RGBA_S3TC_DXT1_EXT) ||
				(mipmap.internalformat === GL_COMPRESSED_RGBA_S3TC_DXT3_EXT) ||
				(mipmap.internalformat === GL_COMPRESSED_RGBA_S3TC_DXT5_EXT)) {
			check$1(mipmap.width % 4 === 0 &&
						mipmap.height % 4 === 0,
						'for compressed texture formats, mipmap level 0 must have width and height that are a multiple of 4');
		}
	}

	function setMipMap (mipmap, target) {
		var images = mipmap.images;
		for (var i = 0; i < images.length; ++i) {
			if (!images[i]) {
				return
			}
			setImage(images[i], target, i);
		}
	}

	var mipPool = [];

	function allocMipMap () {
		var result = mipPool.pop() || new MipMap();
		TexFlags.call(result);
		result.mipmask = 0;
		for (var i = 0; i < 16; ++i) {
			result.images[i] = null;
		}
		return result
	}

	function freeMipMap (mipmap) {
		var images = mipmap.images;
		for (var i = 0; i < images.length; ++i) {
			if (images[i]) {
				freeImage(images[i]);
			}
			images[i] = null;
		}
		mipPool.push(mipmap);
	}

	// -------------------------------------------------------
	// Tex info
	// -------------------------------------------------------
	function TexInfo () {
		this.minFilter = GL_NEAREST$1;
		this.magFilter = GL_NEAREST$1;

		this.wrapS = GL_CLAMP_TO_EDGE$1;
		this.wrapT = GL_CLAMP_TO_EDGE$1;

		this.anisotropic = 1;

		this.genMipmaps = false;
		this.mipmapHint = GL_DONT_CARE;
	}

	function parseTexInfo (info, options) {
		if ('min' in options) {
			var minFilter = options.min;
			check$1.parameter(minFilter, minFilters);
			info.minFilter = minFilters[minFilter];
			if (MIPMAP_FILTERS.indexOf(info.minFilter) >= 0 && !('faces' in options)) {
				info.genMipmaps = true;
			}
		}

		if ('mag' in options) {
			var magFilter = options.mag;
			check$1.parameter(magFilter, magFilters);
			info.magFilter = magFilters[magFilter];
		}

		var wrapS = info.wrapS;
		var wrapT = info.wrapT;
		if ('wrap' in options) {
			var wrap = options.wrap;
			if (typeof wrap === 'string') {
				check$1.parameter(wrap, wrapModes);
				wrapS = wrapT = wrapModes[wrap];
			} else if (Array.isArray(wrap)) {
				check$1.parameter(wrap[0], wrapModes);
				check$1.parameter(wrap[1], wrapModes);
				wrapS = wrapModes[wrap[0]];
				wrapT = wrapModes[wrap[1]];
			}
		} else {
			if ('wrapS' in options) {
				var optWrapS = options.wrapS;
				check$1.parameter(optWrapS, wrapModes);
				wrapS = wrapModes[optWrapS];
			}
			if ('wrapT' in options) {
				var optWrapT = options.wrapT;
				check$1.parameter(optWrapT, wrapModes);
				wrapT = wrapModes[optWrapT];
			}
		}
		info.wrapS = wrapS;
		info.wrapT = wrapT;

		if ('anisotropic' in options) {
			var anisotropic = options.anisotropic;
			check$1(typeof anisotropic === 'number' &&
				 anisotropic >= 1 && anisotropic <= limits.maxAnisotropic,
				'aniso samples must be between 1 and ');
			info.anisotropic = options.anisotropic;
		}

		if ('mipmap' in options) {
			var hasMipMap = false;
			switch (typeof options.mipmap) {
				case 'string':
					check$1.parameter(options.mipmap, mipmapHint,
						'invalid mipmap hint');
					info.mipmapHint = mipmapHint[options.mipmap];
					info.genMipmaps = true;
					hasMipMap = true;
					break

				case 'boolean':
					hasMipMap = info.genMipmaps = options.mipmap;
					break

				case 'object':
					check$1(Array.isArray(options.mipmap), 'invalid mipmap type');
					info.genMipmaps = false;
					hasMipMap = true;
					break

				default:
					check$1.raise('invalid mipmap type');
			}
			if (hasMipMap && !('min' in options)) {
				info.minFilter = GL_NEAREST_MIPMAP_NEAREST$1;
			}
		}
	}

	function setTexInfo (info, target) {
		gl.texParameteri(target, GL_TEXTURE_MIN_FILTER, info.minFilter);
		gl.texParameteri(target, GL_TEXTURE_MAG_FILTER, info.magFilter);
		gl.texParameteri(target, GL_TEXTURE_WRAP_S, info.wrapS);
		gl.texParameteri(target, GL_TEXTURE_WRAP_T, info.wrapT);
		if (extensions.ext_texture_filter_anisotropic) {
			gl.texParameteri(target, GL_TEXTURE_MAX_ANISOTROPY_EXT, info.anisotropic);
		}
		if (info.genMipmaps) {
			gl.hint(GL_GENERATE_MIPMAP_HINT, info.mipmapHint);
			gl.generateMipmap(target);
		}
	}

	// -------------------------------------------------------
	// Full texture object
	// -------------------------------------------------------
	var textureCount = 0;
	var textureSet = {};
	var numTexUnits = limits.maxTextureUnits;
	var textureUnits = Array(numTexUnits).map(function () {
		return null
	});

	function REGLTexture (target) {
		TexFlags.call(this);
		this.mipmask = 0;
		this.internalformat = GL_RGBA$1;

		this.id = textureCount++;

		this.refCount = 1;

		this.target = target;
		this.texture = gl.createTexture();

		this.unit = -1;
		this.bindCount = 0;

		this.texInfo = new TexInfo();

		if (config.profile) {
			this.stats = {size: 0};
		}
	}

	function tempBind (texture) {
		gl.activeTexture(GL_TEXTURE0$1);
		gl.bindTexture(texture.target, texture.texture);
	}

	function tempRestore () {
		var prev = textureUnits[0];
		if (prev) {
			gl.bindTexture(prev.target, prev.texture);
		} else {
			gl.bindTexture(GL_TEXTURE_2D$1, null);
		}
	}

	function destroy (texture) {
		var handle = texture.texture;
		check$1(handle, 'must not double destroy texture');
		var unit = texture.unit;
		var target = texture.target;
		if (unit >= 0) {
			gl.activeTexture(GL_TEXTURE0$1 + unit);
			gl.bindTexture(target, null);
			textureUnits[unit] = null;
		}
		gl.deleteTexture(handle);
		texture.texture = null;
		texture.params = null;
		texture.pixels = null;
		texture.refCount = 0;
		delete textureSet[texture.id];
		stats.textureCount--;
	}

	extend(REGLTexture.prototype, {
		bind: function () {
			var texture = this;
			texture.bindCount += 1;
			var unit = texture.unit;
			if (unit < 0) {
				for (var i = 0; i < numTexUnits; ++i) {
					var other = textureUnits[i];
					if (other) {
						if (other.bindCount > 0) {
							continue
						}
						other.unit = -1;
					}
					textureUnits[i] = texture;
					unit = i;
					break
				}
				if (unit >= numTexUnits) {
					check$1.raise('insufficient number of texture units');
				}
				if (config.profile && stats.maxTextureUnits < (unit + 1)) {
					stats.maxTextureUnits = unit + 1; // +1, since the units are zero-based
				}
				texture.unit = unit;
				gl.activeTexture(GL_TEXTURE0$1 + unit);
				gl.bindTexture(texture.target, texture.texture);
			}
			return unit
		},

		unbind: function () {
			this.bindCount -= 1;
		},

		decRef: function () {
			if (--this.refCount <= 0) {
				destroy(this);
			}
		}
	});

	function createTexture2D (a, b) {
		var texture = new REGLTexture(GL_TEXTURE_2D$1);
		textureSet[texture.id] = texture;
		stats.textureCount++;

		function reglTexture2D (a, b) {
			var texInfo = texture.texInfo;
			TexInfo.call(texInfo);
			var mipData = allocMipMap();

			if (typeof a === 'number') {
				if (typeof b === 'number') {
					parseMipMapFromShape(mipData, a | 0, b | 0);
				} else {
					parseMipMapFromShape(mipData, a | 0, a | 0);
				}
			} else if (a) {
				check$1.type(a, 'object', 'invalid arguments to regl.texture');
				parseTexInfo(texInfo, a);
				parseMipMapFromObject(mipData, a);
			} else {
				// empty textures get assigned a default shape of 1x1
				parseMipMapFromShape(mipData, 1, 1);
			}

			if (texInfo.genMipmaps) {
				mipData.mipmask = (mipData.width << 1) - 1;
			}
			texture.mipmask = mipData.mipmask;

			copyFlags(texture, mipData);

			check$1.texture2D(texInfo, mipData, limits);
			texture.internalformat = mipData.internalformat;

			reglTexture2D.width = mipData.width;
			reglTexture2D.height = mipData.height;

			tempBind(texture);
			setMipMap(mipData, GL_TEXTURE_2D$1);
			setTexInfo(texInfo, GL_TEXTURE_2D$1);
			tempRestore();

			freeMipMap(mipData);

			if (config.profile) {
				texture.stats.size = getTextureSize(
					texture.internalformat,
					texture.type,
					mipData.width,
					mipData.height,
					texInfo.genMipmaps,
					false);
			}
			reglTexture2D.format = textureFormatsInvert[texture.internalformat];
			reglTexture2D.type = textureTypesInvert[texture.type];

			reglTexture2D.mag = magFiltersInvert[texInfo.magFilter];
			reglTexture2D.min = minFiltersInvert[texInfo.minFilter];

			reglTexture2D.wrapS = wrapModesInvert[texInfo.wrapS];
			reglTexture2D.wrapT = wrapModesInvert[texInfo.wrapT];

			return reglTexture2D
		}

		function subimage (image, x_, y_, level_) {
			check$1(!!image, 'must specify image data');

			var x = x_ | 0;
			var y = y_ | 0;
			var level = level_ | 0;

			var imageData = allocImage();
			copyFlags(imageData, texture);
			imageData.width = 0;
			imageData.height = 0;
			parseImage(imageData, image);
			imageData.width = imageData.width || ((texture.width >> level) - x);
			imageData.height = imageData.height || ((texture.height >> level) - y);

			check$1(
				texture.type === imageData.type &&
				texture.format === imageData.format &&
				texture.internalformat === imageData.internalformat,
				'incompatible format for texture.subimage');
			check$1(
				x >= 0 && y >= 0 &&
				x + imageData.width <= texture.width &&
				y + imageData.height <= texture.height,
				'texture.subimage write out of bounds');
			check$1(
				texture.mipmask & (1 << level),
				'missing mipmap data');
			check$1(
				imageData.data || imageData.element || imageData.needsCopy,
				'missing image data');

			tempBind(texture);
			setSubImage(imageData, GL_TEXTURE_2D$1, x, y, level);
			tempRestore();

			freeImage(imageData);

			return reglTexture2D
		}

		function resize (w_, h_) {
			var w = w_ | 0;
			var h = (h_ | 0) || w;
			if (w === texture.width && h === texture.height) {
				return reglTexture2D
			}

			reglTexture2D.width = texture.width = w;
			reglTexture2D.height = texture.height = h;

			tempBind(texture);

			var data;
			var channels = texture.channels;
			var type = texture.type;

			for (var i = 0; texture.mipmask >> i; ++i) {
				var _w = w >> i;
				var _h = h >> i;
				if (!_w || !_h) break
				data = pool.zero.allocType(type, _w * _h * channels);
				gl.texImage2D(
					GL_TEXTURE_2D$1,
					i,
					texture.format,
					_w,
					_h,
					0,
					texture.format,
					texture.type,
					data);
				if (data) pool.zero.freeType(data);
			}
			tempRestore();

			// also, recompute the texture size.
			if (config.profile) {
				texture.stats.size = getTextureSize(
					texture.internalformat,
					texture.type,
					w,
					h,
					false,
					false);
			}

			return reglTexture2D
		}

		reglTexture2D(a, b);

		reglTexture2D.subimage = subimage;
		reglTexture2D.resize = resize;
		reglTexture2D._reglType = 'texture2d';
		reglTexture2D._texture = texture;
		if (config.profile) {
			reglTexture2D.stats = texture.stats;
		}
		reglTexture2D.destroy = function () {
			texture.decRef();
		};

		return reglTexture2D
	}

	function createTextureCube (a0, a1, a2, a3, a4, a5) {
		var texture = new REGLTexture(GL_TEXTURE_CUBE_MAP$1);
		textureSet[texture.id] = texture;
		stats.cubeCount++;

		var faces = new Array(6);

		function reglTextureCube (a0, a1, a2, a3, a4, a5) {
			var i;
			var texInfo = texture.texInfo;
			TexInfo.call(texInfo);
			for (i = 0; i < 6; ++i) {
				faces[i] = allocMipMap();
			}

			if (typeof a0 === 'number' || !a0) {
				var s = (a0 | 0) || 1;
				for (i = 0; i < 6; ++i) {
					parseMipMapFromShape(faces[i], s, s);
				}
			} else if (typeof a0 === 'object') {
				if (a1) {
					parseMipMapFromObject(faces[0], a0);
					parseMipMapFromObject(faces[1], a1);
					parseMipMapFromObject(faces[2], a2);
					parseMipMapFromObject(faces[3], a3);
					parseMipMapFromObject(faces[4], a4);
					parseMipMapFromObject(faces[5], a5);
				} else {
					parseTexInfo(texInfo, a0);
					parseFlags(texture, a0);
					if ('faces' in a0) {
						var face_input = a0.faces;
						check$1(Array.isArray(face_input) && face_input.length === 6,
							'cube faces must be a length 6 array');
						for (i = 0; i < 6; ++i) {
							check$1(typeof face_input[i] === 'object' && !!face_input[i],
								'invalid input for cube map face');
							copyFlags(faces[i], texture);
							parseMipMapFromObject(faces[i], face_input[i]);
						}
					} else {
						for (i = 0; i < 6; ++i) {
							parseMipMapFromObject(faces[i], a0);
						}
					}
				}
			} else {
				check$1.raise('invalid arguments to cube map');
			}

			copyFlags(texture, faces[0]);

			if (!limits.npotTextureCube) {
				check$1(isPow2$1(texture.width) && isPow2$1(texture.height), 'your browser does not support non power or two texture dimensions');
			}

			if (texInfo.genMipmaps) {
				texture.mipmask = (faces[0].width << 1) - 1;
			} else {
				texture.mipmask = faces[0].mipmask;
			}

			check$1.textureCube(texture, texInfo, faces, limits);
			texture.internalformat = faces[0].internalformat;

			reglTextureCube.width = faces[0].width;
			reglTextureCube.height = faces[0].height;

			tempBind(texture);
			for (i = 0; i < 6; ++i) {
				setMipMap(faces[i], GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + i);
			}
			setTexInfo(texInfo, GL_TEXTURE_CUBE_MAP$1);
			tempRestore();

			if (config.profile) {
				texture.stats.size = getTextureSize(
					texture.internalformat,
					texture.type,
					reglTextureCube.width,
					reglTextureCube.height,
					texInfo.genMipmaps,
					true);
			}

			reglTextureCube.format = textureFormatsInvert[texture.internalformat];
			reglTextureCube.type = textureTypesInvert[texture.type];

			reglTextureCube.mag = magFiltersInvert[texInfo.magFilter];
			reglTextureCube.min = minFiltersInvert[texInfo.minFilter];

			reglTextureCube.wrapS = wrapModesInvert[texInfo.wrapS];
			reglTextureCube.wrapT = wrapModesInvert[texInfo.wrapT];

			for (i = 0; i < 6; ++i) {
				freeMipMap(faces[i]);
			}

			return reglTextureCube
		}

		function subimage (face, image, x_, y_, level_) {
			check$1(!!image, 'must specify image data');
			check$1(typeof face === 'number' && face === (face | 0) &&
				face >= 0 && face < 6, 'invalid face');

			var x = x_ | 0;
			var y = y_ | 0;
			var level = level_ | 0;

			var imageData = allocImage();
			copyFlags(imageData, texture);
			imageData.width = 0;
			imageData.height = 0;
			parseImage(imageData, image);
			imageData.width = imageData.width || ((texture.width >> level) - x);
			imageData.height = imageData.height || ((texture.height >> level) - y);

			check$1(
				texture.type === imageData.type &&
				texture.format === imageData.format &&
				texture.internalformat === imageData.internalformat,
				'incompatible format for texture.subimage');
			check$1(
				x >= 0 && y >= 0 &&
				x + imageData.width <= texture.width &&
				y + imageData.height <= texture.height,
				'texture.subimage write out of bounds');
			check$1(
				texture.mipmask & (1 << level),
				'missing mipmap data');
			check$1(
				imageData.data || imageData.element || imageData.needsCopy,
				'missing image data');

			tempBind(texture);
			setSubImage(imageData, GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + face, x, y, level);
			tempRestore();

			freeImage(imageData);

			return reglTextureCube
		}

		function resize (radius_) {
			var radius = radius_ | 0;
			if (radius === texture.width) {
				return
			}

			reglTextureCube.width = texture.width = radius;
			reglTextureCube.height = texture.height = radius;

			tempBind(texture);
			for (var i = 0; i < 6; ++i) {
				for (var j = 0; texture.mipmask >> j; ++j) {
					gl.texImage2D(
						GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + i,
						j,
						texture.format,
						radius >> j,
						radius >> j,
						0,
						texture.format,
						texture.type,
						null);
				}
			}
			tempRestore();

			if (config.profile) {
				texture.stats.size = getTextureSize(
					texture.internalformat,
					texture.type,
					reglTextureCube.width,
					reglTextureCube.height,
					false,
					true);
			}

			return reglTextureCube
		}

		reglTextureCube(a0, a1, a2, a3, a4, a5);

		reglTextureCube.subimage = subimage;
		reglTextureCube.resize = resize;
		reglTextureCube._reglType = 'textureCube';
		reglTextureCube._texture = texture;
		if (config.profile) {
			reglTextureCube.stats = texture.stats;
		}
		reglTextureCube.destroy = function () {
			texture.decRef();
		};

		return reglTextureCube
	}

	// Called when regl is destroyed
	function destroyTextures () {
		for (var i = 0; i < numTexUnits; ++i) {
			gl.activeTexture(GL_TEXTURE0$1 + i);
			gl.bindTexture(GL_TEXTURE_2D$1, null);
			textureUnits[i] = null;
		}
		values(textureSet).forEach(destroy);

		stats.cubeCount = 0;
		stats.textureCount = 0;
	}

	if (config.profile) {
		stats.getTotalTextureSize = function () {
			var total = 0;
			Object.keys(textureSet).forEach(function (key) {
				total += textureSet[key].stats.size;
			});
			return total
		};
	}

	function restoreTextures () {
		for (var i = 0; i < numTexUnits; ++i) {
			var tex = textureUnits[i];
			if (tex) {
				tex.bindCount = 0;
				tex.unit = -1;
				textureUnits[i] = null;
			}
		}

		values(textureSet).forEach(function (texture) {
			texture.texture = gl.createTexture();
			gl.bindTexture(texture.target, texture.texture);
			for (var i = 0; i < 32; ++i) {
				if ((texture.mipmask & (1 << i)) === 0) {
					continue
				}
				if (texture.target === GL_TEXTURE_2D$1) {
					gl.texImage2D(GL_TEXTURE_2D$1,
						i,
						texture.internalformat,
						texture.width >> i,
						texture.height >> i,
						0,
						texture.internalformat,
						texture.type,
						null);
				} else {
					for (var j = 0; j < 6; ++j) {
						gl.texImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + j,
							i,
							texture.internalformat,
							texture.width >> i,
							texture.height >> i,
							0,
							texture.internalformat,
							texture.type,
							null);
					}
				}
			}
			setTexInfo(texture.texInfo, texture.target);
		});
	}

	return {
		create2D: createTexture2D,
		createCube: createTextureCube,
		clear: destroyTextures,
		getTexture: function (wrapper) {
			return null
		},
		restore: restoreTextures
	}
}

var GL_RENDERBUFFER = 0x8D41;

var GL_RGBA4$1 = 0x8056;
var GL_RGB5_A1$1 = 0x8057;
var GL_RGB565$1 = 0x8D62;
var GL_DEPTH_COMPONENT16 = 0x81A5;
var GL_STENCIL_INDEX8 = 0x8D48;
var GL_DEPTH_STENCIL$1 = 0x84F9;

var GL_SRGB8_ALPHA8_EXT = 0x8C43;

var GL_RGBA32F_EXT = 0x8814;

var GL_RGBA16F_EXT = 0x881A;
var GL_RGB16F_EXT = 0x881B;

var FORMAT_SIZES = [];

FORMAT_SIZES[GL_RGBA4$1] = 2;
FORMAT_SIZES[GL_RGB5_A1$1] = 2;
FORMAT_SIZES[GL_RGB565$1] = 2;

FORMAT_SIZES[GL_DEPTH_COMPONENT16] = 2;
FORMAT_SIZES[GL_STENCIL_INDEX8] = 1;
FORMAT_SIZES[GL_DEPTH_STENCIL$1] = 4;

FORMAT_SIZES[GL_SRGB8_ALPHA8_EXT] = 4;
FORMAT_SIZES[GL_RGBA32F_EXT] = 16;
FORMAT_SIZES[GL_RGBA16F_EXT] = 8;
FORMAT_SIZES[GL_RGB16F_EXT] = 6;

function getRenderbufferSize (format, width, height) {
	return FORMAT_SIZES[format] * width * height
}

var wrapRenderbuffers = function (gl, extensions, limits, stats, config) {
	var formatTypes = {
		'rgba4': GL_RGBA4$1,
		'rgb565': GL_RGB565$1,
		'rgb5 a1': GL_RGB5_A1$1,
		'depth': GL_DEPTH_COMPONENT16,
		'stencil': GL_STENCIL_INDEX8,
		'depth stencil': GL_DEPTH_STENCIL$1
	};

	if (extensions.ext_srgb) {
		formatTypes['srgba'] = GL_SRGB8_ALPHA8_EXT;
	}

	if (extensions.ext_color_buffer_half_float) {
		formatTypes['rgba16f'] = GL_RGBA16F_EXT;
		formatTypes['rgb16f'] = GL_RGB16F_EXT;
	}

	if (extensions.webgl_color_buffer_float) {
		formatTypes['rgba32f'] = GL_RGBA32F_EXT;
	}

	var formatTypesInvert = [];
	Object.keys(formatTypes).forEach(function (key) {
		var val = formatTypes[key];
		formatTypesInvert[val] = key;
	});

	var renderbufferCount = 0;
	var renderbufferSet = {};

	function REGLRenderbuffer (renderbuffer) {
		this.id = renderbufferCount++;
		this.refCount = 1;

		this.renderbuffer = renderbuffer;

		this.format = GL_RGBA4$1;
		this.width = 0;
		this.height = 0;

		if (config.profile) {
			this.stats = {size: 0};
		}
	}

	REGLRenderbuffer.prototype.decRef = function () {
		if (--this.refCount <= 0) {
			destroy(this);
		}
	};

	function destroy (rb) {
		var handle = rb.renderbuffer;
		check$1(handle, 'must not double destroy renderbuffer');
		gl.bindRenderbuffer(GL_RENDERBUFFER, null);
		gl.deleteRenderbuffer(handle);
		rb.renderbuffer = null;
		rb.refCount = 0;
		delete renderbufferSet[rb.id];
		stats.renderbufferCount--;
	}

	function createRenderbuffer (a, b) {
		var renderbuffer = new REGLRenderbuffer(gl.createRenderbuffer());
		renderbufferSet[renderbuffer.id] = renderbuffer;
		stats.renderbufferCount++;

		function reglRenderbuffer (a, b) {
			var w = 0;
			var h = 0;
			var format = GL_RGBA4$1;

			if (typeof a === 'object' && a) {
				var options = a;
				if ('shape' in options) {
					var shape = options.shape;
					check$1(Array.isArray(shape) && shape.length >= 2,
						'invalid renderbuffer shape');
					w = shape[0] | 0;
					h = shape[1] | 0;
				} else {
					if ('radius' in options) {
						w = h = options.radius | 0;
					}
					if ('width' in options) {
						w = options.width | 0;
					}
					if ('height' in options) {
						h = options.height | 0;
					}
				}
				if ('format' in options) {
					check$1.parameter(options.format, formatTypes,
						'invalid renderbuffer format');
					format = formatTypes[options.format];
				}
			} else if (typeof a === 'number') {
				w = a | 0;
				if (typeof b === 'number') {
					h = b | 0;
				} else {
					h = w;
				}
			} else if (!a) {
				w = h = 1;
			} else {
				check$1.raise('invalid arguments to renderbuffer constructor');
			}

			// check shape
			check$1(
				w > 0 && h > 0 &&
				w <= limits.maxRenderbufferSize && h <= limits.maxRenderbufferSize,
				'invalid renderbuffer size');

			if (w === renderbuffer.width &&
					h === renderbuffer.height &&
					format === renderbuffer.format) {
				return
			}

			reglRenderbuffer.width = renderbuffer.width = w;
			reglRenderbuffer.height = renderbuffer.height = h;
			renderbuffer.format = format;

			gl.bindRenderbuffer(GL_RENDERBUFFER, renderbuffer.renderbuffer);
			gl.renderbufferStorage(GL_RENDERBUFFER, format, w, h);

			check$1(
				gl.getError() === 0,
				'invalid render buffer format');

			if (config.profile) {
				renderbuffer.stats.size = getRenderbufferSize(renderbuffer.format, renderbuffer.width, renderbuffer.height);
			}
			reglRenderbuffer.format = formatTypesInvert[renderbuffer.format];

			return reglRenderbuffer
		}

		function resize (w_, h_) {
			var w = w_ | 0;
			var h = (h_ | 0) || w;

			if (w === renderbuffer.width && h === renderbuffer.height) {
				return reglRenderbuffer
			}

			// check shape
			check$1(
				w > 0 && h > 0 &&
				w <= limits.maxRenderbufferSize && h <= limits.maxRenderbufferSize,
				'invalid renderbuffer size');

			reglRenderbuffer.width = renderbuffer.width = w;
			reglRenderbuffer.height = renderbuffer.height = h;

			gl.bindRenderbuffer(GL_RENDERBUFFER, renderbuffer.renderbuffer);
			gl.renderbufferStorage(GL_RENDERBUFFER, renderbuffer.format, w, h);

			check$1(
				gl.getError() === 0,
				'invalid render buffer format');

			// also, recompute size.
			if (config.profile) {
				renderbuffer.stats.size = getRenderbufferSize(
					renderbuffer.format, renderbuffer.width, renderbuffer.height);
			}

			return reglRenderbuffer
		}

		reglRenderbuffer(a, b);

		reglRenderbuffer.resize = resize;
		reglRenderbuffer._reglType = 'renderbuffer';
		reglRenderbuffer._renderbuffer = renderbuffer;
		if (config.profile) {
			reglRenderbuffer.stats = renderbuffer.stats;
		}
		reglRenderbuffer.destroy = function () {
			renderbuffer.decRef();
		};

		return reglRenderbuffer
	}

	if (config.profile) {
		stats.getTotalRenderbufferSize = function () {
			var total = 0;
			Object.keys(renderbufferSet).forEach(function (key) {
				total += renderbufferSet[key].stats.size;
			});
			return total
		};
	}

	function restoreRenderbuffers () {
		values(renderbufferSet).forEach(function (rb) {
			rb.renderbuffer = gl.createRenderbuffer();
			gl.bindRenderbuffer(GL_RENDERBUFFER, rb.renderbuffer);
			gl.renderbufferStorage(GL_RENDERBUFFER, rb.format, rb.width, rb.height);
		});
		gl.bindRenderbuffer(GL_RENDERBUFFER, null);
	}

	return {
		create: createRenderbuffer,
		clear: function () {
			values(renderbufferSet).forEach(destroy);
		},
		restore: restoreRenderbuffers
	}
};

// We store these constants so that the minifier can inline them
var GL_FRAMEBUFFER$1 = 0x8D40;
var GL_RENDERBUFFER$1 = 0x8D41;

var GL_TEXTURE_2D$2 = 0x0DE1;
var GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 = 0x8515;

var GL_COLOR_ATTACHMENT0$1 = 0x8CE0;
var GL_DEPTH_ATTACHMENT = 0x8D00;
var GL_STENCIL_ATTACHMENT = 0x8D20;
var GL_DEPTH_STENCIL_ATTACHMENT = 0x821A;

var GL_FRAMEBUFFER_COMPLETE$1 = 0x8CD5;
var GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 0x8CD6;
var GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 0x8CD7;
var GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 0x8CD9;
var GL_FRAMEBUFFER_UNSUPPORTED = 0x8CDD;

var GL_HALF_FLOAT_OES$2 = 0x8D61;
var GL_UNSIGNED_BYTE$6 = 0x1401;
var GL_FLOAT$5 = 0x1406;

var GL_RGB$1 = 0x1907;
var GL_RGBA$2 = 0x1908;

var GL_DEPTH_COMPONENT$1 = 0x1902;

var colorTextureFormatEnums = [
	GL_RGB$1,
	GL_RGBA$2
];

// for every texture format, store
// the number of channels
var textureFormatChannels = [];
textureFormatChannels[GL_RGBA$2] = 4;
textureFormatChannels[GL_RGB$1] = 3;

// for every texture type, store
// the size in bytes.
var textureTypeSizes = [];
textureTypeSizes[GL_UNSIGNED_BYTE$6] = 1;
textureTypeSizes[GL_FLOAT$5] = 4;
textureTypeSizes[GL_HALF_FLOAT_OES$2] = 2;

var GL_RGBA4$2 = 0x8056;
var GL_RGB5_A1$2 = 0x8057;
var GL_RGB565$2 = 0x8D62;
var GL_DEPTH_COMPONENT16$1 = 0x81A5;
var GL_STENCIL_INDEX8$1 = 0x8D48;
var GL_DEPTH_STENCIL$2 = 0x84F9;

var GL_SRGB8_ALPHA8_EXT$1 = 0x8C43;

var GL_RGBA32F_EXT$1 = 0x8814;

var GL_RGBA16F_EXT$1 = 0x881A;
var GL_RGB16F_EXT$1 = 0x881B;

var colorRenderbufferFormatEnums = [
	GL_RGBA4$2,
	GL_RGB5_A1$2,
	GL_RGB565$2,
	GL_SRGB8_ALPHA8_EXT$1,
	GL_RGBA16F_EXT$1,
	GL_RGB16F_EXT$1,
	GL_RGBA32F_EXT$1
];

var statusCode = {};
statusCode[GL_FRAMEBUFFER_COMPLETE$1] = 'complete';
statusCode[GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT] = 'incomplete attachment';
statusCode[GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS] = 'incomplete dimensions';
statusCode[GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT] = 'incomplete, missing attachment';
statusCode[GL_FRAMEBUFFER_UNSUPPORTED] = 'unsupported';

function wrapFBOState (
	gl,
	extensions,
	limits,
	textureState,
	renderbufferState,
	stats) {
	var framebufferState = {
		cur: null,
		next: null,
		dirty: false,
		setFBO: null
	};

	var colorTextureFormats = ['rgba'];
	var colorRenderbufferFormats = ['rgba4', 'rgb565', 'rgb5 a1'];

	if (extensions.ext_srgb) {
		colorRenderbufferFormats.push('srgba');
	}

	if (extensions.ext_color_buffer_half_float) {
		colorRenderbufferFormats.push('rgba16f', 'rgb16f');
	}

	if (extensions.webgl_color_buffer_float) {
		colorRenderbufferFormats.push('rgba32f');
	}

	var colorTypes = ['uint8'];
	if (extensions.oes_texture_half_float) {
		colorTypes.push('half float', 'float16');
	}
	if (extensions.oes_texture_float) {
		colorTypes.push('float', 'float32');
	}

	function FramebufferAttachment (target, texture, renderbuffer) {
		this.target = target;
		this.texture = texture;
		this.renderbuffer = renderbuffer;

		var w = 0;
		var h = 0;
		if (texture) {
			w = texture.width;
			h = texture.height;
		} else if (renderbuffer) {
			w = renderbuffer.width;
			h = renderbuffer.height;
		}
		this.width = w;
		this.height = h;
	}

	function decRef (attachment) {
		if (attachment) {
			if (attachment.texture) {
				attachment.texture._texture.decRef();
			}
			if (attachment.renderbuffer) {
				attachment.renderbuffer._renderbuffer.decRef();
			}
		}
	}

	function incRefAndCheckShape (attachment, width, height) {
		if (!attachment) {
			return
		}
		if (attachment.texture) {
			var texture = attachment.texture._texture;
			var tw = Math.max(1, texture.width);
			var th = Math.max(1, texture.height);
			check$1(tw === width && th === height,
				'inconsistent width/height for supplied texture');
			texture.refCount += 1;
		} else {
			var renderbuffer = attachment.renderbuffer._renderbuffer;
			check$1(
				renderbuffer.width === width && renderbuffer.height === height,
				'inconsistent width/height for renderbuffer');
			renderbuffer.refCount += 1;
		}
	}

	function attach (location, attachment) {
		if (attachment) {
			if (attachment.texture) {
				gl.framebufferTexture2D(
					GL_FRAMEBUFFER$1,
					location,
					attachment.target,
					attachment.texture._texture.texture,
					0);
			} else {
				gl.framebufferRenderbuffer(
					GL_FRAMEBUFFER$1,
					location,
					GL_RENDERBUFFER$1,
					attachment.renderbuffer._renderbuffer.renderbuffer);
			}
		}
	}

	function parseAttachment (attachment) {
		var target = GL_TEXTURE_2D$2;
		var texture = null;
		var renderbuffer = null;

		var data = attachment;
		if (typeof attachment === 'object') {
			data = attachment.data;
			if ('target' in attachment) {
				target = attachment.target | 0;
			}
		}

		check$1.type(data, 'function', 'invalid attachment data');

		var type = data._reglType;
		if (type === 'texture2d') {
			texture = data;
			check$1(target === GL_TEXTURE_2D$2);
		} else if (type === 'textureCube') {
			texture = data;
			check$1(
				target >= GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 &&
				target < GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 + 6,
				'invalid cube map target');
		} else if (type === 'renderbuffer') {
			renderbuffer = data;
			target = GL_RENDERBUFFER$1;
		} else {
			check$1.raise('invalid regl object for attachment');
		}

		return new FramebufferAttachment(target, texture, renderbuffer)
	}

	function allocAttachment (
		width,
		height,
		isTexture,
		format,
		type) {
		if (isTexture) {
			var texture = textureState.create2D({
				width: width,
				height: height,
				format: format,
				type: type
			});
			texture._texture.refCount = 0;
			return new FramebufferAttachment(GL_TEXTURE_2D$2, texture, null)
		} else {
			var rb = renderbufferState.create({
				width: width,
				height: height,
				format: format
			});
			rb._renderbuffer.refCount = 0;
			return new FramebufferAttachment(GL_RENDERBUFFER$1, null, rb)
		}
	}

	function unwrapAttachment (attachment) {
		return attachment && (attachment.texture || attachment.renderbuffer)
	}

	function resizeAttachment (attachment, w, h) {
		if (attachment) {
			if (attachment.texture) {
				attachment.texture.resize(w, h);
			} else if (attachment.renderbuffer) {
				attachment.renderbuffer.resize(w, h);
			}
			attachment.width = w;
			attachment.height = h;
		}
	}

	var framebufferCount = 0;
	var framebufferSet = {};

	function REGLFramebuffer () {
		this.id = framebufferCount++;
		framebufferSet[this.id] = this;

		this.framebuffer = gl.createFramebuffer();
		this.width = 0;
		this.height = 0;

		this.colorAttachments = [];
		this.depthAttachment = null;
		this.stencilAttachment = null;
		this.depthStencilAttachment = null;
	}

	function decFBORefs (framebuffer) {
		framebuffer.colorAttachments.forEach(decRef);
		decRef(framebuffer.depthAttachment);
		decRef(framebuffer.stencilAttachment);
		decRef(framebuffer.depthStencilAttachment);
	}

	function destroy (framebuffer) {
		var handle = framebuffer.framebuffer;
		check$1(handle, 'must not double destroy framebuffer');
		gl.deleteFramebuffer(handle);
		framebuffer.framebuffer = null;
		stats.framebufferCount--;
		delete framebufferSet[framebuffer.id];
	}

	function updateFramebuffer (framebuffer) {
		var i;

		gl.bindFramebuffer(GL_FRAMEBUFFER$1, framebuffer.framebuffer);
		var colorAttachments = framebuffer.colorAttachments;
		for (i = 0; i < colorAttachments.length; ++i) {
			attach(GL_COLOR_ATTACHMENT0$1 + i, colorAttachments[i]);
		}
		for (i = colorAttachments.length; i < limits.maxColorAttachments; ++i) {
			gl.framebufferTexture2D(
				GL_FRAMEBUFFER$1,
				GL_COLOR_ATTACHMENT0$1 + i,
				GL_TEXTURE_2D$2,
				null,
				0);
		}

		gl.framebufferTexture2D(
			GL_FRAMEBUFFER$1,
			GL_DEPTH_STENCIL_ATTACHMENT,
			GL_TEXTURE_2D$2,
			null,
			0);
		gl.framebufferTexture2D(
			GL_FRAMEBUFFER$1,
			GL_DEPTH_ATTACHMENT,
			GL_TEXTURE_2D$2,
			null,
			0);
		gl.framebufferTexture2D(
			GL_FRAMEBUFFER$1,
			GL_STENCIL_ATTACHMENT,
			GL_TEXTURE_2D$2,
			null,
			0);

		attach(GL_DEPTH_ATTACHMENT, framebuffer.depthAttachment);
		attach(GL_STENCIL_ATTACHMENT, framebuffer.stencilAttachment);
		attach(GL_DEPTH_STENCIL_ATTACHMENT, framebuffer.depthStencilAttachment);

		// Check status code
		var status = gl.checkFramebufferStatus(GL_FRAMEBUFFER$1);
		if (!gl.isContextLost() && status !== GL_FRAMEBUFFER_COMPLETE$1) {
			check$1.raise('framebuffer configuration not supported, status = ' +
				statusCode[status]);
		}

		gl.bindFramebuffer(GL_FRAMEBUFFER$1, framebufferState.next ? framebufferState.next.framebuffer : null);
		framebufferState.cur = framebufferState.next;

		// FIXME: Clear error code here.  This is a work around for a bug in
		// headless-gl
		gl.getError();
	}

	function createFBO (a0, a1) {
		var framebuffer = new REGLFramebuffer();
		stats.framebufferCount++;

		function reglFramebuffer (a, b) {
			var i;

			check$1(framebufferState.next !== framebuffer,
				'can not update framebuffer which is currently in use');

			var width = 0;
			var height = 0;

			var needsDepth = true;
			var needsStencil = true;

			var colorBuffer = null;
			var colorTexture = true;
			var colorFormat = 'rgba';
			var colorType = 'uint8';
			var colorCount = 1;

			var depthBuffer = null;
			var stencilBuffer = null;
			var depthStencilBuffer = null;
			var depthStencilTexture = false;

			if (typeof a === 'number') {
				width = a | 0;
				height = (b | 0) || width;
			} else if (!a) {
				width = height = 1;
			} else {
				check$1.type(a, 'object', 'invalid arguments for framebuffer');
				var options = a;

				if ('shape' in options) {
					var shape = options.shape;
					check$1(Array.isArray(shape) && shape.length >= 2,
						'invalid shape for framebuffer');
					width = shape[0];
					height = shape[1];
				} else {
					if ('radius' in options) {
						width = height = options.radius;
					}
					if ('width' in options) {
						width = options.width;
					}
					if ('height' in options) {
						height = options.height;
					}
				}

				if ('color' in options ||
						'colors' in options) {
					colorBuffer =
						options.color ||
						options.colors;
					if (Array.isArray(colorBuffer)) {
						check$1(
							colorBuffer.length === 1 || extensions.webgl_draw_buffers,
							'multiple render targets not supported');
					}
				}

				if (!colorBuffer) {
					if ('colorCount' in options) {
						colorCount = options.colorCount | 0;
						check$1(colorCount > 0, 'invalid color buffer count');
					}

					if ('colorTexture' in options) {
						colorTexture = !!options.colorTexture;
						colorFormat = 'rgba4';
					}

					if ('colorType' in options) {
						colorType = options.colorType;
						if (!colorTexture) {
							if (colorType === 'half float' || colorType === 'float16') {
								check$1(extensions.ext_color_buffer_half_float,
									'you must enable EXT_color_buffer_half_float to use 16-bit render buffers');
								colorFormat = 'rgba16f';
							} else if (colorType === 'float' || colorType === 'float32') {
								check$1(extensions.webgl_color_buffer_float,
									'you must enable WEBGL_color_buffer_float in order to use 32-bit floating point renderbuffers');
								colorFormat = 'rgba32f';
							}
						} else {
							check$1(extensions.oes_texture_float ||
								!(colorType === 'float' || colorType === 'float32'),
								'you must enable OES_texture_float in order to use floating point framebuffer objects');
							check$1(extensions.oes_texture_half_float ||
								!(colorType === 'half float' || colorType === 'float16'),
								'you must enable OES_texture_half_float in order to use 16-bit floating point framebuffer objects');
						}
						check$1.oneOf(colorType, colorTypes, 'invalid color type');
					}

					if ('colorFormat' in options) {
						colorFormat = options.colorFormat;
						if (colorTextureFormats.indexOf(colorFormat) >= 0) {
							colorTexture = true;
						} else if (colorRenderbufferFormats.indexOf(colorFormat) >= 0) {
							colorTexture = false;
						} else {
							if (colorTexture) {
								check$1.oneOf(
									options.colorFormat, colorTextureFormats,
									'invalid color format for texture');
							} else {
								check$1.oneOf(
									options.colorFormat, colorRenderbufferFormats,
									'invalid color format for renderbuffer');
							}
						}
					}
				}

				if ('depthTexture' in options || 'depthStencilTexture' in options) {
					depthStencilTexture = !!(options.depthTexture ||
						options.depthStencilTexture);
					check$1(!depthStencilTexture || extensions.webgl_depth_texture,
						'webgl_depth_texture extension not supported');
				}

				if ('depth' in options) {
					if (typeof options.depth === 'boolean') {
						needsDepth = options.depth;
					} else {
						depthBuffer = options.depth;
						needsStencil = false;
					}
				}

				if ('stencil' in options) {
					if (typeof options.stencil === 'boolean') {
						needsStencil = options.stencil;
					} else {
						stencilBuffer = options.stencil;
						needsDepth = false;
					}
				}

				if ('depthStencil' in options) {
					if (typeof options.depthStencil === 'boolean') {
						needsDepth = needsStencil = options.depthStencil;
					} else {
						depthStencilBuffer = options.depthStencil;
						needsDepth = false;
						needsStencil = false;
					}
				}
			}

			// parse attachments
			var colorAttachments = null;
			var depthAttachment = null;
			var stencilAttachment = null;
			var depthStencilAttachment = null;

			// Set up color attachments
			if (Array.isArray(colorBuffer)) {
				colorAttachments = colorBuffer.map(parseAttachment);
			} else if (colorBuffer) {
				colorAttachments = [parseAttachment(colorBuffer)];
			} else {
				colorAttachments = new Array(colorCount);
				for (i = 0; i < colorCount; ++i) {
					colorAttachments[i] = allocAttachment(
						width,
						height,
						colorTexture,
						colorFormat,
						colorType);
				}
			}

			check$1(extensions.webgl_draw_buffers || colorAttachments.length <= 1,
				'you must enable the WEBGL_draw_buffers extension in order to use multiple color buffers.');
			check$1(colorAttachments.length <= limits.maxColorAttachments,
				'too many color attachments, not supported');

			width = width || colorAttachments[0].width;
			height = height || colorAttachments[0].height;

			if (depthBuffer) {
				depthAttachment = parseAttachment(depthBuffer);
			} else if (needsDepth && !needsStencil) {
				depthAttachment = allocAttachment(
					width,
					height,
					depthStencilTexture,
					'depth',
					'uint32');
			}

			if (stencilBuffer) {
				stencilAttachment = parseAttachment(stencilBuffer);
			} else if (needsStencil && !needsDepth) {
				stencilAttachment = allocAttachment(
					width,
					height,
					false,
					'stencil',
					'uint8');
			}

			if (depthStencilBuffer) {
				depthStencilAttachment = parseAttachment(depthStencilBuffer);
			} else if (!depthBuffer && !stencilBuffer && needsStencil && needsDepth) {
				depthStencilAttachment = allocAttachment(
					width,
					height,
					depthStencilTexture,
					'depth stencil',
					'depth stencil');
			}

			check$1(
				(!!depthBuffer) + (!!stencilBuffer) + (!!depthStencilBuffer) <= 1,
				'invalid framebuffer configuration, can specify exactly one depth/stencil attachment');

			var commonColorAttachmentSize = null;

			for (i = 0; i < colorAttachments.length; ++i) {
				incRefAndCheckShape(colorAttachments[i], width, height);
				check$1(!colorAttachments[i] ||
					(colorAttachments[i].texture &&
						colorTextureFormatEnums.indexOf(colorAttachments[i].texture._texture.format) >= 0) ||
					(colorAttachments[i].renderbuffer &&
						colorRenderbufferFormatEnums.indexOf(colorAttachments[i].renderbuffer._renderbuffer.format) >= 0),
					'framebuffer color attachment ' + i + ' is invalid');

				if (colorAttachments[i] && colorAttachments[i].texture) {
					var colorAttachmentSize =
							textureFormatChannels[colorAttachments[i].texture._texture.format] *
							textureTypeSizes[colorAttachments[i].texture._texture.type];

					if (commonColorAttachmentSize === null) {
						commonColorAttachmentSize = colorAttachmentSize;
					} else {
						// We need to make sure that all color attachments have the same number of bitplanes
						// (that is, the same numer of bits per pixel)
						// This is required by the GLES2.0 standard. See the beginning of Chapter 4 in that document.
						check$1(commonColorAttachmentSize === colorAttachmentSize,
									'all color attachments much have the same number of bits per pixel.');
					}
				}
			}
			incRefAndCheckShape(depthAttachment, width, height);
			check$1(!depthAttachment ||
				(depthAttachment.texture &&
					depthAttachment.texture._texture.format === GL_DEPTH_COMPONENT$1) ||
				(depthAttachment.renderbuffer &&
					depthAttachment.renderbuffer._renderbuffer.format === GL_DEPTH_COMPONENT16$1),
				'invalid depth attachment for framebuffer object');
			incRefAndCheckShape(stencilAttachment, width, height);
			check$1(!stencilAttachment ||
				(stencilAttachment.renderbuffer &&
					stencilAttachment.renderbuffer._renderbuffer.format === GL_STENCIL_INDEX8$1),
				'invalid stencil attachment for framebuffer object');
			incRefAndCheckShape(depthStencilAttachment, width, height);
			check$1(!depthStencilAttachment ||
				(depthStencilAttachment.texture &&
					depthStencilAttachment.texture._texture.format === GL_DEPTH_STENCIL$2) ||
				(depthStencilAttachment.renderbuffer &&
					depthStencilAttachment.renderbuffer._renderbuffer.format === GL_DEPTH_STENCIL$2),
				'invalid depth-stencil attachment for framebuffer object');

			// decrement references
			decFBORefs(framebuffer);

			framebuffer.width = width;
			framebuffer.height = height;

			framebuffer.colorAttachments = colorAttachments;
			framebuffer.depthAttachment = depthAttachment;
			framebuffer.stencilAttachment = stencilAttachment;
			framebuffer.depthStencilAttachment = depthStencilAttachment;

			reglFramebuffer.color = colorAttachments.map(unwrapAttachment);
			reglFramebuffer.depth = unwrapAttachment(depthAttachment);
			reglFramebuffer.stencil = unwrapAttachment(stencilAttachment);
			reglFramebuffer.depthStencil = unwrapAttachment(depthStencilAttachment);

			reglFramebuffer.width = framebuffer.width;
			reglFramebuffer.height = framebuffer.height;

			updateFramebuffer(framebuffer);

			return reglFramebuffer
		}

		function resize (w_, h_) {
			check$1(framebufferState.next !== framebuffer,
				'can not resize a framebuffer which is currently in use');

			var w = Math.max(w_ | 0, 1);
			var h = Math.max((h_ | 0) || w, 1);
			if (w === framebuffer.width && h === framebuffer.height) {
				return reglFramebuffer
			}

			// resize all buffers
			var colorAttachments = framebuffer.colorAttachments;
			for (var i = 0; i < colorAttachments.length; ++i) {
				resizeAttachment(colorAttachments[i], w, h);
			}
			resizeAttachment(framebuffer.depthAttachment, w, h);
			resizeAttachment(framebuffer.stencilAttachment, w, h);
			resizeAttachment(framebuffer.depthStencilAttachment, w, h);

			framebuffer.width = reglFramebuffer.width = w;
			framebuffer.height = reglFramebuffer.height = h;

			updateFramebuffer(framebuffer);

			return reglFramebuffer
		}

		reglFramebuffer(a0, a1);

		return extend(reglFramebuffer, {
			resize: resize,
			_reglType: 'framebuffer',
			_framebuffer: framebuffer,
			destroy: function () {
				destroy(framebuffer);
				decFBORefs(framebuffer);
			},
			use: function (block) {
				framebufferState.setFBO({
					framebuffer: reglFramebuffer
				}, block);
			}
		})
	}

	function createCubeFBO (options) {
		var faces = Array(6);

		function reglFramebufferCube (a) {
			var i;

			check$1(faces.indexOf(framebufferState.next) < 0,
				'can not update framebuffer which is currently in use');

			var params = {
				color: null
			};

			var radius = 0;

			var colorBuffer = null;
			var colorFormat = 'rgba';
			var colorType = 'uint8';
			var colorCount = 1;

			if (typeof a === 'number') {
				radius = a | 0;
			} else if (!a) {
				radius = 1;
			} else {
				check$1.type(a, 'object', 'invalid arguments for framebuffer');
				var options = a;

				if ('shape' in options) {
					var shape = options.shape;
					check$1(
						Array.isArray(shape) && shape.length >= 2,
						'invalid shape for framebuffer');
					check$1(
						shape[0] === shape[1],
						'cube framebuffer must be square');
					radius = shape[0];
				} else {
					if ('radius' in options) {
						radius = options.radius | 0;
					}
					if ('width' in options) {
						radius = options.width | 0;
						if ('height' in options) {
							check$1(options.height === radius, 'must be square');
						}
					} else if ('height' in options) {
						radius = options.height | 0;
					}
				}

				if ('color' in options ||
						'colors' in options) {
					colorBuffer =
						options.color ||
						options.colors;
					if (Array.isArray(colorBuffer)) {
						check$1(
							colorBuffer.length === 1 || extensions.webgl_draw_buffers,
							'multiple render targets not supported');
					}
				}

				if (!colorBuffer) {
					if ('colorCount' in options) {
						colorCount = options.colorCount | 0;
						check$1(colorCount > 0, 'invalid color buffer count');
					}

					if ('colorType' in options) {
						check$1.oneOf(
							options.colorType, colorTypes,
							'invalid color type');
						colorType = options.colorType;
					}

					if ('colorFormat' in options) {
						colorFormat = options.colorFormat;
						check$1.oneOf(
							options.colorFormat, colorTextureFormats,
							'invalid color format for texture');
					}
				}

				if ('depth' in options) {
					params.depth = options.depth;
				}

				if ('stencil' in options) {
					params.stencil = options.stencil;
				}

				if ('depthStencil' in options) {
					params.depthStencil = options.depthStencil;
				}
			}

			var colorCubes;
			if (colorBuffer) {
				if (Array.isArray(colorBuffer)) {
					colorCubes = [];
					for (i = 0; i < colorBuffer.length; ++i) {
						colorCubes[i] = colorBuffer[i];
					}
				} else {
					colorCubes = [ colorBuffer ];
				}
			} else {
				colorCubes = Array(colorCount);
				var cubeMapParams = {
					radius: radius,
					format: colorFormat,
					type: colorType
				};
				for (i = 0; i < colorCount; ++i) {
					colorCubes[i] = textureState.createCube(cubeMapParams);
				}
			}

			// Check color cubes
			params.color = Array(colorCubes.length);
			for (i = 0; i < colorCubes.length; ++i) {
				var cube = colorCubes[i];
				check$1(
					typeof cube === 'function' && cube._reglType === 'textureCube',
					'invalid cube map');
				radius = radius || cube.width;
				check$1(
					cube.width === radius && cube.height === radius,
					'invalid cube map shape');
				params.color[i] = {
					target: GL_TEXTURE_CUBE_MAP_POSITIVE_X$2,
					data: colorCubes[i]
				};
			}

			for (i = 0; i < 6; ++i) {
				for (var j = 0; j < colorCubes.length; ++j) {
					params.color[j].target = GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 + i;
				}
				// reuse depth-stencil attachments across all cube maps
				if (i > 0) {
					params.depth = faces[0].depth;
					params.stencil = faces[0].stencil;
					params.depthStencil = faces[0].depthStencil;
				}
				if (faces[i]) {
					(faces[i])(params);
				} else {
					faces[i] = createFBO(params);
				}
			}

			return extend(reglFramebufferCube, {
				width: radius,
				height: radius,
				color: colorCubes
			})
		}

		function resize (radius_) {
			var i;
			var radius = radius_ | 0;
			check$1(radius > 0 && radius <= limits.maxCubeMapSize,
				'invalid radius for cube fbo');

			if (radius === reglFramebufferCube.width) {
				return reglFramebufferCube
			}

			var colors = reglFramebufferCube.color;
			for (i = 0; i < colors.length; ++i) {
				colors[i].resize(radius);
			}

			for (i = 0; i < 6; ++i) {
				faces[i].resize(radius);
			}

			reglFramebufferCube.width = reglFramebufferCube.height = radius;

			return reglFramebufferCube
		}

		reglFramebufferCube(options);

		return extend(reglFramebufferCube, {
			faces: faces,
			resize: resize,
			_reglType: 'framebufferCube',
			destroy: function () {
				faces.forEach(function (f) {
					f.destroy();
				});
			}
		})
	}

	function restoreFramebuffers () {
		framebufferState.cur = null;
		framebufferState.next = null;
		framebufferState.dirty = true;
		values(framebufferSet).forEach(function (fb) {
			fb.framebuffer = gl.createFramebuffer();
			updateFramebuffer(fb);
		});
	}

	return extend(framebufferState, {
		getFramebuffer: function (object) {
			if (typeof object === 'function' && object._reglType === 'framebuffer') {
				var fbo = object._framebuffer;
				if (fbo instanceof REGLFramebuffer) {
					return fbo
				}
			}
			return null
		},
		create: createFBO,
		createCube: createCubeFBO,
		clear: function () {
			values(framebufferSet).forEach(destroy);
		},
		restore: restoreFramebuffers
	})
}

var GL_FLOAT$6 = 5126;

function AttributeRecord () {
	this.state = 0;

	this.x = 0.0;
	this.y = 0.0;
	this.z = 0.0;
	this.w = 0.0;

	this.buffer = null;
	this.size = 0;
	this.normalized = false;
	this.type = GL_FLOAT$6;
	this.offset = 0;
	this.stride = 0;
	this.divisor = 0;
}

function wrapAttributeState (
	gl,
	extensions,
	limits,
	stringStore) {
	var NUM_ATTRIBUTES = limits.maxAttributes;
	var attributeBindings = new Array(NUM_ATTRIBUTES);
	for (var i = 0; i < NUM_ATTRIBUTES; ++i) {
		attributeBindings[i] = new AttributeRecord();
	}

	return {
		Record: AttributeRecord,
		scope: {},
		state: attributeBindings
	}
}

var GL_FRAGMENT_SHADER = 35632;
var GL_VERTEX_SHADER = 35633;

var GL_ACTIVE_UNIFORMS = 0x8B86;
var GL_ACTIVE_ATTRIBUTES = 0x8B89;

function wrapShaderState (gl, stringStore, stats, config) {
	// ===================================================
	// glsl compilation and linking
	// ===================================================
	var fragShaders = {};
	var vertShaders = {};

	function ActiveInfo (name, id, location, info) {
		this.name = name;
		this.id = id;
		this.location = location;
		this.info = info;
	}

	function insertActiveInfo (list, info) {
		for (var i = 0; i < list.length; ++i) {
			if (list[i].id === info.id) {
				list[i].location = info.location;
				return
			}
		}
		list.push(info);
	}

	function getShader (type, id, command) {
		var cache = type === GL_FRAGMENT_SHADER ? fragShaders : vertShaders;
		var shader = cache[id];

		if (!shader) {
			var source = stringStore.str(id);
			shader = gl.createShader(type);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			check$1.shaderError(gl, shader, source, type, command);
			cache[id] = shader;
		}

		return shader
	}

	// ===================================================
	// program linking
	// ===================================================
	var programCache = {};
	var programList = [];

	var PROGRAM_COUNTER = 0;

	function REGLProgram (fragId, vertId) {
		this.id = PROGRAM_COUNTER++;
		this.fragId = fragId;
		this.vertId = vertId;
		this.program = null;
		this.uniforms = [];
		this.attributes = [];

		if (config.profile) {
			this.stats = {
				uniformsCount: 0,
				attributesCount: 0
			};
		}
	}

	function linkProgram (desc, command) {
		var i, info;

		// -------------------------------
		// compile & link
		// -------------------------------
		var fragShader = getShader(GL_FRAGMENT_SHADER, desc.fragId);
		var vertShader = getShader(GL_VERTEX_SHADER, desc.vertId);

		var program = desc.program = gl.createProgram();
		gl.attachShader(program, fragShader);
		gl.attachShader(program, vertShader);
		gl.linkProgram(program);
		check$1.linkError(
			gl,
			program,
			stringStore.str(desc.fragId),
			stringStore.str(desc.vertId),
			command);

		// -------------------------------
		// grab uniforms
		// -------------------------------
		var numUniforms = gl.getProgramParameter(program, GL_ACTIVE_UNIFORMS);
		if (config.profile) {
			desc.stats.uniformsCount = numUniforms;
		}
		var uniforms = desc.uniforms;
		for (i = 0; i < numUniforms; ++i) {
			info = gl.getActiveUniform(program, i);
			if (info) {
				if (info.size > 1) {
					for (var j = 0; j < info.size; ++j) {
						var name = info.name.replace('[0]', '[' + j + ']');
						insertActiveInfo(uniforms, new ActiveInfo(
							name,
							stringStore.id(name),
							gl.getUniformLocation(program, name),
							info));
					}
				} else {
					insertActiveInfo(uniforms, new ActiveInfo(
						info.name,
						stringStore.id(info.name),
						gl.getUniformLocation(program, info.name),
						info));
				}
			}
		}

		// -------------------------------
		// grab attributes
		// -------------------------------
		var numAttributes = gl.getProgramParameter(program, GL_ACTIVE_ATTRIBUTES);
		if (config.profile) {
			desc.stats.attributesCount = numAttributes;
		}

		var attributes = desc.attributes;
		for (i = 0; i < numAttributes; ++i) {
			info = gl.getActiveAttrib(program, i);
			if (info) {
				insertActiveInfo(attributes, new ActiveInfo(
					info.name,
					stringStore.id(info.name),
					gl.getAttribLocation(program, info.name),
					info));
			}
		}
	}

	if (config.profile) {
		stats.getMaxUniformsCount = function () {
			var m = 0;
			programList.forEach(function (desc) {
				if (desc.stats.uniformsCount > m) {
					m = desc.stats.uniformsCount;
				}
			});
			return m
		};

		stats.getMaxAttributesCount = function () {
			var m = 0;
			programList.forEach(function (desc) {
				if (desc.stats.attributesCount > m) {
					m = desc.stats.attributesCount;
				}
			});
			return m
		};
	}

	function restoreShaders () {
		fragShaders = {};
		vertShaders = {};
		for (var i = 0; i < programList.length; ++i) {
			linkProgram(programList[i]);
		}
	}

	return {
		clear: function () {
			var deleteShader = gl.deleteShader.bind(gl);
			values(fragShaders).forEach(deleteShader);
			fragShaders = {};
			values(vertShaders).forEach(deleteShader);
			vertShaders = {};

			programList.forEach(function (desc) {
				gl.deleteProgram(desc.program);
			});
			programList.length = 0;
			programCache = {};

			stats.shaderCount = 0;
		},

		program: function (vertId, fragId, command) {
			check$1.command(vertId >= 0, 'missing vertex shader', command);
			check$1.command(fragId >= 0, 'missing fragment shader', command);

			var cache = programCache[fragId];
			if (!cache) {
				cache = programCache[fragId] = {};
			}
			var program = cache[vertId];
			if (!program) {
				program = new REGLProgram(fragId, vertId);
				stats.shaderCount++;

				linkProgram(program, command);
				cache[vertId] = program;
				programList.push(program);
			}
			return program
		},

		restore: restoreShaders,

		shader: getShader,

		frag: -1,
		vert: -1
	}
}

var GL_RGBA$3 = 6408;
var GL_UNSIGNED_BYTE$7 = 5121;
var GL_PACK_ALIGNMENT = 0x0D05;
var GL_FLOAT$7 = 0x1406; // 5126

function wrapReadPixels (
	gl,
	framebufferState,
	reglPoll,
	context,
	glAttributes,
	extensions,
	limits) {
	function readPixelsImpl (input) {
		var type;
		if (framebufferState.next === null) {
			check$1(
				glAttributes.preserveDrawingBuffer,
				'you must create a webgl context with "preserveDrawingBuffer":true in order to read pixels from the drawing buffer');
			type = GL_UNSIGNED_BYTE$7;
		} else {
			check$1(
				framebufferState.next.colorAttachments[0].texture !== null,
					'You cannot read from a renderbuffer');
			type = framebufferState.next.colorAttachments[0].texture._texture.type;

			if (extensions.oes_texture_float) {
				check$1(
					type === GL_UNSIGNED_BYTE$7 || type === GL_FLOAT$7,
					'Reading from a framebuffer is only allowed for the types \'uint8\' and \'float\'');

				if (type === GL_FLOAT$7) {
					check$1(limits.readFloat, 'Reading \'float\' values is not permitted in your browser. For a fallback, please see: https://www.npmjs.com/package/glsl-read-float');
				}
			} else {
				check$1(
					type === GL_UNSIGNED_BYTE$7,
					'Reading from a framebuffer is only allowed for the type \'uint8\'');
			}
		}

		var x = 0;
		var y = 0;
		var width = context.framebufferWidth;
		var height = context.framebufferHeight;
		var data = null;

		if (isTypedArray(input)) {
			data = input;
		} else if (input) {
			check$1.type(input, 'object', 'invalid arguments to regl.read()');
			x = input.x | 0;
			y = input.y | 0;
			check$1(
				x >= 0 && x < context.framebufferWidth,
				'invalid x offset for regl.read');
			check$1(
				y >= 0 && y < context.framebufferHeight,
				'invalid y offset for regl.read');
			width = (input.width || (context.framebufferWidth - x)) | 0;
			height = (input.height || (context.framebufferHeight - y)) | 0;
			data = input.data || null;
		}

		// sanity check input.data
		if (data) {
			if (type === GL_UNSIGNED_BYTE$7) {
				check$1(
					data instanceof Uint8Array,
					'buffer must be \'Uint8Array\' when reading from a framebuffer of type \'uint8\'');
			} else if (type === GL_FLOAT$7) {
				check$1(
					data instanceof Float32Array,
					'buffer must be \'Float32Array\' when reading from a framebuffer of type \'float\'');
			}
		}

		check$1(
			width > 0 && width + x <= context.framebufferWidth,
			'invalid width for read pixels');
		check$1(
			height > 0 && height + y <= context.framebufferHeight,
			'invalid height for read pixels');

		// Update WebGL state
		reglPoll();

		// Compute size
		var size = width * height * 4;

		// Allocate data
		if (!data) {
			if (type === GL_UNSIGNED_BYTE$7) {
				data = new Uint8Array(size);
			} else if (type === GL_FLOAT$7) {
				data = data || new Float32Array(size);
			}
		}

		// Type check
		check$1.isTypedArray(data, 'data buffer for regl.read() must be a typedarray');
		check$1(data.byteLength >= size, 'data buffer for regl.read() too small');

		// Run read pixels
		gl.pixelStorei(GL_PACK_ALIGNMENT, 4);
		gl.readPixels(x, y, width, height, GL_RGBA$3,
									type,
									data);

		return data
	}

	function readPixelsFBO (options) {
		var result;
		framebufferState.setFBO({
			framebuffer: options.framebuffer
		}, function () {
			result = readPixelsImpl(options);
		});
		return result
	}

	function readPixels (options) {
		if (!options || !('framebuffer' in options)) {
			return readPixelsImpl(options)
		} else {
			return readPixelsFBO(options)
		}
	}

	return readPixels
}

function slice (x) {
	return Array.prototype.slice.call(x)
}

function join (x) {
	return slice(x).join('')
}

function createEnvironment () {
	// Unique variable id counter
	var varCounter = 0;

	// Linked values are passed from this scope into the generated code block
	// Calling link() passes a value into the generated scope and returns
	// the variable name which it is bound to
	var linkedNames = [];
	var linkedValues = [];
	function link (value) {
		for (var i = 0; i < linkedValues.length; ++i) {
			if (linkedValues[i] === value) {
				return linkedNames[i]
			}
		}

		var name = 'g' + (varCounter++);
		linkedNames.push(name);
		linkedValues.push(value);
		return name
	}

	// create a code block
	function block () {
		var code = [];
		function push () {
			code.push.apply(code, slice(arguments));
		}

		var vars = [];
		function def () {
			var name = 'v' + (varCounter++);
			vars.push(name);

			if (arguments.length > 0) {
				code.push(name, '=');
				code.push.apply(code, slice(arguments));
				code.push(';');
			}

			return name
		}

		return extend(push, {
			def: def,
			toString: function () {
				return join([
					(vars.length > 0 ? 'var ' + vars.join(',') + ';' : ''),
					join(code)
				])
			}
		})
	}

	function scope () {
		var entry = block();
		var exit = block();

		var entryToString = entry.toString;
		var exitToString = exit.toString;

		function save (object, prop) {
			exit(object, prop, '=', entry.def(object, prop), ';');
		}

		return extend(function () {
			entry.apply(entry, slice(arguments));
		}, {
			def: entry.def,
			entry: entry,
			exit: exit,
			save: save,
			set: function (object, prop, value) {
				save(object, prop);
				entry(object, prop, '=', value, ';');
			},
			toString: function () {
				return entryToString() + exitToString()
			}
		})
	}

	function conditional () {
		var pred = join(arguments);
		var thenBlock = scope();
		var elseBlock = scope();

		var thenToString = thenBlock.toString;
		var elseToString = elseBlock.toString;

		return extend(thenBlock, {
			then: function () {
				thenBlock.apply(thenBlock, slice(arguments));
				return this
			},
			else: function () {
				elseBlock.apply(elseBlock, slice(arguments));
				return this
			},
			toString: function () {
				var elseClause = elseToString();
				if (elseClause) {
					elseClause = 'else{' + elseClause + '}';
				}
				return join([
					'if(', pred, '){',
					thenToString(),
					'}', elseClause
				])
			}
		})
	}

	// procedure list
	var globalBlock = block();
	var procedures = {};
	function proc (name, count) {
		var args = [];
		function arg () {
			var name = 'a' + args.length;
			args.push(name);
			return name
		}

		count = count || 0;
		for (var i = 0; i < count; ++i) {
			arg();
		}

		var body = scope();
		var bodyToString = body.toString;

		var result = procedures[name] = extend(body, {
			arg: arg,
			toString: function () {
				return join([
					'function(', args.join(), '){',
					bodyToString(),
					'}'
				])
			}
		});

		return result
	}

	function compile () {
		var code = ['"use strict";',
			globalBlock,
			'return {'];
		Object.keys(procedures).forEach(function (name) {
			code.push('"', name, '":', procedures[name].toString(), ',');
		});
		code.push('}');
		var src = join(code)
			.replace(/;/g, ';\n')
			.replace(/}/g, '}\n')
			.replace(/{/g, '{\n');
		var proc = Function.apply(null, linkedNames.concat(src));
		return proc.apply(null, linkedValues)
	}

	return {
		global: globalBlock,
		link: link,
		block: block,
		proc: proc,
		scope: scope,
		cond: conditional,
		compile: compile
	}
}

// "cute" names for vector components
var CUTE_COMPONENTS = 'xyzw'.split('');

var GL_UNSIGNED_BYTE$8 = 5121;

var ATTRIB_STATE_POINTER = 1;
var ATTRIB_STATE_CONSTANT = 2;

var DYN_FUNC$1 = 0;
var DYN_PROP$1 = 1;
var DYN_CONTEXT$1 = 2;
var DYN_STATE$1 = 3;
var DYN_THUNK = 4;

var S_DITHER = 'dither';
var S_BLEND_ENABLE = 'blend.enable';
var S_BLEND_COLOR = 'blend.color';
var S_BLEND_EQUATION = 'blend.equation';
var S_BLEND_FUNC = 'blend.func';
var S_DEPTH_ENABLE = 'depth.enable';
var S_DEPTH_FUNC = 'depth.func';
var S_DEPTH_RANGE = 'depth.range';
var S_DEPTH_MASK = 'depth.mask';
var S_COLOR_MASK = 'colorMask';
var S_CULL_ENABLE = 'cull.enable';
var S_CULL_FACE = 'cull.face';
var S_FRONT_FACE = 'frontFace';
var S_LINE_WIDTH = 'lineWidth';
var S_POLYGON_OFFSET_ENABLE = 'polygonOffset.enable';
var S_POLYGON_OFFSET_OFFSET = 'polygonOffset.offset';
var S_SAMPLE_ALPHA = 'sample.alpha';
var S_SAMPLE_ENABLE = 'sample.enable';
var S_SAMPLE_COVERAGE = 'sample.coverage';
var S_STENCIL_ENABLE = 'stencil.enable';
var S_STENCIL_MASK = 'stencil.mask';
var S_STENCIL_FUNC = 'stencil.func';
var S_STENCIL_OPFRONT = 'stencil.opFront';
var S_STENCIL_OPBACK = 'stencil.opBack';
var S_SCISSOR_ENABLE = 'scissor.enable';
var S_SCISSOR_BOX = 'scissor.box';
var S_VIEWPORT = 'viewport';

var S_PROFILE = 'profile';

var S_FRAMEBUFFER = 'framebuffer';
var S_VERT = 'vert';
var S_FRAG = 'frag';
var S_ELEMENTS = 'elements';
var S_PRIMITIVE = 'primitive';
var S_COUNT = 'count';
var S_OFFSET = 'offset';
var S_INSTANCES = 'instances';

var SUFFIX_WIDTH = 'Width';
var SUFFIX_HEIGHT = 'Height';

var S_FRAMEBUFFER_WIDTH = S_FRAMEBUFFER + SUFFIX_WIDTH;
var S_FRAMEBUFFER_HEIGHT = S_FRAMEBUFFER + SUFFIX_HEIGHT;
var S_VIEWPORT_WIDTH = S_VIEWPORT + SUFFIX_WIDTH;
var S_VIEWPORT_HEIGHT = S_VIEWPORT + SUFFIX_HEIGHT;
var S_DRAWINGBUFFER = 'drawingBuffer';
var S_DRAWINGBUFFER_WIDTH = S_DRAWINGBUFFER + SUFFIX_WIDTH;
var S_DRAWINGBUFFER_HEIGHT = S_DRAWINGBUFFER + SUFFIX_HEIGHT;

var NESTED_OPTIONS = [
	S_BLEND_FUNC,
	S_BLEND_EQUATION,
	S_STENCIL_FUNC,
	S_STENCIL_OPFRONT,
	S_STENCIL_OPBACK,
	S_SAMPLE_COVERAGE,
	S_VIEWPORT,
	S_SCISSOR_BOX,
	S_POLYGON_OFFSET_OFFSET
];

var GL_ARRAY_BUFFER$1 = 34962;
var GL_ELEMENT_ARRAY_BUFFER$1 = 34963;

var GL_FRAGMENT_SHADER$1 = 35632;
var GL_VERTEX_SHADER$1 = 35633;

var GL_TEXTURE_2D$3 = 0x0DE1;
var GL_TEXTURE_CUBE_MAP$2 = 0x8513;

var GL_CULL_FACE = 0x0B44;
var GL_BLEND = 0x0BE2;
var GL_DITHER = 0x0BD0;
var GL_STENCIL_TEST = 0x0B90;
var GL_DEPTH_TEST = 0x0B71;
var GL_SCISSOR_TEST = 0x0C11;
var GL_POLYGON_OFFSET_FILL = 0x8037;
var GL_SAMPLE_ALPHA_TO_COVERAGE = 0x809E;
var GL_SAMPLE_COVERAGE = 0x80A0;

var GL_FLOAT$8 = 5126;
var GL_FLOAT_VEC2 = 35664;
var GL_FLOAT_VEC3 = 35665;
var GL_FLOAT_VEC4 = 35666;
var GL_INT$3 = 5124;
var GL_INT_VEC2 = 35667;
var GL_INT_VEC3 = 35668;
var GL_INT_VEC4 = 35669;
var GL_BOOL = 35670;
var GL_BOOL_VEC2 = 35671;
var GL_BOOL_VEC3 = 35672;
var GL_BOOL_VEC4 = 35673;
var GL_FLOAT_MAT2 = 35674;
var GL_FLOAT_MAT3 = 35675;
var GL_FLOAT_MAT4 = 35676;
var GL_SAMPLER_2D = 35678;
var GL_SAMPLER_CUBE = 35680;

var GL_TRIANGLES$1 = 4;

var GL_FRONT = 1028;
var GL_BACK = 1029;
var GL_CW = 0x0900;
var GL_CCW = 0x0901;
var GL_MIN_EXT = 0x8007;
var GL_MAX_EXT = 0x8008;
var GL_ALWAYS = 519;
var GL_KEEP = 7680;
var GL_ZERO = 0;
var GL_ONE = 1;
var GL_FUNC_ADD = 0x8006;
var GL_LESS = 513;

var GL_FRAMEBUFFER$2 = 0x8D40;
var GL_COLOR_ATTACHMENT0$2 = 0x8CE0;

var blendFuncs = {
	'0': 0,
	'1': 1,
	'zero': 0,
	'one': 1,
	'src color': 768,
	'one minus src color': 769,
	'src alpha': 770,
	'one minus src alpha': 771,
	'dst color': 774,
	'one minus dst color': 775,
	'dst alpha': 772,
	'one minus dst alpha': 773,
	'constant color': 32769,
	'one minus constant color': 32770,
	'constant alpha': 32771,
	'one minus constant alpha': 32772,
	'src alpha saturate': 776
};

// There are invalid values for srcRGB and dstRGB. See:
// https://www.khronos.org/registry/webgl/specs/1.0/#6.13
// https://github.com/KhronosGroup/WebGL/blob/0d3201f5f7ec3c0060bc1f04077461541f1987b9/conformance-suites/1.0.3/conformance/misc/webgl-specific.html#L56
var invalidBlendCombinations = [
	'constant color, constant alpha',
	'one minus constant color, constant alpha',
	'constant color, one minus constant alpha',
	'one minus constant color, one minus constant alpha',
	'constant alpha, constant color',
	'constant alpha, one minus constant color',
	'one minus constant alpha, constant color',
	'one minus constant alpha, one minus constant color'
];

var compareFuncs = {
	'never': 512,
	'less': 513,
	'<': 513,
	'equal': 514,
	'=': 514,
	'==': 514,
	'===': 514,
	'lequal': 515,
	'<=': 515,
	'greater': 516,
	'>': 516,
	'notequal': 517,
	'!=': 517,
	'!==': 517,
	'gequal': 518,
	'>=': 518,
	'always': 519
};

var stencilOps = {
	'0': 0,
	'zero': 0,
	'keep': 7680,
	'replace': 7681,
	'increment': 7682,
	'decrement': 7683,
	'increment wrap': 34055,
	'decrement wrap': 34056,
	'invert': 5386
};

var shaderType = {
	'frag': GL_FRAGMENT_SHADER$1,
	'vert': GL_VERTEX_SHADER$1
};

var orientationType = {
	'cw': GL_CW,
	'ccw': GL_CCW
};

function isBufferArgs (x) {
	return Array.isArray(x) ||
		isTypedArray(x) ||
		isNDArrayLike(x)
}

// Make sure viewport is processed first
function sortState (state) {
	return state.sort(function (a, b) {
		if (a === S_VIEWPORT) {
			return -1
		} else if (b === S_VIEWPORT) {
			return 1
		}
		return (a < b) ? -1 : 1
	})
}

function Declaration (thisDep, contextDep, propDep, append) {
	this.thisDep = thisDep;
	this.contextDep = contextDep;
	this.propDep = propDep;
	this.append = append;
}

function isStatic (decl) {
	return decl && !(decl.thisDep || decl.contextDep || decl.propDep)
}

function createStaticDecl (append) {
	return new Declaration(false, false, false, append)
}

function createDynamicDecl (dyn, append) {
	var type = dyn.type;
	if (type === DYN_FUNC$1) {
		var numArgs = dyn.data.length;
		return new Declaration(
			true,
			numArgs >= 1,
			numArgs >= 2,
			append)
	} else if (type === DYN_THUNK) {
		var data = dyn.data;
		return new Declaration(
			data.thisDep,
			data.contextDep,
			data.propDep,
			append)
	} else {
		return new Declaration(
			type === DYN_STATE$1,
			type === DYN_CONTEXT$1,
			type === DYN_PROP$1,
			append)
	}
}

var SCOPE_DECL = new Declaration(false, false, false, function () {});

function reglCore (
	gl,
	stringStore,
	extensions,
	limits,
	bufferState,
	elementState,
	textureState,
	framebufferState,
	uniformState,
	attributeState,
	shaderState,
	drawState,
	contextState,
	timer,
	config) {
	var AttributeRecord = attributeState.Record;

	var blendEquations = {
		'add': 32774,
		'subtract': 32778,
		'reverse subtract': 32779
	};
	if (extensions.ext_blend_minmax) {
		blendEquations.min = GL_MIN_EXT;
		blendEquations.max = GL_MAX_EXT;
	}

	var extInstancing = extensions.angle_instanced_arrays;
	var extDrawBuffers = extensions.webgl_draw_buffers;

	// ===================================================
	// ===================================================
	// WEBGL STATE
	// ===================================================
	// ===================================================
	var currentState = {
		dirty: true,
		profile: config.profile
	};
	var nextState = {};
	var GL_STATE_NAMES = [];
	var GL_FLAGS = {};
	var GL_VARIABLES = {};

	function propName (name) {
		return name.replace('.', '_')
	}

	function stateFlag (sname, cap, init) {
		var name = propName(sname);
		GL_STATE_NAMES.push(sname);
		nextState[name] = currentState[name] = !!init;
		GL_FLAGS[name] = cap;
	}

	function stateVariable (sname, func, init) {
		var name = propName(sname);
		GL_STATE_NAMES.push(sname);
		if (Array.isArray(init)) {
			currentState[name] = init.slice();
			nextState[name] = init.slice();
		} else {
			currentState[name] = nextState[name] = init;
		}
		GL_VARIABLES[name] = func;
	}

	// Dithering
	stateFlag(S_DITHER, GL_DITHER);

	// Blending
	stateFlag(S_BLEND_ENABLE, GL_BLEND);
	stateVariable(S_BLEND_COLOR, 'blendColor', [0, 0, 0, 0]);
	stateVariable(S_BLEND_EQUATION, 'blendEquationSeparate',
		[GL_FUNC_ADD, GL_FUNC_ADD]);
	stateVariable(S_BLEND_FUNC, 'blendFuncSeparate',
		[GL_ONE, GL_ZERO, GL_ONE, GL_ZERO]);

	// Depth
	stateFlag(S_DEPTH_ENABLE, GL_DEPTH_TEST, true);
	stateVariable(S_DEPTH_FUNC, 'depthFunc', GL_LESS);
	stateVariable(S_DEPTH_RANGE, 'depthRange', [0, 1]);
	stateVariable(S_DEPTH_MASK, 'depthMask', true);

	// Color mask
	stateVariable(S_COLOR_MASK, S_COLOR_MASK, [true, true, true, true]);

	// Face culling
	stateFlag(S_CULL_ENABLE, GL_CULL_FACE);
	stateVariable(S_CULL_FACE, 'cullFace', GL_BACK);

	// Front face orientation
	stateVariable(S_FRONT_FACE, S_FRONT_FACE, GL_CCW);

	// Line width
	stateVariable(S_LINE_WIDTH, S_LINE_WIDTH, 1);

	// Polygon offset
	stateFlag(S_POLYGON_OFFSET_ENABLE, GL_POLYGON_OFFSET_FILL);
	stateVariable(S_POLYGON_OFFSET_OFFSET, 'polygonOffset', [0, 0]);

	// Sample coverage
	stateFlag(S_SAMPLE_ALPHA, GL_SAMPLE_ALPHA_TO_COVERAGE);
	stateFlag(S_SAMPLE_ENABLE, GL_SAMPLE_COVERAGE);
	stateVariable(S_SAMPLE_COVERAGE, 'sampleCoverage', [1, false]);

	// Stencil
	stateFlag(S_STENCIL_ENABLE, GL_STENCIL_TEST);
	stateVariable(S_STENCIL_MASK, 'stencilMask', -1);
	stateVariable(S_STENCIL_FUNC, 'stencilFunc', [GL_ALWAYS, 0, -1]);
	stateVariable(S_STENCIL_OPFRONT, 'stencilOpSeparate',
		[GL_FRONT, GL_KEEP, GL_KEEP, GL_KEEP]);
	stateVariable(S_STENCIL_OPBACK, 'stencilOpSeparate',
		[GL_BACK, GL_KEEP, GL_KEEP, GL_KEEP]);

	// Scissor
	stateFlag(S_SCISSOR_ENABLE, GL_SCISSOR_TEST);
	stateVariable(S_SCISSOR_BOX, 'scissor',
		[0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight]);

	// Viewport
	stateVariable(S_VIEWPORT, S_VIEWPORT,
		[0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight]);

	// ===================================================
	// ===================================================
	// ENVIRONMENT
	// ===================================================
	// ===================================================
	var sharedState = {
		gl: gl,
		context: contextState,
		strings: stringStore,
		next: nextState,
		current: currentState,
		draw: drawState,
		elements: elementState,
		buffer: bufferState,
		shader: shaderState,
		attributes: attributeState.state,
		uniforms: uniformState,
		framebuffer: framebufferState,
		extensions: extensions,

		timer: timer,
		isBufferArgs: isBufferArgs
	};

	var sharedConstants = {
		primTypes: primTypes,
		compareFuncs: compareFuncs,
		blendFuncs: blendFuncs,
		blendEquations: blendEquations,
		stencilOps: stencilOps,
		glTypes: glTypes,
		orientationType: orientationType
	};

	check$1.optional(function () {
		sharedState.isArrayLike = isArrayLike;
	});

	if (extDrawBuffers) {
		sharedConstants.backBuffer = [GL_BACK];
		sharedConstants.drawBuffer = loop(limits.maxDrawbuffers, function (i) {
			if (i === 0) {
				return [0]
			}
			return loop(i, function (j) {
				return GL_COLOR_ATTACHMENT0$2 + j
			})
		});
	}

	var drawCallCounter = 0;
	function createREGLEnvironment () {
		var env = createEnvironment();
		var link = env.link;
		var global = env.global;
		env.id = drawCallCounter++;

		env.batchId = '0';

		// link shared state
		var SHARED = link(sharedState);
		var shared = env.shared = {
			props: 'a0'
		};
		Object.keys(sharedState).forEach(function (prop) {
			shared[prop] = global.def(SHARED, '.', prop);
		});

		// Inject runtime assertion stuff for debug builds
		check$1.optional(function () {
			env.CHECK = link(check$1);
			env.commandStr = check$1.guessCommand();
			env.command = link(env.commandStr);
			env.assert = function (block, pred, message) {
				block(
					'if(!(', pred, '))',
					this.CHECK, '.commandRaise(', link(message), ',', this.command, ');');
			};

			sharedConstants.invalidBlendCombinations = invalidBlendCombinations;
		});

		// Copy GL state variables over
		var nextVars = env.next = {};
		var currentVars = env.current = {};
		Object.keys(GL_VARIABLES).forEach(function (variable) {
			if (Array.isArray(currentState[variable])) {
				nextVars[variable] = global.def(shared.next, '.', variable);
				currentVars[variable] = global.def(shared.current, '.', variable);
			}
		});

		// Initialize shared constants
		var constants = env.constants = {};
		Object.keys(sharedConstants).forEach(function (name) {
			constants[name] = global.def(JSON.stringify(sharedConstants[name]));
		});

		// Helper function for calling a block
		env.invoke = function (block, x) {
			switch (x.type) {
				case DYN_FUNC$1:
					var argList = [
						'this',
						shared.context,
						shared.props,
						env.batchId
					];
					return block.def(
						link(x.data), '.call(',
							argList.slice(0, Math.max(x.data.length + 1, 4)),
						 ')')
				case DYN_PROP$1:
					return block.def(shared.props, x.data)
				case DYN_CONTEXT$1:
					return block.def(shared.context, x.data)
				case DYN_STATE$1:
					return block.def('this', x.data)
				case DYN_THUNK:
					x.data.append(env, block);
					return x.data.ref
			}
		};

		env.attribCache = {};

		var scopeAttribs = {};
		env.scopeAttrib = function (name) {
			var id = stringStore.id(name);
			if (id in scopeAttribs) {
				return scopeAttribs[id]
			}
			var binding = attributeState.scope[id];
			if (!binding) {
				binding = attributeState.scope[id] = new AttributeRecord();
			}
			var result = scopeAttribs[id] = link(binding);
			return result
		};

		return env
	}

	// ===================================================
	// ===================================================
	// PARSING
	// ===================================================
	// ===================================================
	function parseProfile (options) {
		var staticOptions = options.static;
		var dynamicOptions = options.dynamic;

		var profileEnable;
		if (S_PROFILE in staticOptions) {
			var value = !!staticOptions[S_PROFILE];
			profileEnable = createStaticDecl(function (env, scope) {
				return value
			});
			profileEnable.enable = value;
		} else if (S_PROFILE in dynamicOptions) {
			var dyn = dynamicOptions[S_PROFILE];
			profileEnable = createDynamicDecl(dyn, function (env, scope) {
				return env.invoke(scope, dyn)
			});
		}

		return profileEnable
	}

	function parseFramebuffer (options, env) {
		var staticOptions = options.static;
		var dynamicOptions = options.dynamic;

		if (S_FRAMEBUFFER in staticOptions) {
			var framebuffer = staticOptions[S_FRAMEBUFFER];
			if (framebuffer) {
				framebuffer = framebufferState.getFramebuffer(framebuffer);
				check$1.command(framebuffer, 'invalid framebuffer object');
				return createStaticDecl(function (env, block) {
					var FRAMEBUFFER = env.link(framebuffer);
					var shared = env.shared;
					block.set(
						shared.framebuffer,
						'.next',
						FRAMEBUFFER);
					var CONTEXT = shared.context;
					block.set(
						CONTEXT,
						'.' + S_FRAMEBUFFER_WIDTH,
						FRAMEBUFFER + '.width');
					block.set(
						CONTEXT,
						'.' + S_FRAMEBUFFER_HEIGHT,
						FRAMEBUFFER + '.height');
					return FRAMEBUFFER
				})
			} else {
				return createStaticDecl(function (env, scope) {
					var shared = env.shared;
					scope.set(
						shared.framebuffer,
						'.next',
						'null');
					var CONTEXT = shared.context;
					scope.set(
						CONTEXT,
						'.' + S_FRAMEBUFFER_WIDTH,
						CONTEXT + '.' + S_DRAWINGBUFFER_WIDTH);
					scope.set(
						CONTEXT,
						'.' + S_FRAMEBUFFER_HEIGHT,
						CONTEXT + '.' + S_DRAWINGBUFFER_HEIGHT);
					return 'null'
				})
			}
		} else if (S_FRAMEBUFFER in dynamicOptions) {
			var dyn = dynamicOptions[S_FRAMEBUFFER];
			return createDynamicDecl(dyn, function (env, scope) {
				var FRAMEBUFFER_FUNC = env.invoke(scope, dyn);
				var shared = env.shared;
				var FRAMEBUFFER_STATE = shared.framebuffer;
				var FRAMEBUFFER = scope.def(
					FRAMEBUFFER_STATE, '.getFramebuffer(', FRAMEBUFFER_FUNC, ')');

				check$1.optional(function () {
					env.assert(scope,
						'!' + FRAMEBUFFER_FUNC + '||' + FRAMEBUFFER,
						'invalid framebuffer object');
				});

				scope.set(
					FRAMEBUFFER_STATE,
					'.next',
					FRAMEBUFFER);
				var CONTEXT = shared.context;
				scope.set(
					CONTEXT,
					'.' + S_FRAMEBUFFER_WIDTH,
					FRAMEBUFFER + '?' + FRAMEBUFFER + '.width:' +
					CONTEXT + '.' + S_DRAWINGBUFFER_WIDTH);
				scope.set(
					CONTEXT,
					'.' + S_FRAMEBUFFER_HEIGHT,
					FRAMEBUFFER +
					'?' + FRAMEBUFFER + '.height:' +
					CONTEXT + '.' + S_DRAWINGBUFFER_HEIGHT);
				return FRAMEBUFFER
			})
		} else {
			return null
		}
	}

	function parseViewportScissor (options, framebuffer, env) {
		var staticOptions = options.static;
		var dynamicOptions = options.dynamic;

		function parseBox (param) {
			if (param in staticOptions) {
				var box = staticOptions[param];
				check$1.commandType(box, 'object', 'invalid ' + param, env.commandStr);

				var isStatic = true;
				var x = box.x | 0;
				var y = box.y | 0;
				var w, h;
				if ('width' in box) {
					w = box.width | 0;
					check$1.command(w >= 0, 'invalid ' + param, env.commandStr);
				} else {
					isStatic = false;
				}
				if ('height' in box) {
					h = box.height | 0;
					check$1.command(h >= 0, 'invalid ' + param, env.commandStr);
				} else {
					isStatic = false;
				}

				return new Declaration(
					!isStatic && framebuffer && framebuffer.thisDep,
					!isStatic && framebuffer && framebuffer.contextDep,
					!isStatic && framebuffer && framebuffer.propDep,
					function (env, scope) {
						var CONTEXT = env.shared.context;
						var BOX_W = w;
						if (!('width' in box)) {
							BOX_W = scope.def(CONTEXT, '.', S_FRAMEBUFFER_WIDTH, '-', x);
						}
						var BOX_H = h;
						if (!('height' in box)) {
							BOX_H = scope.def(CONTEXT, '.', S_FRAMEBUFFER_HEIGHT, '-', y);
						}
						return [x, y, BOX_W, BOX_H]
					})
			} else if (param in dynamicOptions) {
				var dynBox = dynamicOptions[param];
				var result = createDynamicDecl(dynBox, function (env, scope) {
					var BOX = env.invoke(scope, dynBox);

					check$1.optional(function () {
						env.assert(scope,
							BOX + '&&typeof ' + BOX + '==="object"',
							'invalid ' + param);
					});

					var CONTEXT = env.shared.context;
					var BOX_X = scope.def(BOX, '.x|0');
					var BOX_Y = scope.def(BOX, '.y|0');
					var BOX_W = scope.def(
						'"width" in ', BOX, '?', BOX, '.width|0:',
						'(', CONTEXT, '.', S_FRAMEBUFFER_WIDTH, '-', BOX_X, ')');
					var BOX_H = scope.def(
						'"height" in ', BOX, '?', BOX, '.height|0:',
						'(', CONTEXT, '.', S_FRAMEBUFFER_HEIGHT, '-', BOX_Y, ')');

					check$1.optional(function () {
						env.assert(scope,
							BOX_W + '>=0&&' +
							BOX_H + '>=0',
							'invalid ' + param);
					});

					return [BOX_X, BOX_Y, BOX_W, BOX_H]
				});
				if (framebuffer) {
					result.thisDep = result.thisDep || framebuffer.thisDep;
					result.contextDep = result.contextDep || framebuffer.contextDep;
					result.propDep = result.propDep || framebuffer.propDep;
				}
				return result
			} else if (framebuffer) {
				return new Declaration(
					framebuffer.thisDep,
					framebuffer.contextDep,
					framebuffer.propDep,
					function (env, scope) {
						var CONTEXT = env.shared.context;
						return [
							0, 0,
							scope.def(CONTEXT, '.', S_FRAMEBUFFER_WIDTH),
							scope.def(CONTEXT, '.', S_FRAMEBUFFER_HEIGHT)]
					})
			} else {
				return null
			}
		}

		var viewport = parseBox(S_VIEWPORT);

		if (viewport) {
			var prevViewport = viewport;
			viewport = new Declaration(
				viewport.thisDep,
				viewport.contextDep,
				viewport.propDep,
				function (env, scope) {
					var VIEWPORT = prevViewport.append(env, scope);
					var CONTEXT = env.shared.context;
					scope.set(
						CONTEXT,
						'.' + S_VIEWPORT_WIDTH,
						VIEWPORT[2]);
					scope.set(
						CONTEXT,
						'.' + S_VIEWPORT_HEIGHT,
						VIEWPORT[3]);
					return VIEWPORT
				});
		}

		return {
			viewport: viewport,
			scissor_box: parseBox(S_SCISSOR_BOX)
		}
	}

	function parseProgram (options) {
		var staticOptions = options.static;
		var dynamicOptions = options.dynamic;

		function parseShader (name) {
			if (name in staticOptions) {
				var id = stringStore.id(staticOptions[name]);
				check$1.optional(function () {
					shaderState.shader(shaderType[name], id, check$1.guessCommand());
				});
				var result = createStaticDecl(function () {
					return id
				});
				result.id = id;
				return result
			} else if (name in dynamicOptions) {
				var dyn = dynamicOptions[name];
				return createDynamicDecl(dyn, function (env, scope) {
					var str = env.invoke(scope, dyn);
					var id = scope.def(env.shared.strings, '.id(', str, ')');
					check$1.optional(function () {
						scope(
							env.shared.shader, '.shader(',
							shaderType[name], ',',
							id, ',',
							env.command, ');');
					});
					return id
				})
			}
			return null
		}

		var frag = parseShader(S_FRAG);
		var vert = parseShader(S_VERT);

		var program = null;
		var progVar;
		if (isStatic(frag) && isStatic(vert)) {
			program = shaderState.program(vert.id, frag.id);
			progVar = createStaticDecl(function (env, scope) {
				return env.link(program)
			});
		} else {
			progVar = new Declaration(
				(frag && frag.thisDep) || (vert && vert.thisDep),
				(frag && frag.contextDep) || (vert && vert.contextDep),
				(frag && frag.propDep) || (vert && vert.propDep),
				function (env, scope) {
					var SHADER_STATE = env.shared.shader;
					var fragId;
					if (frag) {
						fragId = frag.append(env, scope);
					} else {
						fragId = scope.def(SHADER_STATE, '.', S_FRAG);
					}
					var vertId;
					if (vert) {
						vertId = vert.append(env, scope);
					} else {
						vertId = scope.def(SHADER_STATE, '.', S_VERT);
					}
					var progDef = SHADER_STATE + '.program(' + vertId + ',' + fragId;
					check$1.optional(function () {
						progDef += ',' + env.command;
					});
					return scope.def(progDef + ')')
				});
		}

		return {
			frag: frag,
			vert: vert,
			progVar: progVar,
			program: program
		}
	}

	function parseDraw (options, env) {
		var staticOptions = options.static;
		var dynamicOptions = options.dynamic;

		function parseElements () {
			if (S_ELEMENTS in staticOptions) {
				var elements = staticOptions[S_ELEMENTS];
				if (isBufferArgs(elements)) {
					elements = elementState.getElements(elementState.create(elements, true));
				} else if (elements) {
					elements = elementState.getElements(elements);
					check$1.command(elements, 'invalid elements', env.commandStr);
				}
				var result = createStaticDecl(function (env, scope) {
					if (elements) {
						var result = env.link(elements);
						env.ELEMENTS = result;
						return result
					}
					env.ELEMENTS = null;
					return null
				});
				result.value = elements;
				return result
			} else if (S_ELEMENTS in dynamicOptions) {
				var dyn = dynamicOptions[S_ELEMENTS];
				return createDynamicDecl(dyn, function (env, scope) {
					var shared = env.shared;

					var IS_BUFFER_ARGS = shared.isBufferArgs;
					var ELEMENT_STATE = shared.elements;

					var elementDefn = env.invoke(scope, dyn);
					var elements = scope.def('null');
					var elementStream = scope.def(IS_BUFFER_ARGS, '(', elementDefn, ')');

					var ifte = env.cond(elementStream)
						.then(elements, '=', ELEMENT_STATE, '.createStream(', elementDefn, ');')
						.else(elements, '=', ELEMENT_STATE, '.getElements(', elementDefn, ');');

					check$1.optional(function () {
						env.assert(ifte.else,
							'!' + elementDefn + '||' + elements,
							'invalid elements');
					});

					scope.entry(ifte);
					scope.exit(
						env.cond(elementStream)
							.then(ELEMENT_STATE, '.destroyStream(', elements, ');'));

					env.ELEMENTS = elements;

					return elements
				})
			}

			return null
		}

		var elements = parseElements();

		function parsePrimitive () {
			if (S_PRIMITIVE in staticOptions) {
				var primitive = staticOptions[S_PRIMITIVE];
				check$1.commandParameter(primitive, primTypes, 'invalid primitve', env.commandStr);
				return createStaticDecl(function (env, scope) {
					return primTypes[primitive]
				})
			} else if (S_PRIMITIVE in dynamicOptions) {
				var dynPrimitive = dynamicOptions[S_PRIMITIVE];
				return createDynamicDecl(dynPrimitive, function (env, scope) {
					var PRIM_TYPES = env.constants.primTypes;
					var prim = env.invoke(scope, dynPrimitive);
					check$1.optional(function () {
						env.assert(scope,
							prim + ' in ' + PRIM_TYPES,
							'invalid primitive, must be one of ' + Object.keys(primTypes));
					});
					return scope.def(PRIM_TYPES, '[', prim, ']')
				})
			} else if (elements) {
				if (isStatic(elements)) {
					if (elements.value) {
						return createStaticDecl(function (env, scope) {
							return scope.def(env.ELEMENTS, '.primType')
						})
					} else {
						return createStaticDecl(function () {
							return GL_TRIANGLES$1
						})
					}
				} else {
					return new Declaration(
						elements.thisDep,
						elements.contextDep,
						elements.propDep,
						function (env, scope) {
							var elements = env.ELEMENTS;
							return scope.def(elements, '?', elements, '.primType:', GL_TRIANGLES$1)
						})
				}
			}
			return null
		}

		function parseParam (param, isOffset) {
			if (param in staticOptions) {
				var value = staticOptions[param] | 0;
				check$1.command(!isOffset || value >= 0, 'invalid ' + param, env.commandStr);
				return createStaticDecl(function (env, scope) {
					if (isOffset) {
						env.OFFSET = value;
					}
					return value
				})
			} else if (param in dynamicOptions) {
				var dynValue = dynamicOptions[param];
				return createDynamicDecl(dynValue, function (env, scope) {
					var result = env.invoke(scope, dynValue);
					if (isOffset) {
						env.OFFSET = result;
						check$1.optional(function () {
							env.assert(scope,
								result + '>=0',
								'invalid ' + param);
						});
					}
					return result
				})
			} else if (isOffset && elements) {
				return createStaticDecl(function (env, scope) {
					env.OFFSET = '0';
					return 0
				})
			}
			return null
		}

		var OFFSET = parseParam(S_OFFSET, true);

		function parseVertCount () {
			if (S_COUNT in staticOptions) {
				var count = staticOptions[S_COUNT] | 0;
				check$1.command(
					typeof count === 'number' && count >= 0, 'invalid vertex count', env.commandStr);
				return createStaticDecl(function () {
					return count
				})
			} else if (S_COUNT in dynamicOptions) {
				var dynCount = dynamicOptions[S_COUNT];
				return createDynamicDecl(dynCount, function (env, scope) {
					var result = env.invoke(scope, dynCount);
					check$1.optional(function () {
						env.assert(scope,
							'typeof ' + result + '==="number"&&' +
							result + '>=0&&' +
							result + '===(' + result + '|0)',
							'invalid vertex count');
					});
					return result
				})
			} else if (elements) {
				if (isStatic(elements)) {
					if (elements) {
						if (OFFSET) {
							return new Declaration(
								OFFSET.thisDep,
								OFFSET.contextDep,
								OFFSET.propDep,
								function (env, scope) {
									var result = scope.def(
										env.ELEMENTS, '.vertCount-', env.OFFSET);

									check$1.optional(function () {
										env.assert(scope,
											result + '>=0',
											'invalid vertex offset/element buffer too small');
									});

									return result
								})
						} else {
							return createStaticDecl(function (env, scope) {
								return scope.def(env.ELEMENTS, '.vertCount')
							})
						}
					} else {
						var result = createStaticDecl(function () {
							return -1
						});
						check$1.optional(function () {
							result.MISSING = true;
						});
						return result
					}
				} else {
					var variable = new Declaration(
						elements.thisDep || OFFSET.thisDep,
						elements.contextDep || OFFSET.contextDep,
						elements.propDep || OFFSET.propDep,
						function (env, scope) {
							var elements = env.ELEMENTS;
							if (env.OFFSET) {
								return scope.def(elements, '?', elements, '.vertCount-',
									env.OFFSET, ':-1')
							}
							return scope.def(elements, '?', elements, '.vertCount:-1')
						});
					check$1.optional(function () {
						variable.DYNAMIC = true;
					});
					return variable
				}
			}
			return null
		}

		return {
			elements: elements,
			primitive: parsePrimitive(),
			count: parseVertCount(),
			instances: parseParam(S_INSTANCES, false),
			offset: OFFSET
		}
	}

	function parseGLState (options, env) {
		var staticOptions = options.static;
		var dynamicOptions = options.dynamic;

		var STATE = {};

		GL_STATE_NAMES.forEach(function (prop) {
			var param = propName(prop);

			function parseParam (parseStatic, parseDynamic) {
				if (prop in staticOptions) {
					var value = parseStatic(staticOptions[prop]);
					STATE[param] = createStaticDecl(function () {
						return value
					});
				} else if (prop in dynamicOptions) {
					var dyn = dynamicOptions[prop];
					STATE[param] = createDynamicDecl(dyn, function (env, scope) {
						return parseDynamic(env, scope, env.invoke(scope, dyn))
					});
				}
			}

			switch (prop) {
				case S_CULL_ENABLE:
				case S_BLEND_ENABLE:
				case S_DITHER:
				case S_STENCIL_ENABLE:
				case S_DEPTH_ENABLE:
				case S_SCISSOR_ENABLE:
				case S_POLYGON_OFFSET_ENABLE:
				case S_SAMPLE_ALPHA:
				case S_SAMPLE_ENABLE:
				case S_DEPTH_MASK:
					return parseParam(
						function (value) {
							check$1.commandType(value, 'boolean', prop, env.commandStr);
							return value
						},
						function (env, scope, value) {
							check$1.optional(function () {
								env.assert(scope,
									'typeof ' + value + '==="boolean"',
									'invalid flag ' + prop, env.commandStr);
							});
							return value
						})

				case S_DEPTH_FUNC:
					return parseParam(
						function (value) {
							check$1.commandParameter(value, compareFuncs, 'invalid ' + prop, env.commandStr);
							return compareFuncs[value]
						},
						function (env, scope, value) {
							var COMPARE_FUNCS = env.constants.compareFuncs;
							check$1.optional(function () {
								env.assert(scope,
									value + ' in ' + COMPARE_FUNCS,
									'invalid ' + prop + ', must be one of ' + Object.keys(compareFuncs));
							});
							return scope.def(COMPARE_FUNCS, '[', value, ']')
						})

				case S_DEPTH_RANGE:
					return parseParam(
						function (value) {
							check$1.command(
								isArrayLike(value) &&
								value.length === 2 &&
								typeof value[0] === 'number' &&
								typeof value[1] === 'number' &&
								value[0] <= value[1],
								'depth range is 2d array',
								env.commandStr);
							return value
						},
						function (env, scope, value) {
							check$1.optional(function () {
								env.assert(scope,
									env.shared.isArrayLike + '(' + value + ')&&' +
									value + '.length===2&&' +
									'typeof ' + value + '[0]==="number"&&' +
									'typeof ' + value + '[1]==="number"&&' +
									value + '[0]<=' + value + '[1]',
									'depth range must be a 2d array');
							});

							var Z_NEAR = scope.def('+', value, '[0]');
							var Z_FAR = scope.def('+', value, '[1]');
							return [Z_NEAR, Z_FAR]
						})

				case S_BLEND_FUNC:
					return parseParam(
						function (value) {
							check$1.commandType(value, 'object', 'blend.func', env.commandStr);
							var srcRGB = ('srcRGB' in value ? value.srcRGB : value.src);
							var srcAlpha = ('srcAlpha' in value ? value.srcAlpha : value.src);
							var dstRGB = ('dstRGB' in value ? value.dstRGB : value.dst);
							var dstAlpha = ('dstAlpha' in value ? value.dstAlpha : value.dst);
							check$1.commandParameter(srcRGB, blendFuncs, param + '.srcRGB', env.commandStr);
							check$1.commandParameter(srcAlpha, blendFuncs, param + '.srcAlpha', env.commandStr);
							check$1.commandParameter(dstRGB, blendFuncs, param + '.dstRGB', env.commandStr);
							check$1.commandParameter(dstAlpha, blendFuncs, param + '.dstAlpha', env.commandStr);

							check$1.command(
								(invalidBlendCombinations.indexOf(srcRGB + ', ' + dstRGB) === -1),
								'unallowed blending combination (srcRGB, dstRGB) = (' + srcRGB + ', ' + dstRGB + ')', env.commandStr);

							return [
								blendFuncs[srcRGB],
								blendFuncs[dstRGB],
								blendFuncs[srcAlpha],
								blendFuncs[dstAlpha]
							]
						},
						function (env, scope, value) {
							var BLEND_FUNCS = env.constants.blendFuncs;

							check$1.optional(function () {
								env.assert(scope,
									value + '&&typeof ' + value + '==="object"',
									'invalid blend func, must be an object');
							});

							function read (prefix, suffix) {
								var func = scope.def(
									'"', prefix, suffix, '" in ', value,
									'?', value, '.', prefix, suffix,
									':', value, '.', prefix);

								check$1.optional(function () {
									env.assert(scope,
										func + ' in ' + BLEND_FUNCS,
										'invalid ' + prop + '.' + prefix + suffix + ', must be one of ' + Object.keys(blendFuncs));
								});

								return func
							}

							var srcRGB = read('src', 'RGB');
							var dstRGB = read('dst', 'RGB');

							check$1.optional(function () {
								var INVALID_BLEND_COMBINATIONS = env.constants.invalidBlendCombinations;

								env.assert(scope,
													 INVALID_BLEND_COMBINATIONS +
													 '.indexOf(' + srcRGB + '+", "+' + dstRGB + ') === -1 ',
													 'unallowed blending combination for (srcRGB, dstRGB)'
													);
							});

							var SRC_RGB = scope.def(BLEND_FUNCS, '[', srcRGB, ']');
							var SRC_ALPHA = scope.def(BLEND_FUNCS, '[', read('src', 'Alpha'), ']');
							var DST_RGB = scope.def(BLEND_FUNCS, '[', dstRGB, ']');
							var DST_ALPHA = scope.def(BLEND_FUNCS, '[', read('dst', 'Alpha'), ']');

							return [SRC_RGB, DST_RGB, SRC_ALPHA, DST_ALPHA]
						})

				case S_BLEND_EQUATION:
					return parseParam(
						function (value) {
							if (typeof value === 'string') {
								check$1.commandParameter(value, blendEquations, 'invalid ' + prop, env.commandStr);
								return [
									blendEquations[value],
									blendEquations[value]
								]
							} else if (typeof value === 'object') {
								check$1.commandParameter(
									value.rgb, blendEquations, prop + '.rgb', env.commandStr);
								check$1.commandParameter(
									value.alpha, blendEquations, prop + '.alpha', env.commandStr);
								return [
									blendEquations[value.rgb],
									blendEquations[value.alpha]
								]
							} else {
								check$1.commandRaise('invalid blend.equation', env.commandStr);
							}
						},
						function (env, scope, value) {
							var BLEND_EQUATIONS = env.constants.blendEquations;

							var RGB = scope.def();
							var ALPHA = scope.def();

							var ifte = env.cond('typeof ', value, '==="string"');

							check$1.optional(function () {
								function checkProp (block, name, value) {
									env.assert(block,
										value + ' in ' + BLEND_EQUATIONS,
										'invalid ' + name + ', must be one of ' + Object.keys(blendEquations));
								}
								checkProp(ifte.then, prop, value);

								env.assert(ifte.else,
									value + '&&typeof ' + value + '==="object"',
									'invalid ' + prop);
								checkProp(ifte.else, prop + '.rgb', value + '.rgb');
								checkProp(ifte.else, prop + '.alpha', value + '.alpha');
							});

							ifte.then(
								RGB, '=', ALPHA, '=', BLEND_EQUATIONS, '[', value, '];');
							ifte.else(
								RGB, '=', BLEND_EQUATIONS, '[', value, '.rgb];',
								ALPHA, '=', BLEND_EQUATIONS, '[', value, '.alpha];');

							scope(ifte);

							return [RGB, ALPHA]
						})

				case S_BLEND_COLOR:
					return parseParam(
						function (value) {
							check$1.command(
								isArrayLike(value) &&
								value.length === 4,
								'blend.color must be a 4d array', env.commandStr);
							return loop(4, function (i) {
								return +value[i]
							})
						},
						function (env, scope, value) {
							check$1.optional(function () {
								env.assert(scope,
									env.shared.isArrayLike + '(' + value + ')&&' +
									value + '.length===4',
									'blend.color must be a 4d array');
							});
							return loop(4, function (i) {
								return scope.def('+', value, '[', i, ']')
							})
						})

				case S_STENCIL_MASK:
					return parseParam(
						function (value) {
							check$1.commandType(value, 'number', param, env.commandStr);
							return value | 0
						},
						function (env, scope, value) {
							check$1.optional(function () {
								env.assert(scope,
									'typeof ' + value + '==="number"',
									'invalid stencil.mask');
							});
							return scope.def(value, '|0')
						})

				case S_STENCIL_FUNC:
					return parseParam(
						function (value) {
							check$1.commandType(value, 'object', param, env.commandStr);
							var cmp = value.cmp || 'keep';
							var ref = value.ref || 0;
							var mask = 'mask' in value ? value.mask : -1;
							check$1.commandParameter(cmp, compareFuncs, prop + '.cmp', env.commandStr);
							check$1.commandType(ref, 'number', prop + '.ref', env.commandStr);
							check$1.commandType(mask, 'number', prop + '.mask', env.commandStr);
							return [
								compareFuncs[cmp],
								ref,
								mask
							]
						},
						function (env, scope, value) {
							var COMPARE_FUNCS = env.constants.compareFuncs;
							check$1.optional(function () {
								function assert () {
									env.assert(scope,
										Array.prototype.join.call(arguments, ''),
										'invalid stencil.func');
								}
								assert(value + '&&typeof ', value, '==="object"');
								assert('!("cmp" in ', value, ')||(',
									value, '.cmp in ', COMPARE_FUNCS, ')');
							});
							var cmp = scope.def(
								'"cmp" in ', value,
								'?', COMPARE_FUNCS, '[', value, '.cmp]',
								':', GL_KEEP);
							var ref = scope.def(value, '.ref|0');
							var mask = scope.def(
								'"mask" in ', value,
								'?', value, '.mask|0:-1');
							return [cmp, ref, mask]
						})

				case S_STENCIL_OPFRONT:
				case S_STENCIL_OPBACK:
					return parseParam(
						function (value) {
							check$1.commandType(value, 'object', param, env.commandStr);
							var fail = value.fail || 'keep';
							var zfail = value.zfail || 'keep';
							var zpass = value.zpass || 'keep';
							check$1.commandParameter(fail, stencilOps, prop + '.fail', env.commandStr);
							check$1.commandParameter(zfail, stencilOps, prop + '.zfail', env.commandStr);
							check$1.commandParameter(zpass, stencilOps, prop + '.zpass', env.commandStr);
							return [
								prop === S_STENCIL_OPBACK ? GL_BACK : GL_FRONT,
								stencilOps[fail],
								stencilOps[zfail],
								stencilOps[zpass]
							]
						},
						function (env, scope, value) {
							var STENCIL_OPS = env.constants.stencilOps;

							check$1.optional(function () {
								env.assert(scope,
									value + '&&typeof ' + value + '==="object"',
									'invalid ' + prop);
							});

							function read (name) {
								check$1.optional(function () {
									env.assert(scope,
										'!("' + name + '" in ' + value + ')||' +
										'(' + value + '.' + name + ' in ' + STENCIL_OPS + ')',
										'invalid ' + prop + '.' + name + ', must be one of ' + Object.keys(stencilOps));
								});

								return scope.def(
									'"', name, '" in ', value,
									'?', STENCIL_OPS, '[', value, '.', name, ']:',
									GL_KEEP)
							}

							return [
								prop === S_STENCIL_OPBACK ? GL_BACK : GL_FRONT,
								read('fail'),
								read('zfail'),
								read('zpass')
							]
						})

				case S_POLYGON_OFFSET_OFFSET:
					return parseParam(
						function (value) {
							check$1.commandType(value, 'object', param, env.commandStr);
							var factor = value.factor | 0;
							var units = value.units | 0;
							check$1.commandType(factor, 'number', param + '.factor', env.commandStr);
							check$1.commandType(units, 'number', param + '.units', env.commandStr);
							return [factor, units]
						},
						function (env, scope, value) {
							check$1.optional(function () {
								env.assert(scope,
									value + '&&typeof ' + value + '==="object"',
									'invalid ' + prop);
							});

							var FACTOR = scope.def(value, '.factor|0');
							var UNITS = scope.def(value, '.units|0');

							return [FACTOR, UNITS]
						})

				case S_CULL_FACE:
					return parseParam(
						function (value) {
							var face = 0;
							if (value === 'front') {
								face = GL_FRONT;
							} else if (value === 'back') {
								face = GL_BACK;
							}
							check$1.command(!!face, param, env.commandStr);
							return face
						},
						function (env, scope, value) {
							check$1.optional(function () {
								env.assert(scope,
									value + '==="front"||' +
									value + '==="back"',
									'invalid cull.face');
							});
							return scope.def(value, '==="front"?', GL_FRONT, ':', GL_BACK)
						})

				case S_LINE_WIDTH:
					return parseParam(
						function (value) {
							check$1.command(
								typeof value === 'number' &&
								value >= limits.lineWidthDims[0] &&
								value <= limits.lineWidthDims[1],
								'invalid line width, must be a positive number between ' +
								limits.lineWidthDims[0] + ' and ' + limits.lineWidthDims[1], env.commandStr);
							return value
						},
						function (env, scope, value) {
							check$1.optional(function () {
								env.assert(scope,
									'typeof ' + value + '==="number"&&' +
									value + '>=' + limits.lineWidthDims[0] + '&&' +
									value + '<=' + limits.lineWidthDims[1],
									'invalid line width');
							});

							return value
						})

				case S_FRONT_FACE:
					return parseParam(
						function (value) {
							check$1.commandParameter(value, orientationType, param, env.commandStr);
							return orientationType[value]
						},
						function (env, scope, value) {
							check$1.optional(function () {
								env.assert(scope,
									value + '==="cw"||' +
									value + '==="ccw"',
									'invalid frontFace, must be one of cw,ccw');
							});
							return scope.def(value + '==="cw"?' + GL_CW + ':' + GL_CCW)
						})

				case S_COLOR_MASK:
					return parseParam(
						function (value) {
							check$1.command(
								isArrayLike(value) && value.length === 4,
								'color.mask must be length 4 array', env.commandStr);
							return value.map(function (v) { return !!v })
						},
						function (env, scope, value) {
							check$1.optional(function () {
								env.assert(scope,
									env.shared.isArrayLike + '(' + value + ')&&' +
									value + '.length===4',
									'invalid color.mask');
							});
							return loop(4, function (i) {
								return '!!' + value + '[' + i + ']'
							})
						})

				case S_SAMPLE_COVERAGE:
					return parseParam(
						function (value) {
							check$1.command(typeof value === 'object' && value, param, env.commandStr);
							var sampleValue = 'value' in value ? value.value : 1;
							var sampleInvert = !!value.invert;
							check$1.command(
								typeof sampleValue === 'number' &&
								sampleValue >= 0 && sampleValue <= 1,
								'sample.coverage.value must be a number between 0 and 1', env.commandStr);
							return [sampleValue, sampleInvert]
						},
						function (env, scope, value) {
							check$1.optional(function () {
								env.assert(scope,
									value + '&&typeof ' + value + '==="object"',
									'invalid sample.coverage');
							});
							var VALUE = scope.def(
								'"value" in ', value, '?+', value, '.value:1');
							var INVERT = scope.def('!!', value, '.invert');
							return [VALUE, INVERT]
						})
			}
		});

		return STATE
	}

	function parseUniforms (uniforms, env) {
		var staticUniforms = uniforms.static;
		var dynamicUniforms = uniforms.dynamic;

		var UNIFORMS = {};

		Object.keys(staticUniforms).forEach(function (name) {
			var value = staticUniforms[name];
			var result;
			if (typeof value === 'number' ||
					typeof value === 'boolean') {
				result = createStaticDecl(function () {
					return value
				});
			} else if (typeof value === 'function') {
				var reglType = value._reglType;
				if (reglType === 'texture2d' ||
						reglType === 'textureCube') {
					result = createStaticDecl(function (env) {
						return env.link(value)
					});
				} else if (reglType === 'framebuffer' ||
									 reglType === 'framebufferCube') {
					check$1.command(value.color.length > 0,
						'missing color attachment for framebuffer sent to uniform "' + name + '"', env.commandStr);
					result = createStaticDecl(function (env) {
						return env.link(value.color[0])
					});
				} else {
					check$1.commandRaise('invalid data for uniform "' + name + '"', env.commandStr);
				}
			} else if (isArrayLike(value)) {
				result = createStaticDecl(function (env) {
					var ITEM = env.global.def('[',
						loop(value.length, function (i) {
							check$1.command(
								typeof value[i] === 'number' ||
								typeof value[i] === 'boolean',
								'invalid uniform ' + name, env.commandStr);
							return value[i]
						}), ']');
					return ITEM
				});
			} else {
				check$1.commandRaise('invalid or missing data for uniform "' + name + '"', env.commandStr);
			}
			result.value = value;
			UNIFORMS[name] = result;
		});

		Object.keys(dynamicUniforms).forEach(function (key) {
			var dyn = dynamicUniforms[key];
			UNIFORMS[key] = createDynamicDecl(dyn, function (env, scope) {
				return env.invoke(scope, dyn)
			});
		});

		return UNIFORMS
	}

	function parseAttributes (attributes, env) {
		var staticAttributes = attributes.static;
		var dynamicAttributes = attributes.dynamic;

		var attributeDefs = {};

		Object.keys(staticAttributes).forEach(function (attribute) {
			var value = staticAttributes[attribute];
			var id = stringStore.id(attribute);

			var record = new AttributeRecord();
			if (isBufferArgs(value)) {
				record.state = ATTRIB_STATE_POINTER;
				record.buffer = bufferState.getBuffer(
					bufferState.create(value, GL_ARRAY_BUFFER$1, false, true));
				record.type = 0;
			} else {
				var buffer = bufferState.getBuffer(value);
				if (buffer) {
					record.state = ATTRIB_STATE_POINTER;
					record.buffer = buffer;
					record.type = 0;
				} else {
					check$1.command(typeof value === 'object' && value,
						'invalid data for attribute ' + attribute, env.commandStr);
					if ('constant' in value) {
						var constant = value.constant;
						record.buffer = 'null';
						record.state = ATTRIB_STATE_CONSTANT;
						if (typeof constant === 'number') {
							record.x = constant;
						} else {
							check$1.command(
								isArrayLike(constant) &&
								constant.length > 0 &&
								constant.length <= 4,
								'invalid constant for attribute ' + attribute, env.commandStr);
							CUTE_COMPONENTS.forEach(function (c, i) {
								if (i < constant.length) {
									record[c] = constant[i];
								}
							});
						}
					} else {
						if (isBufferArgs(value.buffer)) {
							buffer = bufferState.getBuffer(
								bufferState.create(value.buffer, GL_ARRAY_BUFFER$1, false, true));
						} else {
							buffer = bufferState.getBuffer(value.buffer);
						}
						check$1.command(!!buffer, 'missing buffer for attribute "' + attribute + '"', env.commandStr);

						var offset = value.offset | 0;
						check$1.command(offset >= 0,
							'invalid offset for attribute "' + attribute + '"', env.commandStr);

						var stride = value.stride | 0;
						check$1.command(stride >= 0 && stride < 256,
							'invalid stride for attribute "' + attribute + '", must be integer betweeen [0, 255]', env.commandStr);

						var size = value.size | 0;
						check$1.command(!('size' in value) || (size > 0 && size <= 4),
							'invalid size for attribute "' + attribute + '", must be 1,2,3,4', env.commandStr);

						var normalized = !!value.normalized;

						var type = 0;
						if ('type' in value) {
							check$1.commandParameter(
								value.type, glTypes,
								'invalid type for attribute ' + attribute, env.commandStr);
							type = glTypes[value.type];
						}

						var divisor = value.divisor | 0;
						if ('divisor' in value) {
							check$1.command(divisor === 0 || extInstancing,
								'cannot specify divisor for attribute "' + attribute + '", instancing not supported', env.commandStr);
							check$1.command(divisor >= 0,
								'invalid divisor for attribute "' + attribute + '"', env.commandStr);
						}

						check$1.optional(function () {
							var command = env.commandStr;

							var VALID_KEYS = [
								'buffer',
								'offset',
								'divisor',
								'normalized',
								'type',
								'size',
								'stride'
							];

							Object.keys(value).forEach(function (prop) {
								check$1.command(
									VALID_KEYS.indexOf(prop) >= 0,
									'unknown parameter "' + prop + '" for attribute pointer "' + attribute + '" (valid parameters are ' + VALID_KEYS + ')',
									command);
							});
						});

						record.buffer = buffer;
						record.state = ATTRIB_STATE_POINTER;
						record.size = size;
						record.normalized = normalized;
						record.type = type || buffer.dtype;
						record.offset = offset;
						record.stride = stride;
						record.divisor = divisor;
					}
				}
			}

			attributeDefs[attribute] = createStaticDecl(function (env, scope) {
				var cache = env.attribCache;
				if (id in cache) {
					return cache[id]
				}
				var result = {
					isStream: false
				};
				Object.keys(record).forEach(function (key) {
					result[key] = record[key];
				});
				if (record.buffer) {
					result.buffer = env.link(record.buffer);
					result.type = result.type || (result.buffer + '.dtype');
				}
				cache[id] = result;
				return result
			});
		});

		Object.keys(dynamicAttributes).forEach(function (attribute) {
			var dyn = dynamicAttributes[attribute];

			function appendAttributeCode (env, block) {
				var VALUE = env.invoke(block, dyn);

				var shared = env.shared;
				var constants = env.constants;

				var IS_BUFFER_ARGS = shared.isBufferArgs;
				var BUFFER_STATE = shared.buffer;

				// Perform validation on attribute
				check$1.optional(function () {
					env.assert(block,
						VALUE + '&&(typeof ' + VALUE + '==="object"||typeof ' +
						VALUE + '==="function")&&(' +
						IS_BUFFER_ARGS + '(' + VALUE + ')||' +
						BUFFER_STATE + '.getBuffer(' + VALUE + ')||' +
						BUFFER_STATE + '.getBuffer(' + VALUE + '.buffer)||' +
						IS_BUFFER_ARGS + '(' + VALUE + '.buffer)||' +
						'("constant" in ' + VALUE +
						'&&(typeof ' + VALUE + '.constant==="number"||' +
						shared.isArrayLike + '(' + VALUE + '.constant))))',
						'invalid dynamic attribute "' + attribute + '"');
				});

				// allocate names for result
				var result = {
					isStream: block.def(false)
				};
				var defaultRecord = new AttributeRecord();
				defaultRecord.state = ATTRIB_STATE_POINTER;
				Object.keys(defaultRecord).forEach(function (key) {
					result[key] = block.def('' + defaultRecord[key]);
				});

				var BUFFER = result.buffer;
				var TYPE = result.type;
				block(
					'if(', IS_BUFFER_ARGS, '(', VALUE, ')){',
					result.isStream, '=true;',
					BUFFER, '=', BUFFER_STATE, '.createStream(', GL_ARRAY_BUFFER$1, ',', VALUE, ');',
					TYPE, '=', BUFFER, '.dtype;',
					'}else{',
					BUFFER, '=', BUFFER_STATE, '.getBuffer(', VALUE, ');',
					'if(', BUFFER, '){',
					TYPE, '=', BUFFER, '.dtype;',
					'}else if("constant" in ', VALUE, '){',
					result.state, '=', ATTRIB_STATE_CONSTANT, ';',
					'if(typeof ' + VALUE + '.constant === "number"){',
					result[CUTE_COMPONENTS[0]], '=', VALUE, '.constant;',
					CUTE_COMPONENTS.slice(1).map(function (n) {
						return result[n]
					}).join('='), '=0;',
					'}else{',
					CUTE_COMPONENTS.map(function (name, i) {
						return (
							result[name] + '=' + VALUE + '.constant.length>' + i +
							'?' + VALUE + '.constant[' + i + ']:0;'
						)
					}).join(''),
					'}}else{',
					'if(', IS_BUFFER_ARGS, '(', VALUE, '.buffer)){',
					BUFFER, '=', BUFFER_STATE, '.createStream(', GL_ARRAY_BUFFER$1, ',', VALUE, '.buffer);',
					'}else{',
					BUFFER, '=', BUFFER_STATE, '.getBuffer(', VALUE, '.buffer);',
					'}',
					TYPE, '="type" in ', VALUE, '?',
					constants.glTypes, '[', VALUE, '.type]:', BUFFER, '.dtype;',
					result.normalized, '=!!', VALUE, '.normalized;');
				function emitReadRecord (name) {
					block(result[name], '=', VALUE, '.', name, '|0;');
				}
				emitReadRecord('size');
				emitReadRecord('offset');
				emitReadRecord('stride');
				emitReadRecord('divisor');

				block('}}');

				block.exit(
					'if(', result.isStream, '){',
					BUFFER_STATE, '.destroyStream(', BUFFER, ');',
					'}');

				return result
			}

			attributeDefs[attribute] = createDynamicDecl(dyn, appendAttributeCode);
		});

		return attributeDefs
	}

	function parseContext (context) {
		var staticContext = context.static;
		var dynamicContext = context.dynamic;
		var result = {};

		Object.keys(staticContext).forEach(function (name) {
			var value = staticContext[name];
			result[name] = createStaticDecl(function (env, scope) {
				if (typeof value === 'number' || typeof value === 'boolean') {
					return '' + value
				} else {
					return env.link(value)
				}
			});
		});

		Object.keys(dynamicContext).forEach(function (name) {
			var dyn = dynamicContext[name];
			result[name] = createDynamicDecl(dyn, function (env, scope) {
				return env.invoke(scope, dyn)
			});
		});

		return result
	}

	function parseArguments (options, attributes, uniforms, context, env) {
		var staticOptions = options.static;
		var dynamicOptions = options.dynamic;

		check$1.optional(function () {
			var KEY_NAMES = [
				S_FRAMEBUFFER,
				S_VERT,
				S_FRAG,
				S_ELEMENTS,
				S_PRIMITIVE,
				S_OFFSET,
				S_COUNT,
				S_INSTANCES,
				S_PROFILE
			].concat(GL_STATE_NAMES);

			function checkKeys (dict) {
				Object.keys(dict).forEach(function (key) {
					check$1.command(
						KEY_NAMES.indexOf(key) >= 0,
						'unknown parameter "' + key + '"',
						env.commandStr);
				});
			}

			checkKeys(staticOptions);
			checkKeys(dynamicOptions);
		});

		var framebuffer = parseFramebuffer(options, env);
		var viewportAndScissor = parseViewportScissor(options, framebuffer, env);
		var draw = parseDraw(options, env);
		var state = parseGLState(options, env);
		var shader = parseProgram(options, env);

		function copyBox (name) {
			var defn = viewportAndScissor[name];
			if (defn) {
				state[name] = defn;
			}
		}
		copyBox(S_VIEWPORT);
		copyBox(propName(S_SCISSOR_BOX));

		var dirty = Object.keys(state).length > 0;

		var result = {
			framebuffer: framebuffer,
			draw: draw,
			shader: shader,
			state: state,
			dirty: dirty
		};

		result.profile = parseProfile(options, env);
		result.uniforms = parseUniforms(uniforms, env);
		result.attributes = parseAttributes(attributes, env);
		result.context = parseContext(context, env);
		return result
	}

	// ===================================================
	// ===================================================
	// COMMON UPDATE FUNCTIONS
	// ===================================================
	// ===================================================
	function emitContext (env, scope, context) {
		var shared = env.shared;
		var CONTEXT = shared.context;

		var contextEnter = env.scope();

		Object.keys(context).forEach(function (name) {
			scope.save(CONTEXT, '.' + name);
			var defn = context[name];
			contextEnter(CONTEXT, '.', name, '=', defn.append(env, scope), ';');
		});

		scope(contextEnter);
	}

	// ===================================================
	// ===================================================
	// COMMON DRAWING FUNCTIONS
	// ===================================================
	// ===================================================
	function emitPollFramebuffer (env, scope, framebuffer, skipCheck) {
		var shared = env.shared;

		var GL = shared.gl;
		var FRAMEBUFFER_STATE = shared.framebuffer;
		var EXT_DRAW_BUFFERS;
		if (extDrawBuffers) {
			EXT_DRAW_BUFFERS = scope.def(shared.extensions, '.webgl_draw_buffers');
		}

		var constants = env.constants;

		var DRAW_BUFFERS = constants.drawBuffer;
		var BACK_BUFFER = constants.backBuffer;

		var NEXT;
		if (framebuffer) {
			NEXT = framebuffer.append(env, scope);
		} else {
			NEXT = scope.def(FRAMEBUFFER_STATE, '.next');
		}

		if (!skipCheck) {
			scope('if(', NEXT, '!==', FRAMEBUFFER_STATE, '.cur){');
		}
		scope(
			'if(', NEXT, '){',
			GL, '.bindFramebuffer(', GL_FRAMEBUFFER$2, ',', NEXT, '.framebuffer);');
		if (extDrawBuffers) {
			scope(EXT_DRAW_BUFFERS, '.drawBuffersWEBGL(',
				DRAW_BUFFERS, '[', NEXT, '.colorAttachments.length]);');
		}
		scope('}else{',
			GL, '.bindFramebuffer(', GL_FRAMEBUFFER$2, ',null);');
		if (extDrawBuffers) {
			scope(EXT_DRAW_BUFFERS, '.drawBuffersWEBGL(', BACK_BUFFER, ');');
		}
		scope(
			'}',
			FRAMEBUFFER_STATE, '.cur=', NEXT, ';');
		if (!skipCheck) {
			scope('}');
		}
	}

	function emitPollState (env, scope, args) {
		var shared = env.shared;

		var GL = shared.gl;

		var CURRENT_VARS = env.current;
		var NEXT_VARS = env.next;
		var CURRENT_STATE = shared.current;
		var NEXT_STATE = shared.next;

		var block = env.cond(CURRENT_STATE, '.dirty');

		GL_STATE_NAMES.forEach(function (prop) {
			var param = propName(prop);
			if (param in args.state) {
				return
			}

			var NEXT, CURRENT;
			if (param in NEXT_VARS) {
				NEXT = NEXT_VARS[param];
				CURRENT = CURRENT_VARS[param];
				var parts = loop(currentState[param].length, function (i) {
					return block.def(NEXT, '[', i, ']')
				});
				block(env.cond(parts.map(function (p, i) {
					return p + '!==' + CURRENT + '[' + i + ']'
				}).join('||'))
					.then(
						GL, '.', GL_VARIABLES[param], '(', parts, ');',
						parts.map(function (p, i) {
							return CURRENT + '[' + i + ']=' + p
						}).join(';'), ';'));
			} else {
				NEXT = block.def(NEXT_STATE, '.', param);
				var ifte = env.cond(NEXT, '!==', CURRENT_STATE, '.', param);
				block(ifte);
				if (param in GL_FLAGS) {
					ifte(
						env.cond(NEXT)
								.then(GL, '.enable(', GL_FLAGS[param], ');')
								.else(GL, '.disable(', GL_FLAGS[param], ');'),
						CURRENT_STATE, '.', param, '=', NEXT, ';');
				} else {
					ifte(
						GL, '.', GL_VARIABLES[param], '(', NEXT, ');',
						CURRENT_STATE, '.', param, '=', NEXT, ';');
				}
			}
		});
		if (Object.keys(args.state).length === 0) {
			block(CURRENT_STATE, '.dirty=false;');
		}
		scope(block);
	}

	function emitSetOptions (env, scope, options, filter) {
		var shared = env.shared;
		var CURRENT_VARS = env.current;
		var CURRENT_STATE = shared.current;
		var GL = shared.gl;
		sortState(Object.keys(options)).forEach(function (param) {
			var defn = options[param];
			if (filter && !filter(defn)) {
				return
			}
			var variable = defn.append(env, scope);
			if (GL_FLAGS[param]) {
				var flag = GL_FLAGS[param];
				if (isStatic(defn)) {
					if (variable) {
						scope(GL, '.enable(', flag, ');');
					} else {
						scope(GL, '.disable(', flag, ');');
					}
				} else {
					scope(env.cond(variable)
						.then(GL, '.enable(', flag, ');')
						.else(GL, '.disable(', flag, ');'));
				}
				scope(CURRENT_STATE, '.', param, '=', variable, ';');
			} else if (isArrayLike(variable)) {
				var CURRENT = CURRENT_VARS[param];
				scope(
					GL, '.', GL_VARIABLES[param], '(', variable, ');',
					variable.map(function (v, i) {
						return CURRENT + '[' + i + ']=' + v
					}).join(';'), ';');
			} else {
				scope(
					GL, '.', GL_VARIABLES[param], '(', variable, ');',
					CURRENT_STATE, '.', param, '=', variable, ';');
			}
		});
	}

	function injectExtensions (env, scope) {
		if (extInstancing) {
			env.instancing = scope.def(
				env.shared.extensions, '.angle_instanced_arrays');
		}
	}

	function emitProfile (env, scope, args, useScope, incrementCounter) {
		var shared = env.shared;
		var STATS = env.stats;
		var CURRENT_STATE = shared.current;
		var TIMER = shared.timer;
		var profileArg = args.profile;

		function perfCounter () {
			if (typeof performance === 'undefined') {
				return 'Date.now()'
			} else {
				return 'performance.now()'
			}
		}

		var CPU_START, QUERY_COUNTER;
		function emitProfileStart (block) {
			CPU_START = scope.def();
			block(CPU_START, '=', perfCounter(), ';');
			if (typeof incrementCounter === 'string') {
				block(STATS, '.count+=', incrementCounter, ';');
			} else {
				block(STATS, '.count++;');
			}
			if (timer) {
				if (useScope) {
					QUERY_COUNTER = scope.def();
					block(QUERY_COUNTER, '=', TIMER, '.getNumPendingQueries();');
				} else {
					block(TIMER, '.beginQuery(', STATS, ');');
				}
			}
		}

		function emitProfileEnd (block) {
			block(STATS, '.cpuTime+=', perfCounter(), '-', CPU_START, ';');
			if (timer) {
				if (useScope) {
					block(TIMER, '.pushScopeStats(',
						QUERY_COUNTER, ',',
						TIMER, '.getNumPendingQueries(),',
						STATS, ');');
				} else {
					block(TIMER, '.endQuery();');
				}
			}
		}

		function scopeProfile (value) {
			var prev = scope.def(CURRENT_STATE, '.profile');
			scope(CURRENT_STATE, '.profile=', value, ';');
			scope.exit(CURRENT_STATE, '.profile=', prev, ';');
		}

		var USE_PROFILE;
		if (profileArg) {
			if (isStatic(profileArg)) {
				if (profileArg.enable) {
					emitProfileStart(scope);
					emitProfileEnd(scope.exit);
					scopeProfile('true');
				} else {
					scopeProfile('false');
				}
				return
			}
			USE_PROFILE = profileArg.append(env, scope);
			scopeProfile(USE_PROFILE);
		} else {
			USE_PROFILE = scope.def(CURRENT_STATE, '.profile');
		}

		var start = env.block();
		emitProfileStart(start);
		scope('if(', USE_PROFILE, '){', start, '}');
		var end = env.block();
		emitProfileEnd(end);
		scope.exit('if(', USE_PROFILE, '){', end, '}');
	}

	function emitAttributes (env, scope, args, attributes, filter) {
		var shared = env.shared;

		function typeLength (x) {
			switch (x) {
				case GL_FLOAT_VEC2:
				case GL_INT_VEC2:
				case GL_BOOL_VEC2:
					return 2
				case GL_FLOAT_VEC3:
				case GL_INT_VEC3:
				case GL_BOOL_VEC3:
					return 3
				case GL_FLOAT_VEC4:
				case GL_INT_VEC4:
				case GL_BOOL_VEC4:
					return 4
				default:
					return 1
			}
		}

		function emitBindAttribute (ATTRIBUTE, size, record) {
			var GL = shared.gl;

			var LOCATION = scope.def(ATTRIBUTE, '.location');
			var BINDING = scope.def(shared.attributes, '[', LOCATION, ']');

			var STATE = record.state;
			var BUFFER = record.buffer;
			var CONST_COMPONENTS = [
				record.x,
				record.y,
				record.z,
				record.w
			];

			var COMMON_KEYS = [
				'buffer',
				'normalized',
				'offset',
				'stride'
			];

			function emitBuffer () {
				scope(
					'if(!', BINDING, '.buffer){',
					GL, '.enableVertexAttribArray(', LOCATION, ');}');

				var TYPE = record.type;
				var SIZE;
				if (!record.size) {
					SIZE = size;
				} else {
					SIZE = scope.def(record.size, '||', size);
				}

				scope('if(',
					BINDING, '.type!==', TYPE, '||',
					BINDING, '.size!==', SIZE, '||',
					COMMON_KEYS.map(function (key) {
						return BINDING + '.' + key + '!==' + record[key]
					}).join('||'),
					'){',
					GL, '.bindBuffer(', GL_ARRAY_BUFFER$1, ',', BUFFER, '.buffer);',
					GL, '.vertexAttribPointer(', [
						LOCATION,
						SIZE,
						TYPE,
						record.normalized,
						record.stride,
						record.offset
					], ');',
					BINDING, '.type=', TYPE, ';',
					BINDING, '.size=', SIZE, ';',
					COMMON_KEYS.map(function (key) {
						return BINDING + '.' + key + '=' + record[key] + ';'
					}).join(''),
					'}');

				if (extInstancing) {
					var DIVISOR = record.divisor;
					scope(
						'if(', BINDING, '.divisor!==', DIVISOR, '){',
						env.instancing, '.vertexAttribDivisorANGLE(', [LOCATION, DIVISOR], ');',
						BINDING, '.divisor=', DIVISOR, ';}');
				}
			}

			function emitConstant () {
				scope(
					'if(', BINDING, '.buffer){',
					GL, '.disableVertexAttribArray(', LOCATION, ');',
					BINDING, '.buffer=null;',
					'}if(', CUTE_COMPONENTS.map(function (c, i) {
						return BINDING + '.' + c + '!==' + CONST_COMPONENTS[i]
					}).join('||'), '){',
					GL, '.vertexAttrib4f(', LOCATION, ',', CONST_COMPONENTS, ');',
					CUTE_COMPONENTS.map(function (c, i) {
						return BINDING + '.' + c + '=' + CONST_COMPONENTS[i] + ';'
					}).join(''),
					'}');
			}

			if (STATE === ATTRIB_STATE_POINTER) {
				emitBuffer();
			} else if (STATE === ATTRIB_STATE_CONSTANT) {
				emitConstant();
			} else {
				scope('if(', STATE, '===', ATTRIB_STATE_POINTER, '){');
				emitBuffer();
				scope('}else{');
				emitConstant();
				scope('}');
			}
		}

		attributes.forEach(function (attribute) {
			var name = attribute.name;
			var arg = args.attributes[name];
			var record;
			if (arg) {
				if (!filter(arg)) {
					return
				}
				record = arg.append(env, scope);
			} else {
				if (!filter(SCOPE_DECL)) {
					return
				}
				var scopeAttrib = env.scopeAttrib(name);
				check$1.optional(function () {
					env.assert(scope,
						scopeAttrib + '.state',
						'missing attribute ' + name);
				});
				record = {};
				Object.keys(new AttributeRecord()).forEach(function (key) {
					record[key] = scope.def(scopeAttrib, '.', key);
				});
			}
			emitBindAttribute(
				env.link(attribute), typeLength(attribute.info.type), record);
		});
	}

	function emitUniforms (env, scope, args, uniforms, filter) {
		var shared = env.shared;
		var GL = shared.gl;

		var infix;
		for (var i = 0; i < uniforms.length; ++i) {
			var uniform = uniforms[i];
			var name = uniform.name;
			var type = uniform.info.type;
			var arg = args.uniforms[name];
			var UNIFORM = env.link(uniform);
			var LOCATION = UNIFORM + '.location';

			var VALUE;
			if (arg) {
				if (!filter(arg)) {
					continue
				}
				if (isStatic(arg)) {
					var value = arg.value;
					check$1.command(
						value !== null && typeof value !== 'undefined',
						'missing uniform "' + name + '"', env.commandStr);
					if (type === GL_SAMPLER_2D || type === GL_SAMPLER_CUBE) {
						check$1.command(
							typeof value === 'function' &&
							((type === GL_SAMPLER_2D &&
								(value._reglType === 'texture2d' ||
								value._reglType === 'framebuffer')) ||
							(type === GL_SAMPLER_CUBE &&
								(value._reglType === 'textureCube' ||
								value._reglType === 'framebufferCube'))),
							'invalid texture for uniform ' + name, env.commandStr);
						var TEX_VALUE = env.link(value._texture || value.color[0]._texture);
						scope(GL, '.uniform1i(', LOCATION, ',', TEX_VALUE + '.bind());');
						scope.exit(TEX_VALUE, '.unbind();');
					} else if (
						type === GL_FLOAT_MAT2 ||
						type === GL_FLOAT_MAT3 ||
						type === GL_FLOAT_MAT4) {
						check$1.optional(function () {
							check$1.command(isArrayLike(value),
								'invalid matrix for uniform ' + name, env.commandStr);
							check$1.command(
								(type === GL_FLOAT_MAT2 && value.length === 4) ||
								(type === GL_FLOAT_MAT3 && value.length === 9) ||
								(type === GL_FLOAT_MAT4 && value.length === 16),
								'invalid length for matrix uniform ' + name, env.commandStr);
						});
						var MAT_VALUE = env.global.def('new Float32Array([' +
							Array.prototype.slice.call(value) + '])');
						var dim = 2;
						if (type === GL_FLOAT_MAT3) {
							dim = 3;
						} else if (type === GL_FLOAT_MAT4) {
							dim = 4;
						}
						scope(
							GL, '.uniformMatrix', dim, 'fv(',
							LOCATION, ',false,', MAT_VALUE, ');');
					} else {
						switch (type) {
							case GL_FLOAT$8:
								check$1.commandType(value, 'number', 'uniform ' + name, env.commandStr);
								infix = '1f';
								break
							case GL_FLOAT_VEC2:
								check$1.command(
									isArrayLike(value) && value.length === 2,
									'uniform ' + name, env.commandStr);
								infix = '2f';
								break
							case GL_FLOAT_VEC3:
								check$1.command(
									isArrayLike(value) && value.length === 3,
									'uniform ' + name, env.commandStr);
								infix = '3f';
								break
							case GL_FLOAT_VEC4:
								check$1.command(
									isArrayLike(value) && value.length === 4,
									'uniform ' + name, env.commandStr);
								infix = '4f';
								break
							case GL_BOOL:
								check$1.commandType(value, 'boolean', 'uniform ' + name, env.commandStr);
								infix = '1i';
								break
							case GL_INT$3:
								check$1.commandType(value, 'number', 'uniform ' + name, env.commandStr);
								infix = '1i';
								break
							case GL_BOOL_VEC2:
								check$1.command(
									isArrayLike(value) && value.length === 2,
									'uniform ' + name, env.commandStr);
								infix = '2i';
								break
							case GL_INT_VEC2:
								check$1.command(
									isArrayLike(value) && value.length === 2,
									'uniform ' + name, env.commandStr);
								infix = '2i';
								break
							case GL_BOOL_VEC3:
								check$1.command(
									isArrayLike(value) && value.length === 3,
									'uniform ' + name, env.commandStr);
								infix = '3i';
								break
							case GL_INT_VEC3:
								check$1.command(
									isArrayLike(value) && value.length === 3,
									'uniform ' + name, env.commandStr);
								infix = '3i';
								break
							case GL_BOOL_VEC4:
								check$1.command(
									isArrayLike(value) && value.length === 4,
									'uniform ' + name, env.commandStr);
								infix = '4i';
								break
							case GL_INT_VEC4:
								check$1.command(
									isArrayLike(value) && value.length === 4,
									'uniform ' + name, env.commandStr);
								infix = '4i';
								break
						}
						scope(GL, '.uniform', infix, '(', LOCATION, ',',
							isArrayLike(value) ? Array.prototype.slice.call(value) : value,
							');');
					}
					continue
				} else {
					VALUE = arg.append(env, scope);
				}
			} else {
				if (!filter(SCOPE_DECL)) {
					continue
				}
				VALUE = scope.def(shared.uniforms, '[', stringStore.id(name), ']');
			}

			if (type === GL_SAMPLER_2D) {
				scope(
					'if(', VALUE, '&&', VALUE, '._reglType==="framebuffer"){',
					VALUE, '=', VALUE, '.color[0];',
					'}');
			} else if (type === GL_SAMPLER_CUBE) {
				scope(
					'if(', VALUE, '&&', VALUE, '._reglType==="framebufferCube"){',
					VALUE, '=', VALUE, '.color[0];',
					'}');
			}

			// perform type validation
			check$1.optional(function () {
				function check (pred, message) {
					env.assert(scope, pred,
						'bad data or missing for uniform "' + name + '".  ' + message);
				}

				function checkType (type) {
					check(
						'typeof ' + VALUE + '==="' + type + '"',
						'invalid type, expected ' + type);
				}

				function checkVector (n, type) {
					check(
						shared.isArrayLike + '(' + VALUE + ')&&' + VALUE + '.length===' + n,
						'invalid vector, should have length ' + n, env.commandStr);
				}

				function checkTexture (target) {
					check(
						'typeof ' + VALUE + '==="function"&&' +
						VALUE + '._reglType==="texture' +
						(target === GL_TEXTURE_2D$3 ? '2d' : 'Cube') + '"',
						'invalid texture type', env.commandStr);
				}

				switch (type) {
					case GL_INT$3:
						checkType('number');
						break
					case GL_INT_VEC2:
						checkVector(2, 'number');
						break
					case GL_INT_VEC3:
						checkVector(3, 'number');
						break
					case GL_INT_VEC4:
						checkVector(4, 'number');
						break
					case GL_FLOAT$8:
						checkType('number');
						break
					case GL_FLOAT_VEC2:
						checkVector(2, 'number');
						break
					case GL_FLOAT_VEC3:
						checkVector(3, 'number');
						break
					case GL_FLOAT_VEC4:
						checkVector(4, 'number');
						break
					case GL_BOOL:
						checkType('boolean');
						break
					case GL_BOOL_VEC2:
						checkVector(2, 'boolean');
						break
					case GL_BOOL_VEC3:
						checkVector(3, 'boolean');
						break
					case GL_BOOL_VEC4:
						checkVector(4, 'boolean');
						break
					case GL_FLOAT_MAT2:
						checkVector(4, 'number');
						break
					case GL_FLOAT_MAT3:
						checkVector(9, 'number');
						break
					case GL_FLOAT_MAT4:
						checkVector(16, 'number');
						break
					case GL_SAMPLER_2D:
						checkTexture(GL_TEXTURE_2D$3);
						break
					case GL_SAMPLER_CUBE:
						checkTexture(GL_TEXTURE_CUBE_MAP$2);
						break
				}
			});

			var unroll = 1;
			switch (type) {
				case GL_SAMPLER_2D:
				case GL_SAMPLER_CUBE:
					var TEX = scope.def(VALUE, '._texture');
					scope(GL, '.uniform1i(', LOCATION, ',', TEX, '.bind());');
					scope.exit(TEX, '.unbind();');
					continue

				case GL_INT$3:
				case GL_BOOL:
					infix = '1i';
					break

				case GL_INT_VEC2:
				case GL_BOOL_VEC2:
					infix = '2i';
					unroll = 2;
					break

				case GL_INT_VEC3:
				case GL_BOOL_VEC3:
					infix = '3i';
					unroll = 3;
					break

				case GL_INT_VEC4:
				case GL_BOOL_VEC4:
					infix = '4i';
					unroll = 4;
					break

				case GL_FLOAT$8:
					infix = '1f';
					break

				case GL_FLOAT_VEC2:
					infix = '2f';
					unroll = 2;
					break

				case GL_FLOAT_VEC3:
					infix = '3f';
					unroll = 3;
					break

				case GL_FLOAT_VEC4:
					infix = '4f';
					unroll = 4;
					break

				case GL_FLOAT_MAT2:
					infix = 'Matrix2fv';
					break

				case GL_FLOAT_MAT3:
					infix = 'Matrix3fv';
					break

				case GL_FLOAT_MAT4:
					infix = 'Matrix4fv';
					break
			}

			scope(GL, '.uniform', infix, '(', LOCATION, ',');
			if (infix.charAt(0) === 'M') {
				var matSize = Math.pow(type - GL_FLOAT_MAT2 + 2, 2);
				var STORAGE = env.global.def('new Float32Array(', matSize, ')');
				scope(
					'false,(Array.isArray(', VALUE, ')||', VALUE, ' instanceof Float32Array)?', VALUE, ':(',
					loop(matSize, function (i) {
						return STORAGE + '[' + i + ']=' + VALUE + '[' + i + ']'
					}), ',', STORAGE, ')');
			} else if (unroll > 1) {
				scope(loop(unroll, function (i) {
					return VALUE + '[' + i + ']'
				}));
			} else {
				scope(VALUE);
			}
			scope(');');
		}
	}

	function emitDraw (env, outer, inner, args) {
		var shared = env.shared;
		var GL = shared.gl;
		var DRAW_STATE = shared.draw;

		var drawOptions = args.draw;

		function emitElements () {
			var defn = drawOptions.elements;
			var ELEMENTS;
			var scope = outer;
			if (defn) {
				if ((defn.contextDep && args.contextDynamic) || defn.propDep) {
					scope = inner;
				}
				ELEMENTS = defn.append(env, scope);
			} else {
				ELEMENTS = scope.def(DRAW_STATE, '.', S_ELEMENTS);
			}
			if (ELEMENTS) {
				scope(
					'if(' + ELEMENTS + ')' +
					GL + '.bindBuffer(' + GL_ELEMENT_ARRAY_BUFFER$1 + ',' + ELEMENTS + '.buffer.buffer);');
			}
			return ELEMENTS
		}

		function emitCount () {
			var defn = drawOptions.count;
			var COUNT;
			var scope = outer;
			if (defn) {
				if ((defn.contextDep && args.contextDynamic) || defn.propDep) {
					scope = inner;
				}
				COUNT = defn.append(env, scope);
				check$1.optional(function () {
					if (defn.MISSING) {
						env.assert(outer, 'false', 'missing vertex count');
					}
					if (defn.DYNAMIC) {
						env.assert(scope, COUNT + '>=0', 'missing vertex count');
					}
				});
			} else {
				COUNT = scope.def(DRAW_STATE, '.', S_COUNT);
				check$1.optional(function () {
					env.assert(scope, COUNT + '>=0', 'missing vertex count');
				});
			}
			return COUNT
		}

		var ELEMENTS = emitElements();
		function emitValue (name) {
			var defn = drawOptions[name];
			if (defn) {
				if ((defn.contextDep && args.contextDynamic) || defn.propDep) {
					return defn.append(env, inner)
				} else {
					return defn.append(env, outer)
				}
			} else {
				return outer.def(DRAW_STATE, '.', name)
			}
		}

		var PRIMITIVE = emitValue(S_PRIMITIVE);
		var OFFSET = emitValue(S_OFFSET);

		var COUNT = emitCount();
		if (typeof COUNT === 'number') {
			if (COUNT === 0) {
				return
			}
		} else {
			inner('if(', COUNT, '){');
			inner.exit('}');
		}

		var INSTANCES, EXT_INSTANCING;
		if (extInstancing) {
			INSTANCES = emitValue(S_INSTANCES);
			EXT_INSTANCING = env.instancing;
		}

		var ELEMENT_TYPE = ELEMENTS + '.type';

		var elementsStatic = drawOptions.elements && isStatic(drawOptions.elements);

		function emitInstancing () {
			function drawElements () {
				inner(EXT_INSTANCING, '.drawElementsInstancedANGLE(', [
					PRIMITIVE,
					COUNT,
					ELEMENT_TYPE,
					OFFSET + '<<((' + ELEMENT_TYPE + '-' + GL_UNSIGNED_BYTE$8 + ')>>1)',
					INSTANCES
				], ');');
			}

			function drawArrays () {
				inner(EXT_INSTANCING, '.drawArraysInstancedANGLE(',
					[PRIMITIVE, OFFSET, COUNT, INSTANCES], ');');
			}

			if (ELEMENTS) {
				if (!elementsStatic) {
					inner('if(', ELEMENTS, '){');
					drawElements();
					inner('}else{');
					drawArrays();
					inner('}');
				} else {
					drawElements();
				}
			} else {
				drawArrays();
			}
		}

		function emitRegular () {
			function drawElements () {
				inner(GL + '.drawElements(' + [
					PRIMITIVE,
					COUNT,
					ELEMENT_TYPE,
					OFFSET + '<<((' + ELEMENT_TYPE + '-' + GL_UNSIGNED_BYTE$8 + ')>>1)'
				] + ');');
			}

			function drawArrays () {
				inner(GL + '.drawArrays(' + [PRIMITIVE, OFFSET, COUNT] + ');');
			}

			if (ELEMENTS) {
				if (!elementsStatic) {
					inner('if(', ELEMENTS, '){');
					drawElements();
					inner('}else{');
					drawArrays();
					inner('}');
				} else {
					drawElements();
				}
			} else {
				drawArrays();
			}
		}

		if (extInstancing && (typeof INSTANCES !== 'number' || INSTANCES >= 0)) {
			if (typeof INSTANCES === 'string') {
				inner('if(', INSTANCES, '>0){');
				emitInstancing();
				inner('}else if(', INSTANCES, '<0){');
				emitRegular();
				inner('}');
			} else {
				emitInstancing();
			}
		} else {
			emitRegular();
		}
	}

	function createBody (emitBody, parentEnv, args, program, count) {
		var env = createREGLEnvironment();
		var scope = env.proc('body', count);
		check$1.optional(function () {
			env.commandStr = parentEnv.commandStr;
			env.command = env.link(parentEnv.commandStr);
		});
		if (extInstancing) {
			env.instancing = scope.def(
				env.shared.extensions, '.angle_instanced_arrays');
		}
		emitBody(env, scope, args, program);
		return env.compile().body
	}

	// ===================================================
	// ===================================================
	// DRAW PROC
	// ===================================================
	// ===================================================
	function emitDrawBody (env, draw, args, program) {
		injectExtensions(env, draw);
		emitAttributes(env, draw, args, program.attributes, function () {
			return true
		});
		emitUniforms(env, draw, args, program.uniforms, function () {
			return true
		});
		emitDraw(env, draw, draw, args);
	}

	function emitDrawProc (env, args) {
		var draw = env.proc('draw', 1);

		injectExtensions(env, draw);

		emitContext(env, draw, args.context);
		emitPollFramebuffer(env, draw, args.framebuffer);

		emitPollState(env, draw, args);
		emitSetOptions(env, draw, args.state);

		emitProfile(env, draw, args, false, true);

		var program = args.shader.progVar.append(env, draw);
		draw(env.shared.gl, '.useProgram(', program, '.program);');

		if (args.shader.program) {
			emitDrawBody(env, draw, args, args.shader.program);
		} else {
			var drawCache = env.global.def('{}');
			var PROG_ID = draw.def(program, '.id');
			var CACHED_PROC = draw.def(drawCache, '[', PROG_ID, ']');
			draw(
				env.cond(CACHED_PROC)
					.then(CACHED_PROC, '.call(this,a0);')
					.else(
						CACHED_PROC, '=', drawCache, '[', PROG_ID, ']=',
						env.link(function (program) {
							return createBody(emitDrawBody, env, args, program, 1)
						}), '(', program, ');',
						CACHED_PROC, '.call(this,a0);'));
		}

		if (Object.keys(args.state).length > 0) {
			draw(env.shared.current, '.dirty=true;');
		}
	}

	// ===================================================
	// ===================================================
	// BATCH PROC
	// ===================================================
	// ===================================================

	function emitBatchDynamicShaderBody (env, scope, args, program) {
		env.batchId = 'a1';

		injectExtensions(env, scope);

		function all () {
			return true
		}

		emitAttributes(env, scope, args, program.attributes, all);
		emitUniforms(env, scope, args, program.uniforms, all);
		emitDraw(env, scope, scope, args);
	}

	function emitBatchBody (env, scope, args, program) {
		injectExtensions(env, scope);

		var contextDynamic = args.contextDep;

		var BATCH_ID = scope.def();
		var PROP_LIST = 'a0';
		var NUM_PROPS = 'a1';
		var PROPS = scope.def();
		env.shared.props = PROPS;
		env.batchId = BATCH_ID;

		var outer = env.scope();
		var inner = env.scope();

		scope(
			outer.entry,
			'for(', BATCH_ID, '=0;', BATCH_ID, '<', NUM_PROPS, ';++', BATCH_ID, '){',
			PROPS, '=', PROP_LIST, '[', BATCH_ID, '];',
			inner,
			'}',
			outer.exit);

		function isInnerDefn (defn) {
			return ((defn.contextDep && contextDynamic) || defn.propDep)
		}

		function isOuterDefn (defn) {
			return !isInnerDefn(defn)
		}

		if (args.needsContext) {
			emitContext(env, inner, args.context);
		}
		if (args.needsFramebuffer) {
			emitPollFramebuffer(env, inner, args.framebuffer);
		}
		emitSetOptions(env, inner, args.state, isInnerDefn);

		if (args.profile && isInnerDefn(args.profile)) {
			emitProfile(env, inner, args, false, true);
		}

		if (!program) {
			var progCache = env.global.def('{}');
			var PROGRAM = args.shader.progVar.append(env, inner);
			var PROG_ID = inner.def(PROGRAM, '.id');
			var CACHED_PROC = inner.def(progCache, '[', PROG_ID, ']');
			inner(
				env.shared.gl, '.useProgram(', PROGRAM, '.program);',
				'if(!', CACHED_PROC, '){',
				CACHED_PROC, '=', progCache, '[', PROG_ID, ']=',
				env.link(function (program) {
					return createBody(
						emitBatchDynamicShaderBody, env, args, program, 2)
				}), '(', PROGRAM, ');}',
				CACHED_PROC, '.call(this,a0[', BATCH_ID, '],', BATCH_ID, ');');
		} else {
			emitAttributes(env, outer, args, program.attributes, isOuterDefn);
			emitAttributes(env, inner, args, program.attributes, isInnerDefn);
			emitUniforms(env, outer, args, program.uniforms, isOuterDefn);
			emitUniforms(env, inner, args, program.uniforms, isInnerDefn);
			emitDraw(env, outer, inner, args);
		}
	}

	function emitBatchProc (env, args) {
		var batch = env.proc('batch', 2);
		env.batchId = '0';

		injectExtensions(env, batch);

		// Check if any context variables depend on props
		var contextDynamic = false;
		var needsContext = true;
		Object.keys(args.context).forEach(function (name) {
			contextDynamic = contextDynamic || args.context[name].propDep;
		});
		if (!contextDynamic) {
			emitContext(env, batch, args.context);
			needsContext = false;
		}

		// framebuffer state affects framebufferWidth/height context vars
		var framebuffer = args.framebuffer;
		var needsFramebuffer = false;
		if (framebuffer) {
			if (framebuffer.propDep) {
				contextDynamic = needsFramebuffer = true;
			} else if (framebuffer.contextDep && contextDynamic) {
				needsFramebuffer = true;
			}
			if (!needsFramebuffer) {
				emitPollFramebuffer(env, batch, framebuffer);
			}
		} else {
			emitPollFramebuffer(env, batch, null);
		}

		// viewport is weird because it can affect context vars
		if (args.state.viewport && args.state.viewport.propDep) {
			contextDynamic = true;
		}

		function isInnerDefn (defn) {
			return (defn.contextDep && contextDynamic) || defn.propDep
		}

		// set webgl options
		emitPollState(env, batch, args);
		emitSetOptions(env, batch, args.state, function (defn) {
			return !isInnerDefn(defn)
		});

		if (!args.profile || !isInnerDefn(args.profile)) {
			emitProfile(env, batch, args, false, 'a1');
		}

		// Save these values to args so that the batch body routine can use them
		args.contextDep = contextDynamic;
		args.needsContext = needsContext;
		args.needsFramebuffer = needsFramebuffer;

		// determine if shader is dynamic
		var progDefn = args.shader.progVar;
		if ((progDefn.contextDep && contextDynamic) || progDefn.propDep) {
			emitBatchBody(
				env,
				batch,
				args,
				null);
		} else {
			var PROGRAM = progDefn.append(env, batch);
			batch(env.shared.gl, '.useProgram(', PROGRAM, '.program);');
			if (args.shader.program) {
				emitBatchBody(
					env,
					batch,
					args,
					args.shader.program);
			} else {
				var batchCache = env.global.def('{}');
				var PROG_ID = batch.def(PROGRAM, '.id');
				var CACHED_PROC = batch.def(batchCache, '[', PROG_ID, ']');
				batch(
					env.cond(CACHED_PROC)
						.then(CACHED_PROC, '.call(this,a0,a1);')
						.else(
							CACHED_PROC, '=', batchCache, '[', PROG_ID, ']=',
							env.link(function (program) {
								return createBody(emitBatchBody, env, args, program, 2)
							}), '(', PROGRAM, ');',
							CACHED_PROC, '.call(this,a0,a1);'));
			}
		}

		if (Object.keys(args.state).length > 0) {
			batch(env.shared.current, '.dirty=true;');
		}
	}

	// ===================================================
	// ===================================================
	// SCOPE COMMAND
	// ===================================================
	// ===================================================
	function emitScopeProc (env, args) {
		var scope = env.proc('scope', 3);
		env.batchId = 'a2';

		var shared = env.shared;
		var CURRENT_STATE = shared.current;

		emitContext(env, scope, args.context);

		if (args.framebuffer) {
			args.framebuffer.append(env, scope);
		}

		sortState(Object.keys(args.state)).forEach(function (name) {
			var defn = args.state[name];
			var value = defn.append(env, scope);
			if (isArrayLike(value)) {
				value.forEach(function (v, i) {
					scope.set(env.next[name], '[' + i + ']', v);
				});
			} else {
				scope.set(shared.next, '.' + name, value);
			}
		});

		emitProfile(env, scope, args, true, true)

		;[S_ELEMENTS, S_OFFSET, S_COUNT, S_INSTANCES, S_PRIMITIVE].forEach(
			function (opt) {
				var variable = args.draw[opt];
				if (!variable) {
					return
				}
				scope.set(shared.draw, '.' + opt, '' + variable.append(env, scope));
			});

		Object.keys(args.uniforms).forEach(function (opt) {
			scope.set(
				shared.uniforms,
				'[' + stringStore.id(opt) + ']',
				args.uniforms[opt].append(env, scope));
		});

		Object.keys(args.attributes).forEach(function (name) {
			var record = args.attributes[name].append(env, scope);
			var scopeAttrib = env.scopeAttrib(name);
			Object.keys(new AttributeRecord()).forEach(function (prop) {
				scope.set(scopeAttrib, '.' + prop, record[prop]);
			});
		});

		function saveShader (name) {
			var shader = args.shader[name];
			if (shader) {
				scope.set(shared.shader, '.' + name, shader.append(env, scope));
			}
		}
		saveShader(S_VERT);
		saveShader(S_FRAG);

		if (Object.keys(args.state).length > 0) {
			scope(CURRENT_STATE, '.dirty=true;');
			scope.exit(CURRENT_STATE, '.dirty=true;');
		}

		scope('a1(', env.shared.context, ',a0,', env.batchId, ');');
	}

	function isDynamicObject (object) {
		if (typeof object !== 'object' || isArrayLike(object)) {
			return
		}
		var props = Object.keys(object);
		for (var i = 0; i < props.length; ++i) {
			if (dynamic.isDynamic(object[props[i]])) {
				return true
			}
		}
		return false
	}

	function splatObject (env, options, name) {
		var object = options.static[name];
		if (!object || !isDynamicObject(object)) {
			return
		}

		var globals = env.global;
		var keys = Object.keys(object);
		var thisDep = false;
		var contextDep = false;
		var propDep = false;
		var objectRef = env.global.def('{}');
		keys.forEach(function (key) {
			var value = object[key];
			if (dynamic.isDynamic(value)) {
				if (typeof value === 'function') {
					value = object[key] = dynamic.unbox(value);
				}
				var deps = createDynamicDecl(value, null);
				thisDep = thisDep || deps.thisDep;
				propDep = propDep || deps.propDep;
				contextDep = contextDep || deps.contextDep;
			} else {
				globals(objectRef, '.', key, '=');
				switch (typeof value) {
					case 'number':
						globals(value);
						break
					case 'string':
						globals('"', value, '"');
						break
					case 'object':
						if (Array.isArray(value)) {
							globals('[', value.join(), ']');
						}
						break
					default:
						globals(env.link(value));
						break
				}
				globals(';');
			}
		});

		function appendBlock (env, block) {
			keys.forEach(function (key) {
				var value = object[key];
				if (!dynamic.isDynamic(value)) {
					return
				}
				var ref = env.invoke(block, value);
				block(objectRef, '.', key, '=', ref, ';');
			});
		}

		options.dynamic[name] = new dynamic.DynamicVariable(DYN_THUNK, {
			thisDep: thisDep,
			contextDep: contextDep,
			propDep: propDep,
			ref: objectRef,
			append: appendBlock
		});
		delete options.static[name];
	}

	// ===========================================================================
	// ===========================================================================
	// MAIN DRAW COMMAND
	// ===========================================================================
	// ===========================================================================
	function compileCommand (options, attributes, uniforms, context, stats) {
		var env = createREGLEnvironment();

		// link stats, so that we can easily access it in the program.
		env.stats = env.link(stats);

		// splat options and attributes to allow for dynamic nested properties
		Object.keys(attributes.static).forEach(function (key) {
			splatObject(env, attributes, key);
		});
		NESTED_OPTIONS.forEach(function (name) {
			splatObject(env, options, name);
		});

		var args = parseArguments(options, attributes, uniforms, context, env);

		emitDrawProc(env, args);
		emitScopeProc(env, args);
		emitBatchProc(env, args);

		return env.compile()
	}

	// ===========================================================================
	// ===========================================================================
	// POLL / REFRESH
	// ===========================================================================
	// ===========================================================================
	return {
		next: nextState,
		current: currentState,
		procs: (function () {
			var env = createREGLEnvironment();
			var poll = env.proc('poll');
			var refresh = env.proc('refresh');
			var common = env.block();
			poll(common);
			refresh(common);

			var shared = env.shared;
			var GL = shared.gl;
			var NEXT_STATE = shared.next;
			var CURRENT_STATE = shared.current;

			common(CURRENT_STATE, '.dirty=false;');

			emitPollFramebuffer(env, poll);
			emitPollFramebuffer(env, refresh, null, true);

			// Refresh updates all attribute state changes
			var INSTANCING;
			if (extInstancing) {
				INSTANCING = env.link(extInstancing);
			}
			for (var i = 0; i < limits.maxAttributes; ++i) {
				var BINDING = refresh.def(shared.attributes, '[', i, ']');
				var ifte = env.cond(BINDING, '.buffer');
				ifte.then(
					GL, '.enableVertexAttribArray(', i, ');',
					GL, '.bindBuffer(',
						GL_ARRAY_BUFFER$1, ',',
						BINDING, '.buffer.buffer);',
					GL, '.vertexAttribPointer(',
						i, ',',
						BINDING, '.size,',
						BINDING, '.type,',
						BINDING, '.normalized,',
						BINDING, '.stride,',
						BINDING, '.offset);'
				).else(
					GL, '.disableVertexAttribArray(', i, ');',
					GL, '.vertexAttrib4f(',
						i, ',',
						BINDING, '.x,',
						BINDING, '.y,',
						BINDING, '.z,',
						BINDING, '.w);',
					BINDING, '.buffer=null;');
				refresh(ifte);
				if (extInstancing) {
					refresh(
						INSTANCING, '.vertexAttribDivisorANGLE(',
						i, ',',
						BINDING, '.divisor);');
				}
			}

			Object.keys(GL_FLAGS).forEach(function (flag) {
				var cap = GL_FLAGS[flag];
				var NEXT = common.def(NEXT_STATE, '.', flag);
				var block = env.block();
				block('if(', NEXT, '){',
					GL, '.enable(', cap, ')}else{',
					GL, '.disable(', cap, ')}',
					CURRENT_STATE, '.', flag, '=', NEXT, ';');
				refresh(block);
				poll(
					'if(', NEXT, '!==', CURRENT_STATE, '.', flag, '){',
					block,
					'}');
			});

			Object.keys(GL_VARIABLES).forEach(function (name) {
				var func = GL_VARIABLES[name];
				var init = currentState[name];
				var NEXT, CURRENT;
				var block = env.block();
				block(GL, '.', func, '(');
				if (isArrayLike(init)) {
					var n = init.length;
					NEXT = env.global.def(NEXT_STATE, '.', name);
					CURRENT = env.global.def(CURRENT_STATE, '.', name);
					block(
						loop(n, function (i) {
							return NEXT + '[' + i + ']'
						}), ');',
						loop(n, function (i) {
							return CURRENT + '[' + i + ']=' + NEXT + '[' + i + '];'
						}).join(''));
					poll(
						'if(', loop(n, function (i) {
							return NEXT + '[' + i + ']!==' + CURRENT + '[' + i + ']'
						}).join('||'), '){',
						block,
						'}');
				} else {
					NEXT = common.def(NEXT_STATE, '.', name);
					CURRENT = common.def(CURRENT_STATE, '.', name);
					block(
						NEXT, ');',
						CURRENT_STATE, '.', name, '=', NEXT, ';');
					poll(
						'if(', NEXT, '!==', CURRENT, '){',
						block,
						'}');
				}
				refresh(block);
			});

			return env.compile()
		})(),
		compile: compileCommand
	}
}

function stats () {
	return {
		bufferCount: 0,
		elementsCount: 0,
		framebufferCount: 0,
		shaderCount: 0,
		textureCount: 0,
		cubeCount: 0,
		renderbufferCount: 0,
		maxTextureUnits: 0
	}
}

var GL_QUERY_RESULT_EXT = 0x8866;
var GL_QUERY_RESULT_AVAILABLE_EXT = 0x8867;
var GL_TIME_ELAPSED_EXT = 0x88BF;

var createTimer = function (gl, extensions) {
	if (!extensions.ext_disjoint_timer_query) {
		return null
	}

	// QUERY POOL BEGIN
	var queryPool = [];
	function allocQuery () {
		return queryPool.pop() || extensions.ext_disjoint_timer_query.createQueryEXT()
	}
	function freeQuery (query) {
		queryPool.push(query);
	}
	// QUERY POOL END

	var pendingQueries = [];
	function beginQuery (stats) {
		var query = allocQuery();
		extensions.ext_disjoint_timer_query.beginQueryEXT(GL_TIME_ELAPSED_EXT, query);
		pendingQueries.push(query);
		pushScopeStats(pendingQueries.length - 1, pendingQueries.length, stats);
	}

	function endQuery () {
		extensions.ext_disjoint_timer_query.endQueryEXT(GL_TIME_ELAPSED_EXT);
	}

	//
	// Pending stats pool.
	//
	function PendingStats () {
		this.startQueryIndex = -1;
		this.endQueryIndex = -1;
		this.sum = 0;
		this.stats = null;
	}
	var pendingStatsPool = [];
	function allocPendingStats () {
		return pendingStatsPool.pop() || new PendingStats()
	}
	function freePendingStats (pendingStats) {
		pendingStatsPool.push(pendingStats);
	}
	// Pending stats pool end

	var pendingStats = [];
	function pushScopeStats (start, end, stats) {
		var ps = allocPendingStats();
		ps.startQueryIndex = start;
		ps.endQueryIndex = end;
		ps.sum = 0;
		ps.stats = stats;
		pendingStats.push(ps);
	}

	// we should call this at the beginning of the frame,
	// in order to update gpuTime
	var timeSum = [];
	var queryPtr = [];
	function update () {
		var ptr, i;

		var n = pendingQueries.length;
		if (n === 0) {
			return
		}

		// Reserve space
		queryPtr.length = Math.max(queryPtr.length, n + 1);
		timeSum.length = Math.max(timeSum.length, n + 1);
		timeSum[0] = 0;
		queryPtr[0] = 0;

		// Update all pending timer queries
		var queryTime = 0;
		ptr = 0;
		for (i = 0; i < pendingQueries.length; ++i) {
			var query = pendingQueries[i];
			if (extensions.ext_disjoint_timer_query.getQueryObjectEXT(query, GL_QUERY_RESULT_AVAILABLE_EXT)) {
				queryTime += extensions.ext_disjoint_timer_query.getQueryObjectEXT(query, GL_QUERY_RESULT_EXT);
				freeQuery(query);
			} else {
				pendingQueries[ptr++] = query;
			}
			timeSum[i + 1] = queryTime;
			queryPtr[i + 1] = ptr;
		}
		pendingQueries.length = ptr;

		// Update all pending stat queries
		ptr = 0;
		for (i = 0; i < pendingStats.length; ++i) {
			var stats = pendingStats[i];
			var start = stats.startQueryIndex;
			var end = stats.endQueryIndex;
			stats.sum += timeSum[end] - timeSum[start];
			var startPtr = queryPtr[start];
			var endPtr = queryPtr[end];
			if (endPtr === startPtr) {
				stats.stats.gpuTime += stats.sum / 1e6;
				freePendingStats(stats);
			} else {
				stats.startQueryIndex = startPtr;
				stats.endQueryIndex = endPtr;
				pendingStats[ptr++] = stats;
			}
		}
		pendingStats.length = ptr;
	}

	return {
		beginQuery: beginQuery,
		endQuery: endQuery,
		pushScopeStats: pushScopeStats,
		update: update,
		getNumPendingQueries: function () {
			return pendingQueries.length
		},
		clear: function () {
			queryPool.push.apply(queryPool, pendingQueries);
			for (var i = 0; i < queryPool.length; i++) {
				extensions.ext_disjoint_timer_query.deleteQueryEXT(queryPool[i]);
			}
			pendingQueries.length = 0;
			queryPool.length = 0;
		},
		restore: function () {
			pendingQueries.length = 0;
			queryPool.length = 0;
		}
	}
};

var GL_COLOR_BUFFER_BIT = 16384;
var GL_DEPTH_BUFFER_BIT = 256;
var GL_STENCIL_BUFFER_BIT = 1024;

var GL_ARRAY_BUFFER = 34962;

var CONTEXT_LOST_EVENT = 'webglcontextlost';
var CONTEXT_RESTORED_EVENT = 'webglcontextrestored';

var DYN_PROP = 1;
var DYN_CONTEXT = 2;
var DYN_STATE = 3;

function find (haystack, needle) {
	for (var i = 0; i < haystack.length; ++i) {
		if (haystack[i] === needle) {
			return i
		}
	}
	return -1
}

function wrapREGL (args) {
	var config = parseArgs(args);
	if (!config) {
		return null
	}

	var gl = config.gl;
	var glAttributes = gl.getContextAttributes();
	var contextLost = gl.isContextLost();

	var extensionState = createExtensionCache(gl, config);
	if (!extensionState) {
		return null
	}

	var stringStore = createStringStore();
	var stats$$1 = stats();
	var extensions = extensionState.extensions;
	var timer = createTimer(gl, extensions);

	var START_TIME = clock();
	var WIDTH = gl.drawingBufferWidth;
	var HEIGHT = gl.drawingBufferHeight;

	var contextState = {
		tick: 0,
		time: 0,
		viewportWidth: WIDTH,
		viewportHeight: HEIGHT,
		framebufferWidth: WIDTH,
		framebufferHeight: HEIGHT,
		drawingBufferWidth: WIDTH,
		drawingBufferHeight: HEIGHT,
		pixelRatio: config.pixelRatio
	};
	var uniformState = {};
	var drawState = {
		elements: null,
		primitive: 4, // GL_TRIANGLES
		count: -1,
		offset: 0,
		instances: -1
	};

	var limits = wrapLimits(gl, extensions);
	var attributeState = wrapAttributeState(
		gl,
		extensions,
		limits,
		stringStore);
	var bufferState = wrapBufferState(
		gl,
		stats$$1,
		config,
		attributeState);
	var elementState = wrapElementsState(gl, extensions, bufferState, stats$$1);
	var shaderState = wrapShaderState(gl, stringStore, stats$$1, config);
	var textureState = createTextureSet(
		gl,
		extensions,
		limits,
		function () { core.procs.poll(); },
		contextState,
		stats$$1,
		config);
	var renderbufferState = wrapRenderbuffers(gl, extensions, limits, stats$$1, config);
	var framebufferState = wrapFBOState(
		gl,
		extensions,
		limits,
		textureState,
		renderbufferState,
		stats$$1);
	var core = reglCore(
		gl,
		stringStore,
		extensions,
		limits,
		bufferState,
		elementState,
		textureState,
		framebufferState,
		uniformState,
		attributeState,
		shaderState,
		drawState,
		contextState,
		timer,
		config);
	var readPixels = wrapReadPixels(
		gl,
		framebufferState,
		core.procs.poll,
		contextState,
		glAttributes, extensions, limits);

	var nextState = core.next;
	var canvas = gl.canvas;

	var rafCallbacks = [];
	var lossCallbacks = [];
	var restoreCallbacks = [];
	var destroyCallbacks = [config.onDestroy];

	var activeRAF = null;
	function handleRAF () {
		if (rafCallbacks.length === 0) {
			if (timer) {
				timer.update();
			}
			activeRAF = null;
			return
		}

		// schedule next animation frame
		activeRAF = raf.next(handleRAF);

		// poll for changes
		poll();

		// fire a callback for all pending rafs
		for (var i = rafCallbacks.length - 1; i >= 0; --i) {
			var cb = rafCallbacks[i];
			if (cb) {
				cb(contextState, null, 0);
			}
		}

		// flush all pending webgl calls
		gl.flush();

		// poll GPU timers *after* gl.flush so we don't delay command dispatch
		if (timer) {
			timer.update();
		}
	}

	function startRAF () {
		if (!activeRAF && rafCallbacks.length > 0) {
			activeRAF = raf.next(handleRAF);
		}
	}

	function stopRAF () {
		if (activeRAF) {
			raf.cancel(handleRAF);
			activeRAF = null;
		}
	}

	function handleContextLoss (event) {
		event.preventDefault();

		// set context lost flag
		contextLost = true;

		// pause request animation frame
		stopRAF();

		// lose context
		lossCallbacks.forEach(function (cb) {
			cb();
		});
	}

	function handleContextRestored (event) {
		// clear error code
		gl.getError();

		// clear context lost flag
		contextLost = false;

		// refresh state
		extensionState.restore();
		shaderState.restore();
		bufferState.restore();
		textureState.restore();
		renderbufferState.restore();
		framebufferState.restore();
		if (timer) {
			timer.restore();
		}

		// refresh state
		core.procs.refresh();

		// restart RAF
		startRAF();

		// restore context
		restoreCallbacks.forEach(function (cb) {
			cb();
		});
	}

	if (canvas) {
		canvas.addEventListener(CONTEXT_LOST_EVENT, handleContextLoss, false);
		canvas.addEventListener(CONTEXT_RESTORED_EVENT, handleContextRestored, false);
	}

	function destroy () {
		rafCallbacks.length = 0;
		stopRAF();

		if (canvas) {
			canvas.removeEventListener(CONTEXT_LOST_EVENT, handleContextLoss);
			canvas.removeEventListener(CONTEXT_RESTORED_EVENT, handleContextRestored);
		}

		shaderState.clear();
		framebufferState.clear();
		renderbufferState.clear();
		textureState.clear();
		elementState.clear();
		bufferState.clear();

		if (timer) {
			timer.clear();
		}

		destroyCallbacks.forEach(function (cb) {
			cb();
		});
	}

	function compileProcedure (options) {
		check$1(!!options, 'invalid args to regl({...})');
		check$1.type(options, 'object', 'invalid args to regl({...})');

		function flattenNestedOptions (options) {
			var result = extend({}, options);
			delete result.uniforms;
			delete result.attributes;
			delete result.context;

			if ('stencil' in result && result.stencil.op) {
				result.stencil.opBack = result.stencil.opFront = result.stencil.op;
				delete result.stencil.op;
			}

			function merge (name) {
				if (name in result) {
					var child = result[name];
					delete result[name];
					Object.keys(child).forEach(function (prop) {
						result[name + '.' + prop] = child[prop];
					});
				}
			}
			merge('blend');
			merge('depth');
			merge('cull');
			merge('stencil');
			merge('polygonOffset');
			merge('scissor');
			merge('sample');

			return result
		}

		function separateDynamic (object) {
			var staticItems = {};
			var dynamicItems = {};
			Object.keys(object).forEach(function (option) {
				var value = object[option];
				if (dynamic.isDynamic(value)) {
					dynamicItems[option] = dynamic.unbox(value, option);
				} else {
					staticItems[option] = value;
				}
			});
			return {
				dynamic: dynamicItems,
				static: staticItems
			}
		}

		// Treat context variables separate from other dynamic variables
		var context = separateDynamic(options.context || {});
		var uniforms = separateDynamic(options.uniforms || {});
		var attributes = separateDynamic(options.attributes || {});
		var opts = separateDynamic(flattenNestedOptions(options));

		var stats$$1 = {
			gpuTime: 0.0,
			cpuTime: 0.0,
			count: 0
		};

		var compiled = core.compile(opts, attributes, uniforms, context, stats$$1);

		var draw = compiled.draw;
		var batch = compiled.batch;
		var scope = compiled.scope;

		// FIXME: we should modify code generation for batch commands so this
		// isn't necessary
		var EMPTY_ARRAY = [];
		function reserve (count) {
			while (EMPTY_ARRAY.length < count) {
				EMPTY_ARRAY.push(null);
			}
			return EMPTY_ARRAY
		}

		function REGLCommand (args, body) {
			var i;
			if (contextLost) {
				check$1.raise('context lost');
			}
			if (typeof args === 'function') {
				return scope.call(this, null, args, 0)
			} else if (typeof body === 'function') {
				if (typeof args === 'number') {
					for (i = 0; i < args; ++i) {
						scope.call(this, null, body, i);
					}
					return
				} else if (Array.isArray(args)) {
					for (i = 0; i < args.length; ++i) {
						scope.call(this, args[i], body, i);
					}
					return
				} else {
					return scope.call(this, args, body, 0)
				}
			} else if (typeof args === 'number') {
				if (args > 0) {
					return batch.call(this, reserve(args | 0), args | 0)
				}
			} else if (Array.isArray(args)) {
				if (args.length) {
					return batch.call(this, args, args.length)
				}
			} else {
				return draw.call(this, args)
			}
		}

		return extend(REGLCommand, {
			stats: stats$$1
		})
	}

	var setFBO = framebufferState.setFBO = compileProcedure({
		framebuffer: dynamic.define.call(null, DYN_PROP, 'framebuffer')
	});

	function clearImpl (_, options) {
		var clearFlags = 0;
		core.procs.poll();

		var c = options.color;
		if (c) {
			gl.clearColor(+c[0] || 0, +c[1] || 0, +c[2] || 0, +c[3] || 0);
			clearFlags |= GL_COLOR_BUFFER_BIT;
		}
		if ('depth' in options) {
			gl.clearDepth(+options.depth);
			clearFlags |= GL_DEPTH_BUFFER_BIT;
		}
		if ('stencil' in options) {
			gl.clearStencil(options.stencil | 0);
			clearFlags |= GL_STENCIL_BUFFER_BIT;
		}

		check$1(!!clearFlags, 'called regl.clear with no buffer specified');
		gl.clear(clearFlags);
	}

	function clear (options) {
		check$1(
			typeof options === 'object' && options,
			'regl.clear() takes an object as input');
		if ('framebuffer' in options) {
			if (options.framebuffer &&
					options.framebuffer_reglType === 'framebufferCube') {
				for (var i = 0; i < 6; ++i) {
					setFBO(extend({
						framebuffer: options.framebuffer.faces[i]
					}, options), clearImpl);
				}
			} else {
				setFBO(options, clearImpl);
			}
		} else {
			clearImpl(null, options);
		}
	}

	function frame (cb) {
		check$1.type(cb, 'function', 'regl.frame() callback must be a function');
		rafCallbacks.push(cb);

		function cancel () {
			// FIXME:  should we check something other than equals cb here?
			// what if a user calls frame twice with the same callback...
			//
			var i = find(rafCallbacks, cb);
			check$1(i >= 0, 'cannot cancel a frame twice');
			function pendingCancel () {
				var index = find(rafCallbacks, pendingCancel);
				rafCallbacks[index] = rafCallbacks[rafCallbacks.length - 1];
				rafCallbacks.length -= 1;
				if (rafCallbacks.length <= 0) {
					stopRAF();
				}
			}
			rafCallbacks[i] = pendingCancel;
		}

		startRAF();

		return {
			cancel: cancel
		}
	}

	// poll viewport
	function pollViewport () {
		var viewport = nextState.viewport;
		var scissorBox = nextState.scissor_box;
		viewport[0] = viewport[1] = scissorBox[0] = scissorBox[1] = 0;
		contextState.viewportWidth =
			contextState.framebufferWidth =
			contextState.drawingBufferWidth =
			viewport[2] =
			scissorBox[2] = gl.drawingBufferWidth;
		contextState.viewportHeight =
			contextState.framebufferHeight =
			contextState.drawingBufferHeight =
			viewport[3] =
			scissorBox[3] = gl.drawingBufferHeight;
	}

	function poll () {
		contextState.tick += 1;
		contextState.time = now();
		pollViewport();
		core.procs.poll();
	}

	function refresh () {
		pollViewport();
		core.procs.refresh();
		if (timer) {
			timer.update();
		}
	}

	function now () {
		return (clock() - START_TIME) / 1000.0
	}

	refresh();

	function addListener (event, callback) {
		check$1.type(callback, 'function', 'listener callback must be a function');

		var callbacks;
		switch (event) {
			case 'frame':
				return frame(callback)
			case 'lost':
				callbacks = lossCallbacks;
				break
			case 'restore':
				callbacks = restoreCallbacks;
				break
			case 'destroy':
				callbacks = destroyCallbacks;
				break
			default:
				check$1.raise('invalid event, must be one of frame,lost,restore,destroy');
		}

		callbacks.push(callback);
		return {
			cancel: function () {
				for (var i = 0; i < callbacks.length; ++i) {
					if (callbacks[i] === callback) {
						callbacks[i] = callbacks[callbacks.length - 1];
						callbacks.pop();
						return
					}
				}
			}
		}
	}

	var regl = extend(compileProcedure, {
		// Clear current FBO
		clear: clear,

		// Short cuts for dynamic variables
		prop: dynamic.define.bind(null, DYN_PROP),
		context: dynamic.define.bind(null, DYN_CONTEXT),
		this: dynamic.define.bind(null, DYN_STATE),

		// executes an empty draw command
		draw: compileProcedure({}),

		// Resources
		buffer: function (options) {
			return bufferState.create(options, GL_ARRAY_BUFFER, false, false)
		},
		elements: function (options) {
			return elementState.create(options, false)
		},
		texture: textureState.create2D,
		cube: textureState.createCube,
		renderbuffer: renderbufferState.create,
		framebuffer: framebufferState.create,
		framebufferCube: framebufferState.createCube,

		// Expose context attributes
		attributes: glAttributes,

		// Frame rendering
		frame: frame,
		on: addListener,

		// System limits
		limits: limits,
		hasExtension: function (name) {
			return limits.extensions.indexOf(name.toLowerCase()) >= 0
		},

		// Read pixels
		read: readPixels,

		// Destroy regl and all associated resources
		destroy: destroy,

		// Direct GL state manipulation
		_gl: gl,
		_refresh: refresh,

		poll: function () {
			poll();
			if (timer) {
				timer.update();
			}
		},

		// Current time
		now: now,

		// regl Statistics Information
		stats: stats$$1
	});

	config.onDone(null, regl);

	return regl
}

return wrapREGL;

})();

// javascript-astar 0.4.0
// http://github.com/bgrins/javascript-astar
// Freely distributable under the MIT License.
// Implements the astar search algorithm in javascript using a Binary Heap.
// Includes Binary Heap (with modifications) from Marijn Haverbeke.
// http://eloquentjavascript.net/appendix2.html

let Finder = (function() {

function pathTo(node){
	var curr = node,
		path = [];
	while(curr.parent) {
		path.push(curr);
		curr = curr.parent;
	}
	return path.reverse();
}

function getHeap() {
	return new BinaryHeap(function(node) {
		return node.f;
	});
}

var astar = {
	/**
	* Perform an A* Search on a graph given a start and end node.
	* @param {Graph} graph
	* @param {GridNode} start
	* @param {GridNode} end
	* @param {Object} [options]
	* @param {bool} [options.closest] Specifies whether to return the
			   path to the closest node if the target is unreachable.
	* @param {Function} [options.heuristic] Heuristic function (see
	*          astar.heuristics).
	*/
	search: function(graph, start, end, options) {
		graph.cleanDirty();
		options = options || {};
		var heuristic = options.heuristic || astar.heuristics.manhattan,
			closest = options.closest || false;

		var openHeap = getHeap(),
			closestNode = start; // set the start node to be the closest if required

		start.h = heuristic(start, end);

		openHeap.push(start);

		while(openHeap.size() > 0) {

			// Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
			var currentNode = openHeap.pop();

			// End case -- result has been found, return the traced path.
			if(currentNode === end) {
				return pathTo(currentNode);
			}

			// Normal case -- move currentNode from open to closed, process each of its neighbors.
			currentNode.closed = true;

			// Find all neighbors for the current node.
			var neighbors = graph.neighbors(currentNode);

			for (var i = 0, il = neighbors.length; i < il; ++i) {
				var neighbor = neighbors[i];

				if (neighbor.closed || neighbor.isWall()) {
					// Not a valid node to process, skip to next neighbor.
					continue;
				}

				// The g score is the shortest distance from start to current node.
				// We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
				var gScore = currentNode.g + neighbor.getCost(currentNode),
					beenVisited = neighbor.visited;

				if (!beenVisited || gScore < neighbor.g) {

					// Found an optimal (so far) path to this node.  Take score for node to see how good it is.
					neighbor.visited = true;
					neighbor.parent = currentNode;
					neighbor.h = neighbor.h || heuristic(neighbor, end);
					neighbor.g = gScore;
					neighbor.f = neighbor.g + neighbor.h;
					graph.markDirty(neighbor);
					if (closest) {
						// If the neighbour is closer than the current closestNode or if it's equally close but has
						// a cheaper path than the current closest node then it becomes the closest node
						if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
							closestNode = neighbor;
						}
					}

					if (!beenVisited) {
						// Pushing to heap will put it in proper place based on the 'f' value.
						openHeap.push(neighbor);
					}
					else {
						// Already seen the node, but since it has been rescored we need to reorder it in the heap
						openHeap.rescoreElement(neighbor);
					}
				}
			}
		}

		if (closest) {
			return pathTo(closestNode);
		}

		// No result was found - empty array signifies failure to find path.
		return [];
	},
	// See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
	heuristics: {
		manhattan: function(pos0, pos1) {
			var d1 = Math.abs(pos1.x - pos0.x);
			var d2 = Math.abs(pos1.y - pos0.y);
			return d1 + d2;
		},
		diagonal: function(pos0, pos1) {
			var D = 1;
			var D2 = Math.sqrt(2);
			var d1 = Math.abs(pos1.x - pos0.x);
			var d2 = Math.abs(pos1.y - pos0.y);
			return (D * (d1 + d2)) + ((D2 - (2 * D)) * Math.min(d1, d2));
		}
	},
	cleanNode:function(node){
		node.f = 0;
		node.g = 0;
		node.h = 0;
		node.visited = false;
		node.closed = false;
		node.parent = null;
	}
};

/**
* A graph memory structure
* @param {Array} gridIn 2D array of input weights
* @param {Object} [options]
* @param {bool} [options.diagonal] Specifies whether diagonal moves are allowed
*/
function Graph(gridIn, options) {
	options = options || {};
	this.nodes = [];
	this.diagonal = !!options.diagonal;
	this.grid = [];
	for (var x = 0; x < gridIn.length; x++) {
		this.grid[x] = [];

		for (var y = 0, row = gridIn[x]; y < row.length; y++) {
			var node = new GridNode(x, y, row[y]);
			this.grid[x][y] = node;
			this.nodes.push(node);
		}
	}
	this.init();
}

Graph.prototype.init = function() {
	this.dirtyNodes = [];
	for (var i = 0; i < this.nodes.length; i++) {
		astar.cleanNode(this.nodes[i]);
	}
};

Graph.prototype.cleanDirty = function() {
	for (var i = 0; i < this.dirtyNodes.length; i++) {
		astar.cleanNode(this.dirtyNodes[i]);
	}
	this.dirtyNodes = [];
};

Graph.prototype.markDirty = function(node) {
	this.dirtyNodes.push(node);
};

Graph.prototype.neighbors = function(node) {
	var ret = [],
		x = node.x,
		y = node.y,
		grid = this.grid;

	// West
	if(grid[x-1] && grid[x-1][y]) {
		ret.push(grid[x-1][y]);
	}

	// East
	if(grid[x+1] && grid[x+1][y]) {
		ret.push(grid[x+1][y]);
	}

	// South
	if(grid[x] && grid[x][y-1]) {
		ret.push(grid[x][y-1]);
	}

	// North
	if(grid[x] && grid[x][y+1]) {
		ret.push(grid[x][y+1]);
	}

	if (this.diagonal) {
		// Southwest
		if(grid[x-1] && grid[x-1][y-1]) {
			ret.push(grid[x-1][y-1]);
		}

		// Southeast
		if(grid[x+1] && grid[x+1][y-1]) {
			ret.push(grid[x+1][y-1]);
		}

		// Northwest
		if(grid[x-1] && grid[x-1][y+1]) {
			ret.push(grid[x-1][y+1]);
		}

		// Northeast
		if(grid[x+1] && grid[x+1][y+1]) {
			ret.push(grid[x+1][y+1]);
		}
	}

	return ret;
};

Graph.prototype.toString = function() {
	var graphString = [],
		nodes = this.grid, // when using grid
		rowDebug, row, y, l;
	for (var x = 0, len = nodes.length; x < len; x++) {
		rowDebug = [];
		row = nodes[x];
		for (y = 0, l = row.length; y < l; y++) {
			rowDebug.push(row[y].weight);
		}
		graphString.push(rowDebug.join(" "));
	}
	return graphString.join("\n");
};

function GridNode(x, y, weight) {
	this.x = x;
	this.y = y;
	this.weight = weight;
}

GridNode.prototype.toString = function() {
	return "[" + this.x + " " + this.y + "]";
};

GridNode.prototype.getCost = function() {
	return this.weight;
};

GridNode.prototype.isWall = function() {
	return this.weight === 0;
};

function BinaryHeap(scoreFunction){
	this.content = [];
	this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
	push: function(element) {
		// Add the new element to the end of the array.
		this.content.push(element);

		// Allow it to sink down.
		this.sinkDown(this.content.length - 1);
	},
	pop: function() {
		// Store the first element so we can return it later.
		var result = this.content[0];
		// Get the element at the end of the array.
		var end = this.content.pop();
		// If there are any elements left, put the end element at the
		// start, and let it bubble up.
		if (this.content.length > 0) {
			this.content[0] = end;
			this.bubbleUp(0);
		}
		return result;
	},
	remove: function(node) {
		var i = this.content.indexOf(node);

		// When it is found, the process seen in 'pop' is repeated
		// to fill up the hole.
		var end = this.content.pop();

		if (i !== this.content.length - 1) {
			this.content[i] = end;

			if (this.scoreFunction(end) < this.scoreFunction(node)) {
				this.sinkDown(i);
			}
			else {
				this.bubbleUp(i);
			}
		}
	},
	size: function() {
		return this.content.length;
	},
	rescoreElement: function(node) {
		this.sinkDown(this.content.indexOf(node));
	},
	sinkDown: function(n) {
		// Fetch the element that has to be sunk.
		var element = this.content[n];

		// When at 0, an element can not sink any further.
		while (n > 0) {

			// Compute the parent element's index, and fetch it.
			var parentN = ((n + 1) >> 1) - 1,
				parent = this.content[parentN];
			// Swap the elements if the parent is greater.
			if (this.scoreFunction(element) < this.scoreFunction(parent)) {
				this.content[parentN] = element;
				this.content[n] = parent;
				// Update 'n' to continue at the new position.
				n = parentN;
			}
			// Found a parent that is less, no need to sink any further.
			else {
				break;
			}
		}
	},
	bubbleUp: function(n) {
		// Look up the target element and its score.
		var length = this.content.length,
			element = this.content[n],
			elemScore = this.scoreFunction(element);

		while(true) {
			// Compute the indices of the child elements.
			var child2N = (n + 1) << 1,
				child1N = child2N - 1;
			// This is used to store the new position of the element, if any.
			var swap = null,
				child1Score;
			// If the first child exists (is inside the array)...
			if (child1N < length) {
				// Look it up and compute its score.
				var child1 = this.content[child1N];
				child1Score = this.scoreFunction(child1);

				// If the score is less than our element's, we need to swap.
				if (child1Score < elemScore){
					swap = child1N;
				}
			}

			// Do the same checks for the other child.
			if (child2N < length) {
				var child2 = this.content[child2N],
					child2Score = this.scoreFunction(child2);
				if (child2Score < (swap === null ? elemScore : child1Score)) {
					swap = child2N;
				}
			}

			// If the element needs to be moved, swap it, and continue.
			if (swap !== null) {
				this.content[n] = this.content[swap];
				this.content[swap] = element;
				n = swap;
			}
			// Otherwise, we are done.
			else {
				break;
			}
		}
	}
};

return {
	astar: astar,
	Graph: Graph
};

})();
// SVGPathSeg API polyfill
// https://github.com/progers/pathseg
//
// This is a drop-in replacement for the SVGPathSeg and SVGPathSegList APIs that were removed from
// SVG2 (https://lists.w3.org/Archives/Public/www-svg/2015Jun/0044.html), including the latest spec
// changes which were implemented in Firefox 43 and Chrome 46.

(function() { "use strict";
    // The polyfill only applies to browser environments with a `window` object 
    // (i.e. not node.js, workers, etc.). If included in one of these 
    // environments (such as when using 'react-dom/server'), simply return out
    if (typeof window === 'undefined')
        return;

    if (!("SVGPathSeg" in window)) {
        // Spec: http://www.w3.org/TR/SVG11/single-page.html#paths-InterfaceSVGPathSeg
        window.SVGPathSeg = function(type, typeAsLetter, owningPathSegList) {
            this.pathSegType = type;
            this.pathSegTypeAsLetter = typeAsLetter;
            this._owningPathSegList = owningPathSegList;
        };

        window.SVGPathSeg.prototype.classname = "SVGPathSeg";

        window.SVGPathSeg.PATHSEG_UNKNOWN = 0;
        window.SVGPathSeg.PATHSEG_CLOSEPATH = 1;
        window.SVGPathSeg.PATHSEG_MOVETO_ABS = 2;
        window.SVGPathSeg.PATHSEG_MOVETO_REL = 3;
        window.SVGPathSeg.PATHSEG_LINETO_ABS = 4;
        window.SVGPathSeg.PATHSEG_LINETO_REL = 5;
        window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS = 6;
        window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_REL = 7;
        window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS = 8;
        window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_REL = 9;
        window.SVGPathSeg.PATHSEG_ARC_ABS = 10;
        window.SVGPathSeg.PATHSEG_ARC_REL = 11;
        window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_ABS = 12;
        window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_REL = 13;
        window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_ABS = 14;
        window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_REL = 15;
        window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS = 16;
        window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_REL = 17;
        window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS = 18;
        window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL = 19;

        // Notify owning PathSegList on any changes so they can be synchronized back to the path element.
        window.SVGPathSeg.prototype._segmentChanged = function() {
            if (this._owningPathSegList)
                this._owningPathSegList.segmentChanged(this);
        };

        window.SVGPathSegClosePath = function(owningPathSegList) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_CLOSEPATH, "z", owningPathSegList);
        };
        window.SVGPathSegClosePath.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegClosePath.prototype.toString = function() { return "[object SVGPathSegClosePath]"; };
        window.SVGPathSegClosePath.prototype._asPathString = function() { return this.pathSegTypeAsLetter; };
        window.SVGPathSegClosePath.prototype.clone = function() { return new window.SVGPathSegClosePath(undefined); };

        window.SVGPathSegMovetoAbs = function(owningPathSegList, x, y) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_MOVETO_ABS, "M", owningPathSegList);
            this._x = x;
            this._y = y;
        };
        window.SVGPathSegMovetoAbs.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegMovetoAbs.prototype.toString = function() { return "[object SVGPathSegMovetoAbs]"; };
        window.SVGPathSegMovetoAbs.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._x + " " + this._y; };
        window.SVGPathSegMovetoAbs.prototype.clone = function() { return new window.SVGPathSegMovetoAbs(undefined, this._x, this._y); };
        Object.defineProperty(window.SVGPathSegMovetoAbs.prototype, "x", { get: function() { return this._x; }, set: function(x) { this._x = x; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegMovetoAbs.prototype, "y", { get: function() { return this._y; }, set: function(y) { this._y = y; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegMovetoRel = function(owningPathSegList, x, y) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_MOVETO_REL, "m", owningPathSegList);
            this._x = x;
            this._y = y;
        };
        window.SVGPathSegMovetoRel.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegMovetoRel.prototype.toString = function() { return "[object SVGPathSegMovetoRel]"; };
        window.SVGPathSegMovetoRel.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._x + " " + this._y; };
        window.SVGPathSegMovetoRel.prototype.clone = function() { return new window.SVGPathSegMovetoRel(undefined, this._x, this._y); };
        Object.defineProperty(window.SVGPathSegMovetoRel.prototype, "x", { get: function() { return this._x; }, set: function(x) { this._x = x; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegMovetoRel.prototype, "y", { get: function() { return this._y; }, set: function(y) { this._y = y; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegLinetoAbs = function(owningPathSegList, x, y) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_LINETO_ABS, "L", owningPathSegList);
            this._x = x;
            this._y = y;
        };
        window.SVGPathSegLinetoAbs.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegLinetoAbs.prototype.toString = function() { return "[object SVGPathSegLinetoAbs]"; };
        window.SVGPathSegLinetoAbs.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._x + " " + this._y; };
        window.SVGPathSegLinetoAbs.prototype.clone = function() { return new window.SVGPathSegLinetoAbs(undefined, this._x, this._y); };
        Object.defineProperty(window.SVGPathSegLinetoAbs.prototype, "x", { get: function() { return this._x; }, set: function(x) { this._x = x; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegLinetoAbs.prototype, "y", { get: function() { return this._y; }, set: function(y) { this._y = y; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegLinetoRel = function(owningPathSegList, x, y) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_LINETO_REL, "l", owningPathSegList);
            this._x = x;
            this._y = y;
        };
        window.SVGPathSegLinetoRel.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegLinetoRel.prototype.toString = function() { return "[object SVGPathSegLinetoRel]"; };
        window.SVGPathSegLinetoRel.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._x + " " + this._y; };
        window.SVGPathSegLinetoRel.prototype.clone = function() { return new window.SVGPathSegLinetoRel(undefined, this._x, this._y); };
        Object.defineProperty(window.SVGPathSegLinetoRel.prototype, "x", { get: function() { return this._x; }, set: function(x) { this._x = x; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegLinetoRel.prototype, "y", { get: function() { return this._y; }, set: function(y) { this._y = y; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegCurvetoCubicAbs = function(owningPathSegList, x, y, x1, y1, x2, y2) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS, "C", owningPathSegList);
            this._x = x;
            this._y = y;
            this._x1 = x1;
            this._y1 = y1;
            this._x2 = x2;
            this._y2 = y2;
        };
        window.SVGPathSegCurvetoCubicAbs.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegCurvetoCubicAbs.prototype.toString = function() { return "[object SVGPathSegCurvetoCubicAbs]"; };
        window.SVGPathSegCurvetoCubicAbs.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._x1 + " " + this._y1 + " " + this._x2 + " " + this._y2 + " " + this._x + " " + this._y; };
        window.SVGPathSegCurvetoCubicAbs.prototype.clone = function() { return new window.SVGPathSegCurvetoCubicAbs(undefined, this._x, this._y, this._x1, this._y1, this._x2, this._y2); };
        Object.defineProperty(window.SVGPathSegCurvetoCubicAbs.prototype, "x", { get: function() { return this._x; }, set: function(x) { this._x = x; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoCubicAbs.prototype, "y", { get: function() { return this._y; }, set: function(y) { this._y = y; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoCubicAbs.prototype, "x1", { get: function() { return this._x1; }, set: function(x1) { this._x1 = x1; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoCubicAbs.prototype, "y1", { get: function() { return this._y1; }, set: function(y1) { this._y1 = y1; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoCubicAbs.prototype, "x2", { get: function() { return this._x2; }, set: function(x2) { this._x2 = x2; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoCubicAbs.prototype, "y2", { get: function() { return this._y2; }, set: function(y2) { this._y2 = y2; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegCurvetoCubicRel = function(owningPathSegList, x, y, x1, y1, x2, y2) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_REL, "c", owningPathSegList);
            this._x = x;
            this._y = y;
            this._x1 = x1;
            this._y1 = y1;
            this._x2 = x2;
            this._y2 = y2;
        };
        window.SVGPathSegCurvetoCubicRel.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegCurvetoCubicRel.prototype.toString = function() { return "[object SVGPathSegCurvetoCubicRel]"; };
        window.SVGPathSegCurvetoCubicRel.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._x1 + " " + this._y1 + " " + this._x2 + " " + this._y2 + " " + this._x + " " + this._y; };
        window.SVGPathSegCurvetoCubicRel.prototype.clone = function() { return new window.SVGPathSegCurvetoCubicRel(undefined, this._x, this._y, this._x1, this._y1, this._x2, this._y2); };
        Object.defineProperty(window.SVGPathSegCurvetoCubicRel.prototype, "x", { get: function() { return this._x; }, set: function(x) { this._x = x; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoCubicRel.prototype, "y", { get: function() { return this._y; }, set: function(y) { this._y = y; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoCubicRel.prototype, "x1", { get: function() { return this._x1; }, set: function(x1) { this._x1 = x1; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoCubicRel.prototype, "y1", { get: function() { return this._y1; }, set: function(y1) { this._y1 = y1; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoCubicRel.prototype, "x2", { get: function() { return this._x2; }, set: function(x2) { this._x2 = x2; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoCubicRel.prototype, "y2", { get: function() { return this._y2; }, set: function(y2) { this._y2 = y2; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegCurvetoQuadraticAbs = function(owningPathSegList, x, y, x1, y1) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS, "Q", owningPathSegList);
            this._x = x;
            this._y = y;
            this._x1 = x1;
            this._y1 = y1;
        };
        window.SVGPathSegCurvetoQuadraticAbs.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegCurvetoQuadraticAbs.prototype.toString = function() { return "[object SVGPathSegCurvetoQuadraticAbs]"; };
        window.SVGPathSegCurvetoQuadraticAbs.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._x1 + " " + this._y1 + " " + this._x + " " + this._y; };
        window.SVGPathSegCurvetoQuadraticAbs.prototype.clone = function() { return new window.SVGPathSegCurvetoQuadraticAbs(undefined, this._x, this._y, this._x1, this._y1); };
        Object.defineProperty(window.SVGPathSegCurvetoQuadraticAbs.prototype, "x", { get: function() { return this._x; }, set: function(x) { this._x = x; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoQuadraticAbs.prototype, "y", { get: function() { return this._y; }, set: function(y) { this._y = y; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoQuadraticAbs.prototype, "x1", { get: function() { return this._x1; }, set: function(x1) { this._x1 = x1; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoQuadraticAbs.prototype, "y1", { get: function() { return this._y1; }, set: function(y1) { this._y1 = y1; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegCurvetoQuadraticRel = function(owningPathSegList, x, y, x1, y1) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_REL, "q", owningPathSegList);
            this._x = x;
            this._y = y;
            this._x1 = x1;
            this._y1 = y1;
        };
        window.SVGPathSegCurvetoQuadraticRel.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegCurvetoQuadraticRel.prototype.toString = function() { return "[object SVGPathSegCurvetoQuadraticRel]"; };
        window.SVGPathSegCurvetoQuadraticRel.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._x1 + " " + this._y1 + " " + this._x + " " + this._y; };
        window.SVGPathSegCurvetoQuadraticRel.prototype.clone = function() { return new window.SVGPathSegCurvetoQuadraticRel(undefined, this._x, this._y, this._x1, this._y1); };
        Object.defineProperty(window.SVGPathSegCurvetoQuadraticRel.prototype, "x", { get: function() { return this._x; }, set: function(x) { this._x = x; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoQuadraticRel.prototype, "y", { get: function() { return this._y; }, set: function(y) { this._y = y; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoQuadraticRel.prototype, "x1", { get: function() { return this._x1; }, set: function(x1) { this._x1 = x1; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoQuadraticRel.prototype, "y1", { get: function() { return this._y1; }, set: function(y1) { this._y1 = y1; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegArcAbs = function(owningPathSegList, x, y, r1, r2, angle, largeArcFlag, sweepFlag) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_ARC_ABS, "A", owningPathSegList);
            this._x = x;
            this._y = y;
            this._r1 = r1;
            this._r2 = r2;
            this._angle = angle;
            this._largeArcFlag = largeArcFlag;
            this._sweepFlag = sweepFlag;
        };
        window.SVGPathSegArcAbs.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegArcAbs.prototype.toString = function() { return "[object SVGPathSegArcAbs]"; };
        window.SVGPathSegArcAbs.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._r1 + " " + this._r2 + " " + this._angle + " " + (this._largeArcFlag ? "1" : "0") + " " + (this._sweepFlag ? "1" : "0") + " " + this._x + " " + this._y; };
        window.SVGPathSegArcAbs.prototype.clone = function() { return new window.SVGPathSegArcAbs(undefined, this._x, this._y, this._r1, this._r2, this._angle, this._largeArcFlag, this._sweepFlag); };
        Object.defineProperty(window.SVGPathSegArcAbs.prototype, "x", { get: function() { return this._x; }, set: function(x) { this._x = x; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegArcAbs.prototype, "y", { get: function() { return this._y; }, set: function(y) { this._y = y; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegArcAbs.prototype, "r1", { get: function() { return this._r1; }, set: function(r1) { this._r1 = r1; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegArcAbs.prototype, "r2", { get: function() { return this._r2; }, set: function(r2) { this._r2 = r2; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegArcAbs.prototype, "angle", { get: function() { return this._angle; }, set: function(angle) { this._angle = angle; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegArcAbs.prototype, "largeArcFlag", { get: function() { return this._largeArcFlag; }, set: function(largeArcFlag) { this._largeArcFlag = largeArcFlag; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegArcAbs.prototype, "sweepFlag", { get: function() { return this._sweepFlag; }, set: function(sweepFlag) { this._sweepFlag = sweepFlag; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegArcRel = function(owningPathSegList, x, y, r1, r2, angle, largeArcFlag, sweepFlag) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_ARC_REL, "a", owningPathSegList);
            this._x = x;
            this._y = y;
            this._r1 = r1;
            this._r2 = r2;
            this._angle = angle;
            this._largeArcFlag = largeArcFlag;
            this._sweepFlag = sweepFlag;
        };
        window.SVGPathSegArcRel.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegArcRel.prototype.toString = function() { return "[object SVGPathSegArcRel]"; };
        window.SVGPathSegArcRel.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._r1 + " " + this._r2 + " " + this._angle + " " + (this._largeArcFlag ? "1" : "0") + " " + (this._sweepFlag ? "1" : "0") + " " + this._x + " " + this._y; };
        window.SVGPathSegArcRel.prototype.clone = function() { return new window.SVGPathSegArcRel(undefined, this._x, this._y, this._r1, this._r2, this._angle, this._largeArcFlag, this._sweepFlag); };
        Object.defineProperty(window.SVGPathSegArcRel.prototype, "x", { get: function() { return this._x; }, set: function(x) { this._x = x; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegArcRel.prototype, "y", { get: function() { return this._y; }, set: function(y) { this._y = y; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegArcRel.prototype, "r1", { get: function() { return this._r1; }, set: function(r1) { this._r1 = r1; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegArcRel.prototype, "r2", { get: function() { return this._r2; }, set: function(r2) { this._r2 = r2; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegArcRel.prototype, "angle", { get: function() { return this._angle; }, set: function(angle) { this._angle = angle; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegArcRel.prototype, "largeArcFlag", { get: function() { return this._largeArcFlag; }, set: function(largeArcFlag) { this._largeArcFlag = largeArcFlag; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegArcRel.prototype, "sweepFlag", { get: function() { return this._sweepFlag; }, set: function(sweepFlag) { this._sweepFlag = sweepFlag; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegLinetoHorizontalAbs = function(owningPathSegList, x) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_ABS, "H", owningPathSegList);
            this._x = x;
        };
        window.SVGPathSegLinetoHorizontalAbs.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegLinetoHorizontalAbs.prototype.toString = function() { return "[object SVGPathSegLinetoHorizontalAbs]"; };
        window.SVGPathSegLinetoHorizontalAbs.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._x; };
        window.SVGPathSegLinetoHorizontalAbs.prototype.clone = function() { return new window.SVGPathSegLinetoHorizontalAbs(undefined, this._x); };
        Object.defineProperty(window.SVGPathSegLinetoHorizontalAbs.prototype, "x", { get: function() { return this._x; }, set: function(x) { this._x = x; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegLinetoHorizontalRel = function(owningPathSegList, x) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_REL, "h", owningPathSegList);
            this._x = x;
        };
        window.SVGPathSegLinetoHorizontalRel.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegLinetoHorizontalRel.prototype.toString = function() { return "[object SVGPathSegLinetoHorizontalRel]"; };
        window.SVGPathSegLinetoHorizontalRel.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._x; };
        window.SVGPathSegLinetoHorizontalRel.prototype.clone = function() { return new window.SVGPathSegLinetoHorizontalRel(undefined, this._x); };
        Object.defineProperty(window.SVGPathSegLinetoHorizontalRel.prototype, "x", { get: function() { return this._x; }, set: function(x) { this._x = x; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegLinetoVerticalAbs = function(owningPathSegList, y) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_ABS, "V", owningPathSegList);
            this._y = y;
        };
        window.SVGPathSegLinetoVerticalAbs.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegLinetoVerticalAbs.prototype.toString = function() { return "[object SVGPathSegLinetoVerticalAbs]"; };
        window.SVGPathSegLinetoVerticalAbs.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._y; };
        window.SVGPathSegLinetoVerticalAbs.prototype.clone = function() { return new window.SVGPathSegLinetoVerticalAbs(undefined, this._y); };
        Object.defineProperty(window.SVGPathSegLinetoVerticalAbs.prototype, "y", { get: function() { return this._y; }, set: function(y) { this._y = y; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegLinetoVerticalRel = function(owningPathSegList, y) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_REL, "v", owningPathSegList);
            this._y = y;
        };
        window.SVGPathSegLinetoVerticalRel.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegLinetoVerticalRel.prototype.toString = function() { return "[object SVGPathSegLinetoVerticalRel]"; };
        window.SVGPathSegLinetoVerticalRel.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._y; };
        window.SVGPathSegLinetoVerticalRel.prototype.clone = function() { return new window.SVGPathSegLinetoVerticalRel(undefined, this._y); };
        Object.defineProperty(window.SVGPathSegLinetoVerticalRel.prototype, "y", { get: function() { return this._y; }, set: function(y) { this._y = y; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegCurvetoCubicSmoothAbs = function(owningPathSegList, x, y, x2, y2) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS, "S", owningPathSegList);
            this._x = x;
            this._y = y;
            this._x2 = x2;
            this._y2 = y2;
        };
        window.SVGPathSegCurvetoCubicSmoothAbs.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegCurvetoCubicSmoothAbs.prototype.toString = function() { return "[object SVGPathSegCurvetoCubicSmoothAbs]"; };
        window.SVGPathSegCurvetoCubicSmoothAbs.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._x2 + " " + this._y2 + " " + this._x + " " + this._y; };
        window.SVGPathSegCurvetoCubicSmoothAbs.prototype.clone = function() { return new window.SVGPathSegCurvetoCubicSmoothAbs(undefined, this._x, this._y, this._x2, this._y2); };
        Object.defineProperty(window.SVGPathSegCurvetoCubicSmoothAbs.prototype, "x", { get: function() { return this._x; }, set: function(x) { this._x = x; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoCubicSmoothAbs.prototype, "y", { get: function() { return this._y; }, set: function(y) { this._y = y; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoCubicSmoothAbs.prototype, "x2", { get: function() { return this._x2; }, set: function(x2) { this._x2 = x2; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoCubicSmoothAbs.prototype, "y2", { get: function() { return this._y2; }, set: function(y2) { this._y2 = y2; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegCurvetoCubicSmoothRel = function(owningPathSegList, x, y, x2, y2) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_REL, "s", owningPathSegList);
            this._x = x;
            this._y = y;
            this._x2 = x2;
            this._y2 = y2;
        };
        window.SVGPathSegCurvetoCubicSmoothRel.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegCurvetoCubicSmoothRel.prototype.toString = function() { return "[object SVGPathSegCurvetoCubicSmoothRel]"; };
        window.SVGPathSegCurvetoCubicSmoothRel.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._x2 + " " + this._y2 + " " + this._x + " " + this._y; };
        window.SVGPathSegCurvetoCubicSmoothRel.prototype.clone = function() { return new window.SVGPathSegCurvetoCubicSmoothRel(undefined, this._x, this._y, this._x2, this._y2); };
        Object.defineProperty(window.SVGPathSegCurvetoCubicSmoothRel.prototype, "x", { get: function() { return this._x; }, set: function(x) { this._x = x; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoCubicSmoothRel.prototype, "y", { get: function() { return this._y; }, set: function(y) { this._y = y; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoCubicSmoothRel.prototype, "x2", { get: function() { return this._x2; }, set: function(x2) { this._x2 = x2; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoCubicSmoothRel.prototype, "y2", { get: function() { return this._y2; }, set: function(y2) { this._y2 = y2; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegCurvetoQuadraticSmoothAbs = function(owningPathSegList, x, y) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS, "T", owningPathSegList);
            this._x = x;
            this._y = y;
        };
        window.SVGPathSegCurvetoQuadraticSmoothAbs.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegCurvetoQuadraticSmoothAbs.prototype.toString = function() { return "[object SVGPathSegCurvetoQuadraticSmoothAbs]"; };
        window.SVGPathSegCurvetoQuadraticSmoothAbs.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._x + " " + this._y; };
        window.SVGPathSegCurvetoQuadraticSmoothAbs.prototype.clone = function() { return new window.SVGPathSegCurvetoQuadraticSmoothAbs(undefined, this._x, this._y); };
        Object.defineProperty(window.SVGPathSegCurvetoQuadraticSmoothAbs.prototype, "x", { get: function() { return this._x; }, set: function(x) { this._x = x; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoQuadraticSmoothAbs.prototype, "y", { get: function() { return this._y; }, set: function(y) { this._y = y; this._segmentChanged(); }, enumerable: true });

        window.SVGPathSegCurvetoQuadraticSmoothRel = function(owningPathSegList, x, y) {
            window.SVGPathSeg.call(this, window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL, "t", owningPathSegList);
            this._x = x;
            this._y = y;
        };
        window.SVGPathSegCurvetoQuadraticSmoothRel.prototype = Object.create(window.SVGPathSeg.prototype);
        window.SVGPathSegCurvetoQuadraticSmoothRel.prototype.toString = function() { return "[object SVGPathSegCurvetoQuadraticSmoothRel]"; };
        window.SVGPathSegCurvetoQuadraticSmoothRel.prototype._asPathString = function() { return this.pathSegTypeAsLetter + " " + this._x + " " + this._y; };
        window.SVGPathSegCurvetoQuadraticSmoothRel.prototype.clone = function() { return new window.SVGPathSegCurvetoQuadraticSmoothRel(undefined, this._x, this._y); };
        Object.defineProperty(window.SVGPathSegCurvetoQuadraticSmoothRel.prototype, "x", { get: function() { return this._x; }, set: function(x) { this._x = x; this._segmentChanged(); }, enumerable: true });
        Object.defineProperty(window.SVGPathSegCurvetoQuadraticSmoothRel.prototype, "y", { get: function() { return this._y; }, set: function(y) { this._y = y; this._segmentChanged(); }, enumerable: true });

        // Add createSVGPathSeg* functions to window.SVGPathElement.
        // Spec: http://www.w3.org/TR/SVG11/single-page.html#paths-Interfacewindow.SVGPathElement.
        window.SVGPathElement.prototype.createSVGPathSegClosePath = function() { return new window.SVGPathSegClosePath(undefined); };
        window.SVGPathElement.prototype.createSVGPathSegMovetoAbs = function(x, y) { return new window.SVGPathSegMovetoAbs(undefined, x, y); };
        window.SVGPathElement.prototype.createSVGPathSegMovetoRel = function(x, y) { return new window.SVGPathSegMovetoRel(undefined, x, y); };
        window.SVGPathElement.prototype.createSVGPathSegLinetoAbs = function(x, y) { return new window.SVGPathSegLinetoAbs(undefined, x, y); };
        window.SVGPathElement.prototype.createSVGPathSegLinetoRel = function(x, y) { return new window.SVGPathSegLinetoRel(undefined, x, y); };
        window.SVGPathElement.prototype.createSVGPathSegCurvetoCubicAbs = function(x, y, x1, y1, x2, y2) { return new window.SVGPathSegCurvetoCubicAbs(undefined, x, y, x1, y1, x2, y2); };
        window.SVGPathElement.prototype.createSVGPathSegCurvetoCubicRel = function(x, y, x1, y1, x2, y2) { return new window.SVGPathSegCurvetoCubicRel(undefined, x, y, x1, y1, x2, y2); };
        window.SVGPathElement.prototype.createSVGPathSegCurvetoQuadraticAbs = function(x, y, x1, y1) { return new window.SVGPathSegCurvetoQuadraticAbs(undefined, x, y, x1, y1); };
        window.SVGPathElement.prototype.createSVGPathSegCurvetoQuadraticRel = function(x, y, x1, y1) { return new window.SVGPathSegCurvetoQuadraticRel(undefined, x, y, x1, y1); };
        window.SVGPathElement.prototype.createSVGPathSegArcAbs = function(x, y, r1, r2, angle, largeArcFlag, sweepFlag) { return new window.SVGPathSegArcAbs(undefined, x, y, r1, r2, angle, largeArcFlag, sweepFlag); };
        window.SVGPathElement.prototype.createSVGPathSegArcRel = function(x, y, r1, r2, angle, largeArcFlag, sweepFlag) { return new window.SVGPathSegArcRel(undefined, x, y, r1, r2, angle, largeArcFlag, sweepFlag); };
        window.SVGPathElement.prototype.createSVGPathSegLinetoHorizontalAbs = function(x) { return new window.SVGPathSegLinetoHorizontalAbs(undefined, x); };
        window.SVGPathElement.prototype.createSVGPathSegLinetoHorizontalRel = function(x) { return new window.SVGPathSegLinetoHorizontalRel(undefined, x); };
        window.SVGPathElement.prototype.createSVGPathSegLinetoVerticalAbs = function(y) { return new window.SVGPathSegLinetoVerticalAbs(undefined, y); };
        window.SVGPathElement.prototype.createSVGPathSegLinetoVerticalRel = function(y) { return new window.SVGPathSegLinetoVerticalRel(undefined, y); };
        window.SVGPathElement.prototype.createSVGPathSegCurvetoCubicSmoothAbs = function(x, y, x2, y2) { return new window.SVGPathSegCurvetoCubicSmoothAbs(undefined, x, y, x2, y2); };
        window.SVGPathElement.prototype.createSVGPathSegCurvetoCubicSmoothRel = function(x, y, x2, y2) { return new window.SVGPathSegCurvetoCubicSmoothRel(undefined, x, y, x2, y2); };
        window.SVGPathElement.prototype.createSVGPathSegCurvetoQuadraticSmoothAbs = function(x, y) { return new window.SVGPathSegCurvetoQuadraticSmoothAbs(undefined, x, y); };
        window.SVGPathElement.prototype.createSVGPathSegCurvetoQuadraticSmoothRel = function(x, y) { return new window.SVGPathSegCurvetoQuadraticSmoothRel(undefined, x, y); };

        if (!("getPathSegAtLength" in window.SVGPathElement.prototype)) {
            // Add getPathSegAtLength to SVGPathElement.
            // Spec: https://www.w3.org/TR/SVG11/single-page.html#paths-__svg__SVGPathElement__getPathSegAtLength
            // This polyfill requires SVGPathElement.getTotalLength to implement the distance-along-a-path algorithm.
            window.SVGPathElement.prototype.getPathSegAtLength = function(distance) {
                if (distance === undefined || !isFinite(distance))
                    throw "Invalid arguments.";

                var measurementElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
                measurementElement.setAttribute("d", this.getAttribute("d"));
                var lastPathSegment = measurementElement.pathSegList.numberOfItems - 1;

                // If the path is empty, return 0.
                if (lastPathSegment <= 0)
                    return 0;

                do {
                    measurementElement.pathSegList.removeItem(lastPathSegment);
                    if (distance > measurementElement.getTotalLength())
                        break;
                    lastPathSegment--;
                } while (lastPathSegment > 0);
                return lastPathSegment;
            };
        }
    }

    // Checking for SVGPathSegList in window checks for the case of an implementation without the
    // SVGPathSegList API.
    // The second check for appendItem is specific to Firefox 59+ which removed only parts of the
    // SVGPathSegList API (e.g., appendItem). In this case we need to re-implement the entire API
    // so the polyfill data (i.e., _list) is used throughout.
    if (!("SVGPathSegList" in window) || !("appendItem" in window.SVGPathSegList.prototype)) {
        // Spec: http://www.w3.org/TR/SVG11/single-page.html#paths-InterfaceSVGPathSegList
        window.SVGPathSegList = function(pathElement) {
            this._pathElement = pathElement;
            this._list = this._parsePath(this._pathElement.getAttribute("d"));

            // Use a MutationObserver to catch changes to the path's "d" attribute.
            this._mutationObserverConfig = { "attributes": true, "attributeFilter": ["d"] };
            this._pathElementMutationObserver = new MutationObserver(this._updateListFromPathMutations.bind(this));
            this._pathElementMutationObserver.observe(this._pathElement, this._mutationObserverConfig);
        };

        window.SVGPathSegList.prototype.classname = "SVGPathSegList";

        Object.defineProperty(window.SVGPathSegList.prototype, "numberOfItems", {
            get: function() {
                this._checkPathSynchronizedToList();
                return this._list.length;
            },
            enumerable: true
        });

        // The length property was not specified but was in Firefox 58.
        Object.defineProperty(window.SVGPathSegList.prototype, "length", {
            get: function() {
                this._checkPathSynchronizedToList();
                return this._list.length;
            },
            enumerable: true
        });

        try {
            // Add the pathSegList accessors to window.SVGPathElement.
            // Spec: http://www.w3.org/TR/SVG11/single-page.html#paths-InterfaceSVGAnimatedPathData
            Object.defineProperty(window.SVGPathElement.prototype, "pathSegList", {
                get: function() {
                    if (!this._pathSegList)
                        this._pathSegList = new window.SVGPathSegList(this);
                    return this._pathSegList;
                },
                enumerable: true
            });
            // FIXME: The following are not implemented and simply return window.SVGPathElement.pathSegList.
            Object.defineProperty(window.SVGPathElement.prototype, "normalizedPathSegList", { get: function() { return this.pathSegList; }, enumerable: true });
            Object.defineProperty(window.SVGPathElement.prototype, "animatedPathSegList", { get: function() { return this.pathSegList; }, enumerable: true });
            Object.defineProperty(window.SVGPathElement.prototype, "animatedNormalizedPathSegList", { get: function() { return this.pathSegList; }, enumerable: true });
        } catch (e) {}

        // Process any pending mutations to the path element and update the list as needed.
        // This should be the first call of all public functions and is needed because
        // MutationObservers are not synchronous so we can have pending asynchronous mutations.
        window.SVGPathSegList.prototype._checkPathSynchronizedToList = function() {
            this._updateListFromPathMutations(this._pathElementMutationObserver.takeRecords());
        };

        window.SVGPathSegList.prototype._updateListFromPathMutations = function(mutationRecords) {
            if (!this._pathElement)
                return;
            var hasPathMutations = false;
            mutationRecords.forEach(function(record) {
                if (record.attributeName == "d")
                    hasPathMutations = true;
            });
            if (hasPathMutations)
                this._list = this._parsePath(this._pathElement.getAttribute("d"));
        };

        // Serialize the list and update the path's 'd' attribute.
        window.SVGPathSegList.prototype._writeListToPath = function() {
            this._pathElementMutationObserver.disconnect();
            this._pathElement.setAttribute("d", window.SVGPathSegList._pathSegArrayAsString(this._list));
            this._pathElementMutationObserver.observe(this._pathElement, this._mutationObserverConfig);
        };

        // When a path segment changes the list needs to be synchronized back to the path element.
        window.SVGPathSegList.prototype.segmentChanged = function(pathSeg) {
            this._writeListToPath();
        };

        window.SVGPathSegList.prototype.clear = function() {
            this._checkPathSynchronizedToList();

            this._list.forEach(function(pathSeg) {
                pathSeg._owningPathSegList = null;
            });
            this._list = [];
            this._writeListToPath();
        };

        window.SVGPathSegList.prototype.initialize = function(newItem) {
            this._checkPathSynchronizedToList();

            this._list = [newItem];
            newItem._owningPathSegList = this;
            this._writeListToPath();
            return newItem;
        };

        window.SVGPathSegList.prototype._checkValidIndex = function(index) {
            if (isNaN(index) || index < 0 || index >= this.numberOfItems)
                throw "INDEX_SIZE_ERR";
        };

        window.SVGPathSegList.prototype.getItem = function(index) {
            this._checkPathSynchronizedToList();

            this._checkValidIndex(index);
            return this._list[index];
        };

        window.SVGPathSegList.prototype.insertItemBefore = function(newItem, index) {
            this._checkPathSynchronizedToList();

            // Spec: If the index is greater than or equal to numberOfItems, then the new item is appended to the end of the list.
            if (index > this.numberOfItems)
                index = this.numberOfItems;
            if (newItem._owningPathSegList) {
                // SVG2 spec says to make a copy.
                newItem = newItem.clone();
            }
            this._list.splice(index, 0, newItem);
            newItem._owningPathSegList = this;
            this._writeListToPath();
            return newItem;
        };

        window.SVGPathSegList.prototype.replaceItem = function(newItem, index) {
            this._checkPathSynchronizedToList();

            if (newItem._owningPathSegList) {
                // SVG2 spec says to make a copy.
                newItem = newItem.clone();
            }
            this._checkValidIndex(index);
            this._list[index] = newItem;
            newItem._owningPathSegList = this;
            this._writeListToPath();
            return newItem;
        };

        window.SVGPathSegList.prototype.removeItem = function(index) {
            this._checkPathSynchronizedToList();

            this._checkValidIndex(index);
            var item = this._list[index];
            this._list.splice(index, 1);
            this._writeListToPath();
            return item;
        };

        window.SVGPathSegList.prototype.appendItem = function(newItem) {
            this._checkPathSynchronizedToList();

            if (newItem._owningPathSegList) {
                // SVG2 spec says to make a copy.
                newItem = newItem.clone();
            }
            this._list.push(newItem);
            newItem._owningPathSegList = this;
            // TODO: Optimize this to just append to the existing attribute.
            this._writeListToPath();
            return newItem;
        };

        window.SVGPathSegList._pathSegArrayAsString = function(pathSegArray) {
            var string = "";
            var first = true;
            pathSegArray.forEach(function(pathSeg) {
                if (first) {
                    first = false;
                    string += pathSeg._asPathString();
                } else {
                    string += " " + pathSeg._asPathString();
                }
            });
            return string;
        };

        // This closely follows SVGPathParser::parsePath from Source/core/svg/SVGPathParser.cpp.
        window.SVGPathSegList.prototype._parsePath = function(string) {
            if (!string || string.length == 0)
                return [];

            var owningPathSegList = this;

            var Builder = function() {
                this.pathSegList = [];
            };

            Builder.prototype.appendSegment = function(pathSeg) {
                this.pathSegList.push(pathSeg);
            };

            var Source = function(string) {
                this._string = string;
                this._currentIndex = 0;
                this._endIndex = this._string.length;
                this._previousCommand = window.SVGPathSeg.PATHSEG_UNKNOWN;

                this._skipOptionalSpaces();
            };

            Source.prototype._isCurrentSpace = function() {
                var character = this._string[this._currentIndex];
                return character <= " " && (character == " " || character == "\n" || character == "\t" || character == "\r" || character == "\f");
            };

            Source.prototype._skipOptionalSpaces = function() {
                while (this._currentIndex < this._endIndex && this._isCurrentSpace())
                    this._currentIndex++;
                return this._currentIndex < this._endIndex;
            };

            Source.prototype._skipOptionalSpacesOrDelimiter = function() {
                if (this._currentIndex < this._endIndex && !this._isCurrentSpace() && this._string.charAt(this._currentIndex) != ",")
                    return false;
                if (this._skipOptionalSpaces()) {
                    if (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) == ",") {
                        this._currentIndex++;
                        this._skipOptionalSpaces();
                    }
                }
                return this._currentIndex < this._endIndex;
            };

            Source.prototype.hasMoreData = function() {
                return this._currentIndex < this._endIndex;
            };

            Source.prototype.peekSegmentType = function() {
                var lookahead = this._string[this._currentIndex];
                return this._pathSegTypeFromChar(lookahead);
            };

            Source.prototype._pathSegTypeFromChar = function(lookahead) {
                switch (lookahead) {
                case "Z":
                case "z":
                    return window.SVGPathSeg.PATHSEG_CLOSEPATH;
                case "M":
                    return window.SVGPathSeg.PATHSEG_MOVETO_ABS;
                case "m":
                    return window.SVGPathSeg.PATHSEG_MOVETO_REL;
                case "L":
                    return window.SVGPathSeg.PATHSEG_LINETO_ABS;
                case "l":
                    return window.SVGPathSeg.PATHSEG_LINETO_REL;
                case "C":
                    return window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS;
                case "c":
                    return window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_REL;
                case "Q":
                    return window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS;
                case "q":
                    return window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_REL;
                case "A":
                    return window.SVGPathSeg.PATHSEG_ARC_ABS;
                case "a":
                    return window.SVGPathSeg.PATHSEG_ARC_REL;
                case "H":
                    return window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_ABS;
                case "h":
                    return window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_REL;
                case "V":
                    return window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_ABS;
                case "v":
                    return window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_REL;
                case "S":
                    return window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS;
                case "s":
                    return window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_REL;
                case "T":
                    return window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS;
                case "t":
                    return window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL;
                default:
                    return window.SVGPathSeg.PATHSEG_UNKNOWN;
                }
            };

            Source.prototype._nextCommandHelper = function(lookahead, previousCommand) {
                // Check for remaining coordinates in the current command.
                if ((lookahead == "+" || lookahead == "-" || lookahead == "." || (lookahead >= "0" && lookahead <= "9")) && previousCommand != window.SVGPathSeg.PATHSEG_CLOSEPATH) {
                    if (previousCommand == window.SVGPathSeg.PATHSEG_MOVETO_ABS)
                        return window.SVGPathSeg.PATHSEG_LINETO_ABS;
                    if (previousCommand == window.SVGPathSeg.PATHSEG_MOVETO_REL)
                        return window.SVGPathSeg.PATHSEG_LINETO_REL;
                    return previousCommand;
                }
                return window.SVGPathSeg.PATHSEG_UNKNOWN;
            };

            Source.prototype.initialCommandIsMoveTo = function() {
                // If the path is empty it is still valid, so return true.
                if (!this.hasMoreData())
                    return true;
                var command = this.peekSegmentType();
                // Path must start with moveTo.
                return command == window.SVGPathSeg.PATHSEG_MOVETO_ABS || command == window.SVGPathSeg.PATHSEG_MOVETO_REL;
            };

            // Parse a number from an SVG path. This very closely follows genericParseNumber(...) from Source/core/svg/SVGParserUtilities.cpp.
            // Spec: http://www.w3.org/TR/SVG11/single-page.html#paths-PathDataBNF
            Source.prototype._parseNumber = function() {
                var exponent = 0;
                var integer = 0;
                var frac = 1;
                var decimal = 0;
                var sign = 1;
                var expsign = 1;

                var startIndex = this._currentIndex;

                this._skipOptionalSpaces();

                // Read the sign.
                if (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) == "+")
                    this._currentIndex++;
                else if (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) == "-") {
                    this._currentIndex++;
                    sign = -1;
                }

                if (this._currentIndex == this._endIndex || ((this._string.charAt(this._currentIndex) < "0" || this._string.charAt(this._currentIndex) > "9") && this._string.charAt(this._currentIndex) != "."))
                    // The first character of a number must be one of [0-9+-.].
                    return undefined;

                // Read the integer part, build right-to-left.
                var startIntPartIndex = this._currentIndex;
                while (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) >= "0" && this._string.charAt(this._currentIndex) <= "9")
                    this._currentIndex++; // Advance to first non-digit.

                if (this._currentIndex != startIntPartIndex) {
                    var scanIntPartIndex = this._currentIndex - 1;
                    var multiplier = 1;
                    while (scanIntPartIndex >= startIntPartIndex) {
                        integer += multiplier * (this._string.charAt(scanIntPartIndex--) - "0");
                        multiplier *= 10;
                    }
                }

                // Read the decimals.
                if (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) == ".") {
                    this._currentIndex++;

                    // There must be a least one digit following the .
                    if (this._currentIndex >= this._endIndex || this._string.charAt(this._currentIndex) < "0" || this._string.charAt(this._currentIndex) > "9")
                        return undefined;
                    while (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) >= "0" && this._string.charAt(this._currentIndex) <= "9") {
                        frac *= 10;
                        decimal += (this._string.charAt(this._currentIndex) - "0") / frac;
                        this._currentIndex += 1;
                    }
                }

                // Read the exponent part.
                if (this._currentIndex != startIndex && this._currentIndex + 1 < this._endIndex && (this._string.charAt(this._currentIndex) == "e" || this._string.charAt(this._currentIndex) == "E") && (this._string.charAt(this._currentIndex + 1) != "x" && this._string.charAt(this._currentIndex + 1) != "m")) {
                    this._currentIndex++;

                    // Read the sign of the exponent.
                    if (this._string.charAt(this._currentIndex) == "+") {
                        this._currentIndex++;
                    } else if (this._string.charAt(this._currentIndex) == "-") {
                        this._currentIndex++;
                        expsign = -1;
                    }

                    // There must be an exponent.
                    if (this._currentIndex >= this._endIndex || this._string.charAt(this._currentIndex) < "0" || this._string.charAt(this._currentIndex) > "9")
                        return undefined;

                    while (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) >= "0" && this._string.charAt(this._currentIndex) <= "9") {
                        exponent *= 10;
                        exponent += (this._string.charAt(this._currentIndex) - "0");
                        this._currentIndex++;
                    }
                }

                var number = integer + decimal;
                number *= sign;

                if (exponent)
                    number *= Math.pow(10, expsign * exponent);

                if (startIndex == this._currentIndex)
                    return undefined;

                this._skipOptionalSpacesOrDelimiter();

                return number;
            };

            Source.prototype._parseArcFlag = function() {
                if (this._currentIndex >= this._endIndex)
                    return undefined;
                var flag = false;
                var flagChar = this._string.charAt(this._currentIndex++);
                if (flagChar == "0")
                    flag = false;
                else if (flagChar == "1")
                    flag = true;
                else
                    return undefined;

                this._skipOptionalSpacesOrDelimiter();
                return flag;
            };

            Source.prototype.parseSegment = function() {
                var lookahead = this._string[this._currentIndex];
                var command = this._pathSegTypeFromChar(lookahead);
                if (command == window.SVGPathSeg.PATHSEG_UNKNOWN) {
                    // Possibly an implicit command. Not allowed if this is the first command.
                    if (this._previousCommand == window.SVGPathSeg.PATHSEG_UNKNOWN)
                        return null;
                    command = this._nextCommandHelper(lookahead, this._previousCommand);
                    if (command == window.SVGPathSeg.PATHSEG_UNKNOWN)
                        return null;
                } else {
                    this._currentIndex++;
                }

                this._previousCommand = command;

                switch (command) {
                case window.SVGPathSeg.PATHSEG_MOVETO_REL:
                    return new window.SVGPathSegMovetoRel(owningPathSegList, this._parseNumber(), this._parseNumber());
                case window.SVGPathSeg.PATHSEG_MOVETO_ABS:
                    return new window.SVGPathSegMovetoAbs(owningPathSegList, this._parseNumber(), this._parseNumber());
                case window.SVGPathSeg.PATHSEG_LINETO_REL:
                    return new window.SVGPathSegLinetoRel(owningPathSegList, this._parseNumber(), this._parseNumber());
                case window.SVGPathSeg.PATHSEG_LINETO_ABS:
                    return new window.SVGPathSegLinetoAbs(owningPathSegList, this._parseNumber(), this._parseNumber());
                case window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_REL:
                    return new window.SVGPathSegLinetoHorizontalRel(owningPathSegList, this._parseNumber());
                case window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_ABS:
                    return new window.SVGPathSegLinetoHorizontalAbs(owningPathSegList, this._parseNumber());
                case window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_REL:
                    return new window.SVGPathSegLinetoVerticalRel(owningPathSegList, this._parseNumber());
                case window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_ABS:
                    return new window.SVGPathSegLinetoVerticalAbs(owningPathSegList, this._parseNumber());
                case window.SVGPathSeg.PATHSEG_CLOSEPATH:
                    this._skipOptionalSpaces();
                    return new window.SVGPathSegClosePath(owningPathSegList);
                case window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_REL:
                    var points = {x1: this._parseNumber(), y1: this._parseNumber(), x2: this._parseNumber(), y2: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber()};
                    return new window.SVGPathSegCurvetoCubicRel(owningPathSegList, points.x, points.y, points.x1, points.y1, points.x2, points.y2);
                case window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS:
                    var points = {x1: this._parseNumber(), y1: this._parseNumber(), x2: this._parseNumber(), y2: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber()};
                    return new window.SVGPathSegCurvetoCubicAbs(owningPathSegList, points.x, points.y, points.x1, points.y1, points.x2, points.y2);
                case window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_REL:
                    var points = {x2: this._parseNumber(), y2: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber()};
                    return new window.SVGPathSegCurvetoCubicSmoothRel(owningPathSegList, points.x, points.y, points.x2, points.y2);
                case window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS:
                    var points = {x2: this._parseNumber(), y2: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber()};
                    return new window.SVGPathSegCurvetoCubicSmoothAbs(owningPathSegList, points.x, points.y, points.x2, points.y2);
                case window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_REL:
                    var points = {x1: this._parseNumber(), y1: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber()};
                    return new window.SVGPathSegCurvetoQuadraticRel(owningPathSegList, points.x, points.y, points.x1, points.y1);
                case window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS:
                    var points = {x1: this._parseNumber(), y1: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber()};
                    return new window.SVGPathSegCurvetoQuadraticAbs(owningPathSegList, points.x, points.y, points.x1, points.y1);
                case window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL:
                    return new window.SVGPathSegCurvetoQuadraticSmoothRel(owningPathSegList, this._parseNumber(), this._parseNumber());
                case window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS:
                    return new window.SVGPathSegCurvetoQuadraticSmoothAbs(owningPathSegList, this._parseNumber(), this._parseNumber());
                case window.SVGPathSeg.PATHSEG_ARC_REL:
                    var points = {x1: this._parseNumber(), y1: this._parseNumber(), arcAngle: this._parseNumber(), arcLarge: this._parseArcFlag(), arcSweep: this._parseArcFlag(), x: this._parseNumber(), y: this._parseNumber()};
                    return new window.SVGPathSegArcRel(owningPathSegList, points.x, points.y, points.x1, points.y1, points.arcAngle, points.arcLarge, points.arcSweep);
                case window.SVGPathSeg.PATHSEG_ARC_ABS:
                    var points = {x1: this._parseNumber(), y1: this._parseNumber(), arcAngle: this._parseNumber(), arcLarge: this._parseArcFlag(), arcSweep: this._parseArcFlag(), x: this._parseNumber(), y: this._parseNumber()};
                    return new window.SVGPathSegArcAbs(owningPathSegList, points.x, points.y, points.x1, points.y1, points.arcAngle, points.arcLarge, points.arcSweep);
                default:
                    throw "Unknown path seg type."
                }
            };

            var builder = new Builder();
            var source = new Source(string);

            if (!source.initialCommandIsMoveTo())
                return [];
            while (source.hasMoreData()) {
                var pathSeg = source.parseSegment();
                if (!pathSeg)
                    return [];
                builder.appendSegment(pathSeg);
            }

            return builder.pathSegList;
        };
    }
}());



let Raycaster = (() => {

	// Visibility

	let RC = {
			hashKeyCounter: 0,
			init() {
				// 
				this.visibility = new Visibility;

				return this;
			},
			loadMap(walls, origo) {
				// set origo point
				this.origo = origo;
				this.visibility.clear();
				walls.map(verts => this.visibility.addVertices(verts));
				this.visibility.setLightLocation(origo.x, origo.y);
				this.visibility.sweep();
			},
			clip(ctx, path) {
				ctx.beginPath();
				Visibility.interpretSvg(ctx, path);
				ctx.clip();
				ctx.closePath();
			},
			drawFloor(ctx, path) {
				ctx.save();
				ctx.fillStyle = "#fff1";
				// ctx.globalCompositeOperation = "soft-light";
				ctx.beginPath();
				Visibility.interpretSvg(ctx, path);
				ctx.closePath();
				ctx.fill();
				ctx.restore();
			},
			drawVisibleWalls(ctx, path) {
				ctx.save();
				ctx.strokeStyle = "#f00";
				ctx.lineWidth = 2;
				ctx.beginPath();
				Visibility.interpretSvg(ctx, path);
				ctx.stroke();
				ctx.closePath();
				ctx.restore();
			},
			drawWalls(ctx, path) {
				ctx.save();
				ctx.strokeStyle = "#fff";
				ctx.lineWidth = 2;
				ctx.beginPath();
				let it0 = this.visibility.segments.iterator();
				while(it0.hasNext()) {
					let seg = it0.next();
					ctx.moveTo(seg.p1.x, seg.p1.y);
					ctx.lineTo(seg.p2.x, seg.p2.y);
				}
				ctx.stroke();
				ctx.closePath();
				ctx.restore();
			},
			render(ctx, cfg={}) {
				let paths = Visibility.computeVisibleAreaPaths(this.origo, this.visibility.output);
				if (cfg.floor) this.drawFloor(ctx, paths.floor);
				if (cfg.walls) this.drawWalls(ctx, paths.walls);
				if (cfg.clip) this.clip(ctx, paths.floor);
			}
		};

	class Point {
		constructor(x=0, y=0) {
			this.x = x;
			this.y = y;
		}
	}


	class EndPoint extends Point {
		constructor(x=0, y=0) {
			super(x, y);
			this.visualize = false;
			this.angle = 0;
			this.segment = null;
			this.begin = false;
		}
	}


	class Segment {
		constructor() {
			
		}
	}


	class DLLNode {
		constructor(x, list) {
			this.val = x;
			this._list = list;
		}

		_unlink() {
			var t = this.next;
			if (this.prev != null) this.prev.next = this.next;
			if (this.next != null) this.next.prev = this.prev;
			this.next = this.prev = null;
			return t;
		}

		_insertAfter(node) {
			node.next = this.next;
			node.prev = this;
			if (this.next != null) this.next.prev = node;
			this.next = node;
		}

		_insertBefore(node) {
			node.next = this;
			node.prev = this.prev;
			if (this.prev != null) this.prev.next = node;
			this.prev = node;
		}
	}


	class DLLIterator {
		constructor(f) {
			this._f = f;
			this._walker = this._f.head;
			this._hook = null;
		}

		reset() {
			this._walker = this._f.head;
			this._hook = null;
			return this;
		}

		hasNext() {
			return this._walker != null;
		}

		next() {
			var x = this._walker.val;
			this._hook = this._walker;
			this._walker = this._walker.next;
			return x;
		}
	}


	class CircularDLLIterator {
		constructor(f) {
			this._f = f;
			this._walker = this._f.head;
			this._s = this._f._size;
			this._i = 0;
			this._hook = null;
			this.__interfaces__ = [];
		}

		reset() {
			this._walker = this._f.head;
			this._s = this._f._size;
			this._i = 0;
			this._hook = null;
			return this;
		}
		
		hasNext() {
			return this._i < this._s;
		}
		
		next() {
			var x = this._walker.val;
			this._hook = this._walker;
			this._walker = this._walker.next;
			this._i++;
			return x;
		}
	}


	class DLL {
		constructor(reservedSize, maxSize) {
			if (maxSize == null) maxSize = -1;
			if (reservedSize == null) reservedSize = 0;
			this.maxSize = -1;
			this._reservedSize = reservedSize;
			this._size = 0;
			this._poolSize = 0;
			this._circular = false;
			this._iterator = null;
			if (reservedSize > 0) this._headPool = this._tailPool = new DLLNode(null,this);
			this.head = this.tail = null;
			this.key = RC.hashKeyCounter++;
			this.reuseIterator = false;
		}

		append(x) {
			var node = this._getNode(x);
			if (this.tail != null) {
				this.tail.next = node;
				node.prev = this.tail;
			} else this.head = node;
			this.tail = node;
			if (this._circular) {
				this.tail.next = this.head;
				this.head.prev = this.tail;
			}
			this._size++;
			return node;
		}

		insertBefore(node, x) {
			var t = this._getNode(x);
			node._insertBefore(t);
			if (node == this.head) {
				this.head = t;
				if (this._circular) this.head.prev = this.tail;
			}
			this._size++;
			return t;
		}

		unlink(node) {
			var hook = node.next;
			if (node == this.head) {
				this.head = this.head.next;
				if (this._circular) {
					if (this.head == this.tail) this.head = null;
					else this.tail.next = this.head;
				}
				if (this.head == null) this.tail = null;
			} else if (node == this.tail) {
				this.tail = this.tail.prev;
				if (this._circular) this.head.prev = this.tail;
				if (this.tail == null) this.head = null;
			}
			node._unlink();
			this._putNode(node);
			this._size--;
			return hook;
		}

		sort(compare, useInsertionSort) {
			if (useInsertionSort == null) useInsertionSort = false;
			if (this._size > 1) {
				if (this._circular) {
					this.tail.next = null;
					this.head.prev = null;
				}
				if (compare == null) if (useInsertionSort) this.head = this._insertionSortComparable(this.head);
				else this.head = this._mergeSortComparable(this.head);
				else if (useInsertionSort) this.head = this._insertionSort(this.head,compare);
				else this.head = this._mergeSort(this.head,compare);
				if (this._circular) {
					this.tail.next = this.head;
					this.head.prev = this.tail;
				}
			}
		}

		remove(x) {
			var s = this._size;
			if (s == 0) return false;
			var node = this.head;
			while(node != null) if (node.val == x) node = this.unlink(node);
			else node = node.next;
			return this._size < s;
		}

		clear(purge) {
			if (purge == null) purge = false;
			if (purge || this._reservedSize > 0) {
				var node = this.head;
				var _g1 = 0;
				var _g = this._size;
				while(_g1 < _g) {
					var i = _g1++;
					var next = node.next;
					node.prev = null;
					node.next = null;
					this._putNode(node);
					node = next;
				}
			}
			this.head = this.tail = null;
			this._size = 0;
		}

		iterator() {
			if (this.reuseIterator) {
				if (this._iterator == null) {
					if (this._circular) return new CircularDLLIterator(this);
					else return new DLLIterator(this);
				} else this._iterator.reset();
				return this._iterator;
			} else if (this._circular) return new CircularDLLIterator(this);
			else return new DLLIterator(this);
		}

		toArray() {
			var a = new Array(this._size);
			var node = this.head;
			var _g1 = 0;
			var _g = this._size;
			while(_g1 < _g) {
				var i = _g1++;
				a[i] = node.val;
				node = node.next;
			}
			return a;
		}

		_mergeSortComparable(node) {
			var h = node;
			var p;
			var q;
			var e;
			var tail = null;
			var insize = 1;
			var nmerges;
			var psize;
			var qsize;
			var i;
			while(true) {
				p = h;
				h = tail = null;
				nmerges = 0;
				while(p != null) {
					nmerges++;
					psize = 0;
					q = p;
					var _g = 0;
					while(_g < insize) {
						var i1 = _g++;
						psize++;
						q = q.next;
						if (q == null) break;
					}
					qsize = insize;
					while(psize > 0 || qsize > 0 && q != null) {
						if (psize == 0) {
							e = q;
							q = q.next;
							qsize--;
						} else if (qsize == 0 || q == null) {
							e = p;
							p = p.next;
							psize--;
						} else {
							e = q;
							q = q.next;
							qsize--;
						}
						if (tail != null) tail.next = e;
						else h = e;
						e.prev = tail;
						tail = e;
					}
					p = q;
				}
				tail.next = null;
				if (nmerges <= 1) break;
				insize <<= 1;
			}
			h.prev = null;
			this.tail = tail;
			return h;
		}

		_mergeSort(node,cmp) {
			var h = node;
			var p;
			var q;
			var e;
			var tail = null;
			var insize = 1;
			var nmerges;
			var psize;
			var qsize;
			var i;
			while(true) {
				p = h;
				h = tail = null;
				nmerges = 0;
				while(p != null) {
					nmerges++;
					psize = 0;
					q = p;
					var _g = 0;
					while(_g < insize) {
						var i1 = _g++;
						psize++;
						q = q.next;
						if (q == null) break;
					}
					qsize = insize;
					while(psize > 0 || qsize > 0 && q != null) {
						if (psize == 0) {
							e = q;
							q = q.next;
							qsize--;
						} else if (qsize == 0 || q == null) {
							e = p;
							p = p.next;
							psize--;
						} else if (cmp(q.val,p.val) >= 0) {
							e = p;
							p = p.next;
							psize--;
						} else {
							e = q;
							q = q.next;
							qsize--;
						}
						if (tail != null) tail.next = e;
						else h = e;
						e.prev = tail;
						tail = e;
					}
					p = q;
				}
				tail.next = null;
				if (nmerges <= 1) break;
				insize <<= 1;
			}
			h.prev = null;
			this.tail = tail;
			return h;
		}

		_insertionSortComparable(node) {
			var h = node;
			var n = h.next;
			while(n != null) {
				var m = n.next;
				var p = n.prev;
				var v = n.val;
				n = m;
			}
			return h;
		}

		_insertionSort(node,cmp) {
			var h = node;
			var n = h.next;
			while(n != null) {
				var m = n.next;
				var p = n.prev;
				var v = n.val;
				if (cmp(v,p.val) < 0) {
					var i = p;
					while(i.prev != null) if (cmp(v,i.prev.val) < 0) i = i.prev;
					else break;
					if (m != null) {
						p.next = m;
						m.prev = p;
					} else {
						p.next = null;
						this.tail = p;
					}
					if (i == h) {
						n.prev = null;
						n.next = i;
						i.prev = n;
						h = n;
					} else {
						n.prev = i.prev;
						i.prev.next = n;
						n.next = i;
						i.prev = n;
					}
				}
				n = m;
			}
			return h;
		}

		_getNode(x) {
			if (this._reservedSize == 0 || this._poolSize == 0) return new DLLNode(x, this);
			else {
				var n = this._headPool;
				this._headPool = this._headPool.next;
				this._poolSize--;
				n.next = null;
				n.val = x;
				return n;
			}
		}

		_putNode(x) {
			var val = x.val;
			if (this._reservedSize > 0 && this._poolSize < this._reservedSize) {
				this._tailPool = this._tailPool.next = x;
				x.val = null;
				this._poolSize++;
			} else x._list = null;
			return val;
		}
	}


	class Visibility {
		constructor() {
			this.segments = new DLL();
			this.endpoints = new DLL();
			this.open = new DLL();
			this.center = new Point(0,0);
			this.output = new Array();
			this.intersectionsDetected = [];
			this.segments.toArray();
		}

		clear() {
			this.segments.clear();
			this.endpoints.clear();
		}

		close() {
			var $it0 = this.segments.iterator();
			while( $it0.hasNext() ) {
				var segment = $it0.next();
				var node = this.open.head;
			}
		}

		static _endpoint_compare(a, b) {
			if (a.angle > b.angle) return 1;
			if (a.angle < b.angle) return -1;
			if (!a.begin && b.begin) return 1;
			if (a.begin && !b.begin) return -1;
			return 0;
		}

		static leftOf(s,p) {
			var cross = (s.p2.x - s.p1.x) * (p.y - s.p1.y) - (s.p2.y - s.p1.y) * (p.x - s.p1.x);
			return cross < 0;
		}

		static interpolate(p,q,f) {
			return new Point(p.x * (1 - f) + q.x * f,p.y * (1 - f) + q.y * f);
		}

		static computeVisibleAreaPaths(center, output) {
			let floor = [];
			let triangles = [];
			let walls = [];
			for (let i=0; i<output.length; i+=2) {
				let p1 = output[i];
				let p2 = output[i+1];
				if (isNaN(p1.x) || isNaN(p1.y) || isNaN(p2.x) || isNaN(p2.y)) {
					// These are collinear points that Visibility.hx
					// doesn't output properly. The triangle has zero area
					// so we can skip it.
					continue;
				}
				floor.push("L", p1.x, p1.y, "L", p2.x, p2.y);
				triangles.push("M", center.x, center.y, "L", p1.x, p1.y, "M", center.x, center.y, "L", p2.x, p2.y);
				walls.push("M", p1.x, p1.y, "L", p2.x, p2.y);
			}
			return { floor, triangles, walls };
		}

		static interpretSvg(ctx, path) {
			for (let i = 0; i < path.length; i++) {
				if (path[i] === "M") {
					ctx.moveTo(path[i+1], path[i+2]);
					i += 2;
				}
				if (path[i] === "L") {
					ctx.lineTo(path[i+1], path[i+2]);
					i += 2;
				}
			}
		}

		// loadEdgeOfMap(area) {
		// 	this.addSegment(area.m, area.m, area.w-area.m, area.m);
		// 	this.addSegment(area.m, area.m, area.m, area.h-area.m);
		// 	this.addSegment(area.w-area.m, area.m, area.w-area.m, area.h-area.m);
		// 	this.addSegment(area.m, area.h-area.m, area.w-area.m, area.h-area.m);
		// }

		// loadMap(area, blocks, walls) {
		// 	this.segments.clear();
		// 	this.endpoints.clear();
		// 	this.loadEdgeOfMap(area);
		// 	var _g = 0;

		// 	while(_g < blocks.length) {
		// 		var block = blocks[_g];
		// 		++_g;
		// 		// corners
		// 		let nw = [block.x, block.y];
		// 		let sw = [block.x, block.y + block.h];
		// 		let ne = [block.x + block.w, block.y];
		// 		let se = [block.x + block.w, block.y + block.h]
		// 		this.addSegment(...nw, ...ne);
		// 		this.addSegment(...nw, ...sw);
		// 		this.addSegment(...ne, ...se);
		// 		this.addSegment(...sw, ...se);
		// 	}
		// 	var _g1 = 0;
		// 	while(_g1 < walls.length) {
		// 		var wall = walls[_g1];
		// 		++_g1;
		// 		this.addSegment(wall.p1.x, wall.p1.y, wall.p2.x, wall.p2.y);
		// 	}

		// 	var $it0 = this.segments.iterator();
		// 	while( $it0.hasNext() ) {
		// 		var segment = $it0.next();
		// 		var node = this.open.head;
		// 	}
		// }
		
		addVertices(vert) {
			if (vert.length > 1) {
				vert.slice(0, -1).map((v, i) => {
					this.addSegment(v[0], v[1], vert[i+1][0], vert[i+1][1]);
				});
				// end to start segment
				let i = vert.length-1;
				this.addSegment(vert[i][0], vert[i][1], vert[0][0], vert[0][1]);
			}
			// close "vertex loop"
			this.close();
		}
		
		addSegment(x1, y1, x2, y2) {
			var segment = null;
			var p1 = new EndPoint(0, 0);
			p1.segment = segment;
			p1.visualize = true;
			var p2 = new EndPoint(0, 0);
			p2.segment = segment;
			p2.visualize = false;
			segment = new Segment();
			p1.x = x1;
			p1.y = y1;
			p2.x = x2;
			p2.y = y2;
			p1.segment = segment;
			p2.segment = segment;
			segment.p1 = p1;
			segment.p2 = p2;
			segment.d = 0;
			this.segments.append(segment);
			this.endpoints.append(p1);
			this.endpoints.append(p2);
		}

		// addBlocks(blocks) {
		// 	blocks.map(b => {
		// 		// corners
		// 		let nw = [b.x, b.y];
		// 		let sw = [b.x, b.y + b.h];
		// 		let ne = [b.x + b.w, b.y];
		// 		let se = [b.x + b.w, b.y + b.h]
		// 		this.addSegment(...nw, ...ne);
		// 		this.addSegment(...nw, ...sw);
		// 		this.addSegment(...ne, ...se);
		// 		this.addSegment(...sw, ...se);
		// 		// close "vertex loop"
		// 		this.close();
		// 	});
		// }
		
		setLightLocation(x, y) {
			this.center.x = x;
			this.center.y = y;
			var $it0 = this.segments.iterator();
			while( $it0.hasNext() ) {
				var segment = $it0.next();
				var dx = 0.5 * (segment.p1.x + segment.p2.x) - x;
				var dy = 0.5 * (segment.p1.y + segment.p2.y) - y;
				segment.d = dx * dx + dy * dy;
				segment.p1.angle = Math.atan2(segment.p1.y - y,segment.p1.x - x);
				segment.p2.angle = Math.atan2(segment.p2.y - y,segment.p2.x - x);
				var dAngle = segment.p2.angle - segment.p1.angle;
				if (dAngle <= -Math.PI) dAngle += 2 * Math.PI;
				if (dAngle > Math.PI) dAngle -= 2 * Math.PI;
				segment.p1.begin = dAngle > 0;
				segment.p2.begin = !segment.p1.begin;
			}
		}
		
		_segment_in_front_of(a, b, relativeTo) {
			var A1 = Visibility.leftOf(a, Visibility.interpolate(b.p1, b.p2, 0.01));
			var A2 = Visibility.leftOf(a, Visibility.interpolate(b.p2, b.p1, 0.01));
			var A3 = Visibility.leftOf(a, relativeTo);
			var B1 = Visibility.leftOf(b, Visibility.interpolate(a.p1, a.p2, 0.01));
			var B2 = Visibility.leftOf(b, Visibility.interpolate(a.p2, a.p1, 0.01));
			var B3 = Visibility.leftOf(b, relativeTo);
			if (B1 == B2 && B2 != B3) return true;
			if (A1 == A2 && A2 == A3) return true;
			if (A1 == A2 && A2 != A3) return false;
			if (B1 == B2 && B2 == B3) return false;
			this.intersectionsDetected.push([ a.p1, a.p2, b.p1, b.p2 ]);
			return false;
		}
		
		sweep(maxAngle=Math.PI) {
			this.output = [];
			this.intersectionsDetected = [];
			this.endpoints.sort(Visibility._endpoint_compare, true);
			this.open.clear();
			var beginAngle = 0;
			var _g = 0;
			while(_g < 2) {
				var pass = _g++;
				var $it0 = this.endpoints.iterator();
				while($it0.hasNext()) {
					var p = $it0.next();
					if (pass == 1 && p.angle > maxAngle) break;
					var current_old;
					if (this.open._size == 0) current_old = null;
					else current_old = this.open.head.val;
					if (p.begin) {
						var node = this.open.head;
						// while(node != null && this._segment_in_front_of(p.segment, node.val, this.center)) {
						// while (node != null && !this._segment_in_front_of(node.val, p.segment, this.center)) {
						while (node != null && (!this._segment_in_front_of(node.val, p.segment, this.center) && this._segment_in_front_of(p.segment, node.val, this.center))) {
							node = node.next;
						}
						if (node == null) this.open.append(p.segment);
						else this.open.insertBefore(node, p.segment);
					} else this.open.remove(p.segment);
					var current_new;
					if (this.open._size == 0) current_new = null;
					else current_new = this.open.head.val;
					if (current_old != current_new) {
						if (pass == 1) this.addTriangle(beginAngle, p.angle, current_old);
						beginAngle = p.angle;
					}
				}
			}
		}
		
		lineIntersection(p1, p2, p3, p4) {
			var s = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) /
					((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
			return new Point(p1.x + s * (p2.x - p1.x),p1.y + s * (p2.y - p1.y));
		}
		
		addTriangle(angle1, angle2, segment) {
			var p1 = this.center;
			var p2 = new Point(this.center.x + Math.cos(angle1),this.center.y + Math.sin(angle1));
			var p3 = new Point(0, 0);
			var p4 = new Point(0, 0);
			if (segment != null) {
				p3.x = segment.p1.x;
				p3.y = segment.p1.y;
				p4.x = segment.p2.x;
				p4.y = segment.p2.y;
			} else {
				p3.x = this.center.x + Math.cos(angle1) * 500;
				p3.y = this.center.y + Math.sin(angle1) * 500;
				p4.x = this.center.x + Math.cos(angle2) * 500;
				p4.y = this.center.y + Math.sin(angle2) * 500;
			}
			var pBegin = this.lineIntersection(p3, p4, p1, p2);
			p2.x = this.center.x + Math.cos(angle2);
			p2.y = this.center.y + Math.sin(angle2);
			var pEnd = this.lineIntersection(p3, p4, p1, p2);
			this.output.push(pBegin);
			this.output.push(pEnd);
		}
	}

	return RC;

})();


let Shifter = (() => {
	"use strict";
	
	let DOTS = 50e3,
		shaderConfig = { // these affect the shaders; changing them does *not* require updating buffers
			alpha: 0.125,
			speed: 5,
			spread: 0.1,
		},
		shape = [],
		jitter = Array.from({ length: DOTS }, () => Math.random()),
		tick = 0,
		total = 135,
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
			await this.loadImage(`/app/ant/paradroid/icons/bp-${cfg.to}.png`);
			await this.loadImage(`/app/ant/paradroid/icons/bp-${cfg.from}.png`);
			// prepare regl anim
			draw = this.prepareRegl();

			this.start();
		},
		start() {
			tick = 0;
			// reset regl canvas
			regl.clear({color: [0, 0, 0, 0], depth: 1});
			// start anim
			let loop = regl.frame(() => {
				if (tick++ > 40) {
					loop.cancel();
					return this.done()
				}
				// loop.cancel();

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
						x = -208,
						y = 0,
						w = img.height,
						h = img.height;
					cvs.width = w;
					cvs.height = h;
					// draw image
					ctx.translate(x, y);
					ctx.drawImage(img, 0, 0);
					let imageData = ctx.getImageData(0, 0, w, h),
						pixels = imageData.data,
						j = 0,
						xtra = 0;
					for (let i=0, il=pixels.length; i<il; i+=4) {
						if (pixels[i] <= 230) continue;
						let avg = (pixels[i+0] + pixels[i+1] + pixels[i+2]) / 3,
							k = i/4,
							pX = ((k % w) / (w * .5)) - 1,
							pY = 1 - ((k / h) / (h * .5));
						data[j++] = pX;
						data[j++] = pY;
					}
					while (j < len) {
						data[j++] = data[xtra++];
						data[j++] = data[xtra++];
					}
					shape[num]({ data });
					// save reference
					this.bank[url] = 1;
					// done
					resolve();
				};
				img.src = url;
			});
		},
		redraw(a,b,c) {
			regl.clear({ color: [0, 0, 0, 0], depth: 1 });
			// Chromatic blur: draw blue, cyan, green, orange, red versions of each point,
			// and have them added together using blending so they'll be white if they're
			// all present. The sums of R, G, B should be roughly equal to get white.
			let chromaticblur = 0.0015;
			draw({ u_color: [0.1, 0.1, 0.1], u_chromaticblur: 0 });
			draw({ u_color: [0.2, 0.2, 0.2], u_chromaticblur: 1 * chromaticblur });
			draw({ u_color: [0.3, 0.3, 0.3], u_chromaticblur: 2 * chromaticblur });
			draw({ u_color: [0.1, 0.1, 0.1], u_chromaticblur: 3 * chromaticblur });
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
						vec3 color = vec3(1, 1, 1);
						gl_FragColor = vec4(color * u_alpha, u_alpha);
						// gl_FragColor = vec4(u_color * u_alpha, u_alpha);
					}`,
				
				vert: `
					precision highp float;
					uniform float u_tick, u_chromaticblur, u_spread, u_speed;
					attribute float a_jitter;
					attribute vec2 a_position1, a_position2;
					void main () {
						float phase = (.125 + cos(u_speed * (u_tick + u_chromaticblur) + a_jitter * u_spread));
						phase = smoothstep(0.1, 0.9, phase);
						gl_PointSize = .5;
						gl_Position = vec4(mix(a_position1, a_position2, phase), 0, 1);
					}`,

				// additive — we want to draw many points in the same place and have them add together
				depth: { enable: false, },
				blend: { enable: true, func: { src: "one", dst: "one" }, },
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
					u_spread: () => Math.TAU * shaderConfig.spread,
					u_chromaticblur: regl.prop("u_chromaticblur"),
					u_color: regl.prop("u_color"),
					u_tick: () => tick / total,
				},
				count: DOTS,
				primitive: "points",
			});
		}
	};

	return Shifter;

})();


const Color = {
	rgbToLightness(r, g, b) {
		return (1/2 * (Math.max(r, g, b) + Math.min(r, g, b))) / 255;
	},
	rgbToSaturation(r, g, b) {
		let L = this.rgbToLightness(r, g, b),
			max = Math.max(r, g, b),
			min = Math.min(r, g, b);
		return (L === 0 || L === 1)
			? 0
			: ((max - min) / (1 - Math.abs(2 * L - 1))) / 255;
	},
	rgbToHue(r, g, b) {
		let hue = Math.round(Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180 / Math.PI );
		return hue < 0 ? hue + 360 : hue;
	},
	hslToRgb(h, s, l, a=1) {
		let _round = Math.round,
			_min = Math.min,
			_max = Math.max,
			b = s * _min(l, 1-l);
		let f = (n, k = (n + h / 30) % 12) => l - b * _max(_min(k - 3, 9 - k, 1), -1);
		return [_round(f(0) * 255), _round(f(8) * 255), _round(f(4) * 255), a];
	},
	hslToHex(h, s, l, a=1) {
		let rgb = this.hslToRgb(h, s, l, a);
		return this.rgbToHex(`rgba(${rgb.join(",")})`);
	},
	hexToHsl(hex) {
		if (hex.startsWith("rgb")) hex = this.rgbToHex(hex);
		let rgb = this.hexToRgb(hex);
		return this.rgbToHsl(...rgb);
	},
	mixColors(hex1, hex2, p) {
		let rgb1 = this.hexToRgb(hex1),
			rgb2 = this.hexToRgb(hex2),
			w = p * 2 - 1,
			w1 = (w + 1) / 2.0,
			w2 = 1 - w1,
			rgb = [
				parseInt(rgb1[0] * w1 + rgb2[0] * w2, 10),
				parseInt(rgb1[1] * w1 + rgb2[1] * w2, 10),
				parseInt(rgb1[2] * w1 + rgb2[2] * w2, 10),
				rgb1[3] * w1 + rgb2[3] * w2
			];
		return this.rgbToHex(`rgba(${rgb.join(",")})`);
	},
	hexToHsv(hex) {
		let rgb = this.hexToRgb(hex);
		return this.rgbToHsv(...rgb);
	},
	rgbToHsv(r, g, b, a=1) {
		var max = Math.max(r, g, b), min = Math.min(r, g, b),
			d = max - min,
			h,
			s = (max === 0 ? 0 : d / max),
			v = max / 255;
		switch (max) {
			case min: h = 0; break;
			case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
			case g: h = (b - r) + d * 2; h /= 6 * d; break;
			case b: h = (r - g) + d * 4; h /= 6 * d; break;
		}
		return [Math.round(h*360), s, v, a];
	},
	hexToRgb(hex) {
		if (hex.length === 4) {
			let [h,r,g,b] = hex.split("");
			hex = h+r+r+g+g+b+b;
		}
		let r = parseInt(hex.substr(1,2), 16),
			g = parseInt(hex.substr(3,2), 16),
			b = parseInt(hex.substr(5,2), 16),
			a = parseInt(hex.substr(7,2) || "ff", 16) / 255;
		return [r, g, b, a];
	},
	rgbToHsl(r, g, b, a=1) {
		r /= 255;
		g /= 255;
		b /= 255;
		var max = Math.max(r, g, b),
			min = Math.min(r, g, b),
			l = (max + min) / 2,
			h, s;
		if (max == min){
			h = s = 0; // achromatic
		} else {
			var d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch (max){
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}
		return [Math.round(h*360), s, l, a];
	},
	rgbToHex(rgb) {
		let d = "0123456789abcdef".split(""),
			hex = x => isNaN(x) ? "00" : d[( x - x % 16) / 16] + d[x % 16];
		rgb = rgb.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\.\d]+)\)$/);
		if (!rgb) rgb = arguments[0].match(/^rgb?\((\d+),\s*(\d+),\s*(\d+)\)$/);
		let a = Math.round((rgb[4] || 1) * 255);
		return "#"+ hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]) + hex(a);
	}
};


let Utils = {
	digits: {},
	// creates offscreen canvas
	createCanvas(width, height) {
		let cvs = $(document.createElement("canvas")),
			ctx = cvs[0].getContext("2d", { willReadFrequently: true });
		cvs.prop({ width, height });
		return { cvs, ctx }
	},
	random(min, max) {
		return Math.random() * ( max - min ) + min;
	},
	randomInt(min, max) {
		return this.random(min, max) | 0;
	},
	sortPointsCW(arr) {
		// Get the center (mean value) using reduce
		let center = arr.reduce((acc, { x, y }) => {
				acc.x += x / arr.length;
				acc.y += y / arr.length;
				return acc;
			}, { x: 0, y: 0 }),
			// Add an angle property to each point using tan(angle) = y/x
			angles = arr.map(({ x, y }) => {
				return { x, y, angle: Math.atan2(y - center.y, x - center.x) * 180 / Math.PI };
			});
		// Sort your points by angle
		return angles.sort((a, b) => a.angle - b.angle);
	},
	grand: 0,
	rSeed: Math.random() * 8388607 + 24478357,
	prand() {
		[...Array(25)].map(e => this.prandi());
		return this.prandi();
	},
	prandi() {
		this.grand += 1;
		this.rSeed = this.rSeed << 1;
		this.rSeed = this.rSeed | (this.rSeed & 1073741824) >> 30;
		this.rSeed = this.rSeed ^ (this.rSeed & 614924288) >> 9;
		this.rSeed = this.rSeed ^ (this.rSeed & 4241) << 17;
		this.rSeed = this.rSeed ^ (this.rSeed & 272629760) >> 23;
		this.rSeed = this.rSeed ^ (this.rSeed & 318767104) >> 10;
		return (this.rSeed & 16777215) / 16777216;
	}
};



class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	distance(point) {
		var myX = this.x - point.x;
        var myY = this.y - point.y;
        return Math.sqrt(myX * myX + myY * myY);			
	}

	direction(point) {
		var myX = point ? point.x - this.x : this.x,
			myY = point ? point.y - this.y : this.y;
   		return Math.atan2(myY, myX);
	}

	moveTowards(point, step) {
		let angle = this.direction(point);
		this.x += Math.cos(angle) * step;
		this.y += Math.sin(angle) * step;
		return this;
	}

	limit(scalar) {
		return this.normalize().multiply(Math.min(this.magnitude(), scalar));
	}

	abs() {
		this.x = Math.abs(this.x);
		this.y = Math.abs(this.y);
		return this;
	}

	dot(p) {
		return this.x * p.x + this.y * p.y;
	}

	magnitude() {
		var x = this.x,
			y = this.y;
		return Math.sqrt(x * x + y * y);
	}

	setMagnitude(n) {
		return this.normalize().multiply(n);
	}

	scale(s) {
		this.x *= s;
		this.y *= s;
        return this;
	}

	normalize() { 
		var m = this.magnitude();
		if (m > 0) this.divide(m);
        return this;
	}

	norm() { 
		var m = this.magnitude();
		if (m > 0) return this.divide(m);
        return this;
	}

	add(point) {
		if (point.constructor === Number) point = { x: point, y: point };
		return new Point(this.x + point.x, this.y + point.y);
	}

	subtract(point) {
		if (point.constructor === Number) point = { x: point, y: point };
		return new Point(this.x - point.x, this.y - point.y);
	}

	multiply(value) {
		return new Point(this.x * value, this.y * value);
	}

	divide(value) {
		return new Point(this.x / value, this.y / value);
	}

	empty() {
		this.x = 0;
		this.y = 0;
		return this;
	}

	clone() {
		return new Point(this.x, this.y);
	}

	copy(point) {
		this.x = point.x;
		this.y = point.y;
		return this;
	}

	toString() {
		return `${this.x}, ${this.y}`
	}
}


class HackerAI {
	constructor(cfg) {
		let { id, el, owner, order } = cfg;

		this.id = id;
		this.el = el;
		this.owner = owner;
		this.order = order || [];
		this.pEl = el.parent();

		// create FPS controller
		let Self = this;
		this.fpsControl = karaqu.FpsControl({
			fps: 6,
			autoplay: true,
			callback(time, delta) {
				Self.tick();
			}
		});
		this.fpsControl.start();
	}

	setOrder(arr) {
		this.order = arr;
	}

	chooseConn() {
		if (this.order.length) {
			this.target = this.order.shift();
		} else {
			let available = this.pEl.find(".io .toggler > div:not(.active)").map(el => $(el).index()+1);
			// remove first / entry position
			available = available.slice(1);
			// set target
			this.target = available[Utils.randomInt(0, available.length)];
		}
	}

	gotoConn() {
		let toggler = this.pEl.find(".io .toggler"),
			index = +toggler.data("active");
		if (index < this.target) {
			toggler.data({ active: index + 1 });
		} else {
			// trigger connection row
			this.owner.dispatch({ type: "toggle-io-row", el: toggler, index });
			// if there are more "ammo", reset and go again
			let ammo = toggler.parent().parent().find(".ammo");
			if (+ammo.data("left") >= 0) delete this.target;
			else this.fpsControl.stop();
		}
	}

	tick() {
		if (!this.target) this.chooseConn();
		else this.gotoConn();
	}
}


class Explosion {
	constructor(cfg) {
		let { arena, x, y } = cfg;

		this.arena = arena;
		this.sprite = arena.assets["explosion"].img;
		this.frame = {
			index: 0,
			last: 30,
			speed: 30,
		};
		
		this.angle = 0;
		// this ensures this to be rendered on top
		this._fx = true;

		// update tile position
		let position = new Point(x, y),
			tile = this.arena.config.tile;
		this.x = Math.round(position.x / tile);
		this.y = Math.round(position.y / tile);
		this.position = position;
		
		// add entity to entries list
		this.arena.map.entries.push(this);
	}

	update(delta) {
		this.angle += .5;
		this.frame.last -= delta;
		if (this.frame.last < 0) {
			this.frame.last = (this.frame.last + this.frame.speed) % this.frame.speed;
			this.frame.index++;
			if (this.frame.index > 30) {
				let index = this.arena.map.entries.indexOf(this);
				this.arena.map.entries.splice(index, 1);
			}
		}
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport,
			w = 64,
			f = this.frame.index * w,
			pX = this.position.x + arena.viewport.x,
			pY = this.position.y + arena.viewport.y;
		
		ctx.save();
		ctx.translate(pX, pY);
		ctx.rotate((this.angle * Math.PI) / 180);
		// ctx.globalCompositeOperation = "lighter";
		ctx.drawImage(this.sprite,
				f, 0, w, w,
				-32, -32, w, w
			);
		ctx.restore();
	}
}


class Sparks {
	constructor(cfg) {
		let { arena, owner, x, y, count } = cfg;

		this.arena = arena;
		this.owner = owner;
		this.parts = [];
		this.gravity = 1.65;
		this.alpha = 1;
		this.trailLen = 5;
		this.decay = Utils.random(.02, .035);
		// this ensures this to be rendered on top
		this._fx = true;
		
		// update tile position
		let position = new Point(x, y),
			tile = this.arena.config.tile;
		this.x = Math.round(position.x / tile);
		this.y = Math.round(position.y / tile);

		let len = count || 3;
		while (len--) {
			let vX = Utils.random(-1.5, 1.5),
				vY = Utils.random(-1.5, 1.5),
				angle = Utils.random(-2, -1);
			this.parts.push({
				pos: position.clone(),
				vel: new Point(vX, vY),
				trail: [],
				angle,
			});
		}

		// add entity to entries list
		this.arena.map.entries.push(this);
	}

	update(delta) {
		let m = delta/16;
		this.parts.map(p => {
			p.pos.x += p.vel.x + Math.cos(p.angle) * m;
			p.pos.y += p.vel.y + Math.sin(p.angle) * m + this.gravity;

			// prepend position to trail
			p.trail.unshift([p.pos.x, p.pos.y]);
			let [x2, y2] = p.trail[5] || [p.pos.x, p.pos.y];
			p.x2 = x2;
			p.y2 = y2;
			// trim trail log
			p.trail.splice(this.trailLen, this.trailLen);
		});

		// remove parts if fade is < zero
		this.alpha -= this.decay;
		if (this.alpha < 0) {
			let index = this.arena.map.entries.indexOf(this);
			this.arena.map.entries.splice(index, 1);
		}
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport;
		if (arena.debug.mode < 2) {
			ctx.save();
			ctx.lineWidth = 2;
			ctx.strokeStyle = "#fff9";
			// ctx.globalAlpha = this.alpha;
			this.parts.map(p => {
				let x1 = p.pos.x + viewport.x,
					y1 = p.pos.y + viewport.y,
					x2 = p.x2 + viewport.x,
					y2 = p.y2 + viewport.y;
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.stroke();
			});
			ctx.restore();
		}
	}
}


class Missile {
	constructor(cfg) {
		let { arena, owner, target, angle } = cfg;

		this.arena = arena;
		this.owner = owner;
		this.angle = angle + Math.PI / 2;
		this.asset = {
			img: owner.sprites.missile,
			oX: arena.assets.missile.item.oX,
			oY: arena.assets.missile.item.oY,
		};
		this.bullet = Math.random();
		this.trail = [];
		this.color = owner.isPlayer ? "#fff" : "#222";
		// this ensures this to be rendered on top
		this._fx = true;

		this.position = owner.position.clone();
		this.position.x += Math.cos(angle) * 28;
		this.position.y += Math.sin(angle) * 28;

		let speed = 2,
			vX = Math.cos(angle) * speed,
 			vY = Math.sin(angle) * speed;
		this.velocity = new Point(vX, vY);

		this.target = new Point(target.x, target.y);
	    this.acceleration = new Point(0, 0);
	    this.maxspeed = .25;
	    this.maxforce = .15;

		this.body = Matter.Bodies.circle(this.position.x, this.position.y, 2, { frictionAir: .006 });
		this.body.label = `fire-${this.bullet}`;

		// add to map entries
		this.arena.map.addItem(this);
	}

	destroy() {
		let arena = this.arena,
			owner = this.owner,
			index = arena.map.entries.indexOf(this);
		arena.map.entries.splice(index, 1);
		// sparks at kill zone
		new Sparks({ arena, owner, x: this.position.x, y: this.position.y });
		// remove from physical world
		Matter.Composite.remove(arena.map.engine.world, this.body);
	}

	seek() {
		let desired = this.target.subtract(this.position).setMagnitude(this.maxspeed);
		let steer = desired.subtract(this.velocity).limit(this.maxforce);
		// We could add mass here if we want A = F / M
		this.acceleration = this.acceleration.add(steer);
	}

	update(delta) {
		if (this.position.distance(this.target) < 15) {
			return this.destroy();
		} else if (this.position.distance(this.owner.position) < 55) {
			this.position = this.position.add(this.velocity);
			this.acceleration = this.velocity.clone().setMagnitude(15);
		} else {
			this.seek();
			// Update velocity & Limit speed
			this.velocity = this.velocity.add(this.acceleration).limit(this.maxspeed);
			this.position = this.position.add(this.velocity);
			// Reset accelerationelertion to 0 each cycle
			this.acceleration = this.acceleration.multiply(0.75);
			this.angle = this.velocity.direction() + Math.PI/2;
		}
		// transfer body position to physical world
		Matter.Body.setPosition(this.body, this.position);

		// add trail
		this.trail.unshift({
			x: this.position.x,
			y: this.position.y,
		});
		// trim trail log
		this.trail.splice(21, 9);
		
		// update tile position
		let tile = this.arena.config.tile;
		this.x = Math.round(this.position.x / tile);
		this.y = Math.round(this.position.y / tile);
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport,
			x = this.position.x + viewport.x,
			y = this.position.y + viewport.y;

		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(this.angle);
		ctx.drawImage(this.asset.img, -this.asset.oX, -this.asset.oY);
		ctx.restore();

		if (this.trail.length > 10) {
			let s = 7,
				r = this.trail.slice(s);
			ctx.save();
			ctx.lineWidth = 2;
			r.slice(0,-1).map((p,i) => {
					let x1 = p.x + viewport.x,
						y1 = p.y + viewport.y,
						x2 = r[i+1].x + viewport.x,
						y2 = r[i+1].y + viewport.y;
					ctx.strokeStyle = `${this.color}${(14-i).toString(16)}`;
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.stroke();
				});
			ctx.restore();
		}
	}
}


class Electric {
	constructor(cfg) {
		let { arena, owner, color, lineWidth, droid, amplitude } = cfg,
			vPoint = { x: arena.viewport.x, y: arena.viewport.y },
			origin = owner.position.clone().add(vPoint),
			target = droid.position.add({ x: arena.viewport.x, y: arena.viewport.y });
		
		this.arena = arena;
		this.owner = owner;
		this._fx = true; // map renders this last
		this.speed = 0.2;
		this.color = color || "#fff";
		this.lineWidth = lineWidth || 2.5;
		this.amplitude = amplitude || 0.85;
		this.origin = origin.moveTowards(target, 23);
		this.target = target.moveTowards(origin, 23);
		this.droid = droid;
		this.points = [];
		this.ttl = 12;
		this.simplexNoise = new SimplexNoise;
		// this ensures this to be rendered on top
		this._fx = true;

		if (this.lineWidth !== 1) {
			// thinner child lines
			this.children = [...Array(2)].map(i => new Electric({ ...cfg, color: `${color}9`, lineWidth: 1, amplitude: 0.95 }));
			// add to map entries
			this.arena.map.addItem(this);
		}
	}

	noise(v) {
		let amp = 1,
			sum = 0,
			f = 1;
		for (let i=0; i<6; ++i) {
			amp *= 0.5;
			sum += amp * (this.simplexNoise.noise2D(v * f, 0) + 1) * 0.5;
			f *= 2;
		}
		return sum;
	}

	update(delta) {
		let arena = this.arena,
			_sin = Math.sin,
			_cos = Math.cos,
			_pi = Math.PI,
			length = this.origin.distance(this.target),
			step = Math.max(length / 2, 25),
			normal = this.target.clone().subtract(this.origin).norm().scale(length / step),
			radian = normal.direction(),
			sinv   = _sin(radian),
			cosv   = _cos(radian),
			points = this.points = [],
			off    = Utils.random(this.speed, this.speed * 0.1),
			waveWidth = (!this.children ? length * 1.5 : length) * this.amplitude;

		for (let i=0, len=step; i<len; i++) {
			let n = i / 60,
				av = waveWidth * this.noise(n - off, 0) * 0.5,
				ax = sinv * av,
				ay = cosv * av,
				bv = waveWidth * this.noise(n + off, 0) * 0.5,
				bx = sinv * bv,
				by = cosv * bv,
				m = _sin((_pi * (i / (len - 1)))),
				x = this.origin.x + normal.x * i + (ax - bx) * m,
				y = this.origin.y + normal.y * i - (ay - by) * m;
			points.push({ x, y });
		}
		points.push(this.target.clone());

		// freeze droid while being "zapped"
		this.droid.freeze = true;
		this.owner.freeze = true;

		// count down ttl (Time To Live)
		if (this.children) {
			this.children.map(child => child.update(delta));
			if (this.ttl-- <= 0) {
				let index = arena.map.entries.indexOf(this);
				arena.map.entries.splice(index, 1);
				// unfreeze droid
				this.droid.freeze = false;
				this.owner.freeze = false;
			}
		}
	}

	render(ctx) {
		let points = this.points || [],
			len = points.length;
		// electric
		ctx.save();
		ctx.lineWidth = this.lineWidth;
		ctx.strokeStyle = this.color;
		ctx.beginPath();
		points.map((point, i) => ctx[i === 0 ? "moveTo" : "lineTo"](point.x, point.y));
		ctx.stroke();
		ctx.restore();
		
		if (this.children) {
			// ctx.save();
			// // ctx.globalCompositeOperation = "screen";
			// ctx.fillStyle   = "#fff";
			// // start dot
			// ctx.beginPath();
			// ctx.arc(this.origin.x, this.origin.y, 4, 0, Math.TAU);
			// ctx.fill();

			// // end dot
			// ctx.beginPath();
			// ctx.arc(this.target.x, this.target.y, 4, 0, Math.TAU);
			// ctx.fill();
			// ctx.restore();

			// Draw children
			this.children.map(child => child.render(ctx));
		}
	}
}

/*
 * A fast javascript implementation of simplex noise by Jonas Wagner
 *
 * Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
 * Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 *
 */
 
class SimplexNoise {
	constructor() {
		this.F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
		this.G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

		let random = Math.random;
		this.p = new Uint8Array(256);
		this.perm = new Uint8Array(512);
		this.permMod12 = new Uint8Array(512);

		for (let i=0; i<256; i++) {
			this.p[i] = random() * 256;
		}

		for (let i=0; i<512; i++) {
			this.perm[i] = this.p[i & 255];
			this.permMod12[i] = this.perm[i] % 12;
		}

		this.grad3 = new Float32Array([1, 1, 0, - 1, 1, 0, 1, - 1, 0, - 1, - 1, 0, 1, 0, 1, - 1, 0, 1, 1, 0, - 1, - 1, 0, - 1, 0, 1, 1, 0, - 1, 1, 0, 1, - 1, 0, - 1, - 1]);
		this.grad4 = new Float32Array([0, 1, 1, 1, 0, 1, 1, - 1, 0, 1, - 1, 1, 0, 1, - 1, - 1, 0, - 1, 1, 1, 0, - 1, 1, - 1, 0, - 1, - 1, 1, 0, - 1, - 1, - 1, 1, 0, 1, 1, 1, 0, 1, - 1, 1, 0, - 1, 1, 1, 0, - 1, - 1, - 1, 0, 1, 1, - 1, 0, 1, - 1, - 1, 0, - 1, 1, - 1, 0, - 1, - 1, 1, 1, 0, 1, 1, 1, 0, - 1, 1, - 1, 0, 1, 1, - 1, 0, - 1, - 1, 1, 0, 1, - 1, 1, 0, - 1, - 1, - 1, 0, 1, - 1, - 1, 0, - 1, 1, 1, 1, 0, 1, 1, - 1, 0, 1, - 1, 1, 0, 1, - 1, - 1, 0, - 1, 1, 1, 0, - 1, 1, - 1, 0, - 1, - 1, 1, 0, - 1, - 1, - 1, 0]);
	}

	noise2D(xin, yin) {
		let permMod12 = this.permMod12,
			perm = this.perm,
			grad3 = this.grad3,
			n0=0, n1=0, n2=0; // Noise contributions from the three corners
		// Skew the input space to determine which simplex cell we're in
		let s = (xin + yin) * this.F2, // Hairy factor for 2D
			i = Math.floor(xin + s),
			j = Math.floor(yin + s),
			t = (i + j) * this.G2,
			X0 = i - t, // Unskew the cell origin back to (x,y) space
			Y0 = j - t,
			x0 = xin - X0, // The x,y distances from the cell origin
			y0 = yin - Y0,
			// For the 2D case, the simplex shape is an equilateral triangle.
			// Determine which simplex we are in.
			i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
		if (x0 > y0) {
			i1 = 1;
			j1 = 0;
		} else { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
			i1 = 0;
			j1 = 1;
		} // upper triangle, YX order: (0,0)->(0,1)->(1,1)
		// A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
		// a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
		// c = (3-sqrt(3))/6
		let x1 = x0 - i1 + this.G2, // Offsets for middle corner in (x,y) unskewed coords
			y1 = y0 - j1 + this.G2,
			x2 = x0 - 1.0 + 2.0 * this.G2, // Offsets for last corner in (x,y) unskewed coords
			y2 = y0 - 1.0 + 2.0 * this.G2,
			// Work out the hashed gradient indices of the three simplex corners
			ii = i & 255,
			jj = j & 255,
			// Calculate the contribution from the three corners
			t0 = 0.5 - x0 * x0 - y0 * y0;
		if (t0 >= 0) {
			let gi0 = permMod12[ii + perm[jj]] * 3;
			t0 *= t0;
			n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
		}
		let t1 = 0.5 - x1 * x1 - y1 * y1;
		if (t1 >= 0) {
			let gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
			t1 *= t1;
			n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
		}
		let t2 = 0.5 - x2 * x2 - y2 * y2;
		if (t2 >= 0) {
			let gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
			t2 *= t2;
			n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
		}
		// Add contributions from each corner to get the final noise value.
		// The result is scaled to return values in the interval [-1,1].
		return 70.0 * (n0 + n1 + n2);
	}
}


class Fire {
	constructor(cfg) {
		let { arena, owner, type, angle, speed, damage, rotate, scale } = cfg;

		this.arena = arena;
		this.owner = owner;
		this.bullet = Math.random();
		this.type = type;
		this.angle = angle + Math.PI / 2;
		// firearm asset
		this.asset = owner.sprites[this.type] || arena.assets[this.type].img;
		this.asset.oX = arena.assets[this.type].item.oX;
		this.asset.oY = arena.assets[this.type].item.oY;
		// ripper uses scale + rotate
		this.rotate = rotate || 0;
		this.scale = scale || 1;
		// this ensures this to be rendered on top
		this._fx = true;
		
		this.speed = speed || .00005;
		let vX = Math.cos(angle) * this.speed,
 			vY = Math.sin(angle) * this.speed;
		this.force = new Point(vX, vY);
		
		this.position = owner.position.clone();
		this.position.x += Math.cos(angle) * 30;
		this.position.y += Math.sin(angle) * 30;

		let opt = { frictionAir: 0, friction: 0, inertia: Infinity, mass: 0 };
		this.body = Matter.Bodies.circle(this.position.x, this.position.y, 1.5, opt);
		this.body.label = `fire-${this.bullet}`;

		// add to map entries
		this.arena.map.addItem(this);

		this.update(16);
	}

	update(delta) {
		let force = this.force.setMagnitude(delta/48);
		Matter.Body.applyForce(this.body, this.body.position, force);

		// rotate (!?)
		this.angle += this.rotate;
		if (this.scale < 1) this.scale += .005;

		// copy physical position to "this" internal position
		this.position.x = this.body.position.x;
		this.position.y = this.body.position.y;

		// update tile position
		let tile = this.arena.config.tile;
		this.x = Math.round(this.position.x / tile);
		this.y = Math.round(this.position.y / tile);
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport,
			x = this.position.x + viewport.x,
			y = this.position.y + viewport.y;

		if (arena.debug.mode < 2) {
			ctx.save();
			ctx.translate(x, y);
			ctx.rotate(this.angle);
			ctx.scale(this.scale, this.scale);
			ctx.drawImage(this.asset, -this.asset.oX, -this.asset.oY);
			ctx.restore();
		}
	}
}


class Sonic extends Fire {
	constructor(cfg) {
		super(cfg);

		let { arena, owner, type, angle, speed } = cfg;

		this.type = "sonic";
		this.asset = arena.assets[this.type];
		this.width = 5;
		this.trail = [];

		this.speed = speed || .0000105;
		let vX = Math.cos(angle) * this.speed,
 			vY = Math.sin(angle) * this.speed;
		this.force = new Point(vX, vY);
	}

	update(delta) {
		super.update(delta);
		if (this.width < 60) this.width += 4;

		if (this.trail) {
			// prepend position to trail
			let w = this.width,
				oX = w >> 1,
				x = this.position.x,
				y = this.position.y;
			this.trail.unshift({ x, y, w, oX });
			// trim trail log
			this.trail.splice(9, 9);
		}
	}

	render(ctx) {
		let arena = this.arena,
			viewport = arena.viewport;

		if (this.trail.length) {
			this.trail
				.filter((r, i) => [0, 3, 5, 7, 9].includes(i))
				.map((ring, i) => {
					let x = ring.x + viewport.x,
						y = ring.y + viewport.y;
					ctx.save();
					ctx.globalAlpha = 1-(i/5);
					ctx.translate(x, y);
					ctx.rotate(this.angle);
					ctx.drawImage(this.owner.sprites.sonic, -ring.oX, -ring.oX, ring.w, ring.w);
					ctx.restore();
				});
		}
	}
}


let Matter = (() => {
	/*!
 * matter-js 0.20.0 by @liabru
 * http://brm.io/matter-js/
 * License MIT
 */
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("Matter",[],t):"object"==typeof exports?exports.Matter=t():e.Matter=t();}(window,(function(){return function(e){var t={};function n(o){if(t[o])return t[o].exports;var i=t[o]={i:o,l:!1,exports:{}};return e[o].call(i.exports,i,i.exports,n),i.l=!0,i.exports}return n.m=e,n.c=t,n.d=function(e,t,o){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o});},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0});},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(n.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)n.d(o,i,function(t){return e[t]}.bind(null,i));return o},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=20)}([function(e,t){var n={};e.exports=n,function(){n._baseDelta=1e3/60,n._nextId=0,n._seed=0,n._nowStartTime=+new Date,n._warnedOnce={},n._decomp=null,n.extend=function(e,t){var o,i;"boolean"==typeof t?(o=2,i=t):(o=1,i=!0);for(var r=o;r<arguments.length;r++){var a=arguments[r];if(a)for(var s in a)i&&a[s]&&a[s].constructor===Object?e[s]&&e[s].constructor!==Object?e[s]=a[s]:(e[s]=e[s]||{},n.extend(e[s],i,a[s])):e[s]=a[s];}return e},n.clone=function(e,t){return n.extend({},t,e)},n.keys=function(e){if(Object.keys)return Object.keys(e);var t=[];for(var n in e)t.push(n);return t},n.values=function(e){var t=[];if(Object.keys){for(var n=Object.keys(e),o=0;o<n.length;o++)t.push(e[n[o]]);return t}for(var i in e)t.push(e[i]);return t},n.get=function(e,t,n,o){t=t.split(".").slice(n,o);for(var i=0;i<t.length;i+=1)e=e[t[i]];return e},n.set=function(e,t,o,i,r){var a=t.split(".").slice(i,r);return n.get(e,t,0,-1)[a[a.length-1]]=o,o},n.shuffle=function(e){for(var t=e.length-1;t>0;t--){var o=Math.floor(n.random()*(t+1)),i=e[t];e[t]=e[o],e[o]=i;}return e},n.choose=function(e){return e[Math.floor(n.random()*e.length)]},n.isElement=function(e){return "undefined"!=typeof HTMLElement?e instanceof HTMLElement:!!(e&&e.nodeType&&e.nodeName)},n.isArray=function(e){return "[object Array]"===Object.prototype.toString.call(e)},n.isFunction=function(e){return "function"==typeof e},n.isPlainObject=function(e){return "object"==typeof e&&e.constructor===Object},n.isString=function(e){return "[object String]"===toString.call(e)},n.clamp=function(e,t,n){return e<t?t:e>n?n:e},n.sign=function(e){return e<0?-1:1},n.now=function(){if("undefined"!=typeof window&&window.performance){if(window.performance.now)return window.performance.now();if(window.performance.webkitNow)return window.performance.webkitNow()}return Date.now?Date.now():new Date-n._nowStartTime},n.random=function(t,n){return n=void 0!==n?n:1,(t=void 0!==t?t:0)+e()*(n-t)};var e=function(){return n._seed=(9301*n._seed+49297)%233280,n._seed/233280};n.colorToNumber=function(e){return 3==(e=e.replace("#","")).length&&(e=e.charAt(0)+e.charAt(0)+e.charAt(1)+e.charAt(1)+e.charAt(2)+e.charAt(2)),parseInt(e,16)},n.logLevel=1,n.log=function(){console&&n.logLevel>0&&n.logLevel<=3&&console.log.apply(console,["matter-js:"].concat(Array.prototype.slice.call(arguments)));},n.info=function(){console&&n.logLevel>0&&n.logLevel<=2&&console.info.apply(console,["matter-js:"].concat(Array.prototype.slice.call(arguments)));},n.warn=function(){console&&n.logLevel>0&&n.logLevel<=3&&console.warn.apply(console,["matter-js:"].concat(Array.prototype.slice.call(arguments)));},n.warnOnce=function(){var e=Array.prototype.slice.call(arguments).join(" ");n._warnedOnce[e]||(n.warn(e),n._warnedOnce[e]=!0);},n.deprecated=function(e,t,o){e[t]=n.chain((function(){n.warnOnce("🔅 deprecated 🔅",o);}),e[t]);},n.nextId=function(){return n._nextId++},n.indexOf=function(e,t){if(e.indexOf)return e.indexOf(t);for(var n=0;n<e.length;n++)if(e[n]===t)return n;return -1},n.map=function(e,t){if(e.map)return e.map(t);for(var n=[],o=0;o<e.length;o+=1)n.push(t(e[o]));return n},n.topologicalSort=function(e){var t=[],o=[],i=[];for(var r in e)o[r]||i[r]||n._topologicalSort(r,o,i,e,t);return t},n._topologicalSort=function(e,t,o,i,r){var a=i[e]||[];o[e]=!0;for(var s=0;s<a.length;s+=1){var l=a[s];o[l]||(t[l]||n._topologicalSort(l,t,o,i,r));}o[e]=!1,t[e]=!0,r.push(e);},n.chain=function(){for(var e=[],t=0;t<arguments.length;t+=1){var n=arguments[t];n._chained?e.push.apply(e,n._chained):e.push(n);}var o=function(){for(var t,n=new Array(arguments.length),o=0,i=arguments.length;o<i;o++)n[o]=arguments[o];for(o=0;o<e.length;o+=1){var r=e[o].apply(t,n);void 0!==r&&(t=r);}return t};return o._chained=e,o},n.chainPathBefore=function(e,t,o){return n.set(e,t,n.chain(o,n.get(e,t)))},n.chainPathAfter=function(e,t,o){return n.set(e,t,n.chain(n.get(e,t),o))},n.setDecomp=function(e){n._decomp=e;},n.getDecomp=function(){var e=n._decomp;try{e||"undefined"==typeof window||(e=window.decomp),e||"undefined"==typeof global||(e=global.decomp);}catch(t){e=null;}return e};}();},function(e,t){var n={};e.exports=n,n.create=function(e){var t={min:{x:0,y:0},max:{x:0,y:0}};return e&&n.update(t,e),t},n.update=function(e,t,n){e.min.x=1/0,e.max.x=-1/0,e.min.y=1/0,e.max.y=-1/0;for(var o=0;o<t.length;o++){var i=t[o];i.x>e.max.x&&(e.max.x=i.x),i.x<e.min.x&&(e.min.x=i.x),i.y>e.max.y&&(e.max.y=i.y),i.y<e.min.y&&(e.min.y=i.y);}n&&(n.x>0?e.max.x+=n.x:e.min.x+=n.x,n.y>0?e.max.y+=n.y:e.min.y+=n.y);},n.contains=function(e,t){return t.x>=e.min.x&&t.x<=e.max.x&&t.y>=e.min.y&&t.y<=e.max.y},n.overlaps=function(e,t){return e.min.x<=t.max.x&&e.max.x>=t.min.x&&e.max.y>=t.min.y&&e.min.y<=t.max.y},n.translate=function(e,t){e.min.x+=t.x,e.max.x+=t.x,e.min.y+=t.y,e.max.y+=t.y;},n.shift=function(e,t){var n=e.max.x-e.min.x,o=e.max.y-e.min.y;e.min.x=t.x,e.max.x=t.x+n,e.min.y=t.y,e.max.y=t.y+o;};},function(e,t){var n={};e.exports=n,n.create=function(e,t){return {x:e||0,y:t||0}},n.clone=function(e){return {x:e.x,y:e.y}},n.magnitude=function(e){return Math.sqrt(e.x*e.x+e.y*e.y)},n.magnitudeSquared=function(e){return e.x*e.x+e.y*e.y},n.rotate=function(e,t,n){var o=Math.cos(t),i=Math.sin(t);n||(n={});var r=e.x*o-e.y*i;return n.y=e.x*i+e.y*o,n.x=r,n},n.rotateAbout=function(e,t,n,o){var i=Math.cos(t),r=Math.sin(t);o||(o={});var a=n.x+((e.x-n.x)*i-(e.y-n.y)*r);return o.y=n.y+((e.x-n.x)*r+(e.y-n.y)*i),o.x=a,o},n.normalise=function(e){var t=n.magnitude(e);return 0===t?{x:0,y:0}:{x:e.x/t,y:e.y/t}},n.dot=function(e,t){return e.x*t.x+e.y*t.y},n.cross=function(e,t){return e.x*t.y-e.y*t.x},n.cross3=function(e,t,n){return (t.x-e.x)*(n.y-e.y)-(t.y-e.y)*(n.x-e.x)},n.add=function(e,t,n){return n||(n={}),n.x=e.x+t.x,n.y=e.y+t.y,n},n.sub=function(e,t,n){return n||(n={}),n.x=e.x-t.x,n.y=e.y-t.y,n},n.mult=function(e,t){return {x:e.x*t,y:e.y*t}},n.div=function(e,t){return {x:e.x/t,y:e.y/t}},n.perp=function(e,t){return {x:(t=!0===t?-1:1)*-e.y,y:t*e.x}},n.neg=function(e){return {x:-e.x,y:-e.y}},n.angle=function(e,t){return Math.atan2(t.y-e.y,t.x-e.x)},n._temp=[n.create(),n.create(),n.create(),n.create(),n.create(),n.create()];},function(e,t,n){var o={};e.exports=o;var i=n(2),r=n(0);o.create=function(e,t){for(var n=[],o=0;o<e.length;o++){var i=e[o],r={x:i.x,y:i.y,index:o,body:t,isInternal:!1};n.push(r);}return n},o.fromPath=function(e,t){var n=[];return e.replace(/L?\s*([-\d.e]+)[\s,]*([-\d.e]+)*/gi,(function(e,t,o){n.push({x:parseFloat(t),y:parseFloat(o)});})),o.create(n,t)},o.centre=function(e){for(var t,n,r,a=o.area(e,!0),s={x:0,y:0},l=0;l<e.length;l++)r=(l+1)%e.length,t=i.cross(e[l],e[r]),n=i.mult(i.add(e[l],e[r]),t),s=i.add(s,n);return i.div(s,6*a)},o.mean=function(e){for(var t={x:0,y:0},n=0;n<e.length;n++)t.x+=e[n].x,t.y+=e[n].y;return i.div(t,e.length)},o.area=function(e,t){for(var n=0,o=e.length-1,i=0;i<e.length;i++)n+=(e[o].x-e[i].x)*(e[o].y+e[i].y),o=i;return t?n/2:Math.abs(n)/2},o.inertia=function(e,t){for(var n,o,r=0,a=0,s=e,l=0;l<s.length;l++)o=(l+1)%s.length,r+=(n=Math.abs(i.cross(s[o],s[l])))*(i.dot(s[o],s[o])+i.dot(s[o],s[l])+i.dot(s[l],s[l])),a+=n;return t/6*(r/a)},o.translate=function(e,t,n){n=void 0!==n?n:1;var o,i=e.length,r=t.x*n,a=t.y*n;for(o=0;o<i;o++)e[o].x+=r,e[o].y+=a;return e},o.rotate=function(e,t,n){if(0!==t){var o,i,r,a,s=Math.cos(t),l=Math.sin(t),c=n.x,u=n.y,d=e.length;for(a=0;a<d;a++)i=(o=e[a]).x-c,r=o.y-u,o.x=c+(i*s-r*l),o.y=u+(i*l+r*s);return e}},o.contains=function(e,t){for(var n,o=t.x,i=t.y,r=e.length,a=e[r-1],s=0;s<r;s++){if(n=e[s],(o-a.x)*(n.y-a.y)+(i-a.y)*(a.x-n.x)>0)return !1;a=n;}return !0},o.scale=function(e,t,n,r){if(1===t&&1===n)return e;var a,s;r=r||o.centre(e);for(var l=0;l<e.length;l++)a=e[l],s=i.sub(a,r),e[l].x=r.x+s.x*t,e[l].y=r.y+s.y*n;return e},o.chamfer=function(e,t,n,o,a){t="number"==typeof t?[t]:t||[8],n=void 0!==n?n:-1,o=o||2,a=a||14;for(var s=[],l=0;l<e.length;l++){var c=e[l-1>=0?l-1:e.length-1],u=e[l],d=e[(l+1)%e.length],p=t[l<t.length?l:t.length-1];if(0!==p){var f=i.normalise({x:u.y-c.y,y:c.x-u.x}),v=i.normalise({x:d.y-u.y,y:u.x-d.x}),m=Math.sqrt(2*Math.pow(p,2)),y=i.mult(r.clone(f),p),g=i.normalise(i.mult(i.add(f,v),.5)),x=i.sub(u,i.mult(g,m)),h=n;-1===n&&(h=1.75*Math.pow(p,.32)),(h=r.clamp(h,o,a))%2==1&&(h+=1);for(var b=Math.acos(i.dot(f,v))/h,S=0;S<h;S++)s.push(i.add(i.rotate(y,b*S),x));}else s.push(u);}return s},o.clockwiseSort=function(e){var t=o.mean(e);return e.sort((function(e,n){return i.angle(t,e)-i.angle(t,n)})),e},o.isConvex=function(e){var t,n,o,i,r=0,a=e.length;if(a<3)return null;for(t=0;t<a;t++)if(o=(t+2)%a,i=(e[n=(t+1)%a].x-e[t].x)*(e[o].y-e[n].y),(i-=(e[n].y-e[t].y)*(e[o].x-e[n].x))<0?r|=1:i>0&&(r|=2),3===r)return !1;return 0!==r||null},o.hull=function(e){var t,n,o=[],r=[];for((e=e.slice(0)).sort((function(e,t){var n=e.x-t.x;return 0!==n?n:e.y-t.y})),n=0;n<e.length;n+=1){for(t=e[n];r.length>=2&&i.cross3(r[r.length-2],r[r.length-1],t)<=0;)r.pop();r.push(t);}for(n=e.length-1;n>=0;n-=1){for(t=e[n];o.length>=2&&i.cross3(o[o.length-2],o[o.length-1],t)<=0;)o.pop();o.push(t);}return o.pop(),r.pop(),o.concat(r)};},function(e,t,n){var o={};e.exports=o;var i=n(3),r=n(2),a=n(7),s=n(0),l=n(1),c=n(11);!function(){o._timeCorrection=!0,o._inertiaScale=4,o._nextCollidingGroupId=1,o._nextNonCollidingGroupId=-1,o._nextCategory=1,o._baseDelta=1e3/60,o.create=function(t){var n={id:s.nextId(),type:"body",label:"Body",parts:[],plugin:{},angle:0,vertices:i.fromPath("L 0 0 L 40 0 L 40 40 L 0 40"),position:{x:0,y:0},force:{x:0,y:0},torque:0,positionImpulse:{x:0,y:0},constraintImpulse:{x:0,y:0,angle:0},totalContacts:0,speed:0,angularSpeed:0,velocity:{x:0,y:0},angularVelocity:0,isSensor:!1,isStatic:!1,isSleeping:!1,motion:0,sleepThreshold:60,density:.001,restitution:0,friction:.1,frictionStatic:.5,frictionAir:.01,collisionFilter:{category:1,mask:4294967295,group:0},slop:.05,timeScale:1,render:{visible:!0,opacity:1,strokeStyle:null,fillStyle:null,lineWidth:null,sprite:{xScale:1,yScale:1,xOffset:0,yOffset:0}},events:null,bounds:null,chamfer:null,circleRadius:0,positionPrev:null,anglePrev:0,parent:null,axes:null,area:0,mass:0,inertia:0,deltaTime:1e3/60,_original:null},o=s.extend(n,t);return e(o,t),o},o.nextGroup=function(e){return e?o._nextNonCollidingGroupId--:o._nextCollidingGroupId++},o.nextCategory=function(){return o._nextCategory=o._nextCategory<<1,o._nextCategory};var e=function(e,t){t=t||{},o.set(e,{bounds:e.bounds||l.create(e.vertices),positionPrev:e.positionPrev||r.clone(e.position),anglePrev:e.anglePrev||e.angle,vertices:e.vertices,parts:e.parts||[e],isStatic:e.isStatic,isSleeping:e.isSleeping,parent:e.parent||e}),i.rotate(e.vertices,e.angle,e.position),c.rotate(e.axes,e.angle),l.update(e.bounds,e.vertices,e.velocity),o.set(e,{axes:t.axes||e.axes,area:t.area||e.area,mass:t.mass||e.mass,inertia:t.inertia||e.inertia});var n=e.isStatic?"#14151f":s.choose(["#f19648","#f5d259","#f55a3c","#063e7b","#ececd1"]),a=e.isStatic?"#555":"#ccc",u=e.isStatic&&null===e.render.fillStyle?1:0;e.render.fillStyle=e.render.fillStyle||n,e.render.strokeStyle=e.render.strokeStyle||a,e.render.lineWidth=e.render.lineWidth||u,e.render.sprite.xOffset+=-(e.bounds.min.x-e.position.x)/(e.bounds.max.x-e.bounds.min.x),e.render.sprite.yOffset+=-(e.bounds.min.y-e.position.y)/(e.bounds.max.y-e.bounds.min.y);};o.set=function(e,t,n){var i;for(i in "string"==typeof t&&(i=t,(t={})[i]=n),t)if(Object.prototype.hasOwnProperty.call(t,i))switch(n=t[i],i){case"isStatic":o.setStatic(e,n);break;case"isSleeping":a.set(e,n);break;case"mass":o.setMass(e,n);break;case"density":o.setDensity(e,n);break;case"inertia":o.setInertia(e,n);break;case"vertices":o.setVertices(e,n);break;case"position":o.setPosition(e,n);break;case"angle":o.setAngle(e,n);break;case"velocity":o.setVelocity(e,n);break;case"angularVelocity":o.setAngularVelocity(e,n);break;case"speed":o.setSpeed(e,n);break;case"angularSpeed":o.setAngularSpeed(e,n);break;case"parts":o.setParts(e,n);break;case"centre":o.setCentre(e,n);break;default:e[i]=n;}},o.setStatic=function(e,t){for(var n=0;n<e.parts.length;n++){var o=e.parts[n];t?(o.isStatic||(o._original={restitution:o.restitution,friction:o.friction,mass:o.mass,inertia:o.inertia,density:o.density,inverseMass:o.inverseMass,inverseInertia:o.inverseInertia}),o.restitution=0,o.friction=1,o.mass=o.inertia=o.density=1/0,o.inverseMass=o.inverseInertia=0,o.positionPrev.x=o.position.x,o.positionPrev.y=o.position.y,o.anglePrev=o.angle,o.angularVelocity=0,o.speed=0,o.angularSpeed=0,o.motion=0):o._original&&(o.restitution=o._original.restitution,o.friction=o._original.friction,o.mass=o._original.mass,o.inertia=o._original.inertia,o.density=o._original.density,o.inverseMass=o._original.inverseMass,o.inverseInertia=o._original.inverseInertia,o._original=null),o.isStatic=t;}},o.setMass=function(e,t){var n=e.inertia/(e.mass/6);e.inertia=n*(t/6),e.inverseInertia=1/e.inertia,e.mass=t,e.inverseMass=1/e.mass,e.density=e.mass/e.area;},o.setDensity=function(e,t){o.setMass(e,t*e.area),e.density=t;},o.setInertia=function(e,t){e.inertia=t,e.inverseInertia=1/e.inertia;},o.setVertices=function(e,t){t[0].body===e?e.vertices=t:e.vertices=i.create(t,e),e.axes=c.fromVertices(e.vertices),e.area=i.area(e.vertices),o.setMass(e,e.density*e.area);var n=i.centre(e.vertices);i.translate(e.vertices,n,-1),o.setInertia(e,o._inertiaScale*i.inertia(e.vertices,e.mass)),i.translate(e.vertices,e.position),l.update(e.bounds,e.vertices,e.velocity);},o.setParts=function(e,t,n){var r;for(t=t.slice(0),e.parts.length=0,e.parts.push(e),e.parent=e,r=0;r<t.length;r++){var a=t[r];a!==e&&(a.parent=e,e.parts.push(a));}if(1!==e.parts.length){if(n=void 0===n||n){var s=[];for(r=0;r<t.length;r++)s=s.concat(t[r].vertices);i.clockwiseSort(s);var l=i.hull(s),c=i.centre(l);o.setVertices(e,l),i.translate(e.vertices,c);}var u=o._totalProperties(e);e.area=u.area,e.parent=e,e.position.x=u.centre.x,e.position.y=u.centre.y,e.positionPrev.x=u.centre.x,e.positionPrev.y=u.centre.y,o.setMass(e,u.mass),o.setInertia(e,u.inertia),o.setPosition(e,u.centre);}},o.setCentre=function(e,t,n){n?(e.positionPrev.x+=t.x,e.positionPrev.y+=t.y,e.position.x+=t.x,e.position.y+=t.y):(e.positionPrev.x=t.x-(e.position.x-e.positionPrev.x),e.positionPrev.y=t.y-(e.position.y-e.positionPrev.y),e.position.x=t.x,e.position.y=t.y);},o.setPosition=function(e,t,n){var o=r.sub(t,e.position);n?(e.positionPrev.x=e.position.x,e.positionPrev.y=e.position.y,e.velocity.x=o.x,e.velocity.y=o.y,e.speed=r.magnitude(o)):(e.positionPrev.x+=o.x,e.positionPrev.y+=o.y);for(var a=0;a<e.parts.length;a++){var s=e.parts[a];s.position.x+=o.x,s.position.y+=o.y,i.translate(s.vertices,o),l.update(s.bounds,s.vertices,e.velocity);}},o.setAngle=function(e,t,n){var o=t-e.angle;n?(e.anglePrev=e.angle,e.angularVelocity=o,e.angularSpeed=Math.abs(o)):e.anglePrev+=o;for(var a=0;a<e.parts.length;a++){var s=e.parts[a];s.angle+=o,i.rotate(s.vertices,o,e.position),c.rotate(s.axes,o),l.update(s.bounds,s.vertices,e.velocity),a>0&&r.rotateAbout(s.position,o,e.position,s.position);}},o.setVelocity=function(e,t){var n=e.deltaTime/o._baseDelta;e.positionPrev.x=e.position.x-t.x*n,e.positionPrev.y=e.position.y-t.y*n,e.velocity.x=(e.position.x-e.positionPrev.x)/n,e.velocity.y=(e.position.y-e.positionPrev.y)/n,e.speed=r.magnitude(e.velocity);},o.getVelocity=function(e){var t=o._baseDelta/e.deltaTime;return {x:(e.position.x-e.positionPrev.x)*t,y:(e.position.y-e.positionPrev.y)*t}},o.getSpeed=function(e){return r.magnitude(o.getVelocity(e))},o.setSpeed=function(e,t){o.setVelocity(e,r.mult(r.normalise(o.getVelocity(e)),t));},o.setAngularVelocity=function(e,t){var n=e.deltaTime/o._baseDelta;e.anglePrev=e.angle-t*n,e.angularVelocity=(e.angle-e.anglePrev)/n,e.angularSpeed=Math.abs(e.angularVelocity);},o.getAngularVelocity=function(e){return (e.angle-e.anglePrev)*o._baseDelta/e.deltaTime},o.getAngularSpeed=function(e){return Math.abs(o.getAngularVelocity(e))},o.setAngularSpeed=function(e,t){o.setAngularVelocity(e,s.sign(o.getAngularVelocity(e))*t);},o.translate=function(e,t,n){o.setPosition(e,r.add(e.position,t),n);},o.rotate=function(e,t,n,i){if(n){var r=Math.cos(t),a=Math.sin(t),s=e.position.x-n.x,l=e.position.y-n.y;o.setPosition(e,{x:n.x+(s*r-l*a),y:n.y+(s*a+l*r)},i),o.setAngle(e,e.angle+t,i);}else o.setAngle(e,e.angle+t,i);},o.scale=function(e,t,n,r){var a=0,s=0;r=r||e.position;for(var u=0;u<e.parts.length;u++){var d=e.parts[u];i.scale(d.vertices,t,n,r),d.axes=c.fromVertices(d.vertices),d.area=i.area(d.vertices),o.setMass(d,e.density*d.area),i.translate(d.vertices,{x:-d.position.x,y:-d.position.y}),o.setInertia(d,o._inertiaScale*i.inertia(d.vertices,d.mass)),i.translate(d.vertices,{x:d.position.x,y:d.position.y}),u>0&&(a+=d.area,s+=d.inertia),d.position.x=r.x+(d.position.x-r.x)*t,d.position.y=r.y+(d.position.y-r.y)*n,l.update(d.bounds,d.vertices,e.velocity);}e.parts.length>1&&(e.area=a,e.isStatic||(o.setMass(e,e.density*a),o.setInertia(e,s))),e.circleRadius&&(t===n?e.circleRadius*=t:e.circleRadius=null);},o.update=function(e,t){var n=(t=(void 0!==t?t:1e3/60)*e.timeScale)*t,a=o._timeCorrection?t/(e.deltaTime||t):1,u=1-e.frictionAir*(t/s._baseDelta),d=(e.position.x-e.positionPrev.x)*a,p=(e.position.y-e.positionPrev.y)*a;e.velocity.x=d*u+e.force.x/e.mass*n,e.velocity.y=p*u+e.force.y/e.mass*n,e.positionPrev.x=e.position.x,e.positionPrev.y=e.position.y,e.position.x+=e.velocity.x,e.position.y+=e.velocity.y,e.deltaTime=t,e.angularVelocity=(e.angle-e.anglePrev)*u*a+e.torque/e.inertia*n,e.anglePrev=e.angle,e.angle+=e.angularVelocity;for(var f=0;f<e.parts.length;f++){var v=e.parts[f];i.translate(v.vertices,e.velocity),f>0&&(v.position.x+=e.velocity.x,v.position.y+=e.velocity.y),0!==e.angularVelocity&&(i.rotate(v.vertices,e.angularVelocity,e.position),c.rotate(v.axes,e.angularVelocity),f>0&&r.rotateAbout(v.position,e.angularVelocity,e.position,v.position)),l.update(v.bounds,v.vertices,e.velocity);}},o.updateVelocities=function(e){var t=o._baseDelta/e.deltaTime,n=e.velocity;n.x=(e.position.x-e.positionPrev.x)*t,n.y=(e.position.y-e.positionPrev.y)*t,e.speed=Math.sqrt(n.x*n.x+n.y*n.y),e.angularVelocity=(e.angle-e.anglePrev)*t,e.angularSpeed=Math.abs(e.angularVelocity);},o.applyForce=function(e,t,n){var o=t.x-e.position.x,i=t.y-e.position.y;e.force.x+=n.x,e.force.y+=n.y,e.torque+=o*n.y-i*n.x;},o._totalProperties=function(e){for(var t={mass:0,area:0,inertia:0,centre:{x:0,y:0}},n=1===e.parts.length?0:1;n<e.parts.length;n++){var o=e.parts[n],i=o.mass!==1/0?o.mass:1;t.mass+=i,t.area+=o.area,t.inertia+=o.inertia,t.centre=r.add(t.centre,r.mult(o.position,i));}return t.centre=r.div(t.centre,t.mass),t};}();},function(e,t,n){var o={};e.exports=o;var i=n(0);o.on=function(e,t,n){for(var o,i=t.split(" "),r=0;r<i.length;r++)o=i[r],e.events=e.events||{},e.events[o]=e.events[o]||[],e.events[o].push(n);return n},o.off=function(e,t,n){if(t){"function"==typeof t&&(n=t,t=i.keys(e.events).join(" "));for(var o=t.split(" "),r=0;r<o.length;r++){var a=e.events[o[r]],s=[];if(n&&a)for(var l=0;l<a.length;l++)a[l]!==n&&s.push(a[l]);e.events[o[r]]=s;}}else e.events={};},o.trigger=function(e,t,n){var o,r,a,s,l=e.events;if(l&&i.keys(l).length>0){n||(n={}),o=t.split(" ");for(var c=0;c<o.length;c++)if(a=l[r=o[c]]){(s=i.clone(n,!1)).name=r,s.source=e;for(var u=0;u<a.length;u++)a[u].apply(e,[s]);}}};},function(e,t,n){var o={};e.exports=o;var i=n(5),r=n(0),a=n(1),s=n(4);o.create=function(e){return r.extend({id:r.nextId(),type:"composite",parent:null,isModified:!1,bodies:[],constraints:[],composites:[],label:"Composite",plugin:{},cache:{allBodies:null,allConstraints:null,allComposites:null}},e)},o.setModified=function(e,t,n,i){if(e.isModified=t,t&&e.cache&&(e.cache.allBodies=null,e.cache.allConstraints=null,e.cache.allComposites=null),n&&e.parent&&o.setModified(e.parent,t,n,i),i)for(var r=0;r<e.composites.length;r++){var a=e.composites[r];o.setModified(a,t,n,i);}},o.add=function(e,t){var n=[].concat(t);i.trigger(e,"beforeAdd",{object:t});for(var a=0;a<n.length;a++){var s=n[a];switch(s.type){case"body":if(s.parent!==s){r.warn("Composite.add: skipped adding a compound body part (you must add its parent instead)");break}o.addBody(e,s);break;case"constraint":o.addConstraint(e,s);break;case"composite":o.addComposite(e,s);break;case"mouseConstraint":o.addConstraint(e,s.constraint);}}return i.trigger(e,"afterAdd",{object:t}),e},o.remove=function(e,t,n){var r=[].concat(t);i.trigger(e,"beforeRemove",{object:t});for(var a=0;a<r.length;a++){var s=r[a];switch(s.type){case"body":o.removeBody(e,s,n);break;case"constraint":o.removeConstraint(e,s,n);break;case"composite":o.removeComposite(e,s,n);break;case"mouseConstraint":o.removeConstraint(e,s.constraint);}}return i.trigger(e,"afterRemove",{object:t}),e},o.addComposite=function(e,t){return e.composites.push(t),t.parent=e,o.setModified(e,!0,!0,!1),e},o.removeComposite=function(e,t,n){var i=r.indexOf(e.composites,t);if(-1!==i){var a=o.allBodies(t);o.removeCompositeAt(e,i);for(var s=0;s<a.length;s++)a[s].sleepCounter=0;}if(n)for(s=0;s<e.composites.length;s++)o.removeComposite(e.composites[s],t,!0);return e},o.removeCompositeAt=function(e,t){return e.composites.splice(t,1),o.setModified(e,!0,!0,!1),e},o.addBody=function(e,t){return e.bodies.push(t),o.setModified(e,!0,!0,!1),e},o.removeBody=function(e,t,n){var i=r.indexOf(e.bodies,t);if(-1!==i&&(o.removeBodyAt(e,i),t.sleepCounter=0),n)for(var a=0;a<e.composites.length;a++)o.removeBody(e.composites[a],t,!0);return e},o.removeBodyAt=function(e,t){return e.bodies.splice(t,1),o.setModified(e,!0,!0,!1),e},o.addConstraint=function(e,t){return e.constraints.push(t),o.setModified(e,!0,!0,!1),e},o.removeConstraint=function(e,t,n){var i=r.indexOf(e.constraints,t);if(-1!==i&&o.removeConstraintAt(e,i),n)for(var a=0;a<e.composites.length;a++)o.removeConstraint(e.composites[a],t,!0);return e},o.removeConstraintAt=function(e,t){return e.constraints.splice(t,1),o.setModified(e,!0,!0,!1),e},o.clear=function(e,t,n){if(n)for(var i=0;i<e.composites.length;i++)o.clear(e.composites[i],t,!0);return t?e.bodies=e.bodies.filter((function(e){return e.isStatic})):e.bodies.length=0,e.constraints.length=0,e.composites.length=0,o.setModified(e,!0,!0,!1),e},o.allBodies=function(e){if(e.cache&&e.cache.allBodies)return e.cache.allBodies;for(var t=[].concat(e.bodies),n=0;n<e.composites.length;n++)t=t.concat(o.allBodies(e.composites[n]));return e.cache&&(e.cache.allBodies=t),t},o.allConstraints=function(e){if(e.cache&&e.cache.allConstraints)return e.cache.allConstraints;for(var t=[].concat(e.constraints),n=0;n<e.composites.length;n++)t=t.concat(o.allConstraints(e.composites[n]));return e.cache&&(e.cache.allConstraints=t),t},o.allComposites=function(e){if(e.cache&&e.cache.allComposites)return e.cache.allComposites;for(var t=[].concat(e.composites),n=0;n<e.composites.length;n++)t=t.concat(o.allComposites(e.composites[n]));return e.cache&&(e.cache.allComposites=t),t},o.get=function(e,t,n){var i,r;switch(n){case"body":i=o.allBodies(e);break;case"constraint":i=o.allConstraints(e);break;case"composite":i=o.allComposites(e).concat(e);}return i?0===(r=i.filter((function(e){return e.id.toString()===t.toString()}))).length?null:r[0]:null},o.move=function(e,t,n){return o.remove(e,t),o.add(n,t),e},o.rebase=function(e){for(var t=o.allBodies(e).concat(o.allConstraints(e)).concat(o.allComposites(e)),n=0;n<t.length;n++)t[n].id=r.nextId();return e},o.translate=function(e,t,n){for(var i=n?o.allBodies(e):e.bodies,r=0;r<i.length;r++)s.translate(i[r],t);return e},o.rotate=function(e,t,n,i){for(var r=Math.cos(t),a=Math.sin(t),l=i?o.allBodies(e):e.bodies,c=0;c<l.length;c++){var u=l[c],d=u.position.x-n.x,p=u.position.y-n.y;s.setPosition(u,{x:n.x+(d*r-p*a),y:n.y+(d*a+p*r)}),s.rotate(u,t);}return e},o.scale=function(e,t,n,i,r){for(var a=r?o.allBodies(e):e.bodies,l=0;l<a.length;l++){var c=a[l],u=c.position.x-i.x,d=c.position.y-i.y;s.setPosition(c,{x:i.x+u*t,y:i.y+d*n}),s.scale(c,t,n);}return e},o.bounds=function(e){for(var t=o.allBodies(e),n=[],i=0;i<t.length;i+=1){var r=t[i];n.push(r.bounds.min,r.bounds.max);}return a.create(n)};},function(e,t,n){var o={};e.exports=o;var i=n(4),r=n(5),a=n(0);o._motionWakeThreshold=.18,o._motionSleepThreshold=.08,o._minBias=.9,o.update=function(e,t){for(var n=t/a._baseDelta,r=o._motionSleepThreshold,s=0;s<e.length;s++){var l=e[s],c=i.getSpeed(l),u=i.getAngularSpeed(l),d=c*c+u*u;if(0===l.force.x&&0===l.force.y){var p=Math.min(l.motion,d),f=Math.max(l.motion,d);l.motion=o._minBias*p+(1-o._minBias)*f,l.sleepThreshold>0&&l.motion<r?(l.sleepCounter+=1,l.sleepCounter>=l.sleepThreshold/n&&o.set(l,!0)):l.sleepCounter>0&&(l.sleepCounter-=1);}else o.set(l,!1);}},o.afterCollisions=function(e){for(var t=o._motionSleepThreshold,n=0;n<e.length;n++){var i=e[n];if(i.isActive){var r=i.collision,a=r.bodyA.parent,s=r.bodyB.parent;if(!(a.isSleeping&&s.isSleeping||a.isStatic||s.isStatic)&&(a.isSleeping||s.isSleeping)){var l=a.isSleeping&&!a.isStatic?a:s,c=l===a?s:a;!l.isStatic&&c.motion>t&&o.set(l,!1);}}}},o.set=function(e,t){var n=e.isSleeping;t?(e.isSleeping=!0,e.sleepCounter=e.sleepThreshold,e.positionImpulse.x=0,e.positionImpulse.y=0,e.positionPrev.x=e.position.x,e.positionPrev.y=e.position.y,e.anglePrev=e.angle,e.speed=0,e.angularSpeed=0,e.motion=0,n||r.trigger(e,"sleepStart")):(e.isSleeping=!1,e.sleepCounter=0,n&&r.trigger(e,"sleepEnd"));};},function(e,t,n){var o={};e.exports=o;var i,r,a,s=n(3),l=n(9);i=[],r={overlap:0,axis:null},a={overlap:0,axis:null},o.create=function(e,t){return {pair:null,collided:!1,bodyA:e,bodyB:t,parentA:e.parent,parentB:t.parent,depth:0,normal:{x:0,y:0},tangent:{x:0,y:0},penetration:{x:0,y:0},supports:[null,null],supportCount:0}},o.collides=function(e,t,n){if(o._overlapAxes(r,e.vertices,t.vertices,e.axes),r.overlap<=0)return null;if(o._overlapAxes(a,t.vertices,e.vertices,t.axes),a.overlap<=0)return null;var i,c,u=n&&n.table[l.id(e,t)];u?i=u.collision:((i=o.create(e,t)).collided=!0,i.bodyA=e.id<t.id?e:t,i.bodyB=e.id<t.id?t:e,i.parentA=i.bodyA.parent,i.parentB=i.bodyB.parent),e=i.bodyA,t=i.bodyB,c=r.overlap<a.overlap?r:a;var d=i.normal,p=i.tangent,f=i.penetration,v=i.supports,m=c.overlap,y=c.axis,g=y.x,x=y.y;g*(t.position.x-e.position.x)+x*(t.position.y-e.position.y)>=0&&(g=-g,x=-x),d.x=g,d.y=x,p.x=-x,p.y=g,f.x=g*m,f.y=x*m,i.depth=m;var h=o._findSupports(e,t,d,1),b=0;if(s.contains(e.vertices,h[0])&&(v[b++]=h[0]),s.contains(e.vertices,h[1])&&(v[b++]=h[1]),b<2){var S=o._findSupports(t,e,d,-1);s.contains(t.vertices,S[0])&&(v[b++]=S[0]),b<2&&s.contains(t.vertices,S[1])&&(v[b++]=S[1]);}return 0===b&&(v[b++]=h[0]),i.supportCount=b,i},o._overlapAxes=function(e,t,n,o){var i,r,a,s,l,c,u=t.length,d=n.length,p=t[0].x,f=t[0].y,v=n[0].x,m=n[0].y,y=o.length,g=Number.MAX_VALUE,x=0;for(l=0;l<y;l++){var h=o[l],b=h.x,S=h.y,w=p*b+f*S,A=v*b+m*S,P=w,B=A;for(c=1;c<u;c+=1)(s=t[c].x*b+t[c].y*S)>P?P=s:s<w&&(w=s);for(c=1;c<d;c+=1)(s=n[c].x*b+n[c].y*S)>B?B=s:s<A&&(A=s);if((i=(r=P-A)<(a=B-w)?r:a)<g&&(g=i,x=l,i<=0))break}e.axis=o[x],e.overlap=g;},o._findSupports=function(e,t,n,o){var r,a,s,l=t.vertices,c=l.length,u=e.position.x,d=e.position.y,p=n.x*o,f=n.y*o,v=l[0],m=v,y=p*(u-m.x)+f*(d-m.y);for(s=1;s<c;s+=1)(a=p*(u-(m=l[s]).x)+f*(d-m.y))<y&&(y=a,v=m);return y=p*(u-(r=l[(c+v.index-1)%c]).x)+f*(d-r.y),p*(u-(m=l[(v.index+1)%c]).x)+f*(d-m.y)<y?(i[0]=v,i[1]=m,i):(i[0]=v,i[1]=r,i)};},function(e,t,n){var o={};e.exports=o;var i=n(16);o.create=function(e,t){var n=e.bodyA,r=e.bodyB,a={id:o.id(n,r),bodyA:n,bodyB:r,collision:e,contacts:[i.create(),i.create()],contactCount:0,separation:0,isActive:!0,isSensor:n.isSensor||r.isSensor,timeCreated:t,timeUpdated:t,inverseMass:0,friction:0,frictionStatic:0,restitution:0,slop:0};return o.update(a,e,t),a},o.update=function(e,t,n){var o=t.supports,i=t.supportCount,r=e.contacts,a=t.parentA,s=t.parentB;e.isActive=!0,e.timeUpdated=n,e.collision=t,e.separation=t.depth,e.inverseMass=a.inverseMass+s.inverseMass,e.friction=a.friction<s.friction?a.friction:s.friction,e.frictionStatic=a.frictionStatic>s.frictionStatic?a.frictionStatic:s.frictionStatic,e.restitution=a.restitution>s.restitution?a.restitution:s.restitution,e.slop=a.slop>s.slop?a.slop:s.slop,e.contactCount=i,t.pair=e;var l=o[0],c=r[0],u=o[1],d=r[1];d.vertex!==l&&c.vertex!==u||(r[1]=c,r[0]=c=d,d=r[1]),c.vertex=l,d.vertex=u;},o.setActive=function(e,t,n){t?(e.isActive=!0,e.timeUpdated=n):(e.isActive=!1,e.contactCount=0);},o.id=function(e,t){return e.id<t.id?e.id.toString(36)+":"+t.id.toString(36):t.id.toString(36)+":"+e.id.toString(36)};},function(e,t,n){var o={};e.exports=o;var i=n(3),r=n(2),a=n(7),s=n(1),l=n(11),c=n(0);o._warming=.4,o._torqueDampen=1,o._minLength=1e-6,o.create=function(e){var t=e;t.bodyA&&!t.pointA&&(t.pointA={x:0,y:0}),t.bodyB&&!t.pointB&&(t.pointB={x:0,y:0});var n=t.bodyA?r.add(t.bodyA.position,t.pointA):t.pointA,o=t.bodyB?r.add(t.bodyB.position,t.pointB):t.pointB,i=r.magnitude(r.sub(n,o));t.length=void 0!==t.length?t.length:i,t.id=t.id||c.nextId(),t.label=t.label||"Constraint",t.type="constraint",t.stiffness=t.stiffness||(t.length>0?1:.7),t.damping=t.damping||0,t.angularStiffness=t.angularStiffness||0,t.angleA=t.bodyA?t.bodyA.angle:t.angleA,t.angleB=t.bodyB?t.bodyB.angle:t.angleB,t.plugin={};var a={visible:!0,lineWidth:2,strokeStyle:"#ffffff",type:"line",anchors:!0};return 0===t.length&&t.stiffness>.1?(a.type="pin",a.anchors=!1):t.stiffness<.9&&(a.type="spring"),t.render=c.extend(a,t.render),t},o.preSolveAll=function(e){for(var t=0;t<e.length;t+=1){var n=e[t],o=n.constraintImpulse;n.isStatic||0===o.x&&0===o.y&&0===o.angle||(n.position.x+=o.x,n.position.y+=o.y,n.angle+=o.angle);}},o.solveAll=function(e,t){for(var n=c.clamp(t/c._baseDelta,0,1),i=0;i<e.length;i+=1){var r=e[i],a=!r.bodyA||r.bodyA&&r.bodyA.isStatic,s=!r.bodyB||r.bodyB&&r.bodyB.isStatic;(a||s)&&o.solve(e[i],n);}for(i=0;i<e.length;i+=1)a=!(r=e[i]).bodyA||r.bodyA&&r.bodyA.isStatic,s=!r.bodyB||r.bodyB&&r.bodyB.isStatic,a||s||o.solve(e[i],n);},o.solve=function(e,t){var n=e.bodyA,i=e.bodyB,a=e.pointA,s=e.pointB;if(n||i){n&&!n.isStatic&&(r.rotate(a,n.angle-e.angleA,a),e.angleA=n.angle),i&&!i.isStatic&&(r.rotate(s,i.angle-e.angleB,s),e.angleB=i.angle);var l=a,c=s;if(n&&(l=r.add(n.position,a)),i&&(c=r.add(i.position,s)),l&&c){var u=r.sub(l,c),d=r.magnitude(u);d<o._minLength&&(d=o._minLength);var p,f,v,m,y,g=(d-e.length)/d,x=e.stiffness>=1||0===e.length?e.stiffness*t:e.stiffness*t*t,h=e.damping*t,b=r.mult(u,g*x),S=(n?n.inverseMass:0)+(i?i.inverseMass:0),w=S+((n?n.inverseInertia:0)+(i?i.inverseInertia:0));if(h>0){var A=r.create();v=r.div(u,d),y=r.sub(i&&r.sub(i.position,i.positionPrev)||A,n&&r.sub(n.position,n.positionPrev)||A),m=r.dot(v,y);}n&&!n.isStatic&&(f=n.inverseMass/S,n.constraintImpulse.x-=b.x*f,n.constraintImpulse.y-=b.y*f,n.position.x-=b.x*f,n.position.y-=b.y*f,h>0&&(n.positionPrev.x-=h*v.x*m*f,n.positionPrev.y-=h*v.y*m*f),p=r.cross(a,b)/w*o._torqueDampen*n.inverseInertia*(1-e.angularStiffness),n.constraintImpulse.angle-=p,n.angle-=p),i&&!i.isStatic&&(f=i.inverseMass/S,i.constraintImpulse.x+=b.x*f,i.constraintImpulse.y+=b.y*f,i.position.x+=b.x*f,i.position.y+=b.y*f,h>0&&(i.positionPrev.x+=h*v.x*m*f,i.positionPrev.y+=h*v.y*m*f),p=r.cross(s,b)/w*o._torqueDampen*i.inverseInertia*(1-e.angularStiffness),i.constraintImpulse.angle+=p,i.angle+=p);}}},o.postSolveAll=function(e){for(var t=0;t<e.length;t++){var n=e[t],c=n.constraintImpulse;if(!(n.isStatic||0===c.x&&0===c.y&&0===c.angle)){a.set(n,!1);for(var u=0;u<n.parts.length;u++){var d=n.parts[u];i.translate(d.vertices,c),u>0&&(d.position.x+=c.x,d.position.y+=c.y),0!==c.angle&&(i.rotate(d.vertices,c.angle,n.position),l.rotate(d.axes,c.angle),u>0&&r.rotateAbout(d.position,c.angle,n.position,d.position)),s.update(d.bounds,d.vertices,n.velocity);}c.angle*=o._warming,c.x*=o._warming,c.y*=o._warming;}}},o.pointAWorld=function(e){return {x:(e.bodyA?e.bodyA.position.x:0)+(e.pointA?e.pointA.x:0),y:(e.bodyA?e.bodyA.position.y:0)+(e.pointA?e.pointA.y:0)}},o.pointBWorld=function(e){return {x:(e.bodyB?e.bodyB.position.x:0)+(e.pointB?e.pointB.x:0),y:(e.bodyB?e.bodyB.position.y:0)+(e.pointB?e.pointB.y:0)}},o.currentLength=function(e){var t=(e.bodyA?e.bodyA.position.x:0)+(e.pointA?e.pointA.x:0),n=(e.bodyA?e.bodyA.position.y:0)+(e.pointA?e.pointA.y:0),o=t-((e.bodyB?e.bodyB.position.x:0)+(e.pointB?e.pointB.x:0)),i=n-((e.bodyB?e.bodyB.position.y:0)+(e.pointB?e.pointB.y:0));return Math.sqrt(o*o+i*i)};},function(e,t,n){var o={};e.exports=o;var i=n(2),r=n(0);o.fromVertices=function(e){for(var t={},n=0;n<e.length;n++){var o=(n+1)%e.length,a=i.normalise({x:e[o].y-e[n].y,y:e[n].x-e[o].x}),s=0===a.y?1/0:a.x/a.y;t[s=s.toFixed(3).toString()]=a;}return r.values(t)},o.rotate=function(e,t){if(0!==t)for(var n=Math.cos(t),o=Math.sin(t),i=0;i<e.length;i++){var r,a=e[i];r=a.x*n-a.y*o,a.y=a.x*o+a.y*n,a.x=r;}};},function(e,t,n){var o={};e.exports=o;var i=n(3),r=n(0),a=n(4),s=n(1),l=n(2);o.rectangle=function(e,t,n,o,s){s=s||{};var l={label:"Rectangle Body",position:{x:e,y:t},vertices:i.fromPath("L 0 0 L "+n+" 0 L "+n+" "+o+" L 0 "+o)};if(s.chamfer){var c=s.chamfer;l.vertices=i.chamfer(l.vertices,c.radius,c.quality,c.qualityMin,c.qualityMax),delete s.chamfer;}return a.create(r.extend({},l,s))},o.trapezoid=function(e,t,n,o,s,l){l=l||{},s>=1&&r.warn("Bodies.trapezoid: slope parameter must be < 1.");var c,u=n*(s*=.5),d=u+(1-2*s)*n,p=d+u;c=s<.5?"L 0 0 L "+u+" "+-o+" L "+d+" "+-o+" L "+p+" 0":"L 0 0 L "+d+" "+-o+" L "+p+" 0";var f={label:"Trapezoid Body",position:{x:e,y:t},vertices:i.fromPath(c)};if(l.chamfer){var v=l.chamfer;f.vertices=i.chamfer(f.vertices,v.radius,v.quality,v.qualityMin,v.qualityMax),delete l.chamfer;}return a.create(r.extend({},f,l))},o.circle=function(e,t,n,i,a){i=i||{};var s={label:"Circle Body",circleRadius:n};a=a||25;var l=Math.ceil(Math.max(10,Math.min(a,n)));return l%2==1&&(l+=1),o.polygon(e,t,l,n,r.extend({},s,i))},o.polygon=function(e,t,n,s,l){if(l=l||{},n<3)return o.circle(e,t,s,l);for(var c=2*Math.PI/n,u="",d=.5*c,p=0;p<n;p+=1){var f=d+p*c,v=Math.cos(f)*s,m=Math.sin(f)*s;u+="L "+v.toFixed(3)+" "+m.toFixed(3)+" ";}var y={label:"Polygon Body",position:{x:e,y:t},vertices:i.fromPath(u)};if(l.chamfer){var g=l.chamfer;y.vertices=i.chamfer(y.vertices,g.radius,g.quality,g.qualityMin,g.qualityMax),delete l.chamfer;}return a.create(r.extend({},y,l))},o.fromVertices=function(e,t,n,o,c,u,d,p){var f,v,m,y,g,x,h,b,S,w,A=r.getDecomp();for(f=Boolean(A&&A.quickDecomp),o=o||{},m=[],c=void 0!==c&&c,u=void 0!==u?u:.01,d=void 0!==d?d:10,p=void 0!==p?p:.01,r.isArray(n[0])||(n=[n]),S=0;S<n.length;S+=1)if(g=n[S],!(y=i.isConvex(g))&&!f&&r.warnOnce("Bodies.fromVertices: Install the 'poly-decomp' library and use Common.setDecomp or provide 'decomp' as a global to decompose concave vertices."),y||!f)g=y?i.clockwiseSort(g):i.hull(g),m.push({position:{x:e,y:t},vertices:g});else {var P=g.map((function(e){return [e.x,e.y]}));A.makeCCW(P),!1!==u&&A.removeCollinearPoints(P,u),!1!==p&&A.removeDuplicatePoints&&A.removeDuplicatePoints(P,p);var B=A.quickDecomp(P);for(x=0;x<B.length;x++){var M=B[x].map((function(e){return {x:e[0],y:e[1]}}));d>0&&i.area(M)<d||m.push({position:i.centre(M),vertices:M});}}for(x=0;x<m.length;x++)m[x]=a.create(r.extend(m[x],o));if(c)for(x=0;x<m.length;x++){var _=m[x];for(h=x+1;h<m.length;h++){var C=m[h];if(s.overlaps(_.bounds,C.bounds)){var k=_.vertices,I=C.vertices;for(b=0;b<_.vertices.length;b++)for(w=0;w<C.vertices.length;w++){var T=l.magnitudeSquared(l.sub(k[(b+1)%k.length],I[w])),R=l.magnitudeSquared(l.sub(k[b],I[(w+1)%I.length]));T<5&&R<5&&(k[b].isInternal=!0,I[w].isInternal=!0);}}}}return m.length>1?(v=a.create(r.extend({parts:m.slice(0)},o)),a.setPosition(v,{x:e,y:t}),v):m[0]};},function(e,t,n){var o={};e.exports=o;var i=n(0),r=n(8);o.create=function(e){return i.extend({bodies:[],collisions:[],pairs:null},e)},o.setBodies=function(e,t){e.bodies=t.slice(0);},o.clear=function(e){e.bodies=[],e.collisions=[];},o.collisions=function(e){var t,n,i=e.pairs,a=e.bodies,s=a.length,l=o.canCollide,c=r.collides,u=e.collisions,d=0;for(a.sort(o._compareBoundsX),t=0;t<s;t++){var p=a[t],f=p.bounds,v=p.bounds.max.x,m=p.bounds.max.y,y=p.bounds.min.y,g=p.isStatic||p.isSleeping,x=p.parts.length,h=1===x;for(n=t+1;n<s;n++){var b=a[n];if((C=b.bounds).min.x>v)break;if(!(m<C.min.y||y>C.max.y)&&(!g||!b.isStatic&&!b.isSleeping)&&l(p.collisionFilter,b.collisionFilter)){var S=b.parts.length;if(h&&1===S)(M=c(p,b,i))&&(u[d++]=M);else for(var w=S>1?1:0,A=x>1?1:0;A<x;A++)for(var P=p.parts[A],B=(f=P.bounds,w);B<S;B++){var M,_=b.parts[B],C=_.bounds;f.min.x>C.max.x||f.max.x<C.min.x||f.max.y<C.min.y||f.min.y>C.max.y||(M=c(P,_,i))&&(u[d++]=M);}}}}return u.length!==d&&(u.length=d),u},o.canCollide=function(e,t){return e.group===t.group&&0!==e.group?e.group>0:0!=(e.mask&t.category)&&0!=(t.mask&e.category)},o._compareBoundsX=function(e,t){return e.bounds.min.x-t.bounds.min.x};},function(e,t,n){var o={};e.exports=o;var i=n(0);o.create=function(e){var t={};return e||i.log("Mouse.create: element was undefined, defaulting to document.body","warn"),t.element=e||document.body,t.absolute={x:0,y:0},t.position={x:0,y:0},t.mousedownPosition={x:0,y:0},t.mouseupPosition={x:0,y:0},t.offset={x:0,y:0},t.scale={x:1,y:1},t.wheelDelta=0,t.button=-1,t.pixelRatio=parseInt(t.element.getAttribute("data-pixel-ratio"),10)||1,t.sourceEvents={mousemove:null,mousedown:null,mouseup:null,mousewheel:null},t.mousemove=function(e){var n=o._getRelativeMousePosition(e,t.element,t.pixelRatio);e.changedTouches&&(t.button=0,e.preventDefault()),t.absolute.x=n.x,t.absolute.y=n.y,t.position.x=t.absolute.x*t.scale.x+t.offset.x,t.position.y=t.absolute.y*t.scale.y+t.offset.y,t.sourceEvents.mousemove=e;},t.mousedown=function(e){var n=o._getRelativeMousePosition(e,t.element,t.pixelRatio);e.changedTouches?(t.button=0,e.preventDefault()):t.button=e.button,t.absolute.x=n.x,t.absolute.y=n.y,t.position.x=t.absolute.x*t.scale.x+t.offset.x,t.position.y=t.absolute.y*t.scale.y+t.offset.y,t.mousedownPosition.x=t.position.x,t.mousedownPosition.y=t.position.y,t.sourceEvents.mousedown=e;},t.mouseup=function(e){var n=o._getRelativeMousePosition(e,t.element,t.pixelRatio);e.changedTouches&&e.preventDefault(),t.button=-1,t.absolute.x=n.x,t.absolute.y=n.y,t.position.x=t.absolute.x*t.scale.x+t.offset.x,t.position.y=t.absolute.y*t.scale.y+t.offset.y,t.mouseupPosition.x=t.position.x,t.mouseupPosition.y=t.position.y,t.sourceEvents.mouseup=e;},t.mousewheel=function(e){t.wheelDelta=Math.max(-1,Math.min(1,e.wheelDelta||-e.detail)),e.preventDefault(),t.sourceEvents.mousewheel=e;},o.setElement(t,t.element),t},o.setElement=function(e,t){e.element=t,t.addEventListener("mousemove",e.mousemove,{passive:!0}),t.addEventListener("mousedown",e.mousedown,{passive:!0}),t.addEventListener("mouseup",e.mouseup,{passive:!0}),t.addEventListener("wheel",e.mousewheel,{passive:!1}),t.addEventListener("touchmove",e.mousemove,{passive:!1}),t.addEventListener("touchstart",e.mousedown,{passive:!1}),t.addEventListener("touchend",e.mouseup,{passive:!1});},o.clearSourceEvents=function(e){e.sourceEvents.mousemove=null,e.sourceEvents.mousedown=null,e.sourceEvents.mouseup=null,e.sourceEvents.mousewheel=null,e.wheelDelta=0;},o.setOffset=function(e,t){e.offset.x=t.x,e.offset.y=t.y,e.position.x=e.absolute.x*e.scale.x+e.offset.x,e.position.y=e.absolute.y*e.scale.y+e.offset.y;},o.setScale=function(e,t){e.scale.x=t.x,e.scale.y=t.y,e.position.x=e.absolute.x*e.scale.x+e.offset.x,e.position.y=e.absolute.y*e.scale.y+e.offset.y;},o._getRelativeMousePosition=function(e,t,n){var o,i,r=t.getBoundingClientRect(),a=document.documentElement||document.body.parentNode||document.body,s=void 0!==window.pageXOffset?window.pageXOffset:a.scrollLeft,l=void 0!==window.pageYOffset?window.pageYOffset:a.scrollTop,c=e.changedTouches;return c?(o=c[0].pageX-r.left-s,i=c[0].pageY-r.top-l):(o=e.pageX-r.left-s,i=e.pageY-r.top-l),{x:o/(t.clientWidth/(t.width||t.clientWidth)*n),y:i/(t.clientHeight/(t.height||t.clientHeight)*n)}};},function(e,t,n){var o={};e.exports=o;var i=n(0);o._registry={},o.register=function(e){if(o.isPlugin(e)||i.warn("Plugin.register:",o.toString(e),"does not implement all required fields."),e.name in o._registry){var t=o._registry[e.name],n=o.versionParse(e.version).number,r=o.versionParse(t.version).number;n>r?(i.warn("Plugin.register:",o.toString(t),"was upgraded to",o.toString(e)),o._registry[e.name]=e):n<r?i.warn("Plugin.register:",o.toString(t),"can not be downgraded to",o.toString(e)):e!==t&&i.warn("Plugin.register:",o.toString(e),"is already registered to different plugin object");}else o._registry[e.name]=e;return e},o.resolve=function(e){return o._registry[o.dependencyParse(e).name]},o.toString=function(e){return "string"==typeof e?e:(e.name||"anonymous")+"@"+(e.version||e.range||"0.0.0")},o.isPlugin=function(e){return e&&e.name&&e.version&&e.install},o.isUsed=function(e,t){return e.used.indexOf(t)>-1},o.isFor=function(e,t){var n=e.for&&o.dependencyParse(e.for);return !e.for||t.name===n.name&&o.versionSatisfies(t.version,n.range)},o.use=function(e,t){if(e.uses=(e.uses||[]).concat(t||[]),0!==e.uses.length){for(var n=o.dependencies(e),r=i.topologicalSort(n),a=[],s=0;s<r.length;s+=1)if(r[s]!==e.name){var l=o.resolve(r[s]);l?o.isUsed(e,l.name)||(o.isFor(l,e)||(i.warn("Plugin.use:",o.toString(l),"is for",l.for,"but installed on",o.toString(e)+"."),l._warned=!0),l.install?l.install(e):(i.warn("Plugin.use:",o.toString(l),"does not specify an install function."),l._warned=!0),l._warned?(a.push("🔶 "+o.toString(l)),delete l._warned):a.push("✅ "+o.toString(l)),e.used.push(l.name)):a.push("❌ "+r[s]);}a.length>0&&i.info(a.join("  "));}else i.warn("Plugin.use:",o.toString(e),"does not specify any dependencies to install.");},o.dependencies=function(e,t){var n=o.dependencyParse(e),r=n.name;if(!(r in(t=t||{}))){e=o.resolve(e)||e,t[r]=i.map(e.uses||[],(function(t){o.isPlugin(t)&&o.register(t);var r=o.dependencyParse(t),a=o.resolve(t);return a&&!o.versionSatisfies(a.version,r.range)?(i.warn("Plugin.dependencies:",o.toString(a),"does not satisfy",o.toString(r),"used by",o.toString(n)+"."),a._warned=!0,e._warned=!0):a||(i.warn("Plugin.dependencies:",o.toString(t),"used by",o.toString(n),"could not be resolved."),e._warned=!0),r.name}));for(var a=0;a<t[r].length;a+=1)o.dependencies(t[r][a],t);return t}},o.dependencyParse=function(e){return i.isString(e)?(/^[\w-]+(@(\*|[\^~]?\d+\.\d+\.\d+(-[0-9A-Za-z-+]+)?))?$/.test(e)||i.warn("Plugin.dependencyParse:",e,"is not a valid dependency string."),{name:e.split("@")[0],range:e.split("@")[1]||"*"}):{name:e.name,range:e.range||e.version}},o.versionParse=function(e){var t=/^(\*)|(\^|~|>=|>)?\s*((\d+)\.(\d+)\.(\d+))(-[0-9A-Za-z-+]+)?$/;t.test(e)||i.warn("Plugin.versionParse:",e,"is not a valid version or range.");var n=t.exec(e),o=Number(n[4]),r=Number(n[5]),a=Number(n[6]);return {isRange:Boolean(n[1]||n[2]),version:n[3],range:e,operator:n[1]||n[2]||"",major:o,minor:r,patch:a,parts:[o,r,a],prerelease:n[7],number:1e8*o+1e4*r+a}},o.versionSatisfies=function(e,t){t=t||"*";var n=o.versionParse(t),i=o.versionParse(e);if(n.isRange){if("*"===n.operator||"*"===e)return !0;if(">"===n.operator)return i.number>n.number;if(">="===n.operator)return i.number>=n.number;if("~"===n.operator)return i.major===n.major&&i.minor===n.minor&&i.patch>=n.patch;if("^"===n.operator)return n.major>0?i.major===n.major&&i.number>=n.number:n.minor>0?i.minor===n.minor&&i.patch>=n.patch:i.patch===n.patch}return e===t||"*"===e};},function(e,t){var n={};e.exports=n,n.create=function(e){return {vertex:e,normalImpulse:0,tangentImpulse:0}};},function(e,t,n){var o={};e.exports=o;var i=n(7),r=n(18),a=n(13),s=n(19),l=n(5),c=n(6),u=n(10),d=n(0),p=n(4);o._deltaMax=1e3/60,o.create=function(e){e=e||{};var t=d.extend({positionIterations:6,velocityIterations:4,constraintIterations:2,enableSleeping:!1,events:[],plugin:{},gravity:{x:0,y:1,scale:.001},timing:{timestamp:0,timeScale:1,lastDelta:0,lastElapsed:0,lastUpdatesPerFrame:0}},e);return t.world=e.world||c.create({label:"World"}),t.pairs=e.pairs||s.create(),t.detector=e.detector||a.create(),t.detector.pairs=t.pairs,t.grid={buckets:[]},t.world.gravity=t.gravity,t.broadphase=t.grid,t.metrics={},t},o.update=function(e,t){var n,p=d.now(),f=e.world,v=e.detector,m=e.pairs,y=e.timing,g=y.timestamp;t>o._deltaMax&&d.warnOnce("Matter.Engine.update: delta argument is recommended to be less than or equal to",o._deltaMax.toFixed(3),"ms."),t=void 0!==t?t:d._baseDelta,t*=y.timeScale,y.timestamp+=t,y.lastDelta=t;var x={timestamp:y.timestamp,delta:t};l.trigger(e,"beforeUpdate",x);var h=c.allBodies(f),b=c.allConstraints(f);for(f.isModified&&(a.setBodies(v,h),c.setModified(f,!1,!1,!0)),e.enableSleeping&&i.update(h,t),o._bodiesApplyGravity(h,e.gravity),t>0&&o._bodiesUpdate(h,t),l.trigger(e,"beforeSolve",x),u.preSolveAll(h),n=0;n<e.constraintIterations;n++)u.solveAll(b,t);u.postSolveAll(h);var S=a.collisions(v);s.update(m,S,g),e.enableSleeping&&i.afterCollisions(m.list),m.collisionStart.length>0&&l.trigger(e,"collisionStart",{pairs:m.collisionStart,timestamp:y.timestamp,delta:t});var w=d.clamp(20/e.positionIterations,0,1);for(r.preSolvePosition(m.list),n=0;n<e.positionIterations;n++)r.solvePosition(m.list,t,w);for(r.postSolvePosition(h),u.preSolveAll(h),n=0;n<e.constraintIterations;n++)u.solveAll(b,t);for(u.postSolveAll(h),r.preSolveVelocity(m.list),n=0;n<e.velocityIterations;n++)r.solveVelocity(m.list,t);return o._bodiesUpdateVelocities(h),m.collisionActive.length>0&&l.trigger(e,"collisionActive",{pairs:m.collisionActive,timestamp:y.timestamp,delta:t}),m.collisionEnd.length>0&&l.trigger(e,"collisionEnd",{pairs:m.collisionEnd,timestamp:y.timestamp,delta:t}),o._bodiesClearForces(h),l.trigger(e,"afterUpdate",x),e.timing.lastElapsed=d.now()-p,e},o.merge=function(e,t){if(d.extend(e,t),t.world){e.world=t.world,o.clear(e);for(var n=c.allBodies(e.world),r=0;r<n.length;r++){var a=n[r];i.set(a,!1),a.id=d.nextId();}}},o.clear=function(e){s.clear(e.pairs),a.clear(e.detector);},o._bodiesClearForces=function(e){for(var t=e.length,n=0;n<t;n++){var o=e[n];o.force.x=0,o.force.y=0,o.torque=0;}},o._bodiesApplyGravity=function(e,t){var n=void 0!==t.scale?t.scale:.001,o=e.length;if((0!==t.x||0!==t.y)&&0!==n)for(var i=0;i<o;i++){var r=e[i];r.isStatic||r.isSleeping||(r.force.y+=r.mass*t.y*n,r.force.x+=r.mass*t.x*n);}},o._bodiesUpdate=function(e,t){for(var n=e.length,o=0;o<n;o++){var i=e[o];i.isStatic||i.isSleeping||p.update(i,t);}},o._bodiesUpdateVelocities=function(e){for(var t=e.length,n=0;n<t;n++)p.updateVelocities(e[n]);};},function(e,t,n){var o={};e.exports=o;var i=n(3),r=n(0),a=n(1);o._restingThresh=2,o._restingThreshTangent=Math.sqrt(6),o._positionDampen=.9,o._positionWarming=.8,o._frictionNormalMultiplier=5,o._frictionMaxStatic=Number.MAX_VALUE,o.preSolvePosition=function(e){var t,n,o,i=e.length;for(t=0;t<i;t++)(n=e[t]).isActive&&(o=n.contactCount,n.collision.parentA.totalContacts+=o,n.collision.parentB.totalContacts+=o);},o.solvePosition=function(e,t,n){var i,a,s,l,c,u,d,p,f=o._positionDampen*(n||1),v=r.clamp(t/r._baseDelta,0,1),m=e.length;for(i=0;i<m;i++)(a=e[i]).isActive&&!a.isSensor&&(l=(s=a.collision).parentA,c=s.parentB,u=s.normal,a.separation=s.depth+u.x*(c.positionImpulse.x-l.positionImpulse.x)+u.y*(c.positionImpulse.y-l.positionImpulse.y));for(i=0;i<m;i++)(a=e[i]).isActive&&!a.isSensor&&(l=(s=a.collision).parentA,c=s.parentB,u=s.normal,p=a.separation-a.slop*v,(l.isStatic||c.isStatic)&&(p*=2),l.isStatic||l.isSleeping||(d=f/l.totalContacts,l.positionImpulse.x+=u.x*p*d,l.positionImpulse.y+=u.y*p*d),c.isStatic||c.isSleeping||(d=f/c.totalContacts,c.positionImpulse.x-=u.x*p*d,c.positionImpulse.y-=u.y*p*d));},o.postSolvePosition=function(e){for(var t=o._positionWarming,n=e.length,r=i.translate,s=a.update,l=0;l<n;l++){var c=e[l],u=c.positionImpulse,d=u.x,p=u.y,f=c.velocity;if(c.totalContacts=0,0!==d||0!==p){for(var v=0;v<c.parts.length;v++){var m=c.parts[v];r(m.vertices,u),s(m.bounds,m.vertices,f),m.position.x+=d,m.position.y+=p;}c.positionPrev.x+=d,c.positionPrev.y+=p,d*f.x+p*f.y<0?(u.x=0,u.y=0):(u.x*=t,u.y*=t);}}},o.preSolveVelocity=function(e){var t,n,o=e.length;for(t=0;t<o;t++){var i=e[t];if(i.isActive&&!i.isSensor){var r=i.contacts,a=i.contactCount,s=i.collision,l=s.parentA,c=s.parentB,u=s.normal,d=s.tangent;for(n=0;n<a;n++){var p=r[n],f=p.vertex,v=p.normalImpulse,m=p.tangentImpulse;if(0!==v||0!==m){var y=u.x*v+d.x*m,g=u.y*v+d.y*m;l.isStatic||l.isSleeping||(l.positionPrev.x+=y*l.inverseMass,l.positionPrev.y+=g*l.inverseMass,l.anglePrev+=l.inverseInertia*((f.x-l.position.x)*g-(f.y-l.position.y)*y)),c.isStatic||c.isSleeping||(c.positionPrev.x-=y*c.inverseMass,c.positionPrev.y-=g*c.inverseMass,c.anglePrev-=c.inverseInertia*((f.x-c.position.x)*g-(f.y-c.position.y)*y));}}}}},o.solveVelocity=function(e,t){var n,i,a,s,l=t/r._baseDelta,c=l*l*l,u=-o._restingThresh*l,d=o._restingThreshTangent,p=o._frictionNormalMultiplier*l,f=o._frictionMaxStatic,v=e.length;for(a=0;a<v;a++){var m=e[a];if(m.isActive&&!m.isSensor){var y=m.collision,g=y.parentA,x=y.parentB,h=y.normal.x,b=y.normal.y,S=y.tangent.x,w=y.tangent.y,A=m.inverseMass,P=m.friction*m.frictionStatic*p,B=m.contacts,M=m.contactCount,_=1/M,C=g.position.x-g.positionPrev.x,k=g.position.y-g.positionPrev.y,I=g.angle-g.anglePrev,T=x.position.x-x.positionPrev.x,R=x.position.y-x.positionPrev.y,D=x.angle-x.anglePrev;for(s=0;s<M;s++){var V=B[s],E=V.vertex,L=E.x-g.position.x,F=E.y-g.position.y,O=E.x-x.position.x,H=E.y-x.position.y,q=C-F*I-(T-H*D),j=k+L*I-(R+O*D),U=h*q+b*j,W=S*q+w*j,N=m.separation+U,G=Math.min(N,1),z=(G=N<0?0:G)*P;W<-z||W>z?(i=W>0?W:-W,(n=m.friction*(W>0?1:-1)*c)<-i?n=-i:n>i&&(n=i)):(n=W,i=f);var X=L*b-F*h,Q=O*b-H*h,Y=_/(A+g.inverseInertia*X*X+x.inverseInertia*Q*Q),Z=(1+m.restitution)*U*Y;if(n*=Y,U<u)V.normalImpulse=0;else {var $=V.normalImpulse;V.normalImpulse+=Z,V.normalImpulse>0&&(V.normalImpulse=0),Z=V.normalImpulse-$;}if(W<-d||W>d)V.tangentImpulse=0;else {var J=V.tangentImpulse;V.tangentImpulse+=n,V.tangentImpulse<-i&&(V.tangentImpulse=-i),V.tangentImpulse>i&&(V.tangentImpulse=i),n=V.tangentImpulse-J;}var K=h*Z+S*n,ee=b*Z+w*n;g.isStatic||g.isSleeping||(g.positionPrev.x+=K*g.inverseMass,g.positionPrev.y+=ee*g.inverseMass,g.anglePrev+=(L*ee-F*K)*g.inverseInertia),x.isStatic||x.isSleeping||(x.positionPrev.x-=K*x.inverseMass,x.positionPrev.y-=ee*x.inverseMass,x.anglePrev-=(O*ee-H*K)*x.inverseInertia);}}}};},function(e,t,n){var o={};e.exports=o;var i=n(9),r=n(0);o.create=function(e){return r.extend({table:{},list:[],collisionStart:[],collisionActive:[],collisionEnd:[]},e)},o.update=function(e,t,n){var o,r,a,s=i.update,l=i.create,c=i.setActive,u=e.table,d=e.list,p=d.length,f=p,v=e.collisionStart,m=e.collisionEnd,y=e.collisionActive,g=t.length,x=0,h=0,b=0;for(a=0;a<g;a++)(r=(o=t[a]).pair)?(r.isActive&&(y[b++]=r),s(r,o,n)):(u[(r=l(o,n)).id]=r,v[x++]=r,d[f++]=r);for(f=0,p=d.length,a=0;a<p;a++)(r=d[a]).timeUpdated>=n?d[f++]=r:(c(r,!1,n),r.collision.bodyA.sleepCounter>0&&r.collision.bodyB.sleepCounter>0?d[f++]=r:(m[h++]=r,delete u[r.id]));d.length!==f&&(d.length=f),v.length!==x&&(v.length=x),m.length!==h&&(m.length=h),y.length!==b&&(y.length=b);},o.clear=function(e){return e.table={},e.list.length=0,e.collisionStart.length=0,e.collisionActive.length=0,e.collisionEnd.length=0,e};},function(e,t,n){var o=e.exports=n(21);o.Axes=n(11),o.Bodies=n(12),o.Body=n(4),o.Bounds=n(1),o.Collision=n(8),o.Common=n(0),o.Composite=n(6),o.Composites=n(22),o.Constraint=n(10),o.Contact=n(16),o.Detector=n(13),o.Engine=n(17),o.Events=n(5),o.Grid=n(23),o.Mouse=n(14),o.MouseConstraint=n(24),o.Pair=n(9),o.Pairs=n(19),o.Plugin=n(15),o.Query=n(25),o.Render=n(26),o.Resolver=n(18),o.Runner=n(27),o.SAT=n(28),o.Sleeping=n(7),o.Svg=n(29),o.Vector=n(2),o.Vertices=n(3),o.World=n(30),o.Engine.run=o.Runner.run,o.Common.deprecated(o.Engine,"run","Engine.run ➤ use Matter.Runner.run(engine) instead");},function(e,t,n){var o={};e.exports=o;var i=n(15),r=n(0);o.name="matter-js",o.version="0.20.0",o.uses=[],o.used=[],o.use=function(){i.use(o,Array.prototype.slice.call(arguments));},o.before=function(e,t){return e=e.replace(/^Matter./,""),r.chainPathBefore(o,e,t)},o.after=function(e,t){return e=e.replace(/^Matter./,""),r.chainPathAfter(o,e,t)};},function(e,t,n){var o={};e.exports=o;var i=n(6),r=n(10),a=n(0),s=n(4),l=n(12),c=a.deprecated;o.stack=function(e,t,n,o,r,a,l){for(var c,u=i.create({label:"Stack"}),d=e,p=t,f=0,v=0;v<o;v++){for(var m=0,y=0;y<n;y++){var g=l(d,p,y,v,c,f);if(g){var x=g.bounds.max.y-g.bounds.min.y,h=g.bounds.max.x-g.bounds.min.x;x>m&&(m=x),s.translate(g,{x:.5*h,y:.5*x}),d=g.bounds.max.x+r,i.addBody(u,g),c=g,f+=1;}else d+=r;}p+=m+a,d=e;}return u},o.chain=function(e,t,n,o,s,l){for(var c=e.bodies,u=1;u<c.length;u++){var d=c[u-1],p=c[u],f=d.bounds.max.y-d.bounds.min.y,v=d.bounds.max.x-d.bounds.min.x,m=p.bounds.max.y-p.bounds.min.y,y={bodyA:d,pointA:{x:v*t,y:f*n},bodyB:p,pointB:{x:(p.bounds.max.x-p.bounds.min.x)*o,y:m*s}},g=a.extend(y,l);i.addConstraint(e,r.create(g));}return e.label+=" Chain",e},o.mesh=function(e,t,n,o,s){var l,c,u,d,p,f=e.bodies;for(l=0;l<n;l++){for(c=1;c<t;c++)u=f[c-1+l*t],d=f[c+l*t],i.addConstraint(e,r.create(a.extend({bodyA:u,bodyB:d},s)));if(l>0)for(c=0;c<t;c++)u=f[c+(l-1)*t],d=f[c+l*t],i.addConstraint(e,r.create(a.extend({bodyA:u,bodyB:d},s))),o&&c>0&&(p=f[c-1+(l-1)*t],i.addConstraint(e,r.create(a.extend({bodyA:p,bodyB:d},s)))),o&&c<t-1&&(p=f[c+1+(l-1)*t],i.addConstraint(e,r.create(a.extend({bodyA:p,bodyB:d},s))));}return e.label+=" Mesh",e},o.pyramid=function(e,t,n,i,r,a,l){return o.stack(e,t,n,i,r,a,(function(t,o,a,c,u,d){var p=Math.min(i,Math.ceil(n/2)),f=u?u.bounds.max.x-u.bounds.min.x:0;if(!(c>p||a<(c=p-c)||a>n-1-c))return 1===d&&s.translate(u,{x:(a+(n%2==1?1:-1))*f,y:0}),l(e+(u?a*f:0)+a*r,o,a,c,u,d)}))},o.newtonsCradle=function(e,t,n,o,a){for(var s=i.create({label:"Newtons Cradle"}),c=0;c<n;c++){var u=l.circle(e+c*(1.9*o),t+a,o,{inertia:1/0,restitution:1,friction:0,frictionAir:1e-4,slop:1}),d=r.create({pointA:{x:e+c*(1.9*o),y:t},bodyB:u});i.addBody(s,u),i.addConstraint(s,d);}return s},c(o,"newtonsCradle","Composites.newtonsCradle ➤ moved to newtonsCradle example"),o.car=function(e,t,n,o,a){var c=s.nextGroup(!0),u=.5*-n+20,d=.5*n-20,p=i.create({label:"Car"}),f=l.rectangle(e,t,n,o,{collisionFilter:{group:c},chamfer:{radius:.5*o},density:2e-4}),v=l.circle(e+u,t+0,a,{collisionFilter:{group:c},friction:.8}),m=l.circle(e+d,t+0,a,{collisionFilter:{group:c},friction:.8}),y=r.create({bodyB:f,pointB:{x:u,y:0},bodyA:v,stiffness:1,length:0}),g=r.create({bodyB:f,pointB:{x:d,y:0},bodyA:m,stiffness:1,length:0});return i.addBody(p,f),i.addBody(p,v),i.addBody(p,m),i.addConstraint(p,y),i.addConstraint(p,g),p},c(o,"car","Composites.car ➤ moved to car example"),o.softBody=function(e,t,n,i,r,s,c,u,d,p){d=a.extend({inertia:1/0},d),p=a.extend({stiffness:.2,render:{type:"line",anchors:!1}},p);var f=o.stack(e,t,n,i,r,s,(function(e,t){return l.circle(e,t,u,d)}));return o.mesh(f,n,i,c,p),f.label="Soft Body",f},c(o,"softBody","Composites.softBody ➤ moved to softBody and cloth examples");},function(e,t,n){var o={};e.exports=o;var i=n(9),r=n(0),a=r.deprecated;o.create=function(e){return r.extend({buckets:{},pairs:{},pairsList:[],bucketWidth:48,bucketHeight:48},e)},o.update=function(e,t,n,i){var r,a,s,l,c,u=n.world,d=e.buckets,p=!1;for(r=0;r<t.length;r++){var f=t[r];if((!f.isSleeping||i)&&(!u.bounds||!(f.bounds.max.x<u.bounds.min.x||f.bounds.min.x>u.bounds.max.x||f.bounds.max.y<u.bounds.min.y||f.bounds.min.y>u.bounds.max.y))){var v=o._getRegion(e,f);if(!f.region||v.id!==f.region.id||i){f.region&&!i||(f.region=v);var m=o._regionUnion(v,f.region);for(a=m.startCol;a<=m.endCol;a++)for(s=m.startRow;s<=m.endRow;s++){l=d[c=o._getBucketId(a,s)];var y=a>=v.startCol&&a<=v.endCol&&s>=v.startRow&&s<=v.endRow,g=a>=f.region.startCol&&a<=f.region.endCol&&s>=f.region.startRow&&s<=f.region.endRow;!y&&g&&g&&l&&o._bucketRemoveBody(e,l,f),(f.region===v||y&&!g||i)&&(l||(l=o._createBucket(d,c)),o._bucketAddBody(e,l,f));}f.region=v,p=!0;}}}p&&(e.pairsList=o._createActivePairsList(e));},a(o,"update","Grid.update ➤ replaced by Matter.Detector"),o.clear=function(e){e.buckets={},e.pairs={},e.pairsList=[];},a(o,"clear","Grid.clear ➤ replaced by Matter.Detector"),o._regionUnion=function(e,t){var n=Math.min(e.startCol,t.startCol),i=Math.max(e.endCol,t.endCol),r=Math.min(e.startRow,t.startRow),a=Math.max(e.endRow,t.endRow);return o._createRegion(n,i,r,a)},o._getRegion=function(e,t){var n=t.bounds,i=Math.floor(n.min.x/e.bucketWidth),r=Math.floor(n.max.x/e.bucketWidth),a=Math.floor(n.min.y/e.bucketHeight),s=Math.floor(n.max.y/e.bucketHeight);return o._createRegion(i,r,a,s)},o._createRegion=function(e,t,n,o){return {id:e+","+t+","+n+","+o,startCol:e,endCol:t,startRow:n,endRow:o}},o._getBucketId=function(e,t){return "C"+e+"R"+t},o._createBucket=function(e,t){return e[t]=[]},o._bucketAddBody=function(e,t,n){var o,r=e.pairs,a=i.id,s=t.length;for(o=0;o<s;o++){var l=t[o];if(!(n.id===l.id||n.isStatic&&l.isStatic)){var c=a(n,l),u=r[c];u?u[2]+=1:r[c]=[n,l,1];}}t.push(n);},o._bucketRemoveBody=function(e,t,n){var o,a=e.pairs,s=i.id;t.splice(r.indexOf(t,n),1);var l=t.length;for(o=0;o<l;o++){var c=a[s(n,t[o])];c&&(c[2]-=1);}},o._createActivePairsList=function(e){var t,n,o=e.pairs,i=r.keys(o),a=i.length,s=[];for(n=0;n<a;n++)(t=o[i[n]])[2]>0?s.push(t):delete o[i[n]];return s};},function(e,t,n){var o={};e.exports=o;var i=n(3),r=n(7),a=n(14),s=n(5),l=n(13),c=n(10),u=n(6),d=n(0),p=n(1);o.create=function(e,t){var n=(e?e.mouse:null)||(t?t.mouse:null);n||(e&&e.render&&e.render.canvas?n=a.create(e.render.canvas):t&&t.element?n=a.create(t.element):(n=a.create(),d.warn("MouseConstraint.create: options.mouse was undefined, options.element was undefined, may not function as expected")));var i={type:"mouseConstraint",mouse:n,element:null,body:null,constraint:c.create({label:"Mouse Constraint",pointA:n.position,pointB:{x:0,y:0},length:.01,stiffness:.1,angularStiffness:1,render:{strokeStyle:"#90EE90",lineWidth:3}}),collisionFilter:{category:1,mask:4294967295,group:0}},r=d.extend(i,t);return s.on(e,"beforeUpdate",(function(){var t=u.allBodies(e.world);o.update(r,t),o._triggerEvents(r);})),r},o.update=function(e,t){var n=e.mouse,o=e.constraint,a=e.body;if(0===n.button){if(o.bodyB)r.set(o.bodyB,!1),o.pointA=n.position;else for(var c=0;c<t.length;c++)if(a=t[c],p.contains(a.bounds,n.position)&&l.canCollide(a.collisionFilter,e.collisionFilter))for(var u=a.parts.length>1?1:0;u<a.parts.length;u++){var d=a.parts[u];if(i.contains(d.vertices,n.position)){o.pointA=n.position,o.bodyB=e.body=a,o.pointB={x:n.position.x-a.position.x,y:n.position.y-a.position.y},o.angleB=a.angle,r.set(a,!1),s.trigger(e,"startdrag",{mouse:n,body:a});break}}}else o.bodyB=e.body=null,o.pointB=null,a&&s.trigger(e,"enddrag",{mouse:n,body:a});},o._triggerEvents=function(e){var t=e.mouse,n=t.sourceEvents;n.mousemove&&s.trigger(e,"mousemove",{mouse:t}),n.mousedown&&s.trigger(e,"mousedown",{mouse:t}),n.mouseup&&s.trigger(e,"mouseup",{mouse:t}),a.clearSourceEvents(t);};},function(e,t,n){var o={};e.exports=o;var i=n(2),r=n(8),a=n(1),s=n(12),l=n(3);o.collides=function(e,t){for(var n=[],o=t.length,i=e.bounds,s=r.collides,l=a.overlaps,c=0;c<o;c++){var u=t[c],d=u.parts.length,p=1===d?0:1;if(l(u.bounds,i))for(var f=p;f<d;f++){var v=u.parts[f];if(l(v.bounds,i)){var m=s(v,e);if(m){n.push(m);break}}}}return n},o.ray=function(e,t,n,r){r=r||1e-100;for(var a=i.angle(t,n),l=i.magnitude(i.sub(t,n)),c=.5*(n.x+t.x),u=.5*(n.y+t.y),d=s.rectangle(c,u,l,r,{angle:a}),p=o.collides(d,e),f=0;f<p.length;f+=1){var v=p[f];v.body=v.bodyB=v.bodyA;}return p},o.region=function(e,t,n){for(var o=[],i=0;i<e.length;i++){var r=e[i],s=a.overlaps(r.bounds,t);(s&&!n||!s&&n)&&o.push(r);}return o},o.point=function(e,t){for(var n=[],o=0;o<e.length;o++){var i=e[o];if(a.contains(i.bounds,t))for(var r=1===i.parts.length?0:1;r<i.parts.length;r++){var s=i.parts[r];if(a.contains(s.bounds,t)&&l.contains(s.vertices,t)){n.push(i);break}}}return n};},function(e,t,n){var o={};e.exports=o;var i=n(4),r=n(0),a=n(6),s=n(1),l=n(5),c=n(2),u=n(14);!function(){var e,t;"undefined"!=typeof window&&(e=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.msRequestAnimationFrame||function(e){window.setTimeout((function(){e(r.now());}),1e3/60);},t=window.cancelAnimationFrame||window.mozCancelAnimationFrame||window.webkitCancelAnimationFrame||window.msCancelAnimationFrame),o._goodFps=30,o._goodDelta=1e3/60,o.create=function(e){var t={engine:null,element:null,canvas:null,mouse:null,frameRequestId:null,timing:{historySize:60,delta:0,deltaHistory:[],lastTime:0,lastTimestamp:0,lastElapsed:0,timestampElapsed:0,timestampElapsedHistory:[],engineDeltaHistory:[],engineElapsedHistory:[],engineUpdatesHistory:[],elapsedHistory:[]},options:{width:800,height:600,pixelRatio:1,background:"#14151f",wireframeBackground:"#14151f",wireframeStrokeStyle:"#bbb",hasBounds:!!e.bounds,enabled:!0,wireframes:!0,showSleeping:!0,showDebug:!1,showStats:!1,showPerformance:!1,showBounds:!1,showVelocity:!1,showCollisions:!1,showSeparations:!1,showAxes:!1,showPositions:!1,showAngleIndicator:!1,showIds:!1,showVertexNumbers:!1,showConvexHulls:!1,showInternalEdges:!1,showMousePosition:!1}},n=r.extend(t,e);return n.canvas&&(n.canvas.width=n.options.width||n.canvas.width,n.canvas.height=n.options.height||n.canvas.height),n.mouse=e.mouse,n.engine=e.engine,n.canvas=n.canvas||p(n.options.width,n.options.height),n.context=n.canvas.getContext("2d"),n.textures={},n.bounds=n.bounds||{min:{x:0,y:0},max:{x:n.canvas.width,y:n.canvas.height}},n.controller=o,n.options.showBroadphase=!1,1!==n.options.pixelRatio&&o.setPixelRatio(n,n.options.pixelRatio),r.isElement(n.element)&&n.element.appendChild(n.canvas),n},o.run=function(t){!function i(r){t.frameRequestId=e(i),n(t,r),o.world(t,r),t.context.setTransform(t.options.pixelRatio,0,0,t.options.pixelRatio,0,0),(t.options.showStats||t.options.showDebug)&&o.stats(t,t.context,r),(t.options.showPerformance||t.options.showDebug)&&o.performance(t,t.context,r),t.context.setTransform(1,0,0,1,0,0);}();},o.stop=function(e){t(e.frameRequestId);},o.setPixelRatio=function(e,t){var n=e.options,o=e.canvas;"auto"===t&&(t=f(o)),n.pixelRatio=t,o.setAttribute("data-pixel-ratio",t),o.width=n.width*t,o.height=n.height*t,o.style.width=n.width+"px",o.style.height=n.height+"px";},o.setSize=function(e,t,n){e.options.width=t,e.options.height=n,e.bounds.max.x=e.bounds.min.x+t,e.bounds.max.y=e.bounds.min.y+n,1!==e.options.pixelRatio?o.setPixelRatio(e,e.options.pixelRatio):(e.canvas.width=t,e.canvas.height=n);},o.lookAt=function(e,t,n,o){o=void 0===o||o,t=r.isArray(t)?t:[t],n=n||{x:0,y:0};for(var i={min:{x:1/0,y:1/0},max:{x:-1/0,y:-1/0}},a=0;a<t.length;a+=1){var s=t[a],l=s.bounds?s.bounds.min:s.min||s.position||s,c=s.bounds?s.bounds.max:s.max||s.position||s;l&&c&&(l.x<i.min.x&&(i.min.x=l.x),c.x>i.max.x&&(i.max.x=c.x),l.y<i.min.y&&(i.min.y=l.y),c.y>i.max.y&&(i.max.y=c.y));}var d=i.max.x-i.min.x+2*n.x,p=i.max.y-i.min.y+2*n.y,f=e.canvas.height,v=e.canvas.width/f,m=d/p,y=1,g=1;m>v?g=m/v:y=v/m,e.options.hasBounds=!0,e.bounds.min.x=i.min.x,e.bounds.max.x=i.min.x+d*y,e.bounds.min.y=i.min.y,e.bounds.max.y=i.min.y+p*g,o&&(e.bounds.min.x+=.5*d-d*y*.5,e.bounds.max.x+=.5*d-d*y*.5,e.bounds.min.y+=.5*p-p*g*.5,e.bounds.max.y+=.5*p-p*g*.5),e.bounds.min.x-=n.x,e.bounds.max.x-=n.x,e.bounds.min.y-=n.y,e.bounds.max.y-=n.y,e.mouse&&(u.setScale(e.mouse,{x:(e.bounds.max.x-e.bounds.min.x)/e.canvas.width,y:(e.bounds.max.y-e.bounds.min.y)/e.canvas.height}),u.setOffset(e.mouse,e.bounds.min));},o.startViewTransform=function(e){var t=e.bounds.max.x-e.bounds.min.x,n=e.bounds.max.y-e.bounds.min.y,o=t/e.options.width,i=n/e.options.height;e.context.setTransform(e.options.pixelRatio/o,0,0,e.options.pixelRatio/i,0,0),e.context.translate(-e.bounds.min.x,-e.bounds.min.y);},o.endViewTransform=function(e){e.context.setTransform(e.options.pixelRatio,0,0,e.options.pixelRatio,0,0);},o.world=function(e,t){var n,i=r.now(),d=e.engine,p=d.world,f=e.canvas,v=e.context,y=e.options,g=e.timing,x=a.allBodies(p),h=a.allConstraints(p),b=y.wireframes?y.wireframeBackground:y.background,S=[],w=[],A={timestamp:d.timing.timestamp};if(l.trigger(e,"beforeRender",A),e.currentBackground!==b&&m(e,b),v.globalCompositeOperation="source-in",v.fillStyle="transparent",v.fillRect(0,0,f.width,f.height),v.globalCompositeOperation="source-over",y.hasBounds){for(n=0;n<x.length;n++){var P=x[n];s.overlaps(P.bounds,e.bounds)&&S.push(P);}for(n=0;n<h.length;n++){var B=h[n],M=B.bodyA,_=B.bodyB,C=B.pointA,k=B.pointB;M&&(C=c.add(M.position,B.pointA)),_&&(k=c.add(_.position,B.pointB)),C&&k&&((s.contains(e.bounds,C)||s.contains(e.bounds,k))&&w.push(B));}o.startViewTransform(e),e.mouse&&(u.setScale(e.mouse,{x:(e.bounds.max.x-e.bounds.min.x)/e.options.width,y:(e.bounds.max.y-e.bounds.min.y)/e.options.height}),u.setOffset(e.mouse,e.bounds.min));}else w=h,S=x,1!==e.options.pixelRatio&&e.context.setTransform(e.options.pixelRatio,0,0,e.options.pixelRatio,0,0);!y.wireframes||d.enableSleeping&&y.showSleeping?o.bodies(e,S,v):(y.showConvexHulls&&o.bodyConvexHulls(e,S,v),o.bodyWireframes(e,S,v)),y.showBounds&&o.bodyBounds(e,S,v),(y.showAxes||y.showAngleIndicator)&&o.bodyAxes(e,S,v),y.showPositions&&o.bodyPositions(e,S,v),y.showVelocity&&o.bodyVelocity(e,S,v),y.showIds&&o.bodyIds(e,S,v),y.showSeparations&&o.separations(e,d.pairs.list,v),y.showCollisions&&o.collisions(e,d.pairs.list,v),y.showVertexNumbers&&o.vertexNumbers(e,S,v),y.showMousePosition&&o.mousePosition(e,e.mouse,v),o.constraints(w,v),y.hasBounds&&o.endViewTransform(e),l.trigger(e,"afterRender",A),g.lastElapsed=r.now()-i;},o.stats=function(e,t,n){for(var o=e.engine,i=o.world,r=a.allBodies(i),s=0,l=0,c=0;c<r.length;c+=1)s+=r[c].parts.length;var u={Part:s,Body:r.length,Cons:a.allConstraints(i).length,Comp:a.allComposites(i).length,Pair:o.pairs.list.length};for(var d in t.fillStyle="#0e0f19",t.fillRect(l,0,302.5,44),t.font="12px Arial",t.textBaseline="top",t.textAlign="right",u){var p=u[d];t.fillStyle="#aaa",t.fillText(d,l+55,8),t.fillStyle="#eee",t.fillText(p,l+55,26),l+=55;}},o.performance=function(e,t){var n=e.engine,i=e.timing,a=i.deltaHistory,s=i.elapsedHistory,l=i.timestampElapsedHistory,c=i.engineDeltaHistory,u=i.engineUpdatesHistory,p=i.engineElapsedHistory,f=n.timing.lastUpdatesPerFrame,v=n.timing.lastDelta,m=d(a),y=d(s),g=d(c),x=d(u),h=d(p),b=d(l)/m||0,S=Math.round(m/v),w=1e3/m||0,A=10,P=69;t.fillStyle="#0e0f19",t.fillRect(0,50,442,34),o.status(t,A,P,60,4,a.length,Math.round(w)+" fps",w/o._goodFps,(function(e){return a[e]/m-1})),o.status(t,82,P,60,4,c.length,v.toFixed(2)+" dt",o._goodDelta/v,(function(e){return c[e]/g-1})),o.status(t,154,P,60,4,u.length,f+" upf",Math.pow(r.clamp(x/S||1,0,1),4),(function(e){return u[e]/x-1})),o.status(t,226,P,60,4,p.length,h.toFixed(2)+" ut",1-f*h/o._goodFps,(function(e){return p[e]/h-1})),o.status(t,298,P,60,4,s.length,y.toFixed(2)+" rt",1-y/o._goodFps,(function(e){return s[e]/y-1})),o.status(t,370,P,60,4,l.length,b.toFixed(2)+" x",b*b*b,(function(e){return (l[e]/a[e]/b||0)-1}));},o.status=function(e,t,n,o,i,a,s,l,c){e.strokeStyle="#888",e.fillStyle="#444",e.lineWidth=1,e.fillRect(t,n+7,o,1),e.beginPath(),e.moveTo(t,n+7-i*r.clamp(.4*c(0),-2,2));for(var u=0;u<o;u+=1)e.lineTo(t+u,n+7-(u<a?i*r.clamp(.4*c(u),-2,2):0));e.stroke(),e.fillStyle="hsl("+r.clamp(25+95*l,0,120)+",100%,60%)",e.fillRect(t,n-7,4,4),e.font="12px Arial",e.textBaseline="middle",e.textAlign="right",e.fillStyle="#eee",e.fillText(s,t+o,n-5);},o.constraints=function(e,t){for(var n=t,o=0;o<e.length;o++){var i=e[o];if(i.render.visible&&i.pointA&&i.pointB){var a,s,l=i.bodyA,u=i.bodyB;if(a=l?c.add(l.position,i.pointA):i.pointA,"pin"===i.render.type)n.beginPath(),n.arc(a.x,a.y,3,0,2*Math.PI),n.closePath();else {if(s=u?c.add(u.position,i.pointB):i.pointB,n.beginPath(),n.moveTo(a.x,a.y),"spring"===i.render.type)for(var d,p=c.sub(s,a),f=c.perp(c.normalise(p)),v=Math.ceil(r.clamp(i.length/5,12,20)),m=1;m<v;m+=1)d=m%2==0?1:-1,n.lineTo(a.x+p.x*(m/v)+f.x*d*4,a.y+p.y*(m/v)+f.y*d*4);n.lineTo(s.x,s.y);}i.render.lineWidth&&(n.lineWidth=i.render.lineWidth,n.strokeStyle=i.render.strokeStyle,n.stroke()),i.render.anchors&&(n.fillStyle=i.render.strokeStyle,n.beginPath(),n.arc(a.x,a.y,3,0,2*Math.PI),n.arc(s.x,s.y,3,0,2*Math.PI),n.closePath(),n.fill());}}},o.bodies=function(e,t,n){var o,i,r,a,s=n,l=(e.engine,e.options),c=l.showInternalEdges||!l.wireframes;for(r=0;r<t.length;r++)if((o=t[r]).render.visible)for(a=o.parts.length>1?1:0;a<o.parts.length;a++)if((i=o.parts[a]).render.visible){if(l.showSleeping&&o.isSleeping?s.globalAlpha=.5*i.render.opacity:1!==i.render.opacity&&(s.globalAlpha=i.render.opacity),i.render.sprite&&i.render.sprite.texture&&!l.wireframes){var u=i.render.sprite,d=v(e,u.texture);s.translate(i.position.x,i.position.y),s.rotate(i.angle),s.drawImage(d,d.width*-u.xOffset*u.xScale,d.height*-u.yOffset*u.yScale,d.width*u.xScale,d.height*u.yScale),s.rotate(-i.angle),s.translate(-i.position.x,-i.position.y);}else {if(i.circleRadius)s.beginPath(),s.arc(i.position.x,i.position.y,i.circleRadius,0,2*Math.PI);else {s.beginPath(),s.moveTo(i.vertices[0].x,i.vertices[0].y);for(var p=1;p<i.vertices.length;p++)!i.vertices[p-1].isInternal||c?s.lineTo(i.vertices[p].x,i.vertices[p].y):s.moveTo(i.vertices[p].x,i.vertices[p].y),i.vertices[p].isInternal&&!c&&s.moveTo(i.vertices[(p+1)%i.vertices.length].x,i.vertices[(p+1)%i.vertices.length].y);s.lineTo(i.vertices[0].x,i.vertices[0].y),s.closePath();}l.wireframes?(s.lineWidth=1,s.strokeStyle=e.options.wireframeStrokeStyle,s.stroke()):(s.fillStyle=i.render.fillStyle,i.render.lineWidth&&(s.lineWidth=i.render.lineWidth,s.strokeStyle=i.render.strokeStyle,s.stroke()),s.fill());}s.globalAlpha=1;}},o.bodyWireframes=function(e,t,n){var o,i,r,a,s,l=n,c=e.options.showInternalEdges;for(l.beginPath(),r=0;r<t.length;r++)if((o=t[r]).render.visible)for(s=o.parts.length>1?1:0;s<o.parts.length;s++){for(i=o.parts[s],l.moveTo(i.vertices[0].x,i.vertices[0].y),a=1;a<i.vertices.length;a++)!i.vertices[a-1].isInternal||c?l.lineTo(i.vertices[a].x,i.vertices[a].y):l.moveTo(i.vertices[a].x,i.vertices[a].y),i.vertices[a].isInternal&&!c&&l.moveTo(i.vertices[(a+1)%i.vertices.length].x,i.vertices[(a+1)%i.vertices.length].y);l.lineTo(i.vertices[0].x,i.vertices[0].y);}l.lineWidth=1,l.strokeStyle=e.options.wireframeStrokeStyle,l.stroke();},o.bodyConvexHulls=function(e,t,n){var o,i,r,a=n;for(a.beginPath(),i=0;i<t.length;i++)if((o=t[i]).render.visible&&1!==o.parts.length){for(a.moveTo(o.vertices[0].x,o.vertices[0].y),r=1;r<o.vertices.length;r++)a.lineTo(o.vertices[r].x,o.vertices[r].y);a.lineTo(o.vertices[0].x,o.vertices[0].y);}a.lineWidth=1,a.strokeStyle="rgba(255,255,255,0.2)",a.stroke();},o.vertexNumbers=function(e,t,n){var o,i,r,a=n;for(o=0;o<t.length;o++){var s=t[o].parts;for(r=s.length>1?1:0;r<s.length;r++){var l=s[r];for(i=0;i<l.vertices.length;i++)a.fillStyle="rgba(255,255,255,0.2)",a.fillText(o+"_"+i,l.position.x+.8*(l.vertices[i].x-l.position.x),l.position.y+.8*(l.vertices[i].y-l.position.y));}}},o.mousePosition=function(e,t,n){var o=n;o.fillStyle="rgba(255,255,255,0.8)",o.fillText(t.position.x+"  "+t.position.y,t.position.x+5,t.position.y-5);},o.bodyBounds=function(e,t,n){var o=n,i=(e.engine,e.options);o.beginPath();for(var r=0;r<t.length;r++){if(t[r].render.visible)for(var a=t[r].parts,s=a.length>1?1:0;s<a.length;s++){var l=a[s];o.rect(l.bounds.min.x,l.bounds.min.y,l.bounds.max.x-l.bounds.min.x,l.bounds.max.y-l.bounds.min.y);}}i.wireframes?o.strokeStyle="rgba(255,255,255,0.08)":o.strokeStyle="rgba(0,0,0,0.1)",o.lineWidth=1,o.stroke();},o.bodyAxes=function(e,t,n){var o,i,r,a,s=n,l=(e.engine,e.options);for(s.beginPath(),i=0;i<t.length;i++){var c=t[i],u=c.parts;if(c.render.visible)if(l.showAxes)for(r=u.length>1?1:0;r<u.length;r++)for(o=u[r],a=0;a<o.axes.length;a++){var d=o.axes[a];s.moveTo(o.position.x,o.position.y),s.lineTo(o.position.x+20*d.x,o.position.y+20*d.y);}else for(r=u.length>1?1:0;r<u.length;r++)for(o=u[r],a=0;a<o.axes.length;a++)s.moveTo(o.position.x,o.position.y),s.lineTo((o.vertices[0].x+o.vertices[o.vertices.length-1].x)/2,(o.vertices[0].y+o.vertices[o.vertices.length-1].y)/2);}l.wireframes?(s.strokeStyle="indianred",s.lineWidth=1):(s.strokeStyle="rgba(255, 255, 255, 0.4)",s.globalCompositeOperation="overlay",s.lineWidth=2),s.stroke(),s.globalCompositeOperation="source-over";},o.bodyPositions=function(e,t,n){var o,i,r,a,s=n,l=(e.engine,e.options);for(s.beginPath(),r=0;r<t.length;r++)if((o=t[r]).render.visible)for(a=0;a<o.parts.length;a++)i=o.parts[a],s.arc(i.position.x,i.position.y,3,0,2*Math.PI,!1),s.closePath();for(l.wireframes?s.fillStyle="indianred":s.fillStyle="rgba(0,0,0,0.5)",s.fill(),s.beginPath(),r=0;r<t.length;r++)(o=t[r]).render.visible&&(s.arc(o.positionPrev.x,o.positionPrev.y,2,0,2*Math.PI,!1),s.closePath());s.fillStyle="rgba(255,165,0,0.8)",s.fill();},o.bodyVelocity=function(e,t,n){var o=n;o.beginPath();for(var r=0;r<t.length;r++){var a=t[r];if(a.render.visible){var s=i.getVelocity(a);o.moveTo(a.position.x,a.position.y),o.lineTo(a.position.x+s.x,a.position.y+s.y);}}o.lineWidth=3,o.strokeStyle="cornflowerblue",o.stroke();},o.bodyIds=function(e,t,n){var o,i,r=n;for(o=0;o<t.length;o++)if(t[o].render.visible){var a=t[o].parts;for(i=a.length>1?1:0;i<a.length;i++){var s=a[i];r.font="12px Arial",r.fillStyle="rgba(255,255,255,0.5)",r.fillText(s.id,s.position.x+10,s.position.y-10);}}},o.collisions=function(e,t,n){var o,i,r,a,s=n,l=e.options;for(s.beginPath(),r=0;r<t.length;r++)if((o=t[r]).isActive)for(i=o.collision,a=0;a<o.contactCount;a++){var c=o.contacts[a].vertex;s.rect(c.x-1.5,c.y-1.5,3.5,3.5);}for(l.wireframes?s.fillStyle="rgba(255,255,255,0.7)":s.fillStyle="orange",s.fill(),s.beginPath(),r=0;r<t.length;r++)if((o=t[r]).isActive&&(i=o.collision,o.contactCount>0)){var u=o.contacts[0].vertex.x,d=o.contacts[0].vertex.y;2===o.contactCount&&(u=(o.contacts[0].vertex.x+o.contacts[1].vertex.x)/2,d=(o.contacts[0].vertex.y+o.contacts[1].vertex.y)/2),i.bodyB===i.supports[0].body||!0===i.bodyA.isStatic?s.moveTo(u-8*i.normal.x,d-8*i.normal.y):s.moveTo(u+8*i.normal.x,d+8*i.normal.y),s.lineTo(u,d);}l.wireframes?s.strokeStyle="rgba(255,165,0,0.7)":s.strokeStyle="orange",s.lineWidth=1,s.stroke();},o.separations=function(e,t,n){var o,i,r,a,s,l=n,c=e.options;for(l.beginPath(),s=0;s<t.length;s++)if((o=t[s]).isActive){r=(i=o.collision).bodyA;var u=1;(a=i.bodyB).isStatic||r.isStatic||(u=.5),a.isStatic&&(u=0),l.moveTo(a.position.x,a.position.y),l.lineTo(a.position.x-i.penetration.x*u,a.position.y-i.penetration.y*u),u=1,a.isStatic||r.isStatic||(u=.5),r.isStatic&&(u=0),l.moveTo(r.position.x,r.position.y),l.lineTo(r.position.x+i.penetration.x*u,r.position.y+i.penetration.y*u);}c.wireframes?l.strokeStyle="rgba(255,165,0,0.5)":l.strokeStyle="orange",l.stroke();},o.inspector=function(e,t){e.engine;var n,o=e.selected,i=e.render,r=i.options;if(r.hasBounds){var a=i.bounds.max.x-i.bounds.min.x,s=i.bounds.max.y-i.bounds.min.y,l=a/i.options.width,c=s/i.options.height;t.scale(1/l,1/c),t.translate(-i.bounds.min.x,-i.bounds.min.y);}for(var u=0;u<o.length;u++){var d=o[u].data;switch(t.translate(.5,.5),t.lineWidth=1,t.strokeStyle="rgba(255,165,0,0.9)",t.setLineDash([1,2]),d.type){case"body":n=d.bounds,t.beginPath(),t.rect(Math.floor(n.min.x-3),Math.floor(n.min.y-3),Math.floor(n.max.x-n.min.x+6),Math.floor(n.max.y-n.min.y+6)),t.closePath(),t.stroke();break;case"constraint":var p=d.pointA;d.bodyA&&(p=d.pointB),t.beginPath(),t.arc(p.x,p.y,10,0,2*Math.PI),t.closePath(),t.stroke();}t.setLineDash([]),t.translate(-.5,-.5);}null!==e.selectStart&&(t.translate(.5,.5),t.lineWidth=1,t.strokeStyle="rgba(255,165,0,0.6)",t.fillStyle="rgba(255,165,0,0.1)",n=e.selectBounds,t.beginPath(),t.rect(Math.floor(n.min.x),Math.floor(n.min.y),Math.floor(n.max.x-n.min.x),Math.floor(n.max.y-n.min.y)),t.closePath(),t.stroke(),t.fill(),t.translate(-.5,-.5)),r.hasBounds&&t.setTransform(1,0,0,1,0,0);};var n=function(e,t){var n=e.engine,i=e.timing,r=i.historySize,a=n.timing.timestamp;i.delta=t-i.lastTime||o._goodDelta,i.lastTime=t,i.timestampElapsed=a-i.lastTimestamp||0,i.lastTimestamp=a,i.deltaHistory.unshift(i.delta),i.deltaHistory.length=Math.min(i.deltaHistory.length,r),i.engineDeltaHistory.unshift(n.timing.lastDelta),i.engineDeltaHistory.length=Math.min(i.engineDeltaHistory.length,r),i.timestampElapsedHistory.unshift(i.timestampElapsed),i.timestampElapsedHistory.length=Math.min(i.timestampElapsedHistory.length,r),i.engineUpdatesHistory.unshift(n.timing.lastUpdatesPerFrame),i.engineUpdatesHistory.length=Math.min(i.engineUpdatesHistory.length,r),i.engineElapsedHistory.unshift(n.timing.lastElapsed),i.engineElapsedHistory.length=Math.min(i.engineElapsedHistory.length,r),i.elapsedHistory.unshift(i.lastElapsed),i.elapsedHistory.length=Math.min(i.elapsedHistory.length,r);},d=function(e){for(var t=0,n=0;n<e.length;n+=1)t+=e[n];return t/e.length||0},p=function(e,t){var n=document.createElement("canvas");return n.width=e,n.height=t,n.oncontextmenu=function(){return !1},n.onselectstart=function(){return !1},n},f=function(e){var t=e.getContext("2d");return (window.devicePixelRatio||1)/(t.webkitBackingStorePixelRatio||t.mozBackingStorePixelRatio||t.msBackingStorePixelRatio||t.oBackingStorePixelRatio||t.backingStorePixelRatio||1)},v=function(e,t){var n=e.textures[t];return n||((n=e.textures[t]=new Image).src=t,n)},m=function(e,t){var n=t;/(jpg|gif|png)$/.test(t)&&(n="url("+t+")"),e.canvas.style.background=n,e.canvas.style.backgroundSize="contain",e.currentBackground=t;};}();},function(e,t,n){var o={};e.exports=o;var i=n(5),r=n(17),a=n(0);!function(){o._maxFrameDelta=1e3/15,o._frameDeltaFallback=1e3/60,o._timeBufferMargin=1.5,o._elapsedNextEstimate=1,o._smoothingLowerBound=.1,o._smoothingUpperBound=.9,o.create=function(e){var t=a.extend({delta:1e3/60,frameDelta:null,frameDeltaSmoothing:!0,frameDeltaSnapping:!0,frameDeltaHistory:[],frameDeltaHistorySize:100,frameRequestId:null,timeBuffer:0,timeLastTick:null,maxUpdates:null,maxFrameTime:1e3/30,lastUpdatesDeferred:0,enabled:!0},e);return t.fps=0,t},o.run=function(e,t){return e.timeBuffer=o._frameDeltaFallback,function n(i){e.frameRequestId=o._onNextFrame(e,n),i&&e.enabled&&o.tick(e,t,i);}(),e},o.tick=function(t,n,s){var l=a.now(),c=t.delta,u=0,d=s-t.timeLastTick;if((!d||!t.timeLastTick||d>Math.max(o._maxFrameDelta,t.maxFrameTime))&&(d=t.frameDelta||o._frameDeltaFallback),t.frameDeltaSmoothing){t.frameDeltaHistory.push(d),t.frameDeltaHistory=t.frameDeltaHistory.slice(-t.frameDeltaHistorySize);var p=t.frameDeltaHistory.slice(0).sort(),f=t.frameDeltaHistory.slice(p.length*o._smoothingLowerBound,p.length*o._smoothingUpperBound);d=e(f)||d;}t.frameDeltaSnapping&&(d=1e3/Math.round(1e3/d)),t.frameDelta=d,t.timeLastTick=s,t.timeBuffer+=t.frameDelta,t.timeBuffer=a.clamp(t.timeBuffer,0,t.frameDelta+c*o._timeBufferMargin),t.lastUpdatesDeferred=0;var v=t.maxUpdates||Math.ceil(t.maxFrameTime/c),m={timestamp:n.timing.timestamp};i.trigger(t,"beforeTick",m),i.trigger(t,"tick",m);for(var y=a.now();c>0&&t.timeBuffer>=c*o._timeBufferMargin;){i.trigger(t,"beforeUpdate",m),r.update(n,c),i.trigger(t,"afterUpdate",m),t.timeBuffer-=c,u+=1;var g=a.now()-l,x=a.now()-y,h=g+o._elapsedNextEstimate*x/u;if(u>=v||h>t.maxFrameTime){t.lastUpdatesDeferred=Math.round(Math.max(0,t.timeBuffer/c-o._timeBufferMargin));break}}n.timing.lastUpdatesPerFrame=u,i.trigger(t,"afterTick",m),t.frameDeltaHistory.length>=100&&(t.lastUpdatesDeferred&&Math.round(t.frameDelta/c)>v?a.warnOnce("Matter.Runner: runner reached runner.maxUpdates, see docs."):t.lastUpdatesDeferred&&a.warnOnce("Matter.Runner: runner reached runner.maxFrameTime, see docs."),void 0!==t.isFixed&&a.warnOnce("Matter.Runner: runner.isFixed is now redundant, see docs."),(t.deltaMin||t.deltaMax)&&a.warnOnce("Matter.Runner: runner.deltaMin and runner.deltaMax were removed, see docs."),0!==t.fps&&a.warnOnce("Matter.Runner: runner.fps was replaced by runner.delta, see docs."));},o.stop=function(e){o._cancelNextFrame(e);},o._onNextFrame=function(e,t){if("undefined"==typeof window||!window.requestAnimationFrame)throw new Error("Matter.Runner: missing required global window.requestAnimationFrame.");return e.frameRequestId=window.requestAnimationFrame(t),e.frameRequestId},o._cancelNextFrame=function(e){if("undefined"==typeof window||!window.cancelAnimationFrame)throw new Error("Matter.Runner: missing required global window.cancelAnimationFrame.");window.cancelAnimationFrame(e.frameRequestId);};var e=function(e){for(var t=0,n=e.length,o=0;o<n;o+=1)t+=e[o];return t/n||0};}();},function(e,t,n){var o={};e.exports=o;var i=n(8),r=n(0).deprecated;o.collides=function(e,t){return i.collides(e,t)},r(o,"collides","SAT.collides ➤ replaced by Collision.collides");},function(e,t,n){var o={};e.exports=o;n(1);var i=n(0);o.pathToVertices=function(e,t){"undefined"==typeof window||"SVGPathSeg"in window||i.warn("Svg.pathToVertices: SVGPathSeg not defined, a polyfill is required.");var n,r,a,s,l,c,u,d,p,f,v,m=[],y=0,g=0,x=0;t=t||15;var h=function(e,t,n){var o=n%2==1&&n>1;if(!p||e!=p.x||t!=p.y){p&&o?(f=p.x,v=p.y):(f=0,v=0);var i={x:f+e,y:v+t};!o&&p||(p=i),m.push(i),g=f+e,x=v+t;}},b=function(e){var t=e.pathSegTypeAsLetter.toUpperCase();if("Z"!==t){switch(t){case"M":case"L":case"T":case"C":case"S":case"Q":g=e.x,x=e.y;break;case"H":g=e.x;break;case"V":x=e.y;}h(g,x,e.pathSegType);}};for(o._svgPathToAbsolute(e),a=e.getTotalLength(),c=[],n=0;n<e.pathSegList.numberOfItems;n+=1)c.push(e.pathSegList.getItem(n));for(u=c.concat();y<a;){if((l=c[e.getPathSegAtLength(y)])!=d){for(;u.length&&u[0]!=l;)b(u.shift());d=l;}switch(l.pathSegTypeAsLetter.toUpperCase()){case"C":case"T":case"S":case"Q":case"A":s=e.getPointAtLength(y),h(s.x,s.y,0);}y+=t;}for(n=0,r=u.length;n<r;++n)b(u[n]);return m},o._svgPathToAbsolute=function(e){for(var t,n,o,i,r,a,s=e.pathSegList,l=0,c=0,u=s.numberOfItems,d=0;d<u;++d){var p=s.getItem(d),f=p.pathSegTypeAsLetter;if(/[MLHVCSQTA]/.test(f))"x"in p&&(l=p.x),"y"in p&&(c=p.y);else switch("x1"in p&&(o=l+p.x1),"x2"in p&&(r=l+p.x2),"y1"in p&&(i=c+p.y1),"y2"in p&&(a=c+p.y2),"x"in p&&(l+=p.x),"y"in p&&(c+=p.y),f){case"m":s.replaceItem(e.createSVGPathSegMovetoAbs(l,c),d);break;case"l":s.replaceItem(e.createSVGPathSegLinetoAbs(l,c),d);break;case"h":s.replaceItem(e.createSVGPathSegLinetoHorizontalAbs(l),d);break;case"v":s.replaceItem(e.createSVGPathSegLinetoVerticalAbs(c),d);break;case"c":s.replaceItem(e.createSVGPathSegCurvetoCubicAbs(l,c,o,i,r,a),d);break;case"s":s.replaceItem(e.createSVGPathSegCurvetoCubicSmoothAbs(l,c,r,a),d);break;case"q":s.replaceItem(e.createSVGPathSegCurvetoQuadraticAbs(l,c,o,i),d);break;case"t":s.replaceItem(e.createSVGPathSegCurvetoQuadraticSmoothAbs(l,c),d);break;case"a":s.replaceItem(e.createSVGPathSegArcAbs(l,c,p.r1,p.r2,p.angle,p.largeArcFlag,p.sweepFlag),d);break;case"z":case"Z":l=t,c=n;}"M"!=f&&"m"!=f||(t=l,n=c);}};},function(e,t,n){var o={};e.exports=o;var i=n(6);n(0);o.create=i.create,o.add=i.add,o.remove=i.remove,o.clear=i.clear,o.addComposite=i.addComposite,o.addBody=i.addBody,o.addConstraint=i.addConstraint;}])}));
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
