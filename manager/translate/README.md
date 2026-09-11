# Manager translation (pt-BR -> en)

The Manager UI ships only as a compiled bundle in `manager/dist` (source is not
published upstream), with all texts hardcoded in Portuguese. This folder holds
a dictionary and a script that rewrite the string literals of that bundle to
English.

- `pt-en.json` — dictionary, Portuguese literal -> English literal. Keys must
  match the bundle strings exactly (including leading/trailing spaces used in
  concatenations).
- `translate.mjs` — tokenizes the bundle with acorn and replaces only string /
  template literal tokens found in the dictionary. Code, identifiers and API
  values are never touched. Also sets `lang="en"` in `index.html`.

## Usage

After every upstream sync of `manager/dist`:

```bash
make manager-translate
```

`translate.mjs --check` lists strings that look Portuguese but are missing from
the dictionary; add them to `pt-en.json` and run again. The script is not
idempotent on an already translated bundle (there is nothing left to match), so
always run it on the freshly synced `dist`.
