export enum ZWBFTraitsEnum {
	INFERTILE = "zwbf:infertile",
	FERTILE = "zwbf:fertile",
	HYPERFERTILE = "zwbf:hyperfertile",
	PREGNANCY = "zwbf:pregnancy",
	DAIRY_COW = "zwbf:dairycow",
	STRONG_MENSTRUAL_CRAMPS = "zwbf:strongmenstrualcramps",
	NO_MENSNTRUAL_CRAMPS = "zwbf:nomenstrualcramps"
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
	ANIMATION_UPDATE = "ZWBFAnimationUpdate",
	INTERCOURSE = "ZWBFIntercourse",
	PREGNANCY_START = "ZWBFPregnancyStart",
	WOMB_HOURLY_UPDATE = "ZWBFWombOnEveryHour"
}
