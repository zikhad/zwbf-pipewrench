const { readFileSync } = require("fs-extra");
const { join } = require("path");

/**
 * Reads and parses `package.json` and `pipewrench.json` files from the current working directory,
 * and returns relevant mod packaging info.
 *
 * @returns {{ name: string, version: string, zipname: string }} An object containing:
 * - `name`: The mod ID from `pipewrench.json`
 * - `version`: The version from `package.json`
 * - `zipname`: A zip filename combining mod ID and version
 */
const getInfo = () => {
	/** @type {{ version: string }} */
	const { version } = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));

	/** @type {{ modInfo: { id: string } }} */
	const { modInfo } = JSON.parse(readFileSync(join(process.cwd(), "pipewrench.json"), "utf-8"));

	return {
		name: modInfo.id,
		version,
		zipname: `${modInfo.id}-${version}.zip`
	};
};

module.exports = {
	getInfo
};
