interface UIElement {
	setText: (text: string) => void;
	setValue: (value: number) => void;
	setPath: (path: string) => void;
	setVisible: (visible: boolean) => void;
}

interface UIObject {
	// UI properties
	yAct: number;
	isUIVisible: boolean;

	// UI methods
	setWidthPixel: (width: number) => void;
	setHeight: (height: number) => void;
	setTitle: (title: string) => void;
	titleBarHeight: () => number;
	setVisible: (state: boolean) => void;
	setPositionPixel: (x: number, y: number) => void;
	setPositionPercent: (x: number, y: number) => void;
	toggle: () => void;
	open: () => void;
	close: () => void;

	// Content methods
	addText: (
		id: string,
		text: string,
		font?: string,
		position?: "Center" | "Left" | "Right"
	) => void;
	nextLine: () => void;
	addProgressBar: (id: string, value: number, min: number, max: number) => void;
	addButton: (id: string, text: string, callback: () => void) => void;
	addImage: (id: string, imagePath: string) => void;

	// Layout methods
	setBorderToAllElements: (border: boolean) => void;
	saveLayout: () => void;
}

type SimpleUI = UIObject & { [id: string]: UIElement };

declare const NewUI: () => SimpleUI;
