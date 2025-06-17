/**
 * Lactation management system for a player character.
 * Handles milk production, expiration, pregnancy influence,
 * and visual image resolution based on state.
 */

import { IsoPlayer, triggerEvent, ZombRand } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { ModData } from "./ModData";
import { LactationData, LactationImage as LactationImages, PregnancyData } from "@types";
import { getSkinColor, percentageToNumber } from "@utils";
import { LuaEventManager } from "@asledgehammer/pipewrench";
import { ZWBFEvents, ZWBFTraitsEnum } from "@constants";

export class Lactation {
  private player?: IsoPlayer;
  private modData?: ModData<LactationData>;
  private data?: LactationData;
  private readonly _capacity: number;
  private readonly _bottleAmount;

  private pregnancy: PregnancyData

  private readonly CONSTANTS = {
    MAX_LEVEL: 5,
    AMOUNTS: {
      MIN: 20,
      MAX: 100,
    },
  };

  // TODO: Replace with configurable SandBoxVars
  private readonly options = {
    expiration: 7,
    capacity: 1000,
  };

  /**
   * Debug utilities to modify internal milk data
   */
  public Debug = {
    add: (amount: number) => this.milkAmount += amount,
    remove: (amount: number) => this.milkAmount -= amount,
    set: (amount: number) => this.milkAmount = amount,
    toggle: (status: boolean) => this.toggle(status),
  };

  constructor() {
    this._capacity = this.options.capacity;
    this._bottleAmount = 200;
		this.pregnancy = { isPregnant: false, progress: 0 };

    Events.onCreatePlayer.addListener((_, player) => {
      this.player = player;
      this.modData = new ModData<LactationData>({
        object: player,
        modKey: "ZWBFLactation",
        defaultData: {
          isActive: false,
          milkAmount: 0,
          expiration: 0,
          multiplier: 0,
        },
      });
      this.data = this.modData.data;
    });

    Events.everyOneMinute.addListener(() => this.onEveryMinute());
    Events.everyHours.addListener(() => this.onEveryHour());

    new Events.EventEmitter<(data: PregnancyData) => void>(ZWBFEvents.PREGNANCY_UPDATE)
      .addListener((data) => this.onPregnancyUpdate(data));

    LuaEventManager.AddEvent(ZWBFEvents.LACTATION_UPDATE);
  }

  /**
   * Handles pregnancy progress updates
   */
  private onPregnancyUpdate(data: PregnancyData) {
    this.pregnancy = data;
    if (this.pregnancy.progress < 0.5) return;
    this.toggle(true);
    this.useMilk(0, this.pregnancy.progress);
  }

  /**
   * Periodic hourly update of milk production and decay
   */
  private onEveryHour() {
    if (!this.data?.isActive) return;

    const amount = ZombRand(this.CONSTANTS.AMOUNTS.MIN, this.CONSTANTS.AMOUNTS.MAX);
    const multiplier = 1 + this.data.multiplier;

    this.milkAmount = Math.min(this.capacity, this.milkAmount + (amount * multiplier));
    this.multiplier = Math.max(0, this.multiplier - 0.1);
    this.expiration = Math.max(0, this.expiration - 1);

    if (this.data.expiration === 0) this.toggle(false);
  }

  /**
   * Periodic minute update: Syncs and triggers event
   */
  private onEveryMinute() {
    this.modData!.data = this.data!;
    triggerEvent(ZWBFEvents.LACTATION_UPDATE, this.data!);
  }

  /**
   * Toggles lactation on or off and resets data if needed
   */
  private toggle(status: boolean) {
    this.data!.isActive = status;
    if (!status) {
      this.data = {
        isActive: false,
        expiration: 0,
        milkAmount: 0,
        multiplier: 0,
      };
    }
  }

  /**
   * Uses milk, applies multipliers based on traits
   * @param amount - amount of milk to use
   * @param multiplier - additional production multiplier
   * @param expiration - override expiration value
   */
  useMilk(amount: number, multiplier = 0, expiration = 0) {
    if (!this.data) return;

    amount = Math.min(amount, this.milkAmount);
    this.data.multiplier = Math.max(0, multiplier);
    this.data.expiration = 24 * (expiration || this.options.expiration);

    if (this.player?.HasTrait(ZWBFTraitsEnum.DAIRY_COW)) {
      this.data.multiplier *= 1.25;
      this.data.expiration *= 1.25;
    }

    this.remove(amount);
  }

  /**
   * Removes milk amount ensuring it doesn't go below 0
   */
  private remove(amount: number) {
    this.milkAmount = Math.max(0, this.milkAmount - amount);
  }

  /**
   * Gets the lactation image set depending on state
   */
  get images(): LactationImages {
    const getState = () => {
      if (!this.pregnancy.isPregnant || this.pregnancy.progress < 0.4) return "normal";
      return `pregnant_${this.pregnancy.progress < 0.7 ? "early" : "late"}`;
    };

    const skinColor = getSkinColor(this.player!);
    const fullness = (this.milkAmount > this.capacity / 2) ? "full" : "empty";
    const state = getState();
    const level = percentageToNumber(this.percentage, this.CONSTANTS.MAX_LEVEL);

    return {
      breasts: `media/ui/lactation/boob/color-${skinColor}/${state}_${fullness}.png`,
      level: `media/ui/lactation/level/milk_level_${level}.png`,
    };
  }

  /** Milk percentage relative to capacity */
  get percentage() {
    return (this.milkAmount / this.capacity) * 100;
  }

  /** Is the player currently lactating? */
  get isLactating() {
    return this.data?.isActive || false;
  }

  /** Maximum milk capacity */
  private get capacity() {
    return this._capacity;
  }

  /** Bottleable milk amount */
  get bottleAmount() {
    return this._bottleAmount;
  }

  /** Milk storage */
  private set milkAmount(amount: number) {
    this.data!.milkAmount = amount;
  }
  get milkAmount() {
    return this.data?.milkAmount ?? 0;
  }

  /** Multiplier that affects production */
  private set multiplier(value: number) {
    this.data!.multiplier = value;
  }
  private get multiplier() {
    return this.data!.multiplier;
  }

  /** Time until spoilage in hours */
  private set expiration(value: number) {
    this.data!.expiration = value;
  }
  private get expiration() {
    return this.data!.expiration;
  }
}
