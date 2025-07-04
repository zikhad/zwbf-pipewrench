/* eslint-disable @typescript-eslint/no-explicit-any */
import { IsoPlayer } from "@asledgehammer/pipewrench";
import { mock } from "jest-mock-extended";

globalThis.print = jest.fn();

(globalThis as any).NewUI = () => ({
	setWidthPixel: jest.fn(),
	setHeight: jest.fn(),
	setVisible: jest.fn(),
	setTitle: jest.fn(),
	addText: jest.fn(),
	nextLine: jest.fn(),
	addProgressBar: jest.fn(),
	addButton: jest.fn(),
	addImage: jest.fn(),
	setBorderToAllElements: jest.fn(),
	saveLayout: jest.fn(),
	titleBarHeight: jest.fn(),
	yAct: 0,
	isUIVisible: false
});

export const mockedPlayer = (overrides: Partial<IsoPlayer> = {}) => mock<IsoPlayer>(overrides);
