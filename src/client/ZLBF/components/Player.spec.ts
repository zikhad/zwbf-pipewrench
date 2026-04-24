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
import { ZLBFTraitsEnum } from "@constants";
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
	public testHasTrait(trait: ZLBFTraitsEnum): boolean {
		return this.hasTrait(trait);
	}
	public testAddTrait(trait: ZLBFTraitsEnum): void {
		this.addTrait(trait);
	}
	public testRemoveTrait(trait: ZLBFTraitsEnum): void {
		this.removeTrait(trait);
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
		describe("hasTrait", () => {
			it("should return false when player is not set", () => {
				const instance = new ConcretePlayer();
				const result = instance.testHasTrait(ZLBFTraitsEnum.FERTILE);
				expect(result).toBe(false);
				expect(CharacterTraitApi.hasTrait).not.toHaveBeenCalled();
			});

			it("should delegate to CharacterTraitApi when player is set", () => {
				const instance = new ConcretePlayer();
				instance.triggerOnCreatePlayer(mockPlayer);
				(CharacterTraitApi.hasTrait as jest.Mock).mockReturnValue(true);

				const result = instance.testHasTrait(ZLBFTraitsEnum.FERTILE);

				expect(result).toBe(true);
				expect(CharacterTraitApi.hasTrait).toHaveBeenCalledWith(mockPlayer, ZLBFTraitsEnum.FERTILE);
			});
		});

		describe("addTrait", () => {
			it("should do nothing when player is not set", () => {
				const instance = new ConcretePlayer();
				instance.testAddTrait(ZLBFTraitsEnum.FERTILE);
				expect(CharacterTraitApi.addTrait).not.toHaveBeenCalled();
			});

			it("should delegate to CharacterTraitApi when player is set", () => {
				const instance = new ConcretePlayer();
				instance.triggerOnCreatePlayer(mockPlayer);

				instance.testAddTrait(ZLBFTraitsEnum.FERTILE);

				expect(CharacterTraitApi.addTrait).toHaveBeenCalledWith(mockPlayer, ZLBFTraitsEnum.FERTILE);
			});
		});

		describe("removeTrait", () => {
			it("should do nothing when player is not set", () => {
				const instance = new ConcretePlayer();
				instance.testRemoveTrait(ZLBFTraitsEnum.FERTILE);
				expect(CharacterTraitApi.removeTrait).not.toHaveBeenCalled();
			});

			it("should delegate to CharacterTraitApi when player is set", () => {
				const instance = new ConcretePlayer();
				instance.triggerOnCreatePlayer(mockPlayer);

				instance.testRemoveTrait(ZLBFTraitsEnum.FERTILE);

				expect(CharacterTraitApi.removeTrait).toHaveBeenCalledWith(mockPlayer, ZLBFTraitsEnum.FERTILE);
			});
		});

		describe("static hasTrait", () => {
			it("should return false when player is undefined", () => {
				const result = ConcretePlayer.hasTrait(undefined, ZLBFTraitsEnum.FERTILE);
				expect(result).toBe(false);
				expect(CharacterTraitApi.hasTrait).not.toHaveBeenCalled();
			});

			it("should delegate to CharacterTraitApi when player is provided", () => {
				(CharacterTraitApi.hasTrait as jest.Mock).mockReturnValue(true);

				const result = ConcretePlayer.hasTrait(mockPlayer, ZLBFTraitsEnum.FERTILE);

				expect(result).toBe(true);
				expect(CharacterTraitApi.hasTrait).toHaveBeenCalledWith(mockPlayer, ZLBFTraitsEnum.FERTILE);
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

	describe("applyDamage", () => {
		const setAdditionalPain = jest.fn();
		const getAdditionalPain = jest.fn().mockReturnValue(0);
		const setBleedingTime = jest.fn();
		const getBleedingTime = jest.fn().mockReturnValue(0);

		beforeEach(() => {
			jest.clearAllMocks();
			getAdditionalPain.mockReturnValue(0);
			getBleedingTime.mockReturnValue(0);
			(mockBodyPart as any).getAdditionalPain = getAdditionalPain;
			(mockBodyPart as any).setAdditionalPain = setAdditionalPain;
			(mockBodyPart as any).getBleedingTime = getBleedingTime;
			(mockBodyPart as any).setBleedingTime = setBleedingTime;
		});

		class ConcretePlayerWithApplyDamage extends ConcretePlayer {
			public testApplyDamage(
				part: BodyPartType,
				options?: Partial<{ pain: number; bleedTime: number }>
			): void {
				this.applyBodyEffect(part, options);
			}
		}

		it("should apply pain to a body part", () => {
			const instance = new ConcretePlayerWithApplyDamage("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			instance.testApplyDamage(BodyPartType.Groin, { pain: 50 });
			expect(setAdditionalPain).toHaveBeenCalledWith(50);
		});

		it("should apply bleed time to a body part", () => {
			const instance = new ConcretePlayerWithApplyDamage("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			instance.testApplyDamage(BodyPartType.Groin, { bleedTime: 10 });
			expect(setBleedingTime).toHaveBeenCalledWith(10);
		});

		it("should apply both pain and bleed time", () => {
			const instance = new ConcretePlayerWithApplyDamage("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			instance.testApplyDamage(BodyPartType.Groin, { pain: 25, bleedTime: 5 });
			expect(setAdditionalPain).toHaveBeenCalledWith(25);
			expect(setBleedingTime).toHaveBeenCalledWith(5);
		});

		it("should add pain to existing pain", () => {
			getAdditionalPain.mockReturnValue(30);
			const instance = new ConcretePlayerWithApplyDamage("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			instance.testApplyDamage(BodyPartType.Groin, { pain: 20 });
			expect(setAdditionalPain).toHaveBeenCalledWith(50); // 30 + 20
		});

		it("should add bleed time to existing bleed time", () => {
			getBleedingTime.mockReturnValue(5);
			const instance = new ConcretePlayerWithApplyDamage("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			instance.testApplyDamage(BodyPartType.Groin, { bleedTime: 3 });
			expect(setBleedingTime).toHaveBeenCalledWith(8); // 5 + 3
		});

		it("should not apply negative pain values", () => {
			const instance = new ConcretePlayerWithApplyDamage("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			instance.testApplyDamage(BodyPartType.Groin, { pain: -10 });
			expect(setAdditionalPain).not.toHaveBeenCalled();
		});

		it("should not apply zero pain values", () => {
			const instance = new ConcretePlayerWithApplyDamage("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			instance.testApplyDamage(BodyPartType.Groin, { pain: 0 });
			expect(setAdditionalPain).not.toHaveBeenCalled();
		});

		it("should not apply negative bleed time values", () => {
			const instance = new ConcretePlayerWithApplyDamage("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			instance.testApplyDamage(BodyPartType.Groin, { bleedTime: -5 });
			expect(setBleedingTime).not.toHaveBeenCalled();
		});

		it("should not apply zero bleed time values", () => {
			const instance = new ConcretePlayerWithApplyDamage("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			instance.testApplyDamage(BodyPartType.Groin, { bleedTime: 0 });
			expect(setBleedingTime).not.toHaveBeenCalled();
		});

		it("should do nothing if body part does not exist", () => {
			(mockBodyDamage.getBodyPart as jest.Mock).mockReturnValue(null);
			const instance = new ConcretePlayerWithApplyDamage("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			instance.testApplyDamage(BodyPartType.Groin, { pain: 50 });
			expect(setAdditionalPain).not.toHaveBeenCalled();
			(mockBodyDamage.getBodyPart as jest.Mock).mockReturnValue(mockBodyPart);
		});

		it("should do nothing if player is not defined", () => {
			const instance = new ConcretePlayerWithApplyDamage("TEST_KEY");
			instance.testApplyDamage(BodyPartType.Groin, { pain: 50 });
			expect(setAdditionalPain).not.toHaveBeenCalled();
		});

		it("should do nothing if options are undefined", () => {
			const instance = new ConcretePlayerWithApplyDamage("TEST_KEY");
			instance.triggerOnCreatePlayer(mockPlayer);
			instance.testApplyDamage(BodyPartType.Groin);
			expect(setAdditionalPain).not.toHaveBeenCalled();
			expect(setBleedingTime).not.toHaveBeenCalled();
		});
	});
});
