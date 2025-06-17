import { IsoPlayer } from "@asledgehammer/pipewrench";

/**
 * Given a percentage and an arbitrary number, returns the corresponding number between 0 and the number
 * @param percentage the percentage to be converted into an arbirary number
 * @param maxNumber the number that represents the Max
 * @returns 
 */
export const percentageToNumber = (percentage: number, maxNumber: number) => {
	percentage = Math.min(100, percentage);
	percentage = Math.max(0, percentage);
	return Math.floor(percentage/100 * maxNumber);
}

export const getSkinColor = (character: IsoPlayer) => {
	return character.getHumanVisual().getSkinTextureIndex();
}