import { APPLY_FLAG_KEY, ZLBF_DISTRIBUTION_RULES, applyZLBFDistributions } from "./ZLBFDistributions";

type Entry = { items: unknown[] };

const getExpectedTableItems = (tableNames: readonly string[]) => {
	const expectedItemsByTable = new Map<string, unknown[]>();

	for (const tableName of tableNames) {
		expectedItemsByTable.set(tableName, []);
	}

	for (const rule of ZLBF_DISTRIBUTION_RULES) {
		for (const tableName of rule.tableNames) {
			const expectedItems = expectedItemsByTable.get(tableName);
			if (!expectedItems) {
				continue;
			}

			expectedItems.push(rule.itemType, rule.chance);
		}
	}

	return expectedItemsByTable;
};

const createDistributionTable = (tableNames: readonly string[]) => {
	const list: Record<string, Entry> = {};

	for (const tableName of tableNames) {
		list[tableName] = { items: [] };
	}

	return list;
};

describe("ZLBFDistributions.ts", () => {
	const expectedEntries = ZLBF_DISTRIBUTION_RULES.reduce((count, rule) => count + rule.tableNames.length, 0);

	beforeEach(() => {
		delete (globalThis as any)[APPLY_FLAG_KEY];
		delete (globalThis as any).ProceduralDistributions;
	});

	it("injects item/chance pairs into existing procedural distributions", () => {
		const tableNames = Array.from(new Set(ZLBF_DISTRIBUTION_RULES.flatMap(rule => [...rule.tableNames])));
		const expectedItemsByTable = getExpectedTableItems(tableNames);

		(globalThis as any).ProceduralDistributions = {
			list: createDistributionTable(tableNames)
		};

		const appliedEntries = applyZLBFDistributions();
		expect(appliedEntries).toBe(expectedEntries);

		const list = (globalThis as any).ProceduralDistributions.list;

		for (const tableName of tableNames) {
			expect(list[tableName]?.items).toEqual(expectedItemsByTable.get(tableName));
		}
	});

	it("is idempotent once successfully applied", () => {
		const tableNames = ZLBF_DISTRIBUTION_RULES.flatMap(rule => [...rule.tableNames]);
		(globalThis as any).ProceduralDistributions = {
			list: createDistributionTable(tableNames)
		};

		const firstApply = applyZLBFDistributions();
		const secondApply = applyZLBFDistributions();

		expect(firstApply).toBe(expectedEntries);
		expect(secondApply).toBe(0);
	});

	it("returns zero when procedural distributions are unavailable", () => {
		const appliedEntries = applyZLBFDistributions();
		expect(appliedEntries).toBe(0);
	});
});