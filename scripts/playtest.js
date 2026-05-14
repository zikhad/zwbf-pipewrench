const path = require("path");
const os = require("os");
const fs = require("fs-extra");
const { getInfo, sanitizeFolderName } = require("./utils");

const run = async () => {
	try {
		const targetPath = await deployPlaytestBuild();
		console.info(`Playtest build deployed to: ${targetPath}`);
	} catch (err) {
		console.error("Failed to deploy playtest build:", err);
		process.exitCode = 1;
	}
};

/**
 * Removes the currently installed playtest folder and moves the built dist folder to mods.
 * @param {{ cwd?: string, homeDir?: string, info?: { name: string }, fsModule?: typeof import("fs-extra") }} [options]
 * @returns {Promise<string>} targetPath
 */
const deployPlaytestBuild = async (options = {}) => {
	const { cwd = process.cwd(), homeDir = os.homedir(), info = getInfo(), fsModule = fs } = options;
	const finalFolderName = sanitizeFolderName(info.name);
	const sourcePath = path.join(cwd, "dist", finalFolderName);
	const modsPath = path.join(homeDir, "Zomboid", "mods");
	const targetPath = path.join(modsPath, finalFolderName);

	if (!(await fsModule.pathExists(sourcePath))) {
		throw new Error(
			`Built mod folder not found at ${sourcePath}. Run build/postbuild before playtest deploy.`
		);
	}

	await fsModule.ensureDir(modsPath);

	if (await fsModule.pathExists(targetPath)) {
		await fsModule.remove(targetPath);
		console.info(`Removed existing playtest folder: ${targetPath}`);
	}

	await fsModule.move(sourcePath, targetPath);
	return targetPath;
};

module.exports = {
	sanitizeFolderName,
	deployPlaytestBuild
};

if (require.main === module) {
	run();
}