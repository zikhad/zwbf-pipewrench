export class ISUIElement {
	x: number;
	y: number;
	width: number;
	height: number;
	initialise = jest.fn();
	instantiate = jest.fn();
	addToUIManager = jest.fn();
	setVisible = jest.fn();
	drawRect = jest.fn();

	constructor(x: number, y: number, width: number, height: number) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
}
