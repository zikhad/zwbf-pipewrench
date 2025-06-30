import { getPlayer, ZombRandFloat } from "@asledgehammer/pipewrench";
import { lactation, womb } from "../client/ZWBF/ZWBF";

export const ZWBFRecipes: Recipe = {
	OnTest: {
		HandExpress: () => {
			const player = getPlayer();
			return player.isFemale() && lactation.milkAmount >= lactation.bottleAmount * 2;
		},
		BreastPump: () => {
			const player = getPlayer();
			return player.isFemale() && lactation.milkAmount >= lactation.bottleAmount;
		},
		ClearSperm: () => {
			const player = getPlayer();
			return player.isFemale() && womb.amount > 0;
		}
	},
	OnCreate: {
		HandExpress: () => {
			lactation.useMilk(lactation.bottleAmount * 2, ZombRandFloat(0.05, 0.1));
		},
		BreastPump: () => {
			lactation.useMilk(lactation.bottleAmount, ZombRandFloat(0.1, 0.2));
		},
		ClearSperm: () => {
			womb.amount = 0;
		}
	}
};
