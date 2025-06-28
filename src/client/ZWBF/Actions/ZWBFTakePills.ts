import {
	ISBaseTimedAction,
	InventoryItem,
	IsoGameCharacter,
	getText,
	CharacterActionAnims
} from "@asledgehammer/pipewrench";

type ZWBFTakePillsProps = {
	name: string;
	character: IsoGameCharacter;
	contextMenu: string;
	pills: InventoryItem;
};

export abstract class ZWBFTakePills extends ISBaseTimedAction {
	private contextMenu: string;
	private pills: InventoryItem;

	constructor(props: ZWBFTakePillsProps) {
		super(props.character);
		super.derive(props.name);
		this.pills = props.pills;
		this.contextMenu = props.contextMenu;
		this.maxTime = 100;
		this.stopOnWalk = false;
		this.stopOnRun = false;
		this.stopOnRun = false;
	}

	isValid() {
		return (this.character as IsoGameCharacter).getInventory().contains(this.pills);
	}

	start() {
		super.start();
		this.pills.setJobType(getText(this.contextMenu));
		this.pills.setJobDelta(0);
		this.setActionAnim(CharacterActionAnims.TakePills, null);
		this.setOverrideHandModels(null, this.pills, null);
		(this.character as IsoGameCharacter).playSound("Pills_A");
	}

	stop() {
		super.stop();
		this.pills.setJobDelta(0);
	}

	update() {
		super.update();
		this.pills.setJobDelta(this.getJobDelta());
	}

	perform() {
		super.perform();
		// this.pills.getContainer().setDrawDirty(true);
		this.pills.setJobDelta(0);
		this.pills.Use();
	}
}
