export const onGameStart = {
	addListener: jest.fn(callback => {
		// Simulate the event firing
		callback();
	})
};
