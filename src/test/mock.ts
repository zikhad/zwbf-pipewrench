import { IsoPlayer } from "@asledgehammer/pipewrench";
import { mock } from "jest-mock-extended";

globalThis.print = jest.fn();

export const mockedPlayer = (overrides: Partial<IsoPlayer> = {}) => mock<IsoPlayer>(overrides);