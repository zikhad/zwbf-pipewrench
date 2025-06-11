const path = require("path");
const { copyFolder, getInfo } = require("./utils");

/**
 * returns the src Path for this operation
 * @param {string} dirPath
 * @returns {string}
 */
const srcPath = dirPath => path.join(process.cwd(), ...dirPath.split("/"));

/**
 * returns the dist path (inside media) for this operation
 * @param {string} dirPath
 * @param {boolean} media should include the media folder in destPath ?
 * @returns {string}
 */
const distPath = (dirPath, media = true) => {
	const { name } = getInfo();
	return path.join(process.cwd(), "dist", name, media ? "media" : "", ...dirPath.split("/"));
};

// Copy ui folder to dist
copyFolder(srcPath("src/ui"), distPath("ui"))
	.then(() => {
		console.info("ui folder copied successfully.");
	})
	.catch(err => {
		console.error("Error copying ui folder:", err);
	});

// Copy translations to dist
copyFolder(srcPath("src/translations"), distPath("lua/shared/Translate"))
	.then(() => {
		console.info("Translations folder copied successfully.");
	})
	.catch(err => {
		console.error("Error copying translations folder:", err);
	});

copyFolder(srcPath("src/root"), distPath("", false))
	.then(() => {
		console.info("copy root folder copied successfully.");
	})
	.catch(err => {
		console.error("Error copying root folder:", err);
	});
