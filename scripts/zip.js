const path = require("path");
const os = require("os");
const fs = require("fs-extra");
// const { join } = require('path');
//const { tmpdir } = require('os');
const { copyFolder, getInfo } = require("./utils");
// const { ensureDirSync, createWriteStream, removeSync } = require('fs-extra');

const archiver = require("archiver");

/**
 * Creates a easy to share zip
 */
const createZip = async () => {
	const { name, zipname } = getInfo();
	const tempDir = path.join(os.tmpdir(), `${name}-temp`);

	fs.ensureDirSync(tempDir);

	await copyFolder(path.join(process.cwd(), "dist", name), path.join(tempDir));

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
