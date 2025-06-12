export class Womb {
	private _spermAmount = 0;
	
	set spermAmount(value: number) {
		this._spermAmount = value;
	}
	get spermAmount() {
		return this._spermAmount;
	}
}