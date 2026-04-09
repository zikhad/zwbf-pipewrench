import { InventoryItem } from "@asledgehammer/pipewrench";
import { Fluid } from "server/types";

export class FluidContainerApi {
	constructor(private readonly item: InventoryItem) {}

	private get container() {
		return this.item.getFluidContainer?.() ?? null;
	}

	hasContainer(): boolean {
		return this.container !== null;
	}

	isFull(): boolean {
		return this.container?.isFull() ?? false;
	}

	isEmpty(): boolean {
		return this.container?.isEmpty() ?? false;
	}

	fill(fluid: Fluid, amount: number): number {
		const container = this.container;
		if (!container) return 0;

		const addedFluid = Math.min(container.getFreeCapacity(), amount);
		if (addedFluid <= 0) return 0;

		container.addFluid(fluid, addedFluid);
		return addedFluid;
	}

	clear(): void {
		this.container?.removeFluid();
	}
}
