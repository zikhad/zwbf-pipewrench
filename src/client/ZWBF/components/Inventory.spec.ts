/* eslint-disable @typescript-eslint/no-explicit-any */
import { mock } from "jest-mock-extended";
import { Inventory } from "./Inventory";

import * as Events from "@asledgehammer/pipewrench-events";
import { Lactation } from "./Lactation";
import { Pregnancy } from "./Pregnancy";
import { Womb } from "./Womb";
import { InventoryItem, ISBaseTimedAction, IsoGameCharacter } from "@asledgehammer/pipewrench";

jest.mock("@asledgehammer/pipewrench-events");

describe("Inventory", () => {
	const addListener = jest.fn();
	const addOption = jest.fn();
	const context = { addOption };
	beforeEach(() => {
		addListener.mockClear();
		addOption.mockClear();
		(Events as any).onFillInventoryObjectContextMenu = { addListener };
	});
	it("should call listener correctly", () => {
		new Inventory({
			lactation: mock(),
			pregnancy: mock(),
			womb: mock()
		});
		const [callback] = addListener.mock.calls[0];
		callback(0, context, []);
		expect(addListener).toHaveBeenCalled();
	});
	it.each<{
		scenario: string;
		item: string;
		text: string;
		lactation?: Lactation;
		pregnancy?: Pregnancy;
		womb?: Womb;
	}>([
		{
			scenario: "Breastfeed baby",
			item: "Baby",
			text: "ContextMenu_BreastFeed_Baby",
			lactation: mock<Lactation>({
				milkAmount: 0.4,
				bottleAmount: 0.2
			})
		}
	])("For $scenario addOption should be called with $text", props => {
		const {
			item,
			text,
			lactation = mock<Lactation>(),
			pregnancy = mock<Pregnancy>(),
			womb = mock<Womb>()
		} = props;

		new Inventory({
			lactation,
			pregnancy,
			womb
		});

		const [callback] = addListener.mock.calls[0];
		callback(0, context, [{ getType: () => item, name: item }]);
		const [, , handler] = addOption.mock.calls[0];
		handler(mock<InventoryItem>(), mock<IsoGameCharacter>(), mock<ISBaseTimedAction>());
		expect(addOption).toHaveBeenCalledWith(text, expect.any(Object), expect.any(Function));
	});
});
