import { Fluid } from "server/types";

export enum ZWBFTraitsEnum {
	INFERTILE = "zwbf:infertile",
	FERTILE = "zwbf:fertile",
	HYPERFERTILE = "zwbf:hyperfertile",
	PREGNANCY = "zwbf:pregnancy",
	DAIRY_COW = "zwbf:dairycow",
	STRONG_MENSTRUAL_CRAMPS = "zwbf:strongmenstrualcramps",
	NO_MENSTRUAL_CRAMPS = "zwbf:nomenstrualcramps"
}

export enum CyclePhaseEnum {
	RECOVERY = "Recovery",
	MENSTRUATION = "Menstruation",
	FOLLICULAR = "Follicular",
	OVULATION = "Ovulation",
	LUTEAL = "Luteal",
	PREGNANT = "Pregnant"
}

export enum ZWBFEventsEnum {
	PREGNANCY_UPDATE = "ZWBFPregnancyUpdate",
	LACTATION_UPDATE = "ZWBFLactationUpdate",
	WOMB_UPDATE = "ZWBFWombUpdate",
	INTERCOURSE = "ZWBFIntercourse",
	MENSTRUAL_EFFECTS = "ZWBFMenstrualEffects",
	PREGNANCY_START = "ZWBFPregnancyStart",
	PREGNANCY_STOP = "ZWBFPregnancyStop",
	PREGNANCY_LABOR = "ZWBFPregnancyLabor",
	ANIMATION = "ZWBFWombAnimation",
	ANIMATION_STOP = "ZWBFWombAnimationStop",
	IMAGE = "ZWBFWombImage"
}

export enum ITEMS {
	CONDOM = "ZWBF.Condom",
	CONDOM_BOX = "ZWBF.CondomBox",
	CONDOM_USED = "ZWBF.CondomUsed",
	LACTAID = "ZWBF.Lactaid",
	CONTRACEPTIVE = "ZWBF.Contraceptive",
	VAGINAL_DOUCHE = "ZWBF.VaginalDouche",
	BREAST_PUMP = "ZWBF.BreastPump",
	BABY = "ZWBF.Baby"

}

export const Fluids: Record<string, Fluid> = {
	HUMAN_MILK: "HumanMilk",
	SEMEN: "Semen"
};

export enum MODS {
	ZOMBOWIN = "ZomboWin",
	ZOMBOWIN_DEFEAT = "ZomboWinDefeatStrip",
	MOODLE_FRAMEWORK = "MoodleFramework"
}

export enum ZWBFAnimations {
	TAKE_PILLS = "ZWBF.TakePills",
	BIRTH = "ZWBF.Birth",
	PUMP_MILK = "ZWBF.PumpMilk",
	CLEAN_SELF = "ZWBF.CleanSelf"
}