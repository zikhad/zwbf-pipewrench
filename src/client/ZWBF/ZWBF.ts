import { Lactation } from "@client/components/Lactation";
import { Womb } from "@client/components/Womb";
import { ZWBFUI } from "@client/components/ZWBFUI";
import { Pregnancy } from "@client/components/Pregnancy";

export const lactation = new Lactation();
export const womb = new Womb();
export const pregnancy = new Pregnancy();

export const UI = new ZWBFUI({
    lactation,
    womb,
    pregnancy
});
