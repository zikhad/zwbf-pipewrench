/**
 * A single procedural loot distribution table entry.
 */
type ProceduralDistributionEntry = {
	items: unknown[];
};

/**
 * Map of all procedural distribution tables by name.
 */
type ProceduralDistributionList = Record<string, ProceduralDistributionEntry | undefined>;

/**
 * Configuration for injecting a custom item into procedural distribution tables.
 */
type DistributionRule = {
	readonly itemType: string;
	readonly chance: number;
	readonly tableNames: readonly string[];
};

/**
 * Global flag key to prevent duplicate distribution injection in the same runtime.
 */
const APPLY_FLAG_KEY: string = "__ZWBFProceduralDistributionsApplied";

/**
 * Default distribution rules for all ZWBF custom items.
 * Defines which items spawn in which procedural loot tables and at what chance weight.
 * @type {readonly DistributionRule[]}
 */
const ZWBF_DISTRIBUTION_RULES: readonly DistributionRule[] = [
	{
		itemType: "ZWBF.Condom",
		chance: 2,
		tableNames: ["BathroomCabinet", "BathroomCounter", "BathroomShelf", "DrugShackDrugs", "DerelictHouseDrugs"]
	},
	{
		itemType: "ZWBF.CondomBox",
		chance: 0.8,
		tableNames: ["BathroomCabinet", "BathroomCounter", "DrugShackDrugs", "StoreCounterCleaning"]
	},
	{
		itemType: "ZWBF.VaginalDouche",
		chance: 0.5,
		tableNames: ["BathroomCabinet", "BathroomCounter", "HospitalRoomCounter", "HospitalRoomShelves"]
	},
	{
		itemType: "ZWBF.BreastPump",
		chance: 0.15,
		tableNames: ["HospitalRoomShelves", "HospitalRoomWardrobe", "WardrobeChild", "GigamartHousewares"]
	}
];

/**
 * Low-level adapter for mutating procedural distribution tables.
 * Encapsulates the logic for safely appending items to a distribution table.
 */
class ProceduralDistributionRepository {
	/**
	 * @param {ProceduralDistributionList} list - The procedural distribution list from the game engine
	 */
	public constructor(private readonly list: ProceduralDistributionList) {}

	/**
	 * Appends an item and its spawn chance to a procedural distribution table.
	 * @param {string} tableName - Name of the distribution table (e.g., "BathroomCabinet")
	 * @param {string} itemType - Full item type ID (e.g., "ZWBF.Condom")
	 * @param {number} chance - Spawn chance weight
	 * @returns {boolean} True if the item was appended; false if the table does not exist
	 */
	public appendItem(tableName: string, itemType: string, chance: number): boolean {
		const distribution = this.list[tableName];
		if (!distribution) {
			return false;
		}

		distribution.items.push(itemType, chance);
		return true;
	}
}

/**
 * High-level orchestrator for applying ZWBF distribution rules to the game engine.
 * Iterates through all distribution rules and applies them to their target tables.
 */
class ZWBFDistributionRegistrer {
	/**
	 * @param {ProceduralDistributionRepository} repository - Repository for table mutation
	 * @param {readonly DistributionRule[]} rules - Distribution rules to apply
	 */
	public constructor(
		private readonly repository: ProceduralDistributionRepository,
		private readonly rules: readonly DistributionRule[]
	) {}

	/**
	 * Applies all distribution rules to their target procedural tables.
	 * @returns {number} Number of successful table injections
	 */
	public apply(): number {
		let appliedEntries = 0;

		for (const rule of this.rules) {
			for (const tableName of rule.tableNames) {
				if (this.repository.appendItem(tableName, rule.itemType, rule.chance)) {
					appliedEntries += 1;
				}
			}
		}

		return appliedEntries;
	}
}

/**
 * Safely retrieves the procedural distribution list from the global game engine.
 * @returns {ProceduralDistributionList | undefined} The distribution list, or undefined if unavailable
 */
const getProceduralDistributionList = (): ProceduralDistributionList | undefined => {
	return (globalThis as { ProceduralDistributions?: { list?: ProceduralDistributionList } }).ProceduralDistributions?.list;
};

/**
 * Applies ZWBF distribution rules to procedural loot tables in the game engine.
 * This function is idempotent—it can be called multiple times without duplicating items.
 * It is automatically invoked on module load.
 *
 * @returns {number} Number of successful injections, or 0 if already applied or unavailable
 */
const applyZWBFDistributions = (): number => {
	const globals = globalThis as Record<string, unknown>;
	if (globals[APPLY_FLAG_KEY] === true) {
		return 0;
	}

	const list = getProceduralDistributionList();
	if (!list) {
		return 0;
	}

	const repository = new ProceduralDistributionRepository(list);
	const registrer = new ZWBFDistributionRegistrer(repository, ZWBF_DISTRIBUTION_RULES);
	const appliedEntries = registrer.apply();

	globals[APPLY_FLAG_KEY] = true;
	return appliedEntries;
};

applyZWBFDistributions();

export { APPLY_FLAG_KEY, ZWBF_DISTRIBUTION_RULES, applyZWBFDistributions };