import { TSUIRedSquare } from "./TSUIRedSquare";

jest.mock("@asledgehammer/pipewrench/client");

describe("TSUIRedSquare", () => {
	it("should instantiate", () => {
		const element = new TSUIRedSquare(1, 2, 3, 4);
		expect(element.initialise).toHaveBeenCalled();
		expect(element.instantiate).toHaveBeenCalled();
		expect(element.addToUIManager).toHaveBeenCalled();
		expect(element.setVisible).toHaveBeenCalledWith(true);
	});

	it("should render a red square", () => {
		const element = new TSUIRedSquare(1, 2, 3, 4);
		element.render();
		expect(element.drawRect).toHaveBeenCalledWith(1, 2, 3, 4, 1, 1.0, 0.0, 0.0);
	});
});
