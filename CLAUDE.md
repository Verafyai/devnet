# Verafy Devnet

devnet.verafy.ai. Static Next.js export; data in `data/run.json` from `recorder/record.mjs`.

## Rules

- Never claim more than is real. `/about/` lists what is live, recorded, scripted and modeled; update it with any change that moves something between those.
- The recorder uses the production Verafy Harness (`HARNESS_DIR`); never reimplement protocol logic here.
- No secrets in git. The devnet payer key is passed with `--payer` and never committed.
- Copy: no em or en dashes.

## Checks

```
npm run typecheck && npm run build && npm run verify
```
