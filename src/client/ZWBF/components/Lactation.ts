import { IsoPlayer, ZombRand } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { ModData } from "./ModData";
import { LactationData, LactationImage as LactationImages, PregnancyData, ZWBFTraitsEnum } from "@types";
import { getSkinColor, percentageToNumber } from "@utils";

export class Lactation {
	private player?: IsoPlayer;
	private _bottleAmount = 200;
	private readonly _capacity: number;
	private _expiration: number;
	private modData?: ModData<LactationData>;
	private data?: LactationData;
	// TODO: implement SandBoxVars
	private options = {
		expiration: 7,
		capacity: 1000
	};
	private CONSTANTS = {
		MAX_LEVEL: 5,
		AMOUNTS: {
			MIN: 20,
			MAX: 100
		}
	}

	// TODO: should this be updated by events?
	private pregnancy: PregnancyData;

	constructor() {

		this._capacity = this.options.capacity;
		this._expiration = this.options.expiration;
		this.pregnancy = {
			isPregnant: false,
			progress: 0
		}
		Events.onCreatePlayer.addListener((_, player) => {
			this.player = player;
			this.modData = new ModData<LactationData>({
				object: this.player,
				modKey: "ZWBFLactation",
				defaultData: {
					isActive: false,
					milkAmount: 0,
					expiration: 0,
					multiplier:0
				}
			});
			this.data = this.modData.data;
		});
		Events.everyOneMinute.addListener(() => this.onEveryMinute());
		Events.everyHours.addListener(() => this.onEveryHour());
		new Events.EventEmitter<(data: PregnancyData) => void>('ZWBFPregnancyUpdate').addListener((data) => this.onPregnancyUpdate(data));
	}

	private onPregnancyUpdate(data: PregnancyData) {
		this.pregnancy = data;
		if(this.pregnancy.progress < 0.5) return;
		this.toggle(true);
		this.useMilk(0, this.pregnancy.progress);
	}

	private onEveryHour() {
		if(!this.data?.isActive) return;

		const amount = ZombRand(this.CONSTANTS.AMOUNTS.MIN, this.CONSTANTS.AMOUNTS.MAX);
		const multiplier = 1 + this.data.multiplier;

		this.milkAmount = Math.min(this._capacity, this.milkAmount + (amount * multiplier));
		this.multiplier = Math.max(0, this.multiplier - 0.1);
		this.expiration = Math.max(0, this.expiration - 1);

		if(this.data?.expiration == 0) {
			this.toggle(false);
		}
	}

	private onEveryMinute() {
		this.modData!.data = this.data!
	}

	get isLactating() {
		return this.data?.isActive || false;
	}

	get bottleAmount() {
		return this._bottleAmount;
	}
	
	private set milkAmount(amount: number) {
		this.data!.milkAmount = amount;
	}
	get milkAmount() {
		return this.data?.milkAmount ?? 0
	}

	private set multiplier(value:number) {
		this.data!.multiplier = value;
	}
	get multiplier() {
		return this.data?.multiplier ?? 0;
	}
	
	private set expiration(value:number) {
		this.data!.expiration = value;
	}
	get expiration() {
		return this.data!.expiration;
	}
	
	get percentage() {
		return (this.milkAmount / this._capacity) * 100;
	}

	get images(): LactationImages {
		const getState = () => {
			if (!this.pregnancy.isPregnant || this.pregnancy.progress < 0.4) return "normal";
			const progress = (this.pregnancy.progress < 0.7) ? "early" : "late";
			return `pregnant_${progress}`;
		};
		const skinColor = getSkinColor(this.player!);
		const fullness = (this.milkAmount > (this._capacity / 2)) ? "full" : "empty";
		const state = getState();
		
		const level = percentageToNumber(this.percentage, this.CONSTANTS.MAX_LEVEL);
		return {
			breasts: `media/ui/lactation/boob/color-${skinColor}/${state}_${fullness}.png`,
			level: `media/ui/lactation/level/milk_level_${level}.png`
		};
	}
	
	private remove(amount: number) {
		this.milkAmount = Math.max(0, this.milkAmount - amount);
	}

	private toggle(status: boolean) {
		this.data!.isActive = status;
		if(!this.data?.isActive) {
			this.data = {
				isActive: false,
				expiration: 0,
				milkAmount: 0,
				multiplier: 0
			}
		}
	}

	useMilk(amount: number, multiplier = 0, expiration = 0) {
		if(!this.data) return;
		amount = Math.min(amount, this.milkAmount);
		this.data.multiplier = Math.max(0, multiplier);
		this.data.expiration = 24 * (expiration || this.options.expiration);
		
		if (this.player?.HasTrait(/* ZWBFTraitsEnum.DAIRY_COW */"DairyCow")) {
			this.data.multiplier *= 1.25;
			this.data.expiration *= 1.25;
		}

		this.remove(amount);
	}
}
