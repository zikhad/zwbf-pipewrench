/* eslint-disable @typescript-eslint/no-explicit-any */
import { mock } from "jest-mock-extended";
import * as Events from "@asledgehammer/pipewrench-events";
import { Player } from "./Player";
import {
	IsoPlayer,
	BodyPartType,
	BodyPart,
	BodyDamage,
	ItemContainer,
	HaloTextHelper
} from "@asledgehammer/pipewrench";
import { PregnancyData } from "@types";
import { ZWBFTraitsEnum } from "@constants";
import { CharacterTraitApi } from "@shared/components/CharacterTraitApi";

// Mocks
jest.mock("@asledgehammer/pipewrench");
jest.mock("@asledgehammer/pipewrench-events");
jest.mock("./ModData", () => ({
	ModData: jest.fn().mockImplementation(({ defaultData }) => {
		let storedData: any = null;
		let accessed = false;
		return {
			get data() {
				if (!accessed) {
					accessed = true;
					return storedData; // Return null on first access
				}
				return storedData !== null ? storedData : defaultData;
			},
			set data(value: any) {
				storedData = value;
			}
		};
	})
}));
jest.mock("@shared/components/CharacterTraitApi", () => ({
	CharacterTraitApi: {
		hasTrait: jest.fn(),
		addTrait: jest.fn(),
		removeTrait: jest.fn()
	}
}));

class ConcretePlayer extends Player<Record<string, unknown>> {
	constructor(key?: string, defaultData?: Record<string, unknown>) {
		super(key);
		this.defaultData = defaultData;
	}
	public triggerOnCreatePlayer(player: IsoPlayer) {
		this.onCreatePlayer(player);
	}
	public triggerPregnancyUpdate(data: PregnancyData) {
		this.onPregnancyUpdate(data);
	}
	// Expose protected methods for testing
	public testHasZWBFTrait(trait: ZWBFTraitsEnum): boolean {
		return this.hasZWBFTrait(trait);
	}
	public testAddZWBFTrait(trait: ZWBFTraitsEnum): void {
		this.addZWBFTrait(trait);
	}
	public testRemoveZWBFTrait(trait: ZWBFTraitsEnum): void {
		this.removeZWBFTrait(trait);
	}
}

describe("Player class", () => {
	const mockPlayer = mock<IsoPlayer>();
	const mockBodyDamage = mock<BodyDamage>();
	const mockBodyPart = mock<BodyPart>();

	beforeEach(() => {
		jest.clearAllMocks();

		mockPlayer.getCharacterTraits = jest.fn(() => ({
			get: jest.fn(() => true)
		})) as any;
		(mockPlayer.getBodyDamage as jest.Mock).mockReturnValue(mockBodyDamage);
		(mockBodyDamage.getBodyPart as jest.Mock).mockReturnValue(mockBodyPart);
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
			new ConcretePlayer();
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
			spyOn: () => jest.SpyInstance;
			style?: "good" | "bad";
		}>([
			{ style: "good", spyOn: () => jest.spyOn(HaloTextHelper, "addGoodText") },
			{ style: "bad", spyOn: () => jest.spyOn(HaloTextHelper, "addBadText") },
			{ spyOn: () => jest.spyOn(HaloTextHelper, "addText") }
		])(
			"haloText should call HaloTextHelper with style $style",
			({ style, spyOn }) => {
				const spy = spyOn();
				const instance = new ConcretePlayer();
				instance.triggerOnCreatePlayer(mockPlayer);
				instance.haloText({
					text: "mock",
					style
				});
				expect(spy).toHaveBeenCalled();
			}
		);
		it("should do nothing if player is not defined", () => {
			const spy = jest.spyOn(HaloTextHelper, "addText");
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

	describe("trait methods", () => {
		describe("hasZWBFTrait", () => {
			it("should return false when player is not set", () => {
				const instance = new ConcretePlayer();
				const result = instance.testHasZWBFTrait(ZWBFTraitsEnum.FERTILE);
				expect(result).toBe(false);
				expect(CharacterTraitApi.hasTrait).not.toHaveBeenCalled();
			});

			it("should delegate to CharacterTraitApi when player is set", () => {
				const instance = new ConcretePlayer();
				instance.triggerOnCreatePlayer(mockPlayer);
				(CharacterTraitApi.hasTrait as jest.Mock).mockReturnValue(true);

				const result = instance.testHasZWBFTrait(ZWBFTraitsEnum.FERTILE);

				expect(result).toBe(true);
				expect(CharacterTraitApi.hasTrait).toHaveBeenCalledWith(mockPlayer, ZWBFTraitsEnum.FERTILE);
			});
		});

		describe("addZWBFTrait", () => {
			it("should do nothing when player is not set", () => {
				const instance = new ConcretePlayer();
				instance.testAddZWBFTrait(ZWBFTraitsEnum.FERTILE);
				expect(CharacterTraitApi.addTrait).not.toHaveBeenCalled();
			});

			it("should delegate to CharacterTraitApi when player is set", () => {
				const instance = new ConcretePlayer();
				instance.triggerOnCreatePlayer(mockPlayer);

				instance.testAddZWBFTrait(ZWBFTraitsEnum.FERTILE);

				expect(CharacterTraitApi.addTrait).toHaveBeenCalledWith(mockPlayer, ZWBFTraitsEnum.FERTILE);
			});
		});

		describe("removeZWBFTrait", () => {
			it("should do nothing when player is not set", () => {
				const instance = new ConcretePlayer();
				instance.testRemoveZWBFTrait(ZWBFTraitsEnum.FERTILE);
				expect(CharacterTraitApi.removeTrait).not.toHaveBeenCalled();
			});

			it("should delegate to CharacterTraitApi when player is set", () => {
				const instance = new ConcretePlayer();
				instance.triggerOnCreatePlayer(mockPlayer);

				instance.testRemoveZWBFTrait(ZWBFTraitsEnum.FERTILE);

				expect(CharacterTraitApi.removeTrait).toHaveBeenCalledWith(mockPlayer, ZWBFTraitsEnum.FERTILE);
			});
		});

		describe("static hasZWBFTrait", () => {
			it("should return false when player is undefined", () => {
				const result = ConcretePlayer.hasZWBFTrait(undefined, ZWBFTraitsEnum.FERTILE);
				expect(result).toBe(false);
				expect(CharacterTraitApi.hasTrait).not.toHaveBeenCalled();
			});

			it("should delegate to CharacterTraitApi when player is provided", () => {
				(CharacterTraitApi.hasTrait as jest.Mock).mockReturnValue(true);

				const result = ConcretePlayer.hasZWBFTrait(mockPlayer, ZWBFTraitsEnum.FERTILE);

				expect(result).toBe(true);
				expect(CharacterTraitApi.hasTrait).toHaveBeenCalledWith(mockPlayer, ZWBFTraitsEnum.FERTILE);
			});
		});
	});

	describe("data", () => {
		it("Should return null when modData is undefined", () => {
			const instance = new ConcretePlayer();
			(instance as any).data = undefined;
			expect(instance.data).toBeNull();
		});
		it("Should have defined data", () => {
			const instance = new ConcretePlayer("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			instance.data = { foo: "mocked" };
			expect(instance.data).toBeDefined();
		});
		it("Should have defaultData", () => {
			const instance = new ConcretePlayer("TESTING_DEFAULTS", { default: "default" });
			instance.triggerOnCreatePlayer(mockPlayer);
			expect(instance.data).toBeDefined();
		});
		it("Should set defaultData when ModData initially returns null", () => {
			const instance = new ConcretePlayer("TEST_KEY", { initial: "data" });
			instance.triggerOnCreatePlayer(mockPlayer);
			// The line `if(!this.data && this.defaultData) this.data = this.defaultData;` should be executed
			expect(instance.data).toEqual({ initial: "data" });
		});
	});

	describe("Pregnancy", () => {
		it.each([
			{ pregnancy: true, data: { progress: 0.5, current: 1, isInLabor: false } },
			{ pregnancy: false, data: null }
		])("Should return $data when pregnancy is $pregnancy", ({ pregnancy, data }) => {
			(mockPlayer.getCharacterTraits().get as any).mockReturnValue(pregnancy);
			const instance = new ConcretePlayer("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			data && (instance.pregnancy = data);
			(instance as any)._pregnancy = { data };
			expect(instance.pregnancy).toBe(data);
		});
		it("Pregnancy should return null if player is not pregnant", () => {
			(CharacterTraitApi.hasTrait as jest.Mock).mockReturnValue(false);
			const instance = new ConcretePlayer("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			instance.pregnancy = mock<PregnancyData>();
			expect(instance.pregnancy).toBeNull();
		});
		it("Pregnancy should return null if pregnancy data is not present", () => {
			(mockPlayer.getCharacterTraits().get as any).mockReturnValue(true);
			const instance = new ConcretePlayer("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			// Mock the _pregnancy ModData to return null
			(instance as any)._pregnancy = { data: null };
			expect(instance.pregnancy).toBeNull();
		});
	});
});
