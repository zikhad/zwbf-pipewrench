/** @noSelfInFile */
import { IsoPlayer } from "@asledgehammer/pipewrench";
import { Lactation } from "./Lactation";
import { Pregnancy } from "./Pregnancy";
import { ZWBFTabManager } from "./UI/ZWBFTabManager";
import { Womb } from "./Womb";


type ZWBFUIProps = {
	player: IsoPlayer;
	lactation: Lactation;
	pregnancy: Pregnancy;
	womb: Womb;
	tabManager: ZWBFTabManager
}
export class ZWBFUI {
	private readonly UIElements = {
		lactation: {
			image: "lactation-image",
			title: "lactation-level-title",
			level: "lactation-level-image"
		},
		womb: {
			title: "womb-title",
			image: "womb-image",
			sperm: {
				current: {
					title: "womb-sperm-current-title",
					amount: "womb-sperm-current-amount",
				},
				total: {
					title: "womb-sperm-total-title",
					amount: "womb-sperm-total-amount",
				}
			},
			cycle: {
				title: "womb-cycle-title",
				phase: {
					title: "womb-cycle-phase-title",
					value: "womb-cycle-phase-value",
				}
			},
			fertility: {
				title: "womb-fertility-title",
				bar: "womb-fertility-bar",
				value: "womb-fertility-value"
			}
		}
	};

	private player: IsoPlayer;
	private lactation: Lactation;
	private pregnancy: Pregnancy;
	private womb: Womb;
	
	private readonly tabManager: ZWBFTabManager;

	private activePanels = {
		lactation: true,
		womb: true,
	}
	
	constructor(props: ZWBFUIProps) {
		this.player = props.player;
		this.lactation = props.lactation;
		this.pregnancy = props.pregnancy;
		this.womb = props.womb;
		this.tabManager = props.tabManager || new ZWBFTabManager();
	}

	onCreateUI() {
		if (!this.player.isFemale()) return;
	}
}