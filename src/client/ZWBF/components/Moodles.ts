import { getActivatedMods, getText, HaloTextHelper, IsoPlayer, require } from "@asledgehammer/pipewrench";
// import module from "MF_ISMoodle";

// type moodleValues =
type MoodleProps = {
    player: IsoPlayer;
    name: string;
    texture: string;
    type: "Good" | "Bad";
    tresholds: [number, number, number, number ]
}
export class Moodle {
    
    private isMF = false;
    private player: IsoPlayer;
    private name: string;
    private type: "Good" | "Bad";
    private texture: string;
    private tresholds: [number, number, number, number];

    constructor(props: MoodleProps) {
        const { player, name, type, texture, tresholds } = props;
        this.player = player;
        this.name = name;
        this.type = type;
        this.texture = texture;
        this.tresholds = tresholds;
        if (getActivatedMods().contains("MoodleFramework")) {
            this.isMF = true;
            // require("MF_ISMoodle")
            require("MF_ISMoodle");
            MF.createMoodle(this.name);
            /* const moodle = MF.getMoodle(name); 
            moodle.setPicture(
                moodle.getGoodBadNeutral(),
                moodle.getLevel(),
                texture
            )*/
        }
    }

    private fallbackMoodle(level: number): void {
        const levels = {
            [0.5]: 1,
            [0.6]: 1,
            [0.7]: 2,
            [0.8]: 3,
            [1]: 4,
        };
        for(let i = 0; i < this.tresholds.length; i++) {
            const treshold = this.tresholds[i];
            if (level < treshold) {
                // TODO: continue to implement this
            }
        }
        const color = this.type === "Good" ? HaloTextHelper.getColorGreen() : HaloTextHelper.getColorRed();
        HaloTextHelper.addText(
            this.player,
            getText(`Moodles_${this.name}_${this.type}_desc_${0}`),
            color
        );
    }

    
    private buildTresholds() {
        return new Array(8).fill(null).map((_, index) => {
            if (index < 4 && this.type === "Good") {
                return this.tresholds[index];
            } else if (index >= 4 && this.type === "Bad") {
                return this.tresholds[index - 4];
            }
            return null;
        });
    }

    public moodle(level: number): void {
        if (!this.isMF) {

            return;
        }
        const moodle = MF.getMoodle(this.name);
        const [
            Good1,
            Good2,
            Good3,
            Good4,
            Bad1,
            Bad2,
            Bad3,
            Bad4
        ] = this.buildTresholds();
        moodle.setThresholds(Good1, Good2, Good3, Good4, Bad1, Bad2, Bad3, Bad4);
        moodle.setPicture(
            moodle.getGoodBadNeutral(),
            moodle.getLevel(),
            this.texture
        )
        moodle.setValue(level);
    }
}