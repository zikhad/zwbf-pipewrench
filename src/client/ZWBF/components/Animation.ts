import * as Events from "@asledgehammer/pipewrench-events";


enum ANIMATIONS {
    NORMAL = "normal",
    PREGNANT = "pregnant",
    CONDOM = "condom",
    BIRTH = "birth"
}

type AnimationSettings = Record<ANIMATIONS, { steps: number[], loop?: number }>;
type AnimationConfig = {
    animation: ANIMATIONS;
    fullness?: "full" | "empty";
    delta: number;
};

class Animation {
    public image: string = "";

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

    constructor() {
        new Events.EventEmitter<(data: AnimationConfig) => void>("ZWBFAnimation").addListener((data) => this.onAnimation(data));
    }
    onAnimation({ animation, fullness, delta }: AnimationConfig) {
        const duration = 1;
        const { steps, loop = 1 } = this.animations[animation];
        const loopDuration = duration / loop;
        const currentLoopDelta = (delta * duration) % loopDuration;
		const stepDuration = loopDuration / steps.length;

		const stepIndex = Math.floor(currentLoopDelta / stepDuration) % steps.length;
		const step = steps[stepIndex];

        const fullnessPath = fullness ? `/${fullness}` : "";
        this.image = `media/ui/animation/${animation}${fullnessPath}`;
    }
}