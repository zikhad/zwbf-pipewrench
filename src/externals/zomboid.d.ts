/** @noResolution */
declare const ISContextMenu: {
	getNew: (context: unknown) => never;
};

declare const SandboxVars: Record<string, string | number> & {
	ZLBF?: ZLBFSandboxOptions;
};
