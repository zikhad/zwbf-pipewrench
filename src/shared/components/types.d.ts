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
| "NoMenstrualCramps"


type TraitType = {
	id: ZWBFTraits;
	cost: number;
	profession?: boolean,
	exclusives?: ZWBFTraits[]
}