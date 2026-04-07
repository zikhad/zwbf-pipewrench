const path = require("path");
const fs = require("fs-extra");
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

/**
 * Parses a .info file (key=value per line)
 * @param {string} content
 * @returns {Record<string, string>}
 */
const parseInfoFile = content => {
	return content
		.split(/\r?\n/)
		.filter(Boolean)
		.reduce((acc, line) => {
			const [key, ...rest] = line.split("=");
			acc[key.trim()] = rest.join("=").trim();
			return acc;
		}, {});
};

/**
 * Converts info object back to .info format
 * @param {Record<string, string>} info
 * @returns {string}
 */
const stringifyInfoFile = info =>
	Object.entries(info)
		.filter(([, value]) => value !== undefined && value !== null)
		.map(([key, value]) => `${key}=${value}`)
		.join("\n");

/**
 * Build 42 requires use a backslash prefix for each dependency.
 * @param {string | undefined} requireValue
 * @returns {string | undefined}
 */
const formatBuild42Require = requireValue => {
	if (!requireValue) {
		return undefined;
	}

	const dependencies = requireValue
		.split(",")
		.map(dep => dep.trim().replace(/^\\+/, ""))
		.filter(Boolean);

	if (dependencies.length === 0) {
		return undefined;
	}

	return `\\${dependencies.join(",\\")}`;
};

const generateBuild42Folder = async () => {
	const { name } = getInfo();
	const basePath = path.join(process.cwd(), "dist", name);
	const build42Path = path.join(basePath, "42");

	await fs.ensureDir(build42Path);

	const baseEntries = await fs.readdir(basePath);
	for (const entry of baseEntries) {
		if (entry === "42") {
			continue;
		}

		const src = path.join(basePath, entry);
		const dest = path.join(build42Path, entry);
		await fs.copy(src, dest, { overwrite: true });
	}

	const build42InfoPath = path.join(build42Path, "mod.info");
	if (await fs.pathExists(build42InfoPath)) {
		const raw = await fs.readFile(build42InfoPath, "utf8");
		const parsed = parseInfoFile(raw);
		const transformed = {
			...parsed,
			require: formatBuild42Require(parsed.require),
			version: "42"
		};

		await fs.writeFile(build42InfoPath, stringifyInfoFile(transformed));
	}
};

const run = async () => {
	try {
		await copyFolder(srcPath("src/media"), distPath(""));
		console.info("media folder copied successfully.");

		await copyFolder(srcPath("src/translations"), distPath("lua/shared/Translate"));
		console.info("Translations folder copied successfully.");

		await copyFolder(srcPath("src/root"), distPath("", false));
		console.info("Root folder copied successfully.");

		await generateBuild42Folder();
		console.info("Build 42 folder structure ready.");

		await fs.remove(distPath(""));
		console.info("Root media folder removed (Build 42 only artifact).");
	} catch (err) {
		console.error("Error copying files:", err);
		process.exitCode = 1;
	}
};

run();
