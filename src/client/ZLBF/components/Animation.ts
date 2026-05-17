import { ZombRandBetween } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { Womb } from "@client/components/Womb";
import { createArray, percentageToNumber, repeatArray } from "@client/Utils";
import { ITEMS, ZLBFEventsEnum } from "@constants";

/** External Identifiers of the type of animation to play. */
export enum ANIMATIONS {
    INTERCOURSE = "intercourse",
    BIRTH = "birth",
    // CUSTOM = "custom",
    FERTILIZATION = "fertilization"
}

/**
 * Defines the frame steps and optional loop count for a given animation.
 * @property steps - An array of frame indices that dictate the animation sequence.
 * @property loop - Optional number of times the animation should repeat within its duration (default is 1).
 * @property fullnessSupport - Optional flag indicating if the animation has separate frames for "full" vs "empty" states. (default is false)
 */
type AnimationSetting = {
    name: string,
    steps: number[],
    loop?: number,
    fullnessSupport?: ("full" | "empty")[]
    pregnancy?: boolean
    condom?: boolean
    path?: string
};


/** Maps each animation key to its variant settings. */
type AnimationSettings = Record<ANIMATIONS, AnimationSetting[]>;

/**
 * Payload sent when an animation event fires.
 * @property animation - Which animation to play.
 * @property duration  - Total duration of the animation cycle in milliseconds.
 * @property delta     - Normalized playback position within the current cycle (0–1).
 * @property custom      - Optional override for default animation settings (frame steps, loop count, fullness support).
 */
export type AnimationUpdateConfig = {
    duration: number;
    delta: number;
};

/**
 * Manages womb image rendering for both animated scenes and idle still frames.
 *
 * The current image path is stored in the static {@link Animation.wombImage} property
 * so that UI components can read it without holding a direct reference to this instance.
 *
 * Subscribes to three game events via {@link ZLBFEventsEnum}:
 * - `ANIMATION`      → {@link onAnimation}  — updates the frame for the active scene.
 * - `ANIMATION_STOP` → {@link onAnimationStop} — marks the animation as inactive.
 * - `IMAGE`          → {@link onImage}       — refreshes the idle womb image.
 */
export class Animation {
    /** The current womb image path, shared across all consumers. */
    public static wombImage: string = "media/ui/womb/normal/womb_normal_0.png";
    public static animation: AnimationSetting | undefined;

    static readonly defaultAnimations: AnimationSettings = {
        [ANIMATIONS.INTERCOURSE]: [
            {
                name: "intercourse",
                steps: [
                    ...repeatArray([0, 1, 2, 3, 4, 3, 2, 1], 20),
                    ...createArray(10)
                ],
                loop: 1,
                fullnessSupport: ["empty", "full"]
            },
            {
                name: "intercourse-v1",
                steps: createArray(171),
                loop: 1,
                fullnessSupport: ["empty"]
            },
            {
                name: "intercourse-v2",
                steps: createArray(13),
                loop: 20,
                fullnessSupport: ["full"]
            },
            {
                name: "intercourse-v3",
                steps: createArray(29),
                loop: 20
            },
            {
                name: "intercourse-v4",
                steps: createArray(30),
                loop: 20,
                fullnessSupport: ["empty"]
            },
            {
                name: "pregnant",
                steps: [
                    ...repeatArray([0, 1, 2, 3, 2, 1], 20),
                    ...createArray(12)
                ],
                loop: 1,
                pregnancy: true,
            },
            {
                name: "pregnant-v1",
                steps: createArray(15),
                loop: 20,
                pregnancy: true,
            },
            {
                name: "pregnant-v2",
                steps: createArray(3),
                loop: 20,
                pregnancy: true,
            },
            {
                name: "condom",
                steps: createArray(7),
                loop: 4,
                condom: true,
            },
            {
                name: "condom-v1",
                steps: createArray(30),
                loop: 20,
                condom: true,
                fullnessSupport: ["empty"]
            },
            {
                name: "condom-v2",
                steps: createArray(24),
                loop: 20,
                condom: true,
                fullnessSupport: ["empty"]
            },
            {
                name: "condom-v3",
                steps: createArray(4),
                loop: 30,
                condom: true,
            }
        ],
        [ANIMATIONS.BIRTH]: [
            {
                name: "birth",
                steps: createArray(12),
                loop: 1,
            },
            {
                name: "birth-v1",
                steps: createArray(20),
                loop: 1,
            },
            {
                name: "birth-v2",
                steps: createArray(29),
                loop: 1,
            },
            {
                name: "birth-v3",
                steps: createArray(76),
                loop: 1,
            }
        ],
        [ANIMATIONS.FERTILIZATION]: [
            {
                name: "fertilization",
                steps: createArray(29),
                loop: 1
            },
            {
                name: "fertilization-v1",
                steps: createArray(31),
                loop: 1
            },
            {
                name: "fertilization-v2",
                steps: createArray(26),
                loop: 1
            },
            {
                name: "fertilization-v3",
                steps: createArray(32),
                loop: 1
            },
            {
                name: "fertilization-v4",
                steps: createArray(13),
                loop: 1
            }
        ],
    };

    /**
     * @param womb - The {@link Womb} instance used to read reproductive state (amount, capacity, pregnancy, active items).
     */
    constructor(
        private readonly womb: Womb
    ) {
        new Events.EventEmitter(ZLBFEventsEnum.ANIMATION_START)
            .addListener((animation: ANIMATIONS) => this.onAnimationStart(animation));
        new Events.EventEmitter<(data: AnimationUpdateConfig) => void>(ZLBFEventsEnum.ANIMATION_UPDATE)
            .addListener((data) => this.onAnimation(data));
        new Events.EventEmitter(ZLBFEventsEnum.ANIMATION_STOP)
            .addListener(() => this.onAnimationStop());
        new Events.EventEmitter(ZLBFEventsEnum.IMAGE)
            .addListener(() => this.onImage());
    }

    /**
     * Filters the available animation variants based on the player's current reproductive state.
     * @param animations The array of animation settings to filter.
     * @returns The filtered array of animation settings that match the player's current reproductive state.
     */
    private filterVariants(animations: AnimationSetting[]) {
        const hasCondom = this.hasCondom;
        const isPregnant = this.pregnancyStatus === "pregnant";

        return animations.filter(({ condom, pregnancy }) => {
            if (hasCondom && condom !== true) return false; /** Requires condom but variant does not support it */
            if (!hasCondom && condom === true) return false; /** Does not require condom but variant requires it */
            if (isPregnant && pregnancy !== true) return false; /** Is pregnant but variant does not support it */
            if (!isPregnant && pregnancy === true) return false; /** Is not pregnant but variant requires it */
            return true;
        });
    }


    onAnimationStart(animation: ANIMATIONS | AnimationSetting) {
        if (typeof animation === "string") {
            const animationVariants = Animation.defaultAnimations[animation];
            if (!animationVariants || animationVariants.length === 0) {
                Animation.animation = undefined;
                return;
            }

            const selectableVariants = this.filterVariants(animationVariants);
            const variantIndex = ZombRandBetween(0, selectableVariants.length - 1);

            Animation.animation = selectableVariants[variantIndex] ?? selectableVariants[0];
        } else {
            Animation.animation = animation;
        }
    }

    /**
     * Event that updates the image of womb animated version
     * @param delta Animation delta time
     * @param duration The duration of the animation
    * */
    onAnimation({ delta, duration }: AnimationUpdateConfig) {
		if (!Animation.animation) return;

        const {
            name,
            path = `media/ui/animation`,
            steps,
            loop = 1,
            fullnessSupport = [],
        } = Animation.animation;

        const loopDuration = duration / loop;
        const currentLoopDelta = (delta * duration) % loopDuration;
        const stepDuration = loopDuration / steps.length;
        const stepIndex = Math.floor(currentLoopDelta / stepDuration) % steps.length;
        const step = steps[stepIndex] ?? 0;
        
        const fullness = (this.womb.amount > (this.womb.capacity / 2)) ? "full" : "empty";
        const fullnessPath = (fullnessSupport.includes(fullness)) ? fullness : null;

		Animation.wombImage = `${[path, name, fullnessPath, step].filter((part => part !== null)).join("/")}.png`;
    }

    /** Marks the active animation as finished and re-enables idle image updates. */
    onAnimationStop() {
        Animation.animation = undefined;
    }


    /**
     * Returns the player's current reproductive pregnancyStatus for still-image selection.
     * - `"pregnant"` when pregnancy progress exceeds 5 %.
     * - `"conception"` when pregnant but progress ≤ 5 %.
     * - `"normal"` when there is no active pregnancy.
     */
    private get pregnancyStatus() {
        const { pregnancy } = this.womb;
        if (!pregnancy) return "normal";
        if (pregnancy.progress > 0.05) return "pregnant";
        return "conception";
    }

    private get hasCondom() {
        const { hasItem } = this.womb;
        return hasItem(ITEMS.CONDOM);
    }

    /**
     * Computes the zero-based frame index for the idle still image.
     *
     * - Clamps pregnancy progress to 1 at 90 %+ and maps it to frames 0–6.
     * - When no pregnancy, maps sperm fill percentage to frames 1–17 (0 if empty).
     */
    private get imageIndex() {
        const { pregnancy, amount, capacity } = this.womb;
        if (pregnancy && pregnancy.progress > 0.05) {
            const percentage = (pregnancy.progress > 0.9 ? 1 : pregnancy.progress) * 100;
            return percentageToNumber(percentage, 6);
        }
        if (amount === 0) return 0;
        const percentage = Math.floor((amount / capacity) * 100);
        const index = percentageToNumber(percentage, 17);
        return Math.max(1, index);

    }

    /**
     * Event that updates the still image of Womb
     */
    onImage() {
        if (Animation.animation) return;
        Animation.wombImage = `media/ui/womb/${this.pregnancyStatus}/womb_${this.pregnancyStatus}_${this.imageIndex}.png`;
    }
}