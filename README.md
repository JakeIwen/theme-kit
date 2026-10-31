# theme-kit

The shared Appearance & Theme Editor for Jacob's apps: a framework-free
`<theme-editor>` custom element (a non-modal pane docked on the right) plus a
DOM-free theme model. Every app that uses it gets the same editor, and a theme
copied from one app pastes into another.

## The theme model

A theme is a name plus four knobs that the app turns into oklch colors:

| Knob | Default property | Range |
|---|---|---|
| `hueNeutral` | `--hue-neutral` | 0–360 |
| `hueBrand` | `--hue-brand` | 0–360 |
| `hueAccent` | `--hue-accent` | 0–360 |
| `chroma` | `--chroma` | 0–2, step 0.05 |

An app can rename a property or relabel a knob (Fieldwork maps `hueAccent` to
`--hue-focus`, labelled "Focus hue"). The copy/paste theme code is JSON:

```json
{"theme-kit":1,"name":"Rosewood Slate","knobs":{"hueNeutral":360,"hueBrand":240,"hueAccent":70,"chroma":1.15}}
```

Pasting ignores unknown knobs, fills missing ones with the app's defaults and
clamps the rest.

## Using it in an app

```sh
npm install "theme-kit@github:JakeIwen/theme-kit#semver:^1.0.0"
```

```js
import { knobSpecs, mountThemeEditor } from "theme-kit";

const editor = mountThemeEditor({
  knobs: { hueAccent: { property: "--hue-focus", label: "Focus hue" } },
  builtins: [{ id: "sage", name: "Sage", knobs: { hueNeutral: 125, hueBrand: 160, hueAccent: 75, chroma: 1 } }],
  store,                // see below
  mode,                 // optional light/dark switch: { options, get, set, subscribe }
});
openButton.addEventListener("click", () => editor.toggle());
```

`store` is the app's `ThemeStore` (`src/editor/adapter.ts`): `snapshot()` and
`subscribe()` for the saved themes and the active theme, and `saveTheme`,
`deleteTheme` and `activate` that persist them. `preview(knobs)` shows knobs on
the page without saving, and `preview(null)` shows the active theme again. Apps
with viewers keep the library on their server; `createLocalThemeStore` keeps it
in localStorage for static pages. Servers validate writes with
`theme-kit/core` (`themeProblem`, `activeThemeProblem`), which never touches
the DOM.

Built-in themes are locked: Duplicate or Save as new makes an editable copy.
Deleting the active theme falls back to the first built-in.

### Styling

The pane has no palette of its own. Map its tokens to the app's once, in the
app's tokens file:

```css
theme-editor {
  --te-bg: var(--surface);          /* pane background */
  --te-surface: var(--cream);       /* rows, prompts */
  --te-hover: var(--surface-hover);
  --te-selected: var(--surface-selected);
  --te-field: var(--surface);       /* text inputs */
  --te-text: var(--ink);
  --te-muted: var(--muted);
  --te-border: var(--line);
  --te-control-border: var(--control-border);
  --te-accent: var(--primary);      /* primary buttons, sliders, active row */
  --te-focus: var(--focus);
  --te-danger: var(--danger-text);
}
```

`--te-radius`, `--te-shadow`, `--te-font-size` and `--te-z` are optional.
Unmapped tokens fall back to system colors. Styles load as a constructed
stylesheet, so a CSP without `'unsafe-inline'` styles still works.

## Developing

`npm test` builds and runs the tests; `npm run check` also confirms the
committed `dist/` matches `src/`. `npm run demo` serves `demo/` on loopback to
try the pane in a browser.

## Releasing

`npm run release -- patch|minor|major` runs the checks, tags the release,
pushes it and runs `npm run fanout`. The fanout visits each app in
`consumers.json` and, for each one, updates theme-kit to the newest release in
its range, runs that app's whole suite, commits and pushes the dependency
change, and deploys. It stops at the first failure. `npm run fanout --
--dry-run`, `--no-deploy` or a consumer name narrow it. A major release reaches
no app until that app's range is raised by hand.
