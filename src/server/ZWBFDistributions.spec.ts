import { APPLY_FLAG_KEY, ZWBF_DISTRIBUTION_RULES, applyZWBFDistributions } from "./ZWBFDistributions";

type Entry = { items: unknown[] };

const createDistributionTable = (tableNames: readonly string[]) => {
	const list: Record<string, Entry> = {};

	for (const tableName of tableNames) {
		list[tableName] = { items: [] };
	}

	return list;
};

describe("ZWBFDistributions.ts", () => {
	const expectedEntries = ZWBF_DISTRIBUTION_RULES.reduce((count, rule) => count + rule.tableNames.length, 0);

	beforeEach(() => {
		delete (globalThis as Record<string, unknown>)[APPLY_FLAG_KEY];
		delete (globalThis as { ProceduralDistributions?: unknown }).ProceduralDistributions;
	});

	it("injects item/chance pairs into existing procedural distributions", () => {
		const tableNames = [
			"BathroomCabinet",
			"BathroomCounter",
			"BathroomShelf",
			"DrugShackDrugs",
			"DerelictHouseDrugs",
			"StoreCounterCleaning",
			"HospitalRoomCounter",
			"HospitalRoomShelves",
			"HospitalRoomWardrobe",
			"WardrobeChild",
			"GigamartHousewares"
		] as const;

		(globalThis as { ProceduralDistributions: { list: Record<string, Entry> } }).ProceduralDistributions = {
			list: createDistributionTable(tableNames)
		};

		const appliedEntries = applyZWBFDistributions();
		expect(appliedEntries).toBe(expectedEntries);

		const list = (globalThis as { ProceduralDistributions: { list: Record<string, Entry> } }).ProceduralDistributions.list;
		expect(list.BathroomCounter.items).toContain("ZWBF.Condom");
		expect(list.BathroomCounter.items).toContain(2);
		expect(list.BathroomCounter.items).toContain("ZWBF.CondomBox");
		expect(list.BathroomCounter.items).toContain(0.8);
		expect(list.BathroomCounter.items).toContain("ZWBF.VaginalDouche");
		expect(list.BathroomCounter.items).toContain(0.5);
		expect(list.HospitalRoomShelves.items).toContain("ZWBF.BreastPump");
		expect(list.HospitalRoomShelves.items).toContain(0.15);
	});

	it("is idempotent once successfully applied", () => {
		const tableNames = ZWBF_DISTRIBUTION_RULES.flatMap(rule => [...rule.tableNames]);
		(globalThis as { ProceduralDistributions: { list: Record<string, Entry> } }).ProceduralDistributions = {
			list: createDistributionTable(tableNames)
		};

		const firstApply = applyZWBFDistributions();
		const secondApply = applyZWBFDistributions();

		expect(firstApply).toBe(expectedEntries);
		expect(secondApply).toBe(0);
	});

	it("returns zero when procedural distributions are unavailable", () => {
		const appliedEntries = applyZWBFDistributions();
		expect(appliedEntries).toBe(0);
	});
});