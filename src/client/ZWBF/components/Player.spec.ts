/* eslint-disable @typescript-eslint/no-explicit-any */
import { mock } from "jest-mock-extended";
import * as Events from "@asledgehammer/pipewrench-events";
import { Player } from "./Player";
import {
	IsoPlayer,
	BodyPartType,
	BodyPart,
	BodyDamage,
	ItemContainer
} from "@asledgehammer/pipewrench";
import * as SpyPipewrench from "@asledgehammer/pipewrench";
import { PregnancyData } from "@types";

// Mocks
jest.mock("@asledgehammer/pipewrench");
jest.mock("@asledgehammer/pipewrench-events");

class ConcretePlayer extends Player<Record<string, unknown>> {
	constructor(key?: string) {
		super(key);
	}
	public triggerOnCreatePlayer(player: IsoPlayer) {
		this.onCreatePlayer(player);
	}
	public triggerPregnancyUpdate(data: PregnancyData) {
		this.onPregnancyUpdate(data);
	}
}

describe("Player class", () => {
	const mockPlayer = mock<IsoPlayer>({
		getModData: () => ({ TEST_KEY: "someting" })
	});
	const mockBodyDamage = mock<BodyDamage>();
	const mockBodyPart = mock<BodyPart>();

	beforeEach(() => {
		jest.clearAllMocks();

		mockPlayer.HasTrait.mockReturnValue(true);
		mockPlayer.getBodyDamage.mockReturnValue(mockBodyDamage);
		mockBodyDamage.getBodyPart.mockReturnValue(mockBodyPart);
	});

	it("initializes and creates mod data", () => {
		const instance = new ConcretePlayer("TEST_KEY");
		instance.triggerOnCreatePlayer(mockPlayer);

		expect(instance.player).toBe(mockPlayer);
		expect(instance.data).toBeDefined();
	});

	describe("Timer Events", () => {
		const addListener = jest.fn();
		beforeEach(() => {
			(Events as any).onCreatePlayer = { addListener };
		});
		it("should register onCreatePlayer event", () => {
			new ConcretePlayer("TEST_KEY");
			const [callback] = addListener.mock.calls[0];
			callback(mockPlayer);

			expect(addListener).toHaveBeenCalledWith(expect.any(Function));
		});
	});

	describe("Custom Events", () => {
		const addListener = jest.fn();
		beforeEach(() => {
			jest.spyOn(Events, "EventEmitter").mockReturnValue({ addListener } as any);
		});
		it("should register PREGNANCY_UPDATE event", () => {
			new ConcretePlayer("TEST_KEY");
			const [callback] = addListener.mock.calls[0];
			callback(mock<PregnancyData>());
			expect(addListener).toHaveBeenCalledWith(expect.any(Function));
		});
	});

	describe("getBodyPart", () => {
		it("getBodyPart returns body part if player exists", () => {
			const instance = new ConcretePlayer("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);

			const part = instance.getBodyPart(BodyPartType.Torso_Upper);
			expect(part).toBe(mockBodyPart);
		});
		it("getBodyPart return null if player does not exists", () => {
			const instance = new ConcretePlayer("TEST_KEY");
			const part = instance.getBodyPart(BodyPartType.Torso_Upper);
			expect(part).toBeNull();
		});
	});

	describe("hasItem", () => {
		it.each([{ hasItem: false }, { hasItem: true }])(
			"should return $hasItem if if inventory.contains is $hasItem",
			({ hasItem }) => {
				mockPlayer.getInventory.mockReturnValue(
					mock<ItemContainer>({
						contains: () => hasItem
					})
				);
				const instance = new ConcretePlayer("TEST_KEY");
				instance.triggerOnCreatePlayer(mockPlayer);

				const result = instance.hasItem("MockedItem");
				expect(result).toBe(hasItem);
			}
		);
		it("should return false if player is not defined", () => {
			const instance = new ConcretePlayer("TEST_KEY");
			const result = instance.hasItem("MockedItem");
			expect(result).toBe(false);
		});
	});

	describe("haloText", () => {
		it.each<{
			spyOn: () => void;
			color?: "green" | "red";
			arrow?: "up" | "down";
		}>([
			{
				color: "green",
				arrow: "up",
				spyOn: () => jest.spyOn(SpyPipewrench.HaloTextHelper, "addTextWithArrow")
			},
			{
				color: "green",
				arrow: "down",
				spyOn: () => jest.spyOn(SpyPipewrench.HaloTextHelper, "addTextWithArrow")
			},
			{
				color: "red",
				arrow: "up",
				spyOn: () => jest.spyOn(SpyPipewrench.HaloTextHelper, "addTextWithArrow")
			},
			{
				color: "red",
				arrow: "down",
				spyOn: () => jest.spyOn(SpyPipewrench.HaloTextHelper, "addTextWithArrow")
			},
			{ color: "green", spyOn: () => jest.spyOn(SpyPipewrench.HaloTextHelper, "addText") },
			{ color: "red", spyOn: () => jest.spyOn(SpyPipewrench.HaloTextHelper, "addText") },
			{ spyOn: () => jest.spyOn(SpyPipewrench.HaloTextHelper, "addText") }
		])(
			"haloText should call HaloTextHelper with color $color and arrow $arrow",
			({ color, arrow, spyOn }) => {
				const spy = spyOn();
				const instance = new ConcretePlayer();
				instance.triggerOnCreatePlayer(mockPlayer);
				instance.haloText({
					text: "mock",
					color,
					arrow
				});
				expect(spy).toHaveBeenCalled();
			}
		);
		it("should do nothing if player is not defined", () => {
			const spy = jest.spyOn(SpyPipewrench.HaloTextHelper, "addText");
			const instance = new ConcretePlayer();
			instance.haloText({
				text: "mock"
			});
			expect(spy).not.toHaveBeenCalled();
		});
	});

	describe("skinColorIndex", () => {
		it("should get player skin color", () => {
			const player = mock<IsoPlayer>({
				getHumanVisual: jest.fn().mockImplementation(() => ({
					getSkinTextureIndex: jest.fn().mockReturnValue(2)
				}))
			});

			const instance = new ConcretePlayer();
			instance.triggerOnCreatePlayer(player);
			expect(instance.skinColorIndex).toBe(2);
		});
		it("should return 0 by default", () => {
			const instance = new ConcretePlayer();
			expect(instance.skinColorIndex).toBe(0);
		});
	});

	describe("data", () => {
		it("Should return null when modData is undefined", () => {
			const instance = new ConcretePlayer();
			(instance as any).data = undefined;
			expect(instance.data).toBeNull();
		});
		it("Should return null by default", () => {
			const instance = new ConcretePlayer("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			instance.data = { foo: "mocked" };
			expect(instance.data).toBeDefined();
		});
	});

	describe("Pregnancy", () => {
		it.each([
			{ pregnancy: true, data: { progress: 0.5, current: 1, isInLabor: false } },
			{ pregnancy: false, data: null }
		])("Should return $data when pregnancy is $pregnancy", ({ pregnancy, data }) => {
			mockPlayer.HasTrait.mockReturnValue(pregnancy);
			const instance = new ConcretePlayer("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			data && (instance.pregnancy = data);
			(instance as any)._pregnancy = { data };
			expect(instance.pregnancy).toBe(data);
		});
		it("Pregnancy should return null if player is not pregnant", () => {
			mockPlayer.HasTrait.mockReturnValue(false);
			const instance = new ConcretePlayer("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			instance.pregnancy = mock();
			expect(instance.pregnancy).toBeNull();
		});
		it("Pregnancy should return null if pregnancy data is not present", () => {
			mockPlayer.HasTrait.mockReturnValue(true);
			const instance = new ConcretePlayer("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			(instance as any)._pregnancy = undefined;
			instance.pregnancy = mock();
			expect(instance.pregnancy).toBeNull();
		});
	});
});
