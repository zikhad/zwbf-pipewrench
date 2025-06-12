import { getPlayer, ZombRandFloat } from "@asledgehammer/pipewrench"
import { lactation, womb } from "../client/ZWBF/ZWBF"

export const ZWBFRecipes: Recipe = {
	OnTest: {
		HandExpress: () => {
			const player = getPlayer();
			const { bottleAmount, milkAmount } = lactation; 
			return player.isFemale() && milkAmount >= (bottleAmount * 2)
		},
		BreastPump: () => {
			const player = getPlayer();
			const { bottleAmount, milkAmount } = lactation; 
			return player.isFemale() && milkAmount >= bottleAmount
		},
		ClearSperm: () => {
			const player = getPlayer();
			const { spermAmount } = womb;
			return player.isFemale() && spermAmount > 0;
		}
	},
	OnCreate: {
		HandExpress: () => {
			const { useMilk, bottleAmount } = lactation;
			useMilk(
				bottleAmount * 2,
				ZombRandFloat(0.05, 0.1)
			);
		},
		BreastPump: () => {
			const { useMilk, bottleAmount } = lactation;
			useMilk(
				bottleAmount,
				ZombRandFloat(0.1, 0.2)
			)
		},
		ClearSperm: () => {
			womb.spermAmount = 0;
		}
	}
}
