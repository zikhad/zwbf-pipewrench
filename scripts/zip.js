const path = require("path");
const os = require("os");
const fs = require("fs-extra");
// const { join } = require('path');
//const { tmpdir } = require('os');
const { copyFolder, getInfo } = require("./utils");
// const { ensureDirSync, createWriteStream, removeSync } = require('fs-extra');

const archiver = require("archiver");

/**
 * Sanitizes the mod name to a filesystem-safe folder name.
 * @param {string} value
 * @returns {string}
 */
const sanitizeFolderName = value => {
	const sanitized = value
		.replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
		.replace(/[.\s]+$/g, "")
		.trim();

	return sanitized || "mod";
};

/**
 * Creates a easy to share zip
 */
const createZip = async () => {
	const { id, name, zipname } = getInfo();
	const tempDir = path.join(os.tmpdir(), `${id}-temp`);
	const sourceByName = path.join(process.cwd(), "dist", sanitizeFolderName(name));
	const sourceById = path.join(process.cwd(), "dist", id);
	const sourcePath = (await fs.pathExists(sourceByName)) ? sourceByName : sourceById;

	fs.ensureDirSync(tempDir);

	await copyFolder(sourcePath, path.join(tempDir));

	const output = fs.createWriteStream(zipname);
	const archive = archiver("zip", { zlib: { level: 9 } });

	archive.pipe(output);
	archive.directory(tempDir, false);
	await archive.finalize();

	fs.removeSync(tempDir);
};

createZip().catch(err => {
	console.error("Error preparing zip file:", err);
});
