import { z } from "zod";

export const terminalSchema = z.object({
  id: z.string(),
  label: z.string(),
  role: z.enum(["power_in", "power_out", "neutral_in", "neutral_out", "neutral_bus", "earth"]),
  pole: z.enum(["L1", "L2", "L3", "N", "PE"]),
  direction: z.enum(["in", "out", "bidirectional"])
});

export const boardTerminalSchema = z.object({
  id: z.string(),
  label: z.string(),
  role: z.enum(["power_source", "neutral_source", "earth_source"]),
  pole: z.enum(["L1", "L2", "L3", "N", "PE"]),
  direction: z.literal("out"),
  position: z.object({
    x: z.number(),
    y: z.number()
  })
});

export const electricalSchema = z.object({
  ratedCurrentA: z.number().optional(),
  curve: z.string().optional(),
  poles: z.number().optional(),
  sensitivityMa: z.number().optional(),
  voltage: z.string().optional(),
  shortCircuitCapacityKa: z.number().optional(),
  requiresInput: z.boolean().optional(),
  isMainSwitch: z.boolean().optional(),
  busType: z.enum(["N", "PE"]).optional(),
  externalLoad: z.boolean().optional(),
  requiredPoles: z.array(z.enum(["L1", "L2", "L3", "N", "PE"])).optional(),
  ratingA: z.number().positive().optional(),
  currentA: z.number().nonnegative().optional()
});

export const catalogItemSchema = z.object({
  id: z.string(),
  manufacturer: z.string(),
  model: z.string(),
  category: z.string(),
  displayName: z.string(),
  type: z.enum([
    "mcb",
    "rcd",
    "rcbo",
    "spd",
    "main_switch",
    "neutral_bus",
    "pe_bus",
    "blank",
    "bulb",
    "outlet",
    "custom_load"
  ]),
  placementMode: z.enum(["din_module", "free"]),
  moduleWidth: z.number().int().positive(),
  terminalsTemplate: z.array(terminalSchema),
  electricalTemplate: electricalSchema,
  visual: z.object({
    src: z.string(),
    widthModules: z.number().int().positive().optional(),
    widthPx: z.number().positive().optional(),
    heightPx: z.number().positive()
  })
});

export const boardSchema = z.object({
  id: z.string(),
  name: z.string(),
  widthModulesPerRow: z.number().int().positive(),
  supplyTerminals: z.array(boardTerminalSchema),
  rows: z.array(
    z.object({
      id: z.string(),
      index: z.number().int().nonnegative(),
      maxModules: z.number().int().positive()
    })
  )
});

export const componentSchema = z.object({
  id: z.string(),
  catalogItemId: z.string(),
  type: catalogItemSchema.shape.type,
  name: z.string(),
  moduleWidth: z.number().int().positive(),
  placementMode: z.enum(["din_module", "free"]),
  terminals: z.array(terminalSchema),
  electrical: electricalSchema,
  layout: z.discriminatedUnion("placementMode", [
    z.object({
      placementMode: z.literal("din_module"),
      row: z.number().int().nonnegative(),
      startModule: z.number().int().nonnegative()
    }),
    z.object({
      placementMode: z.literal("free"),
      x: z.number(),
      y: z.number()
    })
  ])
});

export const wireEndpointSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("component_terminal"),
    componentId: z.string(),
    terminalId: z.string()
  }),
  z.object({
    kind: z.literal("board_terminal"),
    boardTerminalId: z.string()
  })
]);

export const wireSchema = z.object({
  id: z.string(),
  from: wireEndpointSchema,
  to: wireEndpointSchema,
  cable: z.object({
    crossSectionMm2: z.number().positive(),
    type: z.string(),
    color: z.string()
  })
});

export const projectSchema = z.object({
  board: boardSchema,
  components: z.array(componentSchema),
  wires: z.array(wireSchema)
});

export const catalogSchema = z.array(catalogItemSchema);
