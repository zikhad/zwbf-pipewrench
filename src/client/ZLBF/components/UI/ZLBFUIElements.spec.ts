import { ZLBFUIElements } from "@client/components/UI/ZLBFUIElements";

describe("ZLBFUIElements", () => {
	describe("lactation keys", () => {
		it("has correct image key", () => {
			expect(ZLBFUIElements.lactation.image).toBe("lactation-image");
		});
		it("has correct title key", () => {
			expect(ZLBFUIElements.lactation.title).toBe("lactation-level-title");
		});
		it("has correct level key", () => {
			expect(ZLBFUIElements.lactation.level).toBe("lactation-level-image");
		});
	});

	describe("womb keys", () => {
		it("has correct image key", () => {
			expect(ZLBFUIElements.womb.image).toBe("womb-image");
		});
		it("has correct sperm current title key", () => {
			expect(ZLBFUIElements.womb.sperm.current.title).toBe("womb-sperm-current-title");
		});
		it("has correct sperm current amount key", () => {
			expect(ZLBFUIElements.womb.sperm.current.amount).toBe("womb-sperm-current-amount");
		});
		it("has correct sperm total title key", () => {
			expect(ZLBFUIElements.womb.sperm.total.title).toBe("womb-sperm-total-title");
		});
		it("has correct sperm total amount key", () => {
			expect(ZLBFUIElements.womb.sperm.total.amount).toBe("womb-sperm-total-amount");
		});
		it("has correct cycle title key", () => {
			expect(ZLBFUIElements.womb.cycle.title).toBe("womb-cycle-title");
		});
		it("has correct cycle phase title key", () => {
			expect(ZLBFUIElements.womb.cycle.phase.title).toBe("womb-cycle-phase-title");
		});
		it("has correct cycle phase value key", () => {
			expect(ZLBFUIElements.womb.cycle.phase.value).toBe("womb-cycle-phase-value");
		});
		it("has correct fertility title key", () => {
			expect(ZLBFUIElements.womb.fertility.title).toBe("womb-fertility-title");
		});
		it("has correct fertility bar key", () => {
			expect(ZLBFUIElements.womb.fertility.bar).toBe("womb-fertility-bar");
		});
		it("has correct fertility value key", () => {
			expect(ZLBFUIElements.womb.fertility.value).toBe("womb-fertility-value");
		});
	});
});
