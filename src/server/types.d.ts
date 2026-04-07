/** Opaque B42 CraftRecipeData Java object passed to OnCreate callbacks. */
type CraftRecipeData = unknown;
type RecipeItem = unknown;
type RecipeCharacter = { isFemale(): boolean };

type Recipe = {
	/** B42: (item: InventoryItem, character: IsoGameCharacter) => boolean */
	OnTest: Record<string, (item: RecipeItem, character: RecipeCharacter) => boolean>;
	/** B42: (craftRecipeData: CraftRecipeData, character: IsoGameCharacter) => void */
	OnCreate: Record<string, (craftRecipeData: CraftRecipeData, character: RecipeCharacter) => void>;
};

declare let ZWBFRecipes: Recipe;