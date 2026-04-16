import {
	getSpecificPlayer,
	getText,
	InventoryItem,
	ISBaseTimedAction,
	IsoGameCharacter
} from "@asledgehammer/pipewrench";
import { Lactation } from "@client/components/Lactation";
import { ISInventoryPaneContextMenu, ISTimedActionQueue } from "@asledgehammer/pipewrench/client";
import { ZWBFFeedBaby } from "@actions/ZWBFFeedBaby";
import * as Events from "@asledgehammer/pipewrench-events";

type Item = InventoryItem & { name: string };
type MenuContext = {
	addOption: (text: string, item: Item, handler: (item: Item) => void) => void;
};

type InventoryProps = {
	lactation: Lactation;
};

export class Inventory {
	private lactation: Lactation;

	constructor(props: InventoryProps) {
		this.lactation = props.lactation;

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
	private buildInventoryContextMenu(
		playerId: number,
		context: MenuContext,
		items: Item[]
	) {
		const player = getSpecificPlayer(playerId);
		const itemActions = [
			{
				text: getText("ContextMenu_BreastFeed_Baby"),
				itemType: "Baby",
				condition: () => 
					this.lactation.milkAmount >= this.lactation.bottleAmount,
				handler: (item: InventoryItem) =>
					this.handleItemAction(item, player, new ZWBFFeedBaby(this.lactation, item))
					
			}
		];
		
		const activeItems = itemActions.filter(({condition}) => condition());
		
		for (const item of items) {
			for (const { itemType, handler, text } of activeItems) {
				if (itemType === item.name) {
					context.addOption(text, item, handler);
				}
			}
		}
	}
}
