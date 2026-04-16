import * as Events from "@asledgehammer/pipewrench-events";
import { Womb } from "@client/components/Womb";
import { Pregnancy } from "@client/components/Pregnancy";
import { percentageToNumber } from "@client/Utils";
import { ZWBFEventsEnum } from "@constants";


export enum ANIMATIONS {
    NORMAL = "normal",
    PREGNANT = "pregnant",
    CONDOM = "condom",
    BIRTH = "birth"
}

type AnimationSettings = Record<ANIMATIONS, { steps: number[], loop?: number }>;

export type AnimationConfig = {
    animation: ANIMATIONS;
    duration: number;
    delta: number;
}



export class Animation {
    public static image: string = "media/ui/animation/normal/empty/1.png";

    private readonly animations: AnimationSettings = {
        [ANIMATIONS.NORMAL]: {
            steps: [
                [0, 1, 2, 3, 4, 3, 2, 1],
                [0, 1, 2, 3, 4, 3, 2, 1],
                [0, 1, 2, 3, 4, 3, 2, 1],
                [0, 1, 2, 3, 4, 3, 2, 1],
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
            ].flat()
        },
        [ANIMATIONS.PREGNANT]: {
            steps: [
                [0, 1, 2, 3, 2, 1],
                [0, 1, 2, 3, 2, 1],
                [0, 1, 2, 3, 2, 1],
                [0, 1, 2, 3, 2, 1],
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
            ].flat()
        },
        [ANIMATIONS.CONDOM]: {
            steps: [0, 1, 2, 3, 4, 5, 6],
            loop: 4
        },
        [ANIMATIONS.BIRTH]: {
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

    onAnimation({ animation, delta, duration = 1 }: AnimationConfig) {
        const { steps, loop = 1 } = this.animations[animation];
        const fullness = this.fullness;
        const loopDuration = duration / loop;
        const currentLoopDelta = (delta * duration) % loopDuration;
		const stepDuration = loopDuration / steps.length;

		const stepIndex = Math.floor(currentLoopDelta / stepDuration) % steps.length;
		const step = steps[stepIndex];

        const fullnessPath = (animation == ANIMATIONS.NORMAL) ? `/${fullness}` : "";
        Animation.image = `media/ui/animation/${animation}${fullnessPath}/${step}.png`;
    }

    
    private get status() {
        const { pregnancy } = this.womb;
        if (!pregnancy) return "normal";
        if (pregnancy.progress > 0.05) return "pregnant";
        return "conception";
    }

    private get imageIndex() {
        const { pregnancy, amount, capacity } = this.womb;
        if (!pregnancy) {
            if (amount === 0) return 0; 
            const percentage = Math.floor((amount / capacity) * 100);
            const index = percentageToNumber(percentage, 17);
            return Math.max(1, index);
        }
        if(pregnancy.progress > 0.05) {
            const percentage = (pregnancy.progress > 0.9 ? 1 : pregnancy.progress);
            return percentageToNumber(percentage, 6);
        }
    }

    onImage() {
        return `media/ui/womb/${this.status}/womb_${this.status}_${this.imageIndex}.png`;
    }
}