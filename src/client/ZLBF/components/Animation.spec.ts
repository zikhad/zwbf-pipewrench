/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Events from "@asledgehammer/pipewrench-events";
import { Animation, AnimationConfig, ANIMATIONS } from "./Animation";
import { Womb } from "./Womb";
import { ITEMS, ZLBFEventsEnum } from "@constants";

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("./Womb");

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a minimal Womb stub for Animation tests. */
const makeWomb = (overrides: {
	amount?: number;
	capacity?: number;
	pregnancy?: { progress: number } | null;
	hasCondom?: boolean;
} = {}): Womb => {
	const {
		amount = 0,
		capacity = 1,
		pregnancy = null,
		hasCondom = false
	} = overrides;

	return {
		amount,
		capacity,
		pregnancy,
		hasItem: jest.fn().mockImplementation((item: string) => item === ITEMS.CONDOM && hasCondom)
	} as unknown as Womb;
};

/** Default animation payload for intercourse at the very start of a cycle. */
const intercourseStart = (overrides: Partial<AnimationConfig> = {}): AnimationConfig => ({
	animation: ANIMATIONS.INTERCOURSE,
	duration: 1000,
	delta: 0,
	...overrides
});

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("Animation", () => {
	let mockAddListener: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();

		mockAddListener = jest.fn();
		jest.spyOn(Events, "EventEmitter").mockReturnValue({ addListener: mockAddListener } as any);

		// Reset static state between runs
		Animation.wombImage = "media/ui/womb/normal/womb_normal_0.png";
		(Animation as any).isAnimationActive = false;
	});

	// ─── Constructor ───────────────────────────────────────────────────────

	describe("Constructor", () => {
		it("should register listeners for ANIMATION, ANIMATION_STOP, and IMAGE events", () => {
			const womb = makeWomb();
			new Animation(womb);

			const calledEvents = (Events.EventEmitter as jest.Mock).mock.calls.map(
				([event]: [string]) => event
			);
			expect(calledEvents).toContain(ZLBFEventsEnum.ANIMATION);
			expect(calledEvents).toContain(ZLBFEventsEnum.ANIMATION_STOP);
			expect(calledEvents).toContain(ZLBFEventsEnum.IMAGE);
			expect(mockAddListener).toHaveBeenCalledTimes(3);
		});
	});

	// ─── onAnimation ───────────────────────────────────────────────────────

	describe("onAnimation", () => {
		describe("normal animation (no condom, no pregnancy)", () => {
			it("should set the wombImage to the correct empty-fullness frame at delta 0", () => {
				const womb = makeWomb({ amount: 0, capacity: 1 });
				const animation = new Animation(womb);

				animation.onAnimation(intercourseStart({ delta: 0, duration: 1000 }));

				expect(Animation.wombImage).toBe("media/ui/animation/intercourse/empty/0.png");
			});

			it("should set the wombImage to full-fullness when amount exceeds half capacity", () => {
				const womb = makeWomb({ amount: 0.6, capacity: 1 });
				const animation = new Animation(womb);

				animation.onAnimation(intercourseStart({ delta: 0, duration: 1000 }));

				expect(Animation.wombImage).toBe("media/ui/animation/intercourse/full/0.png");
			});

			it("should advance to the next frame when delta increases", () => {
				const womb = makeWomb({ amount: 0, capacity: 1 });
				const animation = new Animation(womb);

				// Normal animation loops the bounce sequence 20 times before ending.
				const normalSteps = [
					...Array.from({ length: 20 }, () => [0, 1, 2, 3, 4, 3, 2, 1]).flat(),
					...([0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as number[])
				];
				const duration = 1000;
				const stepDuration = duration / normalSteps.length;

				// Pick a delta mid-step to land on step index 1
				const delta = (stepDuration * 1.5) / duration;
				animation.onAnimation(intercourseStart({ delta, duration }));

				expect(Animation.wombImage).toBe(
					`media/ui/animation/intercourse/empty/${normalSteps[1]}.png`
				);
			});
		});

		describe("condom animation", () => {
			it("should use the condom path when player has a condom", () => {
				const womb = makeWomb({ hasCondom: true, amount: 0, capacity: 1 });
				const animation = new Animation(womb);

				animation.onAnimation(intercourseStart());

				expect(Animation.wombImage).toMatch(/^media\/ui\/animation\/intercourse\/\d+\.png$/);
			});

			it("should keep womb context when calling hasItem", () => {
				const womb = {
					amount: 0,
					capacity: 1,
					pregnancy: null,
					player: {},
					hasItem(this: { player?: unknown }, item: string) {
						return !!this.player && item === ITEMS.CONDOM;
					}
				} as unknown as Womb;
				const animation = new Animation(womb);

				expect(() => animation.onAnimation(intercourseStart())).not.toThrow();
				expect(Animation.wombImage).toMatch(/^media\/ui\/animation\/intercourse\/\d+\.png$/);
			});
		});

		describe("pregnant animation (pregnancy.progress > 0.5)", () => {
			it("should use the pregnant path when pregnancy progress is above 0.5", () => {
				const womb = makeWomb({ pregnancy: { progress: 0.6 } });
				const animation = new Animation(womb);

				animation.onAnimation(intercourseStart());

				expect(Animation.wombImage).toMatch(/^media\/ui\/animation\/intercourse\/\d+\.png$/);
			});
		});

		describe("birth animation", () => {
			it("should use the birth path with no fullness sub-folder", () => {
				const womb = makeWomb({ pregnancy: { progress: 1 } });
				const animation = new Animation(womb);

				animation.onAnimation({
					animation: ANIMATIONS.BIRTH,
					duration: 1000,
					delta: 0
				});

				expect(Animation.wombImage).toMatch(/^media\/ui\/animation\/birth\/\d+\.png$/);
			});

			it("birth animation image should NOT contain a fullness path segment", () => {
				const womb = makeWomb({ amount: 0.9, capacity: 1 });
				const animation = new Animation(womb);

				animation.onAnimation({
					animation: ANIMATIONS.BIRTH,
					duration: 1000,
					delta: 0
				});

				expect(Animation.wombImage).not.toContain("/empty/");
				expect(Animation.wombImage).not.toContain("/full/");
			});
		});

		it("should mark animation as active", () => {
			const womb = makeWomb();
			const animation = new Animation(womb);

			expect((Animation as any).isAnimationActive).toBe(false);
			animation.onAnimation(intercourseStart());
			expect((Animation as any).isAnimationActive).toBe(true);
		});
	});

	// ─── onAnimationStop ───────────────────────────────────────────────────

	describe("onAnimationStop", () => {
		it("should mark animation as inactive", () => {
			const womb = makeWomb();
			const animation = new Animation(womb);

			animation.onAnimation(intercourseStart());
			expect((Animation as any).isAnimationActive).toBe(true);

			animation.onAnimationStop();
			expect((Animation as any).isAnimationActive).toBe(false);
		});
	});

	// ─── onImage ───────────────────────────────────────────────────────────

	describe("onImage", () => {
		it("should do nothing when an animation is active", () => {
			const womb = makeWomb({ amount: 0 });
			const animation = new Animation(womb);

			animation.onAnimation(intercourseStart());
			const imageBefore = Animation.wombImage;

			animation.onImage();
			expect(Animation.wombImage).toBe(imageBefore);
		});

		describe("normal status (no pregnancy)", () => {
			it("should set wombImage to frame 0 when amount is 0", () => {
				const womb = makeWomb({ amount: 0, capacity: 1 });
				const animation = new Animation(womb);

				animation.onImage();

				expect(Animation.wombImage).toBe("media/ui/womb/normal/womb_normal_0.png");
			});

			it("should set wombImage to frame ≥ 1 when amount is non-zero", () => {
				// amount=0.5, capacity=1 → percentage=50 → percentageToNumber(50,17)=8
				const womb = makeWomb({ amount: 0.5, capacity: 1 });
				const animation = new Animation(womb);

				animation.onImage();

				expect(Animation.wombImage).toBe("media/ui/womb/normal/womb_normal_8.png");
			});

			it("should clamp frame to 1 when amount yields index 0 but amount > 0", () => {
				// amount=0.001, capacity=1 → percentage=0 → percentageToNumber(0,17)=0 → max(1,0)=1
				const womb = makeWomb({ amount: 0.001, capacity: 1 });
				const animation = new Animation(womb);

				animation.onImage();

				expect(Animation.wombImage).toBe("media/ui/womb/normal/womb_normal_1.png");
			});
		});

		describe("conception status (pregnancy.progress ≤ 0.05)", () => {
			it("should use frame 0 for conception (progress = 0)", () => {
				const womb = makeWomb({ amount: 0, capacity: 1, pregnancy: { progress: 0 } });
				const animation = new Animation(womb);

				animation.onImage();

				expect(Animation.wombImage).toBe("media/ui/womb/conception/womb_conception_0.png");
			});
		});

		describe("pregnant status (pregnancy.progress > 0.05)", () => {
			it.each([
				{ progress: 0.1,  expected: 0 },  // floor(10/100 * 6) = 0
				{ progress: 0.5,  expected: 3 },  // floor(50/100 * 6) = 3
				{ progress: 0.8,  expected: 4 },  // floor(80/100 * 6) = 4
				{ progress: 0.91, expected: 6 },  // clamped to 100% → floor(100/100 * 6) = 6
				{ progress: 1,    expected: 6 },  // clamped to 100% → floor(100/100 * 6) = 6
			])(
				"should set frame $expected when progress is $progress",
				({ progress, expected }) => {
					const womb = makeWomb({ pregnancy: { progress } });
					const animation = new Animation(womb);

					animation.onImage();

					expect(Animation.wombImage).toBe(
						`media/ui/womb/pregnant/womb_pregnant_${expected}.png`
					);
				}
			);

			it("should cap progress at 1 when progress > 0.9 (same frame for 0.91 and 1.0)", () => {
				const anim91 = new Animation(makeWomb({ pregnancy: { progress: 0.91 } }));
				const anim100 = new Animation(makeWomb({ pregnancy: { progress: 1 } }));

				anim91.onImage();
				const image91 = Animation.wombImage;
				anim100.onImage();
				const image100 = Animation.wombImage;

				expect(image91).toBe(image100);
				expect(image91).toBe("media/ui/womb/pregnant/womb_pregnant_6.png");
			});
		});
	});

	// ─── Event wiring ──────────────────────────────────────────────────────

	describe("Event wiring via EventEmitter", () => {
		it("ANIMATION event should invoke onAnimation", () => {
			const womb = makeWomb();
			const animation = new Animation(womb);

			// Find the listener registered for ANIMATION
			const animationCallIdx = (Events.EventEmitter as jest.Mock).mock.calls.findIndex(
				([event]: [string]) => event === ZLBFEventsEnum.ANIMATION
			);
			const [onAnimationListener] = mockAddListener.mock.calls[animationCallIdx];

			const spy = jest.spyOn(animation, "onAnimation");
			onAnimationListener(intercourseStart());
			expect(spy).toHaveBeenCalled();
		});

		it("ANIMATION_STOP event should invoke onAnimationStop", () => {
			const womb = makeWomb();
			const animation = new Animation(womb);

			const stopCallIdx = (Events.EventEmitter as jest.Mock).mock.calls.findIndex(
				([event]: [string]) => event === ZLBFEventsEnum.ANIMATION_STOP
			);
			const [onStopListener] = mockAddListener.mock.calls[stopCallIdx];

			const spy = jest.spyOn(animation, "onAnimationStop");
			onStopListener();
			expect(spy).toHaveBeenCalled();
		});

		it("IMAGE event should invoke onImage", () => {
			const womb = makeWomb();
			const animation = new Animation(womb);

			const imageCallIdx = (Events.EventEmitter as jest.Mock).mock.calls.findIndex(
				([event]: [string]) => event === ZLBFEventsEnum.IMAGE
			);
			const [onImageListener] = mockAddListener.mock.calls[imageCallIdx];

			const spy = jest.spyOn(animation, "onImage");
			onImageListener();
			expect(spy).toHaveBeenCalled();
		});
	});
});
