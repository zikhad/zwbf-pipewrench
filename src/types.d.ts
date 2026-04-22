import { KahluaTable } from "@asledgehammer/pipewrench";

type ModDataProps<T> = {
	/** The player object from PZ */
	object: { getModData(): KahluaTable };
	/** The key to be used in `getModData()` */
	modKey: string;
	/** The data that shall be returned by default */
	defaultData?: T;
};

type LactationData = {
	isActive: boolean;
	milkAmount: number;
	multiplier: number;
	expiration: number;
};

type LactationImage = {
	breasts: string;
	level: string;
};

type PregnancyData = {
	progress: number;
	current?: number;
	isInLabor?: boolean;
};

/** The different menstrual cycle names */
type CyclePhase =
	"Recovery"
	| "Menstruation"
	| "Follicular"
	| "Ovulation"
	| "Luteal"
	| "Pregnant";

type WombData = {
	amount: number;
	capacity: number;
	total: number;
	cycleDay: number;
	fertility: number;
	onContraceptive: boolean;
	chances: Record<CyclePhase, number>;
};