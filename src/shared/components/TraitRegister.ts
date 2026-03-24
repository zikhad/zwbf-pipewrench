import { TraitFactory } from "@asledgehammer/pipewrench";

type RuntimeTraitFactory = {
	addTrait?: (
		id: string,
		name: string,
		cost: number,
		description: string,
		profession: boolean
	) => void;
	setMutualExclusive?: (id: string, exclusive: string) => void;
};

export abstract class TraitRegister {
	public static create(): TraitRegister {
		const runtimeTraitFactory = TraitRegister.resolveRuntimeTraitFactory();
		if (!runtimeTraitFactory) {
			return new NoopTraitRegister();
		}

		return new PipeWrenchTraitRegister(runtimeTraitFactory);
	}

	public abstract isAvailable(): boolean;

	public abstract addTrait(
		id: string,
		name: string,
		cost: number,
		description: string,
		profession: boolean
	): void;

	public abstract setMutualExclusive(id: string, exclusive: string): void;

	private static resolveRuntimeTraitFactory(): Required<RuntimeTraitFactory> | null {
		const runtimeTraitFactory = TraitFactory as unknown as RuntimeTraitFactory | undefined;

		if (!runtimeTraitFactory?.addTrait || !runtimeTraitFactory?.setMutualExclusive) {
			return null;
		}

		return runtimeTraitFactory as Required<RuntimeTraitFactory>;
	}
}

class PipeWrenchTraitRegister extends TraitRegister {
	public constructor(private readonly traitFactory: Required<RuntimeTraitFactory>) {
		super();
	}

	public isAvailable() {
		return true;
	}

	public addTrait(
		id: string,
		name: string,
		cost: number,
		description: string,
		profession: boolean
	) {
		this.traitFactory.addTrait(id, name, cost, description, profession);
	}

	public setMutualExclusive(id: string, exclusive: string) {
		this.traitFactory.setMutualExclusive(id, exclusive);
	}
}

class NoopTraitRegister extends TraitRegister {
	public isAvailable() {
		return false;
	}

	public addTrait() {}

	public setMutualExclusive() {}
}