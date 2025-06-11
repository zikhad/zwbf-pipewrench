const { pathsToModuleNameMapper, createDefaultPreset } = require("ts-jest");
const { compilerOptions } = require("./tsconfig");

const { transform } = createDefaultPreset();

/** @type {import("jest").Config} **/
module.exports = {
	testEnvironment: "node",
	preset: "ts-jest",
	rootDir: "src",
	setupFiles: ["./test/mock.ts"],
	transform,
	moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
		prefix: "<rootDir>"
	}),
	collectCoverageFrom: ["**/*.(t|j)s"],
	coverageDirectory: "../coverage",
	coverageReporters: ["text", "lcov"],
	coveragePathIgnorePatterns: ["index.(t|j)s"],
	moduleFileExtensions: ["js", "json", "ts", "d.ts", "node"],
	testRegex: ".*\\.spec\\.ts$",
	transformIgnorePatterns: ["/node_modules/(?!<module-name>).+\\.js$"]
};
