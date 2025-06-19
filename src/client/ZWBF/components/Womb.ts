/* @noSelfInFile */
import { CyclePhase, PregnancyData, WombData } from "@types";
import { IsoPlayer, ZombRand, ZombRandFloat } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { Player } from "./Player";
import { Inventory, percentageToNumber } from "@utils";
import { ZWBFTraitsEnum } from "@constants";


type AnimationStatus = {
	isActive: boolean;
	delta: number;
	duration: number;
}

type AnimationSettings = Record<string, {
	steps: number[],
	loop?: number
}>;

export class Womb extends Player<WombData> {
	private readonly _capacity: number;
	
	private readonly options = {
		recovery: 7,
		capacity: 1000,
		fertilityBonus: 50
	};

	private _animation: AnimationStatus;

	private readonly animations: AnimationSettings;

	constructor() {
		super("ZWBFWomb");
		this._capacity = this.options.capacity;
		this._animation = {
			isActive: false,
			delta: 0,
			duration: 0
		};
		this.animations = {
			'normal': {
				steps: [
					0, 1, 2, 3, 4, 3, 2, 1, /* */
					0, 1, 2, 3, 4, 3, 2, 1, /* */
					0, 1, 2, 3, 4, 3, 2, 1, /* */
					0, 1, 2, 3, 4, 3, 2, 1, /* */
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9
				]
			},
			'pregnant': {
				steps: [
					0, 1, 2, 3, 2, 1, /* */
					0, 1, 2, 3, 2, 1, /* */
					0, 1, 2, 3, 2, 1, /* */
					0, 1, 2, 3, 2, 1, /* */
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
				]
			},
			'condom': {
				steps: [
					0, 1, 2, 3, 4, 5, 6
				],
				loop: 4
			},
			'birth': {
				steps: [
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
				]
			}
		}
	}
	

	onCreatePlayer(player: IsoPlayer) {
		const defaultDay = ZombRand(1, 28);
		this.defaultData = {
			amount: 0,
			total: 0,
			cycleDay: defaultDay,
			onContraceptive: false,
			chances: Womb.chances,
			fertility: 0,
		};
		super.onCreatePlayer(player);
		new Events.EventEmitter<(data: AnimationStatus) => void>("ZWBFAnimationUpdate")
		.addListener((data) => this.onAnimationUpdate(data));
	}

	onAnimationUpdate(data: AnimationStatus) {
		this.animation = data;
	}

	onPregnancyUpdate(data:PregnancyData) {
		super.onPregnancyUpdate(data);

		if(!this.pregnancy?.isPregnant) return;
		
		this.cycleDay = -this.options.recovery;
		if (this.pregnancy!.progress > 0.5) {
			this.amount = 0;
		}
	}

	onEveryMinute(): void {
		super.onEveryMinute();
		this.fertility = this.getFertility();
	}

	private getFertility() {
		const isInfertile = this.player?.HasTrait(ZWBFTraitsEnum.INFERTILE);
		if (
			!this.data ||
			this.data.onContraceptive ||
			this.pregnancy?.isPregnant ||
			isInfertile
		) {
			return 0;
		}
		
		const chance = this.data.chances.get(this.phase)!;
		const isFertile = this.player?.HasTrait(ZWBFTraitsEnum.FERTILE);
		const isHyperFertile = this.player?.HasTrait(ZWBFTraitsEnum.HYPERFERTILE);
		if( isFertile || isHyperFertile ) {
			return Math.min(1, chance * (1 + (this.options.fertilityBonus / 100)));
		}

		return chance;
	}

	private getCyclePhase(day: number): CyclePhase {
		if(this.pregnancy!.isPregnant) return "Pregnant";
		if (day < 1) return "Recovery";
		if (day < 6 ) return "Menstruation";
		if (day < 13 ) return "Follicular";
		if (day < 16) return "Ovulation";
		return "Luteal";
	}

	static get chances(): Map<CyclePhase, number> {
		const phases: { phase: CyclePhase, value: number }[] = [
			{ phase: "Recovery", value: 0 },
			{ phase: "Menstruation", value: ZombRandFloat(0, 0.3) },
			{ phase: "Follicular", value: ZombRandFloat(0, 0.4) },
			{ phase: "Ovulation", value: ZombRandFloat(0.85, 1) },
			{ phase: "Luteal", value: ZombRandFloat(0, 0.3) },
		];

		const _chances = new Map<CyclePhase, number>();
		for( const { phase, value } of phases ) {
			_chances.set(phase, value);
		}

		return _chances;
	}

	set cycleDay(value: number) {
		this.data!.cycleDay = value;
	}

	get cycleDay() {
		return this.data?.cycleDay ?? 0;
	}

	set amount(value: number) {
		this.data!.amount = value;
	}

	get amount() {
		return this.data?.amount ?? 0;
	}

	get total() {
		return this.data?.total ?? 0;
	}

	private set fertility(value: number) {
		this.data!.fertility = value;
	}
	get fertility() {
		return this.data?.fertility ?? 0;
	}

	get onContraceptive() {
		return this.data?.onContraceptive ?? false;
	}

	get phase() {
		return this.getCyclePhase(this.cycleDay);
	}

	set animation(value: AnimationStatus) {
		this._animation = value
	}

	get animation() {
		return this._animation;
	}

	private stillImage(): string {
		const getStatus = () => {
			if (this.pregnancy?.isPregnant && this.pregnancy.progress > 0.05) {
				return "pregnant";
			} else if (this.pregnancy?.isPregnant) {
				return "conception";
			}
			return "normal";
		};
		const status = getStatus();
		
		const getImageIndex = () => {
			if (status == "pregnant") {
				const progress = this.pregnancy!.progress < 0.9 ? this.pregnancy!.progress : 1;
				return percentageToNumber(progress * 100, 6);
			}
			const percentage = Math.floor((this.amount / this._capacity) * 100);
			const index = percentageToNumber(percentage, 17);
			if (index === 0 && this.amount > 0) {
				return 1;
			}
			return index;
		};
		const imageIndex = getImageIndex();
		
		return `media/ui/womb/${status}/womb_${status}_${imageIndex}.png`;
	}

	
	private getAnimationSetting(): { animation: AnimationSettings[string], type: string } {
		if (Inventory.hasItem(this.player!, "ZWBF.Condom")) {
			return {
				animation: this.animations["condom"],
				type: "condom"
			}
		} else if (this.pregnancy?.isPregnant) {
			if(this.pregnancy.isInLabor) {
				return {
					animation: this.animations['birth'],
					type: 'birth'
				};
			} else if(this.pregnancy.progress > 0.5) {
				return {
					animation: this.animations['pregnant'],
					type: 'pregnant'
				}
			}
		}
		return {
			animation: this.animations["normal"],
			type: "normal"
		};
	}
	
	private sceneImage(): string {
		const { duration, delta } = this.animation;
		const { animation, type } = this.getAnimationSetting();
		const { steps, loop = 1 } = animation;
		
		// Calculate the total duration of one loop
		const loopDuration = duration / loop;

		// Calculate the current position in the loop
		const currentLoopDelta = (delta * duration) % loopDuration;
		
		// Calculate the step duration
		const stepDuration = loopDuration / steps.length;

		//  Determine the current step index
		const stepIndex = Math.floor(currentLoopDelta / stepDuration) % steps.length;
		const step = steps[stepIndex];

		
		const getFullness = () => {
			if (type !== "normal") return "";
			if (this.amount > (this.options.capacity / 2)) return "/full";
			return "/empty";
		}
		
		const fullness = getFullness();

		return `media/ui/animation/${type}${fullness}/${step}.png`;
	}

	get image() {
		if(!this.data) return "";

		if (this.animation.isActive) return this.sceneImage();
		return this.stillImage();
	}
}
