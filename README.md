# DIN Board Designer

Production-quality MVP web app for designing residential DIN-rail electrical distribution boards. It combines a realistic front-view editor, a typed logical model, simple terminal wiring, and live validation policies.

## Stack

- Next.js App Router, React, TypeScript
- Zustand for editor state
- Tailwind CSS for UI
- Zod for catalog/project validation
- Vitest for pure domain tests
- Custom absolute-positioned canvas for module-accurate board layout

## Run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Docker

Build and run the production image directly:

```bash
docker build -t din-board-designer .
docker run --rm -p 3000:3000 din-board-designer
```

Or use Docker Compose:

```bash
docker compose up --build
```

Then open `http://localhost:3000`.

## Test

```bash
npm test
```

## Architecture

- `src/domain/types.ts` defines the strongly typed board, component, terminal, wire, catalog, and validation models.
- `src/domain/layoutEngine.ts` contains pure module-grid layout functions: occupancy, overlap detection, out-of-bounds detection, and first available slot.
- `src/domain/connectivityEngine.ts` builds terminal graph primitives and validates terminal compatibility.
- `src/domain/policies.ts` is the pluggable policy layer. Current policies cover out-of-bounds components, overlapping components, incompatible connections, PE/non-earth connections, missing inputs, missing main switch, and high occupancy.
- `src/store/useBoardStore.ts` owns editor state with Zustand and runs validation after every board mutation.
- `src/components/*` contains the library, board canvas, component rendering, properties panel, validation panel, and JSON import/export UI.

## Catalog And Assets

The catalog is JSON-driven at `public/catalog/generic-catalog.json`. The MVP includes:

- MCB 1P B16
- MCB 1P B20
- MCB 1P B25
- MCB 1P C16
- MCB 1P C20
- MCB 3P
- RCD 2P 40A 30mA
- RCD 4P
- RCBO 1P+N
- SPD type 2 4P
- Main switch 4P
- Neutral bus
- PE bus
- Blank module

Each catalog item defines manufacturer/model/category, module width, terminal templates, electrical properties, and a visual asset path. Assets live in `public/assets/components`.

## Demo Project

The initial app state is loaded from `public/projects/demo-board.json`. Use the top-right `JSON` panel to export the current project or import edited project JSON. Use `Demo` to restore the sample project.

## MVP Scope

This app intentionally does not implement full electrical standards compliance. It focuses on clear board layout, logical connectivity, and basic validation that is easy to extend.
