const argv = require("yargs").argv;
const Pixel = require("./pixel-stuff");
const image = argv.image;
const number = argv.number;
const type = argv.type;
const option = argv.option;
const fs = require("fs");
const PNG = require("pngjs").PNG;

console.time("start");
if (!image) {
	console.error("You must provide an image with the --image flag");
	process.exit(1);
}

if (!number && type === "kmeans") {
	console.error(
		"You must enter number of colours required in the palette with the --number flag"
	);
	process.exit(1);
}

if (!option && type === "mediancut") {
	console.error(
		"You must provide the sorting criterion with the --option flag"
	);
	process.exit(1);
}

if (!type) {
	console.error("You must provide the method with the --type flag");
	process.exit(1);
}
if (type == "kmeans" || type === "mediancut") {
	Pixel.load_pixels(image).then((pixels) => {
		if (type === "kmeans") {
			var centers = Pixel.fit(pixels, number);
			col = [];
			centers.forEach((v) => {
				col.push(v.center);
			});
			col = Pixel.orderByLuminance(col);
		} else if (type === "mediancut") {
			var bucket = Pixel.quantize(pixels);
			var col =
				option === "hue"
					? Pixel.orderByHue(bucket)
					: Pixel.orderByLuminance(bucket);
		}

		const fs = require("fs");
		paletteHTML = `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8"/>
				<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
				<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
				<title>Palette for ${image}</title>
				<style>
					html,body{
						width: 100%;
						height:100%;
						margin: 0;
						padding: 0;
					}
					body{
						display: flex;
						flex-wrap: wrap;
					}
					.color{
						width: 25%;
						height: 25%;
					}
				</style>
			</head>
			<body>
				${col.reduce((prev, color) => {
					return (
						prev +
						`<div class="color" style="background-color: rgb(${color.r},${color.g},${color.b})"></div>`
					);
				}, "")}
			</body>
			</html>
		`;
		fs.writeFileSync("palette.html", paletteHTML);
		console.timeEnd("start");
	});
} else {
	(async function () {
		try {
			var { rgb, width, height } = await Pixel.load_pixels_redraw(image);
			var centers = Pixel.fit(rgb, number);
			Pixel.draw(centers, width, height);
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	})();
}
