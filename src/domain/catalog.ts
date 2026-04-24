import catalogJson from "../../public/catalog/generic-catalog.json";
import { catalogSchema } from "./projectSchema";
import type { BoardComponent, CatalogItem } from "./types";

export const catalogItems: CatalogItem[] = catalogSchema.parse(catalogJson);

export function findCatalogItem(id: string): CatalogItem | undefined {
  return catalogItems.find((item) => item.id === id);
}

export function createComponentFromCatalog(
  item: CatalogItem,
  layout: BoardComponent["layout"],
  id = crypto.randomUUID()
): BoardComponent {
  return {
    id,
    catalogItemId: item.id,
    type: item.type,
    name: item.displayName,
    moduleWidth: item.moduleWidth,
    placementMode: item.placementMode,
    terminals: item.terminalsTemplate.map((terminal) => ({ ...terminal })),
    electrical: { ...item.electricalTemplate },
    layout
  };
}
