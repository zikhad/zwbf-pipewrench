import { KahluaTable } from "@asledgehammer/pipewrench";

type ModDataProps<T> = {
	/** The player object from PZ */
	object: { getModData(): KahluaTable };
	/** The key to be used in `getModData()` */
	modKey: string;
	/** The data that shall be returned by default */
	defaultData?: T;
};

/* export enum ZWBFTraits {
	INFERTILE = "Infertile",
	FERTILE = "Fertile",
	HYPERFERTILE = "Hyperfertile",
	PREGNANCY = "Pregnancy",
	DAIRY_COW = "DairyCow",
	STRONG_MENSTRUAL_CRAMPS = "StrongMenstrualCramps",
	NO_MENSNTRUAL_CRAMPS = "NoMenstrualCramps"
} */

type ZWBFTraits = "Infertile"
| "Fertile"
| "Hyperfertile"
| "Pregnancy"
| "DairyCow"
| "StrongMenstrualCramps"
| "NoMenstrualCramps";

type TraitType = {
	id: ZWBFTraits;
	cost: number;
	profession?: boolean,
	exclusives?: ZWBFTraits[]
}

type LactationData = {
	isActive: boolean;
	milkAmount: number;
	multiplier: number;
	expiration: number;
}

type LactationImage = {
	breasts: string;
	level: string;
}

type PregnancyData = {
	isPregnant: boolean;
	progress: number;
	isInLabor?: boolean;
}

type CyclePhase = "Recovery" | "Menstruation" | "Follicular" | "Ovulation" | "Luteal" | "Pregnant";

type WombData = {
	amount: number;
	total: number;
	cycleDay: number;
	fertility: number;
	onContraceptive: boolean;
	chances: Map<CyclePhase, number>;
}