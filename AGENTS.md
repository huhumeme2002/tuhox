# Repository Guidelines

## Project Structure & Module Organization
This repo is a client-side React + TypeScript app for Tứ Hóa Tử Vi analysis. Main code lives in `src/`:
- `src/components/`: UI (`BirthForm.tsx`, `Palace.tsx`, `TuViBoard.tsx`)
- `src/utils/`: domain logic (`chartBuilder.ts`, `palaceCalc.ts`, `starPlacement.ts`, `tuHoa.ts`)
- `src/data/constants.ts`: canonical Can/Chi, palace names, star metadata, Tứ Hóa tables
- `src/types/`: shared TypeScript types
- `public/`: static assets
- `dist/`: production build output

Reference validation code lives outside the app in `temp-lasotuvi/`, `temp_validate.py`, and `debug-ketluan.ts`.

## Build, Test, and Development Commands
- `npm install`: install dependencies
- `npm run dev`: start Vite dev server on `http://localhost:5173`
- `npm run build`: run TypeScript project build and create `dist/`
- `npm run lint`: run ESLint across the repo
- `npm run preview`: preview the production build locally

Before merging UI or algorithm changes, run:
```bash
npm run lint
npm run build
```

## Coding Style & Naming Conventions
Use TypeScript with React function components and hooks. Keep indentation consistent with existing files (2 spaces). Prefer `import type` for type-only imports. Follow existing naming:
- Components: `PascalCase`
- Helpers/functions: `camelCase`
- Domain constants: `UPPER_SNAKE_CASE`

UI text and comments may be Vietnamese; keep code identifiers readable and consistent. Styling is Tailwind-first, with shared theme rules in `src/index.css`.

## Testing Guidelines
There is no JS test runner configured yet. For now, validate changes with:
- `npm run lint`
- `npm run build`
- manual checks in the browser
- optional algorithm cross-checks with `python temp_validate.py` or `debug-ketluan.ts`

If you add automated tests, prefer Vitest and place them near source files or under `src/__tests__/`.

## Commit & Pull Request Guidelines
Recent history mixes conventional and plain commits, but `feat: ...` is already in use and should be preferred. Write short, imperative messages such as `feat: refine month impact summary` or `fix: correct year-layer conclusion filtering`.

PRs should include:
- a concise summary of behavior changes
- affected screens or modules
- screenshots for UI changes
- validation notes (`npm run lint`, `npm run build`)

## Domain Notes
Changes in `src/utils/` can alter chart output. Treat `chartBuilder.ts` as the main entry point and verify domain logic carefully before refactoring shared calculations.
