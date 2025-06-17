import { CyclePhase, PregnancyData, WombData } from "@types";
import { IsoPlayer, ZombRand, ZombRandFloat } from "@asledgehammer/pipewrench";
import { Player } from "./Player";

export class Womb extends Player<WombData> {
	private _capacity: number;
	
	private readonly options = {
		recovery: 7,
		capacity: 1000,
		fertilityBonus: 50
	};

	constructor() {
		super("ZWBFWomb");
		this._capacity = this.options.capacity;
	}
	

	onCreatePlayer(player: IsoPlayer) {
		const defaultDay = ZombRand(1, 28);
		this.defaultData = {
			amount: 0,
			total: 0,
			cycleDay: defaultDay,
			phase: this.getCyclePhase(defaultDay),
			onContraceptive: false,
			chances: this.chances,
			fertility: 0,
		};
		super.onCreatePlayer(player);
	}

	onPregnancyUpdate(data:PregnancyData) {
		super.onPregnancyUpdate(data);
		this.cycleDay = -this.options.recovery;
		if (this.pregnancy!.progress > 0.5) {
			this.amount = 0;
		}
	}

	private getCyclePhase(day: number): CyclePhase {
		if(this.pregnancy!.isPregnant) return "Pregnant";
		if (day < 1) return "Recovery";
		if (day < 6 ) return "Menstruation";
		if (day < 13 ) return "Follicular";
		if (day < 16) return "Ovulation";
		return "Luteal";
	}

	get chances(): Map<CyclePhase, number> {
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
}