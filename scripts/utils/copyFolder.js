const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");
const cliProgress = require("cli-progress");

/**
 * Remove .DS_Store files recursively
 * @param {string} dir the folder to look for .DS_Store files
 */
const removeDSStore = dir => {
	fs.readdirSync(dir).forEach(file => {
		const filePath = path.join(dir, file);
		const stats = fs.statSync(filePath);

		if (stats.isDirectory()) {
			removeDSStore(filePath);
		} else if (file === ".DS_Store") {
			fs.unlinkSync(filePath);
		}
	});
};

/**
 * Optimize Images using sharp library
 * @param {string} srcFilePath image to optimize
 * @param {string} destFilePath path to save the optimized image
 */
const optimizeImage = async (srcFilePath, destFilePath) => {
	try {
		const ext = path.extname(srcFilePath).toLowerCase();
		const image = sharp(srcFilePath);
		if (ext === ".png") {
			await image.png({ quality: 80, compressionLevel: 9 }).toFile(destFilePath);
		} else if ([".jpg", ".jpeg"].includes(ext)) {
			await image.jpeg({ quality: 80 }).toFile(destFilePath);
		}
	} catch (error) {
		console.error(`⚠️ Failed to optimize image ${srcFilePath}:`, error);
	}
};

/**
 * Recursively all files paths
 * @param {string} dir folder to look for files
 * @returns {Promise<string[]>} path with all the files
 */
const gatherAllFiles = async dir => {
	const items = await fs.readdir(dir, { withFileTypes: true });
	const filePaths = [];

	for (const item of items) {
		const fullPath = path.join(dir, item.name);
		if (item.isDirectory()) {
			const subFiles = await gatherAllFiles(fullPath);
			filePaths.push(...subFiles);
		} else {
			filePaths.push(fullPath);
		}
	}
	return filePaths;
};

/**
 * Recursively copy files while optimizing images
 * @param {string} srcDir Path to copy from
 * @param {string} destDir Path to copy to
 * @param {cliProgress} progressBar the progress bar from cli-progress library
 */
const copyAndOptimizeRecursive = async (srcDir, destDir, progressBar) => {
	const items = await fs.readdir(srcDir, { withFileTypes: true });
	await fs.ensureDir(destDir);

	for (const item of items) {
		const srcPath = path.join(srcDir, item.name);
		const destPath = path.join(destDir, item.name);

		if (item.isDirectory()) {
			await copyAndOptimizeRecursive(srcPath, destPath, progressBar);
		} else {
			const ext = path.extname(item.name).toLowerCase();
			const isImage = [".png", ".jpg", ".jpeg"].includes(ext);

			if (isImage) {
				await optimizeImage(srcPath, destPath);
			} else {
				await fs.copy(srcPath, destPath);
			}

			progressBar.increment();
		}
	}
};

/**
 * Copy folder, while recursively optimize images
 * @param {string} srcPath Path to copy from
 * @param {string} destPath Path to copy to
 */
const copyFolder = async (srcPath, destPath) => {
	if (!fs.existsSync(srcPath)) {
		console.log(`📁 No files to copy from ${srcPath}...`);
	} else {
		console.log(`📁 Copying and optimizing files from ${srcPath} to ${destPath}`);

		const allFiles = await gatherAllFiles(srcPath);

		const progressBar = new cliProgress.SingleBar({
			format: "Progress |{bar}| {percentage}% | {value}/{total} files",
			barCompleteChar: "█",
			barIncompleteChar: "░",
			hideCursor: true
		});
		progressBar.start(allFiles.length, 0);

		await copyAndOptimizeRecursive(srcPath, destPath, progressBar);

		removeDSStore(destPath);

		progressBar.stop();
		console.log("✅ Copy and optimization complete!");
	}
};

module.exports = {
	copyFolder
};
