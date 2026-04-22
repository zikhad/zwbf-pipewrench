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
	/** The type of the item to inject */
	readonly itemType: string;
	/** The spawn chance weight for the item in the distribution table */
	readonly chance: number;
	/** The names of the procedural distribution tables to inject the item into */
	readonly tableNames: readonly string[];
};

/**
 * Compact item definition used when several items share the same target tables.
 */
type DistributionItem = {
	readonly itemType: string;
	readonly chance: number;
};

/**
 * Higher-level grouped definition for location-based loot rules.
 */
type DistributionGroup = {
	readonly tableNames: readonly string[];
	readonly items: readonly DistributionItem[];
};

/**
 * Global flag key to prevent duplicate distribution injection in the same runtime.
 */
const APPLY_FLAG_KEY: string = "__ZWBFProceduralDistributionsApplied";

/**
 * Named groups of procedural distribution tables for reusability and clarity.
 */
const TABLE_GROUPS = {
	/** Bathroom-related distribution tables */
	bathroom: ["BathroomCabinet", "BathroomCounter", "BathroomShelf"],
	/** Bedroom side table distribution tables */
	bedroomSideTables: ["BedroomSidetable", "BedroomSidetableClassy", "BedroomSidetableRedneck"],
	/** Bedroom dresser distribution tables */
	bedroomDressers: ["BedroomDresser", "BedroomDresserClassy", "BedroomDresserRedneck"],
	/** Hospital-related distribution tables */
	hospital: ["HospitalRoomCounter", "HospitalRoomShelves", "MedicalClinicDrugs"],
	/** Hospital room-specific distribution tables */
	hospitalRoom: ["HospitalRoomCounter", "HospitalRoomShelves"],
	/** Store-related distribution tables */
	store: ["GigamartHousewares"],
	/** Trash bin distribution tables */
	trashBins: ["BinBar", "BinBathroom", "BinCrepe", "BinDumpster", "BinFireStation", "BinGeneric", "BinHospital", "BinJays", "BinSpiffos", "SafehouseBin", "SafehouseBin_Mid", "SafehouseBin_Late"],
	/** Drug-related distribution tables */
	drugLocations: ["DrugShackDrugs", "DerelictHouseDrugs"]
} as const;

const createDistributionRules = (groups: readonly DistributionGroup[]): readonly DistributionRule[] => {
	return groups.flatMap(group => group.items.map(item => ({
		itemType: item.itemType,
		chance: item.chance,
		tableNames: group.tableNames
	})));
};

/**
 * Default distribution rules for all ZWBF custom items.
 * Defines which items spawn in which procedural loot tables and at what chance weight.
 */
const ZWBF_DISTRIBUTION_GROUPS: readonly DistributionGroup[] = [
	{
		tableNames: TABLE_GROUPS.bathroom,
		items: [
			{ itemType: "ZWBF.Contraceptive", chance: 60 },
			{ itemType: "ZWBF.Lactaid", chance: 40 },
			{ itemType: "ZWBF.Condom", chance: 80 },
			{ itemType: "ZWBF.CondomBox", chance: 75 },
			{ itemType: "ZWBF.VaginalDouche", chance: 30 }
		]
	},
	{
		tableNames: TABLE_GROUPS.bedroomSideTables,
		items: [
			{ itemType: "ZWBF.Contraceptive", chance: 40 },
			{ itemType: "ZWBF.Lactaid", chance: 20 }
		]
	},
	{
		tableNames: [...TABLE_GROUPS.bedroomDressers, ...TABLE_GROUPS.bedroomSideTables],
		items: [
			{ itemType: "ZWBF.Condom", chance: 80 },
			{ itemType: "ZWBF.CondomBox", chance: 40 }
		]
	},
	{
		tableNames: [...TABLE_GROUPS.bedroomSideTables, "BedroomDresserChild"],
		items: [{ itemType: "ZWBF.BreastPump", chance: 40 }]
	},
	{
		tableNames: TABLE_GROUPS.hospital,
		items: [
			{ itemType: "ZWBF.Contraceptive", chance: 60 },
			{ itemType: "ZWBF.Lactaid", chance: 50 },
			{ itemType: "ZWBF.Condom", chance: 50 }
		]
	},
	{
		tableNames: TABLE_GROUPS.hospitalRoom,
		items: [
			{ itemType: "ZWBF.CondomBox", chance: 40 },
			{ itemType: "ZWBF.BreastPump", chance: 50 },
			{ itemType: "ZWBF.VaginalDouche", chance: 40 }
		]
	},
	{
		tableNames: TABLE_GROUPS.store,
		items: [
			{ itemType: "ZWBF.Contraceptive", chance: 50 },
			{ itemType: "ZWBF.Lactaid", chance: 40 },
			{ itemType: "ZWBF.Condom", chance: 60 },
			{ itemType: "ZWBF.CondomBox", chance: 80 },
			{ itemType: "ZWBF.BreastPump", chance: 40 },
			{ itemType: "ZWBF.VaginalDouche", chance: 30 }
		]
	},
	{
		tableNames: TABLE_GROUPS.trashBins,
		items: [{ itemType: "ZWBF.CondomUsed", chance: 80 }]
	},
	{
		tableNames: TABLE_GROUPS.drugLocations,
		items: [
			{ itemType: "ZWBF.Contraceptive", chance: 30 },
			{ itemType: "ZWBF.Lactaid", chance: 20 },
			{ itemType: "ZWBF.Condom", chance: 50 }
		]
	}
];

const ZWBF_DISTRIBUTION_RULES: readonly DistributionRule[] = createDistributionRules(ZWBF_DISTRIBUTION_GROUPS);

/**
 * Low-level adapter for mutating procedural distribution tables.
 * Encapsulates the logic for safely appending items to a distribution table.
 */
class ProceduralDistributionRepository {
	/**
	 * @param list - The procedural distribution list from the game engine
	 */
	public constructor(private readonly list: ProceduralDistributionList) { }

	/**
	 * Appends an item and its spawn chance to a procedural distribution table.
	 * @param tableName - Name of the distribution table (e.g., "BathroomCabinet")
	 * @param itemType - Full item type ID (e.g., "ZWBF.Condom")
	 * @param chance - Spawn chance weight
	 * @returns True if the item was appended; false if the table does not exist
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
	 * @param repository - Repository for table mutation
	 * @param rules - Distribution rules to apply
	 */
	public constructor(
		private readonly repository: ProceduralDistributionRepository,
		private readonly rules: readonly DistributionRule[]
	) { }

	/**
	 * Applies all distribution rules to their target procedural tables.
	 * @returns Number of successful table injections
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
 * @returns The distribution list, or undefined if unavailable
 */
const getProceduralDistributionList = (): ProceduralDistributionList | undefined => {
	return (globalThis as { ProceduralDistributions?: { list?: ProceduralDistributionList } }).ProceduralDistributions?.list;
};

/**
 * Applies ZWBF distribution rules to procedural loot tables in the game engine.
 * This function is idempotent—it can be called multiple times without duplicating items.
 * It is automatically invoked on module load.
 *
 * @returns Number of successful injections, or 0 if already applied or unavailable
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