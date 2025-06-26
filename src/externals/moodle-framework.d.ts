type Moodle = {
    setThresholds:(...args:[
        number | null,
        number | null,
        number | null,
        number | null,
        number | null,
        number | null,
        number | null,
        number | null
    ]) => void;
    setPicture: (trasholds: any, level: number, texture: string) => void;
    setValue: (level: number) => void;
    getGoodBadNeutral: () => unknown;
}

/** @noResolution */
declare const MF: {
    createMoodle: (name: string) => void,
    getMoodle: (name: string) => Moodle
};