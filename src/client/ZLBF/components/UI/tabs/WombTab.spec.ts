/* eslint-disable @typescript-eslint/no-explicit-any */
import { mock } from "jest-mock-extended";
import { WombTab } from "@client/components/UI/tabs/WombTab";
import { ZLBFUIElements } from "@client/components/UI/ZLBFUIElements";
import { ZLBFUITabContext } from "@client/components/UI/ZLBFUITabDefinition";
import { Womb } from "@client/components/Womb";
import { mockedPlayer } from "@test/mock";
import { ZLBFTraitsEnum } from "@constants";

jest.mock("@asledgehammer/pipewrench", () => ({
	getText: jest.fn().mockImplementation((key: string) => key),
	triggerEvent: jest.fn()
}));
jest.mock("@client/components/Player");
jest.mock("@client/components/Animation", () => ({
	Animation: { wombImage: "path/to/womb.png" }
}));

import { Player } from "@client/components/Player";
let mockHasTrait: jest.SpyInstance;

const makeUI = () => ({
	addImage: jest.fn(),
	addText: jest.fn(),
	addProgressBar: jest.fn(),
	nextLine: jest.fn(),
	[ZLBFUIElements.womb.image]: { setPath: jest.fn() },
	[ZLBFUIElements.womb.sperm.current.amount]: { setText: jest.fn() },
	[ZLBFUIElements.womb.sperm.total.amount]: { setText: jest.fn() },
	[ZLBFUIElements.womb.cycle.phase.value]: { setText: jest.fn() },
	[ZLBFUIElements.womb.fertility.title]: { setText: jest.fn() },
	[ZLBFUIElements.womb.fertility.bar]: { setValue: jest.fn() },
	[ZLBFUIElements.womb.fertility.value]: { setText: jest.fn() }
});

describe("WombTab", () => {
	let tab: WombTab;
	let ui: ReturnType<typeof makeUI>;

	beforeEach(() => {
		tab = new WombTab();
		ui = makeUI();
		mockHasTrait = jest.spyOn(Player, "hasTrait").mockReturnValue(false);
	});

	it("has correct id", () => {
		expect(tab.id).toBe("Womb");
	});

	it("has correct titleKey", () => {
		expect(tab.TITLE_KEY).toBe("IGUI_ZLBF_UI_Womb_Title");
	});

	describe("build", () => {
		it("adds womb image, sperm info, and cycle phase elements", () => {
			tab.build(ui as any, {});

			expect(ui.addImage).toHaveBeenCalledWith(
				ZLBFUIElements.womb.image,
				"media/ui/womb/normal/womb_normal_0.png"
			);
			expect(ui.addText).toHaveBeenCalledWith(
				ZLBFUIElements.womb.sperm.current.title,
				expect.any(String),
				undefined,
				"Center"
			);
			expect(ui.addText).toHaveBeenCalledWith(
				ZLBFUIElements.womb.sperm.total.title,
				expect.any(String),
				undefined,
				"Center"
			);
			expect(ui.addText).toHaveBeenCalledWith(
				ZLBFUIElements.womb.cycle.phase.title,
				expect.any(String),
				undefined,
				"Center"
			);
		});

		it("adds fertility bar when player is not infertile", () => {
			mockHasTrait.mockReturnValue(false);
			const player = mockedPlayer();

			tab.build(ui as any, { player });

			expect(ui.addProgressBar).toHaveBeenCalledWith(
				ZLBFUIElements.womb.fertility.bar,
				0,
				0,
				1
			);
			expect(ui.addImage).toHaveBeenCalledWith("fertility_egg_img", "media/ui/fertility/egg/egg.png", {
				width: 26,
				height: 26
			});
		});

		it("adds fertility bar when no player is provided", () => {
			tab.build(ui as any, {});

			expect(ui.addProgressBar).toHaveBeenCalledWith(
				ZLBFUIElements.womb.fertility.bar,
				0,
				0,
				1
			);
		});

		it("does NOT add fertility bar when player has INFERTILE trait", () => {
			mockHasTrait.mockImplementation(
				(_player: any, trait: ZLBFTraitsEnum) => trait === ZLBFTraitsEnum.INFERTILE
			);
			const player = mockedPlayer();

			tab.build(ui as any, { player });

			expect(ui.addProgressBar).not.toHaveBeenCalled();
		});
	});

	describe("update", () => {
		it("returns early when womb is not in context", () => {
			tab.update(ui as any, {});

			expect((ui as any)[ZLBFUIElements.womb.sperm.current.amount].setText).not.toHaveBeenCalled();
		});

		it("updates sperm amounts, womb image, and cycle phase", () => {
			const womb = mock<Womb>();
			(womb as any).phaseTranslation = "IGUI_ZLBF_UI_Phase_Ovulation";
			(womb as any).fertility = 0.5;
			(womb as any).amount = 0.25;
			(womb as any).total = 0.5;

			const context: ZLBFUITabContext = { womb };
			tab.update(ui as any, context);

			expect((ui as any)[ZLBFUIElements.womb.sperm.current.amount].setText).toHaveBeenCalledWith("250 ml");
			expect((ui as any)[ZLBFUIElements.womb.sperm.total.amount].setText).toHaveBeenCalledWith("500 ml");
			expect((ui as any)[ZLBFUIElements.womb.image].setPath).toHaveBeenCalledWith("path/to/womb.png");
			expect((ui as any)[ZLBFUIElements.womb.cycle.phase.value].setText).toHaveBeenCalledWith(
				"IGUI_ZLBF_UI_Phase_Ovulation"
			);
		});

		it("shows fertility progress when no pregnancy and player is not infertile", () => {
			const womb = mock<Womb>();
			(womb as any).phaseTranslation = "IGUI_TEST";
			(womb as any).fertility = 0.75;
			(womb as any).amount = 0;
			(womb as any).total = 0;
			const player = mockedPlayer();
			mockHasTrait.mockReturnValue(false);

			tab.update(ui as any, { womb, player });

			expect((ui as any)[ZLBFUIElements.womb.fertility.bar].setValue).toHaveBeenCalledWith(0.75);
			expect((ui as any)[ZLBFUIElements.womb.fertility.value].setText).toHaveBeenCalledWith("75%");
			expect((ui as any)[ZLBFUIElements.womb.fertility.title].setText).toHaveBeenCalledWith(
				"IGUI_ZLBF_UI_Fertility"
			);
		});

		it("shows pregnancy progress when pregnancy is active", () => {
			const womb = mock<Womb>();
			(womb as any).phaseTranslation = "IGUI_TEST";
			(womb as any).fertility = 0.5;
			(womb as any).amount = 0;
			(womb as any).total = 0;
			const player = mockedPlayer();
			mockHasTrait.mockReturnValue(false);

			const pregnancy = mock<Womb["pregnancy"]>();
			(pregnancy as any).progress = 0.4;
			(womb as any).pregnancy = pregnancy;

			tab.update(ui as any, { womb, player, pregnancy: { pregnancy } as any });

			expect((ui as any)[ZLBFUIElements.womb.fertility.bar].setValue).toHaveBeenCalledWith(0.4);
			expect((ui as any)[ZLBFUIElements.womb.fertility.value].setText).toHaveBeenCalledWith("40%");
			expect((ui as any)[ZLBFUIElements.womb.fertility.title].setText).toHaveBeenCalledWith(
				"IGUI_ZLBF_UI_Pregnancy"
			);
		});

		it("skips fertility section when player has INFERTILE trait", () => {
			const womb = mock<Womb>();
			(womb as any).phaseTranslation = "IGUI_TEST";
			(womb as any).fertility = 0.9;
			(womb as any).amount = 0;
			(womb as any).total = 0;
			const player = mockedPlayer();
			mockHasTrait.mockImplementation(
				(_player: any, trait: ZLBFTraitsEnum) => trait === ZLBFTraitsEnum.INFERTILE
			);

			tab.update(ui as any, { womb, player });

			expect((ui as any)[ZLBFUIElements.womb.fertility.bar].setValue).not.toHaveBeenCalled();
			expect((ui as any)[ZLBFUIElements.womb.fertility.title].setText).not.toHaveBeenCalled();
		});
	});
});
