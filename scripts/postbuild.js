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

const run = async () => {
	try {
		await copyFolder(srcPath("src/media"), distPath(""));
		console.info("media folder copied successfully.");

		await copyFolder(srcPath("src/translations"), distPath("lua/shared/Translate"));
		console.info("Translations folder copied successfully.");

		await copyFolder(srcPath("src/root"), distPath("", false));
		console.info("Root folder copied successfully.");
	} catch (err) {
		console.error("Error copying files:", err);
		process.exitCode = 1;
	}
};

run();
