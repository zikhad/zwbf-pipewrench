import { ZombRandFloat } from "@asledgehammer/pipewrench";
import { lactation, womb } from "@client/ZWBF";

ZWBFRecipes = {
	OnTest: {
		HandExpress: (_item, character) => {
			return character.isFemale() && lactation.milkAmount >= lactation.bottleAmount * 2;
		},
		BreastPump: (_item, character) => {
			return character.isFemale() && lactation.milkAmount >= lactation.bottleAmount;
		},
		ClearSperm: (_item, character) => {
			return character.isFemale() && womb.amount > 0;
		}
	},
	OnCreate: {
		HandExpress: (_craftRecipeData, _character) => {
			lactation.useMilk(lactation.bottleAmount * 2, ZombRandFloat(0.05, 0.1));
		},
		BreastPump: (_craftRecipeData, _character) => {
			lactation.useMilk(lactation.bottleAmount, ZombRandFloat(0.1, 0.2));
		},
		ClearSperm: (_craftRecipeData, _character) => {
			womb.amount = 0;
		}
	}
};