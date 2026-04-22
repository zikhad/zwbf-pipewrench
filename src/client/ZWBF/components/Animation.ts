import * as Events from "@asledgehammer/pipewrench-events";
import { Womb } from "@client/components/Womb";
import { percentageToNumber } from "@client/Utils";
import { ITEMS, ZWBFEventsEnum } from "@constants";

/** Identifies the type of animation to play. */
export enum ANIMATIONS {
    INTERCOURSE = "intercourse",
    BIRTH = "birth"
}

/** Internal keys mapping animation states to their frame sequences. */
enum ANIMATION_KEY {
    NORMAL = "normal",
    PREGNANT = "pregnant",
    CONDOM = "condom",
    BIRTH = "birth"
}

/** Maps each animation key to its ordered frame steps and optional loop count. */
type AnimationSettings = Record<ANIMATION_KEY, { steps: number[], loop?: number }>;

/**
 * Payload sent when an animation event fires.
 * @property animation - Which animation to play.
 * @property duration  - Total duration of the animation cycle in milliseconds.
 * @property delta     - Normalized playback position within the current cycle (0–1).
 */
export type AnimationConfig = {
    animation: ANIMATIONS;
    duration: number;
    delta: number;
};

/**
 * Manages womb image rendering for both animated scenes and idle still frames.
 *
 * The current image path is stored in the static {@link Animation.wombImage} property
 * so that UI components can read it without holding a direct reference to this instance.
 *
 * Subscribes to three game events via {@link ZWBFEventsEnum}:
 * - `ANIMATION`      → {@link onAnimation}  — updates the frame for the active scene.
 * - `ANIMATION_STOP` → {@link onAnimationStop} — marks the animation as inactive.
 * - `IMAGE`          → {@link onImage}       — refreshes the idle womb image.
 */
export class Animation {
    /** The current womb image path, shared across all consumers. */
    public static wombImage: string = "media/ui/womb/normal/womb_normal_0.png";
    private static isAnimationActive = false;

    private readonly animations: AnimationSettings = {
        [ANIMATION_KEY.NORMAL]: {
            steps: [
                [0, 1, 2, 3, 4, 3, 2, 1],
                [0, 1, 2, 3, 4, 3, 2, 1],
                [0, 1, 2, 3, 4, 3, 2, 1],
                [0, 1, 2, 3, 4, 3, 2, 1],
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
            ].flat()
        },
        [ANIMATION_KEY.PREGNANT]: {
            steps: [
                [0, 1, 2, 3, 2, 1],
                [0, 1, 2, 3, 2, 1],
                [0, 1, 2, 3, 2, 1],
                [0, 1, 2, 3, 2, 1],
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
            ].flat()
        },
        [ANIMATION_KEY.CONDOM]: {
            steps: [0, 1, 2, 3, 4, 5, 6],
            loop: 4
        },
        [ANIMATION_KEY.BIRTH]: {
            steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        }
    };

    /**
     * @param womb - The {@link Womb} instance used to read reproductive state
     *               (amount, capacity, pregnancy, active items).
     */
    constructor(
        private readonly womb: Womb
    ) {
        new Events.EventEmitter<(data: AnimationConfig) => void>(ZWBFEventsEnum.ANIMATION).addListener((data) => this.onAnimation(data));
        new Events.EventEmitter(ZWBFEventsEnum.ANIMATION_STOP).addListener(() => this.onAnimationStop());
        new Events.EventEmitter(ZWBFEventsEnum.IMAGE).addListener(() => this.onImage());
    }

    /**
     * Returns `"full"` when the womb holds more than half its capacity,
     * otherwise `"empty"`. Used to select the correct normal-animation folder.
     */
    private get fullness() {
        if (this.womb.amount > (this.womb.capacity / 2)) {
            return "full";
        }
        return "empty";
    }

    /**
     * This helper will extract a valid animationKey given a animation to run
     * Since the normal animation can either be condom / pregnant or normal
     * @param key The animation to extract key from
     * @returns A valid animation key
     */
    private animationKey(key: ANIMATIONS ): ANIMATION_KEY {
        if(key === ANIMATIONS.BIRTH) {
            return ANIMATION_KEY.BIRTH;
        }
        const { hasItem, pregnancy } = this.womb;
        if (hasItem(ITEMS.CONDOM)) return ANIMATION_KEY.CONDOM;
        if (pregnancy && pregnancy.progress > 0.5) return ANIMATION_KEY.PREGNANT;
        return ANIMATION_KEY.NORMAL;
    }

    /**
     * Event that updates the image of womb animated version
     * @param props.animation The ENUM for the animation to be used
     * @param props.delta Animation delta time
     * @param props.duration The duration of the animation  
    * */
    onAnimation({ animation, delta, duration = 1 }: AnimationConfig) {
        Animation.isAnimationActive = true;
        const key = this.animationKey(animation);
        const { steps, loop = 1 } = this.animations[key];
        const fullness = this.fullness;
        const loopDuration = duration / loop;
        const currentLoopDelta = (delta * duration) % loopDuration;
		const stepDuration = loopDuration / steps.length;

		const stepIndex = Math.floor(currentLoopDelta / stepDuration) % steps.length;
		const step = steps[stepIndex];

        const fullnessPath = (key == ANIMATION_KEY.NORMAL) ? `/${fullness}` : "";
        Animation.wombImage = `media/ui/animation/${animation}${fullnessPath}/${step}.png`;
    }

    /** Marks the active animation as finished and re-enables idle image updates. */
    onAnimationStop() {
        Animation.isAnimationActive = false;
    }

    
    /**
     * Returns the player's current reproductive status for still-image selection.
     * - `"pregnant"` when pregnancy progress exceeds 5 %.
     * - `"conception"` when pregnant but progress ≤ 5 %.
     * - `"normal"` when there is no active pregnancy.
     */
    private get status() {
        const { pregnancy } = this.womb;
        if (!pregnancy) return "normal";
        if (pregnancy.progress > 0.05) return "pregnant";
        return "conception";
    }

    /**
     * Computes the zero-based frame index for the idle still image.
     *
     * - Clamps pregnancy progress to 1 at 90 %+ and maps it to frames 0–6.
     * - When no pregnancy, maps sperm fill percentage to frames 1–17 (0 if empty).
     */
    private get imageIndex() {
        const { pregnancy, amount, capacity } = this.womb;
        if(pregnancy && pregnancy.progress > 0.05) {
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
        if (Animation.isAnimationActive) return;
        Animation.wombImage = `media/ui/womb/${this.status}/womb_${this.status}_${this.imageIndex}.png`;
    }
}