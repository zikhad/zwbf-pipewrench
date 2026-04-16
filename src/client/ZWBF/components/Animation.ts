import * as Events from "@asledgehammer/pipewrench-events";
import { Womb } from "@client/components/Womb";
import { percentageToNumber } from "@client/Utils";
import { ITEMS, ZWBFEventsEnum } from "@constants";


export enum ANIMATIONS {
    INTERCOURSE = "intercourse",
    BIRTH = "birth"
}

enum ANIMATION_KEY {
    NORMAL = "normal",
    PREGNANT = "pregnant",
    CONDOM = "condom",
    BIRTH = "birth"
}

type AnimationSettings = Record<ANIMATION_KEY, { steps: number[], loop?: number }>;

export type AnimationConfig = {
    animation: ANIMATIONS;
    duration: number;
    delta: number;
};



export class Animation {
    public static wombImage: string = "media/ui/womb/normal/womb_normal_0.png";

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

    constructor(
        private readonly womb: Womb
    ) {
        new Events.EventEmitter<(data: AnimationConfig) => void>(ZWBFEventsEnum.ANIMATION).addListener((data) => this.onAnimation(data));
        new Events.EventEmitter(ZWBFEventsEnum.IMAGE).addListener(() => this.onImage());
    }

    private get fullness() {
        if (this.womb.amount > (this.womb.capacity / 2)) {
            return "full";
        }
        return "empty";
    }

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

    
    private get status() {
        const { pregnancy } = this.womb;
        if (!pregnancy) return "normal";
        if (pregnancy.progress > 0.05) return "pregnant";
        return "conception";
    }

    private get imageIndex() {
        const { pregnancy, amount, capacity } = this.womb;
        if(pregnancy && pregnancy.progress > 0.05) {
            const percentage = (pregnancy.progress > 0.9 ? 1 : pregnancy.progress);
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
        Animation.wombImage = `media/ui/womb/${this.status}/womb_${this.status}_${this.imageIndex}.png`;
    }
}