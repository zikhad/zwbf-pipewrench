import { IsoObject, IsoPlayer } from "@asledgehammer/pipewrench";
import { addRedSquare, greetPlayer, isoObjectToString } from "./ExampleAPI";
import { mock } from "jest-mock-extended";
import * as TSUIRedSquareSpy from "./TSUIRedSquare";

jest.mock("./TSUIRedSquare");

describe("ExampleAPI Testing", () => {
	it("isoObjectToString", () => {
		const mockedIsoObject = mock<IsoObject>({
			getObjectName: () => "mock",
			getX: () => 100,
			getY: () => 100,
			getZ: () => 100
		});

		const result = isoObjectToString(mockedIsoObject);

		expect(JSON.parse(result)).toStrictEqual({
			name: "mock",
			x: "100",
			y: "100",
			z: "100"
		});
	});

	it("addRedSquare", () => {
		addRedSquare();
		expect(TSUIRedSquareSpy.TSUIRedSquare).toHaveBeenCalledWith(512, 256, 256, 256);
	});

	it("greetPlayer", () => {
		greetPlayer(
			mock<IsoPlayer>({
				getFullName: () => "Mock"
			})
		);
		expect(global.print).toHaveBeenCalledWith("Hello, Mock!");
	});
});
