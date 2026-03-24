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
 * Reads optional build42 config from build42.config.json
 * @returns {{require?: string[], requireMap?: Record<string, string>}}
 */
const getBuild42Config = () => {
	const configPath = path.join(process.cwd(), "build42.config.json");
	if (!fs.existsSync(configPath)) {
		return {};
	}

	try {
		const raw = fs.readFileSync(configPath, "utf8");
		return JSON.parse(raw);
	} catch (_err) {
		return {};
	}
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
 * @param {Record<string, string>}
 * @returns {string}
 */
const stringifyInfoFile = info =>
	Object.entries(info)
		.filter(([, value]) => value !== undefined && value !== null)
		.map(([key, value]) => `${key}=${value}`)
		.join("\n");

/**
 * Parses a mod.info require line into dependency ids
 * @param {string | undefined} requireValue
 * @returns {string[]}
 */
const parseRequireDependencies = requireValue => {
	if (!requireValue) {
		return [];
	}

	return requireValue
		.split(",")
		.map(dep => dep.trim().replace(/^\\+/, ""))
		.filter(Boolean);
};

/**
 * Resolves build 42 dependencies from config overrides/map
 * @param {string | undefined} currentRequire
 * @param {{require?: string[], requireMap?: Record<string, string>}} build42Config
 * @returns {string[]}
 */
const resolveBuild42Dependencies = (currentRequire, build42Config) => {
	if (Array.isArray(build42Config.require) && build42Config.require.length > 0) {
		return build42Config.require;
	}

	const requireMap = build42Config.requireMap || {};
	const currentDependencies = parseRequireDependencies(currentRequire);
	return currentDependencies.map(dep => requireMap[dep] || dep);
};

/**
 * Applies Build 42-specific changes
 * @param {Record<string, string>}
 * @returns {Record<string, string>}
 */
const transformInfoForBuild42 = info => {
	const build42Config = getBuild42Config();
	const dependencies = resolveBuild42Dependencies(info.require, build42Config);

	return {
		...info,
		require: dependencies.length > 0 ? `\\${dependencies.join(",\\")}` : undefined,
		version: "42"
	};
};

const generateBuild42Files = async () => {
	const { name } = getInfo();
	const basePath = path.join(process.cwd(), "dist", name);
	const build42Path = path.join(basePath, "42");

	await fs.ensureDir(build42Path);

	/* ----------------------------
	   1. Copy legacy artifacts
	   ---------------------------- */
	const legacyFiles = ["logo.png", "poster.png"];
	await Promise.all(
		legacyFiles.map(async file => {
			const src = path.join(basePath, file);
			const dest = path.join(build42Path, file);
			if (await fs.pathExists(src)) {
				await fs.copy(src, dest);
			}
		})
	);

	const legacyMedia = path.join(basePath, "media");
	if (await fs.pathExists(legacyMedia)) {
		await fs.remove(path.join(build42Path, "media"));
		await fs.copy(legacyMedia, path.join(build42Path, "media"));
	}

	/* ----------------------------
	   2. Rewrite mod.info
	   ---------------------------- */
	const infoPath = path.join(basePath, "mod.info");
	if (await fs.pathExists(infoPath)) {
		const raw = await fs.readFile(infoPath, "utf8");
		const parsed = parseInfoFile(raw);
		const transformed = transformInfoForBuild42(parsed);
		const output = stringifyInfoFile(transformed);

		await fs.writeFile(path.join(build42Path, "mod.info"), output);
	}

	/* ----------------------------
	   3. Overlay src/42 (override)
	   ---------------------------- */
	const src42Path = srcPath("src/42");
	if (await fs.pathExists(src42Path)) {
		await fs.copy(src42Path, build42Path, { overwrite: true });
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

		await generateBuild42Files();
		console.info("Build 42 folder structure ready.");
	} catch (err) {
		console.error("Error copying files:", err);
		process.exitCode = 1;
	}
};

run();
