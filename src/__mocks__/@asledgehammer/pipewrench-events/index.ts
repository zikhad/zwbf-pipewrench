const mockedEvents = {
	addListener: jest.fn(callback => {
		// Simulate the event firing
		callback();
	})
};

export const onGameStart = mockedEvents;

export const everyOneMinute = mockedEvents;

export const onCreatePlayer = mockedEvents;

export const onGameBoot = mockedEvents;

export const onPreDistributionMerge = mockedEvents;