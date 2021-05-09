const getPixels = require("get-pixels");
const _ = require("lodash");
const PNG = require("pngjs").PNG;
const fs = require("fs");

class Pixel {
	static get DEFAULT_DEPTH() {
		return 4;
	}
	static get MIN_DIFF() {
		return 5;
	}
	static load_pixels(image) {
		return new Promise((resolve, reject) => {
			getPixels(image, (err, pixels) => {
				if (err) {
					reject(err);
				}
				resolve(Pixel._convertPixelsToRGB(pixels));
			});
		});
	}

	static load_pixels_redraw(image) {
		return new Promise((resolve, reject) => {
			getPixels(image, (err, pixels) => {
				if (err) {
					reject(err);
				}
				resolve(Pixel._convertPixelsToRGBA(pixels));
			});
		});
	}

	static _convertPixelsToRGBA(pixels) {
		const width = pixels.shape[0];
		const height = pixels.shape[1];
		var rgb = [];
		for (var i = 0; i < height; i++) {
			for (var j = 0; j < width; j++) {
				var index = (j + i * width) * 4;
				rgb.push({
					r: pixels.data[index],
					g: pixels.data[index + 1],
					b: pixels.data[index + 2],
					index,
				});
			}
		}
		return { rgb, width, height };
	}

	static _convertPixelsToRGB(pixels) {
		const width = pixels.shape[0];
		const height = pixels.shape[1];
		var rgb = [];
		for (var i = 0; i < height; i++) {
			for (var j = 0; j < width; j++) {
				var index = (j + i * width) * 4;
				rgb.push({
					r: pixels.data[index],
					g: pixels.data[index + 1],
					b: pixels.data[index + 2],
				});
			}
		}
		return rgb;
	}

	static findBiggestRange(rgb) {
		let rMin = Number.POSITIVE_INFINITY;
		let rMax = Number.NEGATIVE_INFINITY;

		let gMin = Number.POSITIVE_INFINITY;
		let gMax = Number.NEGATIVE_INFINITY;

		let bMin = Number.POSITIVE_INFINITY;
		let bMax = Number.NEGATIVE_INFINITY;

		rgb.forEach((pixel) => {
			rMin = Math.min(rMin, pixel.r);
			rMax = Math.max(rMax, pixel.r);
			gMin = Math.min(gMin, pixel.g);
			gMax = Math.max(gMax, pixel.g);
			bMin = Math.min(bMin, pixel.b);
			bMax = Math.max(bMax, pixel.b);
		});

		const rRange = rMax - rMin;
		const gRange = gMax - gMin;
		const bRange = bMax - bMin;

		const biggestRange = Math.max(rRange, gRange, bRange);
		if (biggestRange === rRange) {
			return "r";
		}
		if (biggestRange === gRange) {
			return "g";
		}
		if (biggestRange === bRange) {
			return "b";
		}
	}

	static quantize(rgb, depth = 0, maxDepth = Pixel.DEFAULT_DEPTH) {
		if (depth === 0) {
			console.log(`Quantizing to ${Math.pow(2, maxDepth)} buckets.`);
		}
		if (depth === maxDepth) {
			const color = rgb.reduce(
				(prev, curr) => {
					prev.r += curr.r;
					prev.g += curr.g;
					prev.b += curr.b;
					return prev;
				},
				{
					r: 0,
					g: 0,
					b: 0,
				}
			);
			color.r = Math.round(color.r / rgb.length);
			color.g = Math.round(color.g / rgb.length);
			color.b = Math.round(color.b / rgb.length);

			return [color];
		}
		const filterToSort = Pixel.findBiggestRange(rgb);
		rgb.sort((p1, p2) => {
			return p1[filterToSort] - p2[filterToSort];
		});

		const mid = rgb.length / 2;
		return [
			...Pixel.quantize(rgb.slice(0, mid), depth + 1, maxDepth),
			...Pixel.quantize(rgb.slice(mid + 1), depth + 1, maxDepth),
		];
	}

	static orderByLuminance(rgb) {
		const calcLuminance = (p) => {
			return 0.2126 * p.r + 0.7152 * p.g + 0.0722 * p.b;
		};

		return rgb.sort((p1, p2) => {
			return -calcLuminance(p1) + calcLuminance(p2);
		});
	}

	static orderByHue(rgb) {
		const calcHue = (p) => {
			var h;
			var R, G, B, min, max;
			R = p.r / 255;
			G = p.g / 255;
			B = p.b / 255;
			min = Math.min(R, G, B);
			max = Math.max(R, G, B);
			if (max === R) {
				h = (G - B) / (max - min);
			} else if (max === G) {
				h = 2 + (B - R) / (max - min);
			} else if (max === B) {
				h = 4 + (R - G) / (max - min);
			}
			h *= 60;
			if (h > 0) {
				return Math.floor(h);
			} else {
				return Math.floor(360 - h);
			}
		};

		return rgb.sort((p1, p2) => {
			return -calcHue(p1) + calcHue(p2);
		});
	}

	static calcMostVariance(rgb) {
		var index = 0;
		var max = Number.NEGATIVE_INFINITY;
		rgb
			.map((p) => Math.max(p.r, p.g, p.b) - Math.min(p.r, p.g, p.b))
			.forEach((v, i) => {
				if (v > max) {
					index = i;
					max = v;
				}
			});
		return rgb[index];
	}

	static euclid(p1, p2) {
		return Math.sqrt(
			Math.pow(p1.r - p2.r, 2) +
				Math.pow(p1.g - p2.g, 2) +
				Math.pow(p1.b - p2.b, 2)
		);
	}

	static findCenter(rgb) {
		const color = rgb.reduce(
			(prev, curr) => {
				prev.r += curr.r;
				prev.g += curr.g;
				prev.b += curr.b;
				return prev;
			},
			{
				r: 0,
				g: 0,
				b: 0,
			}
		);
		color.r = Math.round(color.r / rgb.length);
		color.g = Math.round(color.g / rgb.length);
		color.b = Math.round(color.b / rgb.length);
		return color;
	}

	static assignPoints(cluster, rgb) {
		var fin = {};
		cluster.forEach((v, i) => {
			fin[i] = [];
		});
		rgb.forEach((p) => {
			var index = 0;
			var min = Number.POSITIVE_INFINITY;
			cluster.forEach((v, i) => {
				var dis = Pixel.euclid(v.center, p);
				if (dis < min) {
					min = dis;
					index = i;
				}
			});
			fin[index].push(p);
		});
		return fin;
	}

	static fit(rgb, n) {
		var c = [];
		_.sampleSize(rgb, n).forEach((v) => {
			c.push({
				center: v,
				points: [],
			});
		});
		var nm = 0;
		while (nm < 15) {
			var final = Pixel.assignPoints(c, rgb);
			var diff = Number.NEGATIVE_INFINITY;
			for (var i = 0; i < n; i++) {
				if (!final[i]) {
					continue;
				}
				var old = c[i];
				var newCenter = Pixel.findCenter(final[i]);
				c[i] = {
					center: newCenter,
					points: final[i],
				};
				diff = Math.max(diff, Pixel.euclid(old.center, newCenter));
			}
			if (diff < Pixel.MIN_DIFF) {
				console.log("Breaking bad");
				break;
			}
			nm += 1;
		}
		return c;
	}

	static draw(center, width, height) {
		var png = new PNG({
			width,
			height,
			filterType: -1,
		});
		center.forEach((v) => {
			v["points"].forEach((p) => {
				var idx = p["index"];
				png.data[idx] = v["center"].r;
				png.data[idx + 1] = v["center"].g;
				png.data[idx + 2] = v["center"].b;
				png.data[idx + 3] = 255;
			});
		});
		png.pack().pipe(fs.createWriteStream("newOut.png"));
	}
}
module.exports = Pixel;
