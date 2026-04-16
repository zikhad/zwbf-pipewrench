
import { ZombRandFloat, InventoryItem } from "@asledgehammer/pipewrench";
import { lactation, womb } from "@client/ZWBF";
import { Fluids } from "@constants";
import { Recipe } from "server/types";
import { FluidContainerApi } from "@shared/components/FluidContainerApi";

declare let ZWBFRecipes: Recipe;

ZWBFRecipes = {
	OnTest: {
		TakeContraceptive: (_item, character) => {
			if (!character.isFemale()) return false;
			if (womb.contraceptive) return false;
			if (womb.pregnancy) return false;
			return true;
		},
		TakeLactaid: (_item, character) => {
			if (!character.isFemale()) return false;
			return true;
		},
		HandExpress: (item, character) => {
			if (!character.isFemale()) return false;
			if (new FluidContainerApi(item).isFull()) return false;
			return lactation.milkAmount >= lactation.bottleAmount * 2;
		},
		BreastPump: (item, character) => {
			if (!character.isFemale()) return false;
			if (new FluidContainerApi(item).isFull()) return false;
			return character.isFemale() && lactation.milkAmount >= lactation.bottleAmount;
		},
		ClearSperm: (_item, character) => {
			if (!character.isFemale()) return false;
			return womb.amount > 0;
		},
		PushCum: (item, character) => {
			if (!character.isFemale()) return false;
			if (womb.amount <= 0) return false;
			if (new FluidContainerApi(item).isFull()) return false;
			return true;
		},
		BreastFeedBaby: (_item, character) => {
			if (!character.isFemale()) return false;
			if(lactation.milkAmount < lactation.bottleAmount) return false;
			return true;
		},
		BottleFeedBaby: (item, character) => {
			if (!character.isFemale()) return false;
			const container = new FluidContainerApi(item);
			print(`[ZWBF] Testing BottleFeedBaby - amount: ${container.amount}, bottle amount: ${lactation.bottleAmount}, is there enough: ${container.amount > lactation.bottleAmount}, primaryFluid: ${container.primaryFluid}, HumanMilk: ${Fluids.HUMAN_MILK}, isMilk: ${container.primaryFluid == Fluids.HUMAN_MILK}`);
			print(`[ZWBF] Testing BottleFeedBaby - is content NOT milk: ${container.primaryFluid !== Fluids.HUMAN_MILK}`);
			if (container.primaryFluid !== Fluids.HUMAN_MILK) return false;
			if (container.amount < lactation.bottleAmount) return false;
			print(`[ZWBF] Testing BottleFeedBaby - should be able to bottle feed baby`)
			return true;
		}
	},
	OnCreate: {
		TakeContraceptive: () => {
			womb.contraceptive = true;
		},
		TakeLactaid: () => {
			lactation.toggle(true);
			const multiplier = lactation.multiplier + ZombRandFloat(0, 0.3);
			lactation.useMilk(0, multiplier);
		},
		HandExpress: (items) => {
			const container = items.getInputItems(0).get(0) as InventoryItem;
			const amount = new FluidContainerApi(container).fill(Fluids.HUMAN_MILK, lactation.bottleAmount);
			lactation.useMilk(amount * 2, ZombRandFloat(0.05, 0.1)); // Waste half of the milk when hand expressing
		},
		BreastPump: (items) => {
			const container = items.getInputItems(1).get(0) as InventoryItem;
			const amount = new FluidContainerApi(container).fill(Fluids.HUMAN_MILK, lactation.bottleAmount);
			lactation.useMilk(amount, ZombRandFloat(0.1, 0.2));
		},
		ClearSperm: (items) => {
			const container = items.getInputItems(0).get(0) as InventoryItem;
			new FluidContainerApi(container).clear();
			womb.amount = 0;
		},
		PushCum: (items) => {
			const container = items.getInputItems(0).get(0) as InventoryItem; 
			const filledAmount = new FluidContainerApi(container).fill(Fluids.SEMEN, womb.amount);
			womb.amount -= Math.min(womb.amount, filledAmount);
		},
		BreastFeedBaby: (items) => {
			lactation.useMilk(lactation.bottleAmount, ZombRandFloat(0.2, 0.5));
		},
		BottleFeedBaby: (items) => {
			const container = items.getInputItems(0).get(0) as InventoryItem; 
			new FluidContainerApi(container).clear(lactation.bottleAmount);
		}
	}
};

export { ZWBFRecipes };