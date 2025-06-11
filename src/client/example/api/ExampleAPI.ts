/**
 * @noSelfInFile
 *
 * NOTE: Use this at the top of your TypeScript files. This prevents functions & methods
 *       from prepending a 'self' reference, which is usually not necessary and complicates
 *       rendered Lua code.
 */

// PipeWrench API.
import { IsoObject, IsoPlayer } from "@asledgehammer/pipewrench";

// Example API.
import { TSUIRedSquare } from "./TSUIRedSquare";

/**
 * @param object The object to stringify.
 * @returns A string of the object's name, x, y, and z coordinates.
 */
export function isoObjectToString(object: IsoObject): string {
	return `{"name": "${object.getObjectName()}", "x": "${object.getX()}", "y": "${object.getY()}", "z": "${object.getZ()}"}`;
}

/**
 * Adds a red square element to the UI using the example ISUI typings.
 */
export function addRedSquare() {
	new TSUIRedSquare(512, 256, 256, 256);
}

/**
 * @param player The player to greet.
 */
export function greetPlayer(player: IsoPlayer) {
	print(`Hello, ${player.getFullName()}!`);
}
