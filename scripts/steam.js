const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const archiver = require("archiver");
const { copyFolder, getInfo } = require("./utils");

/**
 * Creates a zip for steam workshop
 */
async function prepareSteamZip() {
	const { name, zipname } = getInfo();
	const tempPath = path.join(os.tmpdir(), `${name}-temp`);
	// steam workshop expectets the following structure mod-name/contents/mods/mod-name
	const modPath = path.join(tempPath, "contents", "mods");

	// Ensure folder structure in temp directory
	fs.ensureDirSync(modPath);

	// Copy items from the source contents folder to the generated contents folder
	await copyFolder(path.join(process.cwd(), "contents"), tempPath);

	// Copy mod files to the expected modPath
	await copyFolder(path.join(process.cwd(), "dist"), modPath);

	// Create zip
	const finalZipName = zipname.replace(".zip", "-steam.zip");
	const output = fs.createWriteStream(finalZipName);
	const archive = archiver("zip", { zlib: { level: 9 } });

	output.on("close", () => {
		console.info(`${finalZipName} has been created.`);
	});

	archive.pipe(output);
	archive.directory(tempPath, name);
	await archive.finalize();

	fs.removeSync(tempPath);
}

prepareSteamZip().catch(err => {
	console.error("Error preparing Steam zip file:", err);
});
