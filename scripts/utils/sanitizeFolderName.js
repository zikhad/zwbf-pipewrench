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

module.exports = {
	sanitizeFolderName
};
