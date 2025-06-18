/**
 * Lactation management system for a player character.
 * Handles milk production, expiration, pregnancy influence,
 * and visual image resolution based on state.
 */

import { IsoPlayer, triggerEvent, ZombRand } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { LactationData, LactationImage as LactationImages, PregnancyData } from "@types";
import { getSkinColor, percentageToNumber } from "@utils";
import { LuaEventManager } from "@asledgehammer/pipewrench";
import { ZWBFEvents, ZWBFTraitsEnum } from "@constants";
import { Player } from "./Player";

export class Lactation extends Player<LactationData> {
  private readonly _capacity: number;
  private readonly _bottleAmount;

  private readonly CONSTANTS = {
    MAX_LEVEL: 5,
    AMOUNTS: {
      MIN: 20,
      MAX: 100,
    },
  };

  // TODO: Replace with configurable SandBoxVars
  private readonly options: Record<string, number>;

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
    super("ZWBFLactation");
    this.options = {
      expiration: 7,
      capacity: 1000,
    };
    this._capacity = this.options.capacity;
    this._bottleAmount = 200;
    Events.everyHours.addListener(() => this.onEveryHour());
    LuaEventManager.AddEvent(ZWBFEvents.LACTATION_UPDATE);
  }

  onCreatePlayer(player: IsoPlayer): void {
    super.onCreatePlayer(player);
    this.defaultData = {
      isActive: false,
      milkAmount: 0,
      // TODO: why options are not working?
      expiration: 7,
      multiplier: 0,
    };  
  }

  onPregnancyUpdate(data: PregnancyData) {
    super.onPregnancyUpdate(data);
    if (this.pregnancy!.progress < 0.5) return;
    this.toggle(true);
    this.useMilk(0, this.pregnancy!.progress);
  }

  /**
   * Periodic hourly update of milk production and decay
   */
  private onEveryHour() {
    if (!this.isLactating) return;

    const amount = ZombRand(this.CONSTANTS.AMOUNTS.MIN, this.CONSTANTS.AMOUNTS.MAX);
    const multiplier = 1 + this.multiplier;

    this.milkAmount = Math.min(this.capacity, this.milkAmount + (amount * multiplier));
    this.multiplier = Math.max(0, this.multiplier - 0.1);
    this.expiration = Math.max(0, this.expiration - 1);

    if (this.expiration === 0) this.toggle(false);
  }

  onEveryMinute() {
    super.onEveryMinute();
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
  public useMilk(amount: number, multiplier?: number, expiration?: number) {
    if (!this.data) return;

    amount = Math.min(amount, this.milkAmount);
    this.multiplier = Math.max(0, multiplier || 0);
    this.expiration = 24 * (expiration || this.expiration);

    if (this.player?.HasTrait(ZWBFTraitsEnum.DAIRY_COW)) {
      this.multiplier *= 1.25;
      this.expiration *= 1.25;
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
      if (!this.pregnancy!.isPregnant || this.pregnancy!.progress < 0.4) return "normal";
      return `pregnant_${this.pregnancy!.progress < 0.7 ? "early" : "late"}`;
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
