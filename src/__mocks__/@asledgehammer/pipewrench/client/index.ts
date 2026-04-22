export class ISTimedActionQueue {
	static getTimedActionQueue() {
		return null as never;
	}
	static add() {}
}

export class ISInventoryPaneContextMenu {
	static transferIfNeeded() {}
}

export class ISToolTip {
	description = "";
	toolTip = "";
	instantiate() {}
	setVisible() {}
}
