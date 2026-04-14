import { MilkOptions, PregnancyOptions, WombOptions } from "./SandboxOptions";

describe("SandboxOptions", () => {
	afterEach(() => {
		delete (globalThis as { SandboxVars?: unknown }).SandboxVars;
	});

	it("falls back to defaults when SandboxVars.ZWBF is unavailable", () => {
		expect(PregnancyOptions.duration).toBe(14 * 24 * 60);
		expect(PregnancyOptions.recovery).toBe(7);
		expect(WombOptions.capacity).toBe(1000);
		expect(WombOptions.recovery).toBe(7);
		expect(MilkOptions.capacity).toBe(1000);
		expect(MilkOptions.expiration).toBe(7);
	});

	it("reads nested values from SandboxVars.ZWBF", () => {
		(globalThis as { SandboxVars?: { ZWBF?: ZWBFSandboxOptions } }).SandboxVars = {
			ZWBF: {
				PregnancyDuration: 21,
				PregnancyRecovery: 10,
				WombMaxCapacity: 1750,
				MilkCapacity: 2400,
				MilkExpiration: 12
			}
		};

		expect(PregnancyOptions.duration).toBe(21 * 24 * 60);
		expect(PregnancyOptions.recovery).toBe(10);
		expect(WombOptions.capacity).toBe(1750);
		expect(WombOptions.recovery).toBe(10);
		expect(MilkOptions.capacity).toBe(2400);
		expect(MilkOptions.expiration).toBe(12);
	});
});