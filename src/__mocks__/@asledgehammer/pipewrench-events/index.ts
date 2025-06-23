export const onGameStart = {
	addListener: jest.fn()
};

export const everyOneMinute = {
	addListener: jest.fn()
};

export const everyTenMinutes = {
	addListener: jest.fn()
};

export const everyHours = {
	addListener: jest.fn()
};

export const everyDays = {
	addListener: jest.fn()
};

export const onDawn = {
	addListener: jest.fn()
};

export const onCreatePlayer = {
	addListener: jest.fn()
};

export const onGameBoot = {
	addListener: jest.fn()
};

export const onPreDistributionMerge = {
	addListener: jest.fn()
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class EventEmitter<T> {
	addListener() {
		return jest.fn();
	}
}
