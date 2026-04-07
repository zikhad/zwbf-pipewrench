const path = require("path");
const fs = require("fs-extra");

/**
 * Recursively collects all files with a given extension.
 * @param {string} baseDir
 * @param {string} extension
 * @returns {Promise<string[]>}
 */
const collectFilesByExtension = async (baseDir, extension) => {
	const entries = await fs.readdir(baseDir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const fullPath = path.join(baseDir, entry.name);
		if (entry.isDirectory()) {
			const nested = await collectFilesByExtension(fullPath, extension);
			files.push(...nested);
			continue;
		}

		if (entry.isFile() && path.extname(entry.name).toLowerCase() === extension) {
			files.push(fullPath);
		}
	}

	return files;
};

/**
 * Loads translation json files from src/translations-json.
 * Expected structure: <source>/<locale>/<namespace>.json
 * @param {string} sourceRoot
 * @returns {Promise<Record<string, Record<string, Record<string, string>>>>}
 */
const loadTranslationSource = async sourceRoot => {
	if (!(await fs.pathExists(sourceRoot))) {
		return {};
	}

	const jsonFiles = await collectFilesByExtension(sourceRoot, ".json");
	const result = {};

	for (const filePath of jsonFiles) {
		const locale = path.basename(path.dirname(filePath));
		const namespace = path.basename(filePath, ".json");
		const content = await fs.readJson(filePath);

		if (!content || typeof content !== "object" || Array.isArray(content)) {
			throw new Error(`Invalid translation file format: ${filePath}`);
		}

		for (const [key, value] of Object.entries(content)) {
			if (typeof value !== "string") {
				throw new Error(
					`Invalid translation value for key '${key}' in ${filePath}. Values must be strings.`
				);
			}
		}

		if (!result[locale]) {
			result[locale] = {};
		}
		result[locale][namespace] = content;
	}

	return result;
};

/**
 * Generates Build 42 translation json files from src/translations-json.
 * @param {{sourceRoot: string, build42TranslateRoot: string}} paths
 */
const generateTranslations = async ({ sourceRoot, build42TranslateRoot }) => {
	const source = await loadTranslationSource(sourceRoot);
	const locales = Object.keys(source);

	if (locales.length === 0) {
		return { generated: false, fileCount: 0 };
	}

	let fileCount = 0;

	for (const locale of locales) {
		const namespaces = source[locale];
		const namespaceNames = Object.keys(namespaces);

		for (const namespace of namespaceNames) {
			const entries = namespaces[namespace];
			const build42Path = path.join(build42TranslateRoot, locale, `${namespace}.json`);

			await fs.ensureDir(path.dirname(build42Path));
			await fs.writeJson(build42Path, entries, { spaces: 4 });
			fileCount += 1;
		}
	}

	return { generated: true, fileCount };
};

module.exports = {
	generateTranslations
};