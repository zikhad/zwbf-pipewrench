/**  @noSelfInFile */
import * as Events from "@asledgehammer/pipewrench-events";
import { ProceduralDistributions } from "@asledgehammer/pipewrench/server";


type DistribuitionItem = {
	item: string;
	probability: number;
}

type ProceduralDistributionsHackType = {
	list: Record<string, { items: (string | number)[] }>;
};

const addItemsToDistributions = (lists: string[], items: DistribuitionItem[]) => {
	for (const list of lists) {
		const distribution = (ProceduralDistributions as unknown as ProceduralDistributionsHackType).list[list]
		for (const { item, probability } of items) {
			table.insert(distribution.items, item);
			table.insert(distribution.items, probability);
		}
	}
}


Events.onPreDistributionMerge.addListener(() => {
	addItemsToDistributions([
		"BathroomShelf",
		"ShelfGeneric",
		"BathroomCabinet",
		"BathroomCounter",
		"BedroomDresser",
		"DresserGeneric",
		"StripClubDressers"
	], [
		{ item: "ZWBF.Condom", probability: 40 },
		{ item: "ZWBF.CondomBox", probability: 35 },
		{ item: "ZWBF.Contraceptive", probability: 30 },
		{ item: "ZWBF.VaginalDouche_empty", probability: 15 },
		{ item: "ZWBF.BreastPump", probability: 10 },
		{ item: "ZWBF.Lactaid", probability: 5 }
	]);
	addItemsToDistributions([
		"MedicalClinicOutfit",
		"MedicalStorageDrugs",
		"MedicalStorageOutfit",
		"MedicalClinicDrugs"

	], [
		{ item: "ZWBF.Condom", probability: 60 },
		{ item: "ZWBF.CondomBox", probability: 50 },
		{ item: "ZWBF.Contraceptive", probability: 45 },
		{ item: "ZWBF.VaginalDouche_empty", probability: 25 },
		{ item: "ZWBF.BreastPump", probability: 15 },
		{ item: "ZWBF.Lactaid", probability: 10 }
	]);

	addItemsToDistributions([
		"BinDumpster",
		"BinBar",
		"StripClubDressers",
		"BinGeneric"
	], [
		{ item: "ZWBF.CondomUsed", probability: 30 }
	]);

})