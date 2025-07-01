import * as Events from "@asledgehammer/pipewrench-events";
import { Lactation } from "./Lactation";
import { Pregnancy } from "./Pregnancy";
import { Womb } from "./Womb";
import { getSpecificPlayer, getText, isDebugEnabled, KahluaTable } from "@asledgehammer/pipewrench";
import { ISToolTip } from "@asledgehammer/pipewrench/client";

type DebugMenuProps = {
	lactation: Lactation;
	pregnancy: Pregnancy;
	womb: Womb;
};

type AddOptionProps = {
	menu: KahluaTable;
	title: string;
	description: string;
	fn: () => void;
};
export class DebugMenu {
	private lactation: Lactation;
	private pregnancy: Pregnancy;
	private womb: Womb;

	constructor(props: DebugMenuProps) {
		const { lactation, pregnancy, womb } = props;

		this.lactation = lactation;
		this.pregnancy = pregnancy;
		this.womb = womb;

		if (!isDebugEnabled()) return;
		Events.onFillWorldObjectContextMenu.addListener((playerId, context /*, items */) =>
			this.createDebugContextMenu(playerId, context /*, items */)
		);
	}

	private addOption(props: AddOptionProps) {
		const { menu, title, description, fn } = props;
		const tooltip = new ISToolTip();

		tooltip.description = description;
		tooltip.initialise();
		tooltip.setVisible(false);

		const option = menu.addOption(title, null, () => fn());
		option.toolTip = tooltip;
	}

	private createDebugContextMenu(
		playerId: number,
		context: KahluaTable /*, items: KahluaTable */
	) {
		const player = getSpecificPlayer(playerId);
		if (!player.isFemale()) return;

		const option = context.addOption(getText("ContextMenu_ZWBF_Being_Female"));
		const submenu = ISContextMenu.getNew(context);

		context.addSubMenu(option, submenu);

		const menuItems: {
			option: string;
			fn: () => void;
			condition?: () => boolean;
		}[] = [
			{
				option: "Add_Sperm",
				fn: () => this.womb.Debug.sperm.add(100)
			},
			{
				option: "Remove_Sperm",
				fn: () => this.womb.Debug.sperm.set(0)
			},
			{
				option: "Reset_Sperm",
				fn: () => this.womb.Debug.sperm.setTotal(0)
			},
			{
				option: "Add_Cycle_Day",
				fn: () => this.womb.Debug.cycle.addDay(1),
				condition: () => this.pregnancy.pregnancy == null
			},
			{
				option: "Next_Cycle",
				fn: () => this.womb.Debug.cycle.nextPhase(),
				condition: () => this.pregnancy.pregnancy == null
			},
			{
				option: "Milk_Toggle",
				fn: () => this.lactation.Debug.toggle(!this.lactation.isLactating)
			},
			{
				option: "Milk_Add_Milk",
				fn: () => this.lactation.Debug.add(this.lactation.bottleAmount),
				condition: () => this.lactation.isLactating
			},
			{
				option: "Milk_Clear_Milk",
				fn: () => this.lactation.Debug.set(0),
				condition: () => this.lactation.isLactating
			},
			{
				option: "Add_Pregnancy",
				fn: () => this.pregnancy.Debug.start(),
				condition: () => this.pregnancy.pregnancy == null
			},
			{
				option: "Remove_Pregnancy",
				fn: () => this.pregnancy.Debug.stop(),
				condition: () => this.pregnancy.pregnancy != null
			},
			{
				option: "Advance_Pregnancy",
				fn: () => this.pregnancy.Debug.advance(60),
				condition: () => this.pregnancy.pregnancy != null
			},
			{
				option: "Advance_Pregnancy_Labor",
				fn: () => this.pregnancy.Debug.advanceToLabor(),
				condition: () => this.pregnancy.pregnancy != null
			}
		];

		for (const { option, fn, condition } of menuItems) {
			if (condition && !condition()) continue;

			this.addOption({
				menu: submenu,
				title: getText(`ContextMenu_${option}_Title`),
				description: getText(`ContextMenu_${option}_Description`),
				fn
			});
		}
	}
}
