# theme-kit

Shared Appearance & Theme Editor pane and theme model, consumed by Jacob's
apps as a pinned git dependency (`github:JakeIwen/theme-kit#semver:^1.0.0`).
README.md covers the adapter contract, tokens and release flow.

## Where things live

| Path | Holds |
|---|---|
| `palette.css` | The shared role tokens derived from the knobs, light and dark, re-declared on `.theme-probe` for swatches |
| `src/core/knobs.ts` | The four canonical knobs, per-app spec overrides, clamping, validation, applying to a style |
| `src/core/themes.ts` | Theme and active-theme shapes, validation, readable unique ids and names |
| `src/core/theme-code.ts` | The versioned copy/paste theme code |
| `src/core/editor-state.ts` | Pure draft rules: loaded theme, unsaved changes, name clashes, fallback |
| `src/core/values.ts` | `isRecord`, `isFiniteNumber` |
| `src/editor/adapter.ts` | The app contract: `ThemeAdapter` (including optional read-only app-derived swatch colors), `ThemeStore`, `ThemeModeControl` |
| `src/editor/theme-editor.ts` | The `<theme-editor>` element: state, actions, rendering |
| `src/editor/editor-view.ts` | DOM construction for the pane and the saved-themes list |
| `src/editor/editor-styles.ts` | The pane's stylesheet and its `--te-*` tokens |
| `src/editor/swatch.ts` | Generic swatch colors for the saved-themes list |
| `src/editor/palette-swatch.ts` | `paletteSwatchColors`: faithful swatches read off a probe for apps on the shared palette |
| `src/editor/local-store.ts` | localStorage `ThemeStore` for static pages and the demo |
| `src/editor/mount.ts` | `defineThemeEditor`, `mountThemeEditor` |
| `src/index.ts`, `src/core/index.ts` | Browser and DOM-free entry points |
| `demo/` | Stand-in app for browser checks (`npm run demo`) |
| `scripts/fanout.mjs`, `scripts/release.mjs` | Rollout to `consumers.json` apps |

## Contracts

- `dist/` is committed and is what apps install; git dependencies are not
  built on install. Rebuild and commit it with every source change;
  `npm run check` fails when it is stale.
- Package exports `theme-kit`, `theme-kit/core` and `theme-kit/palette.css`,
  the `ThemeStore` and `ThemeAdapter` shapes, the `<theme-editor>` tag, the
  `--te-*` tokens, the palette's role token names and the theme code format are
  used by every consumer. A breaking change to any of them is a major release.
- `palette.css` holds the formulas once, for every app: fix a color there, not
  in an app. The formulas are Fieldwork's, the app whose look Jacob tuned, and
  each token's lightness is fixed so contrast holds across themes
  (`test/palette.test.js`).
- `consumers.json` lists each app's repo, package folder, whole-suite command
  and deploy command, plus `deployRecords`: tracked files its deploy rewrites
  (Fieldwork's live browser-verification record), which the fanout commits
  after deploying so the next run finds the repo clean. Add an app there when
  it adopts the editor.

## Checks

`npm run check` is the whole suite: build, core, palette and jsdom element
tests, and the dist freshness check. Check UI changes in a real browser with the demo at
desktop and phone widths before releasing.
