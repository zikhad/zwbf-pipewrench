/** @noSelfInFile */
import {
	getSpecificPlayer,
	getText,
	InventoryItem,
	ISBaseTimedAction,
	IsoGameCharacter
} from "@asledgehammer/pipewrench";
import { Lactation } from "./Lactation";
import { Pregnancy } from "./Pregnancy";
import { Womb } from "./Womb";
import { ISInventoryPaneContextMenu, ISTimedActionQueue } from "@asledgehammer/pipewrench/client";
import { ZWBFFeedBaby } from "@actions/ZWBFFeedBaby";
import { CyclePhaseEnum } from "@constants";
import { ZWBTakeContraceptive } from "@actions/ZWBFTakeContraceptive";
import { ZWBTakeLactaid } from "@actions/ZWBFTakeLactaid";
import * as Events from "@asledgehammer/pipewrench-events";

type MenuContext = {
	addOption: (text: string, item: InventoryItem, handler: (item: InventoryItem) => void) => void;
};

type ZWBFInventoryProps = {
	lactation: Lactation;
	pregnancy: Pregnancy;
	womb: Womb;
};

export class ZWBFInventory {
	private lactation: Lactation;
	private pregnancy: Pregnancy;
	private womb: Womb;

	constructor(props: ZWBFInventoryProps) {
		this.lactation = props.lactation;
		this.pregnancy = props.pregnancy;
		this.womb = props.womb;

		Events.onFillInventoryObjectContextMenu.addListener((playerId, context, items) => {
			this.buildInventoryContextMenu(playerId, context, items);
		});
	}

	private handleItemAction(
		item: InventoryItem,
		player: IsoGameCharacter,
		action: ISBaseTimedAction
	) {
		ISInventoryPaneContextMenu.transferIfNeeded(player, item);
		ISTimedActionQueue.add(action);
	}
	public buildInventoryContextMenu(
		playerId: number,
		context: MenuContext,
		items: InventoryItem[]
	) {
		const player = getSpecificPlayer(playerId);
		const itemActions = [
			{
				text: getText("ContextMenu_BreastFeed_Baby"),
				itemType: "Baby",
				condition: () => this.lactation.milkAmount >= this.lactation.bottleAmount,
				handler: (item: InventoryItem) =>
					this.handleItemAction(item, player, new ZWBFFeedBaby(this.lactation, item))
			},
			{
				text: getText("ContextMenu_Take_Contraceptive"),
				itemType: "Contraceptive",
				condition: () =>
					!this.pregnancy.pregnancy &&
					!this.womb.onContraceptive &&
					this.womb.phase != CyclePhaseEnum.RECOVERY,
				handler: (item: InventoryItem) =>
					this.handleItemAction(item, player, new ZWBTakeContraceptive(this.womb, item))
			},
			{
				text: getText("ContextMenu_Take_Lactaid"),
				itemType: "Lactaid",
				condition: () => true,
				handler: (item: InventoryItem) =>
					this.handleItemAction(item, player, new ZWBTakeLactaid(this.lactation, item))
			}
		];
		for (const item of items) {
			for (const { itemType, condition, handler, text } of itemActions) {
				if (string.find(item.getType(), itemType) && condition()) {
					context.addOption(text, item, handler);
				}
			}
		}
	}
}
