declare const ZomboWinAnimationData: {
	prefix: string;
	id: string;
	tags: string[];
	actors: {
		gender: "Male" | "Female";
		stages: {
			perform: string;
			duration: number;
		}[];
	}[];
}[];
