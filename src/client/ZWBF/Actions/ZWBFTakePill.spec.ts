import { InventoryItem, IsoGameCharacter } from "@asledgehammer/pipewrench";
import { ZWBFTakePills } from "./ZWBFTakePills";
import { mock } from "jest-mock-extended";

class TestClass extends ZWBFTakePills {}

describe("ZWBFTakePill", () => {
	const mockedCharacter = (overrides: Partial<IsoGameCharacter> = {}) =>
		mock<IsoGameCharacter>(overrides);
	it("should be instantiable", () => {
		const instance = new TestClass({
			name: "TestAction",
			character: mockedCharacter(),
			contextMenu: "Take Pills",
			pills: mock()
		});
		expect(instance).toBeInstanceOf(TestClass);
	});
	it("should return true for isValid when character has pills", () => {
		const character = mockedCharacter({
			getInventory: jest.fn().mockImplementation(() => ({
				contains: jest.fn().mockReturnValue(true)
			}))
		});
		const instance = new TestClass({
			name: "TestAction",
			character: mock(),
			contextMenu: "Take Pills",
			pills: mock()
		});
		instance.character = character;
		expect(instance.isValid()).toBe(true);
	});
	it.each([{ method: "start" }, { method: "stop" }, { method: "update" }, { method: "perform" }])(
		"$method should call setJobDelta on pills",
		({ method }) => {
			const spySetJobDelta = jest.fn();
			const instance = new TestClass({
				name: "TestAction",
				character: mock(),
				contextMenu: "Take Pills",
				pills: mock<InventoryItem>({
					setJobDelta: spySetJobDelta
				})
			});
			instance.character = mockedCharacter();
			instance[method]();
			expect(spySetJobDelta).toHaveBeenCalled();
		}
	);
});
