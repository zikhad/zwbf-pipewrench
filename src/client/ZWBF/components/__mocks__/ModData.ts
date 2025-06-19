export class ModData<T> {
	get data() {
		return jest.fn() as T;
	}
	set data(value: T) {}
}
