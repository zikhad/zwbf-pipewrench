import { getActivatedMods, require } from "@asledgehammer/pipewrench";
// import module from "MF_ISMoodle";

export class Moodle {
    
    private isMF = false;
    constructor(name: string) {
        if (getActivatedMods().contains("MoodleFramework")) {
            this.isMF = true;
            // require("MF_ISMoodle")
            require("MF_ISMoodle");
            const moodle = MF.getMoodle(name); 
        }
    }
}