# Verafy Devnet v0.0.2: from replay to live

v0.0.1-alpha replays a recorded run. v0.0.2 makes it live and lets people take part. Build in this order; each step ships on its own.

## 1. A live runner

A long-running service (`runner/`) that does what `recorder/record.mjs` does, continuously, slowed down: the same scenarios on a loop with fresh keys, plus anything visitors start.

- Writes each event to a store the site reads (an append-only log; Server-Sent Events to browsers).
- Anchors each block root on devnet as it seals (Memo), and moves real devnet SOL through Squads escrows with the judiciary signer for agentic contracts, so payouts are transactions, not computations.
- The site switches from `data/run.json` to the event stream, keeping the replay as a fallback when the runner is down.
- Hosting: a small always-on box (Fly.io, Render or a droplet). Budget: devnet SOL from a faucet pool, refilled daily.

Done when the map shows events less than a few seconds old and every block links a devnet transaction minutes old.

## 2. Real jurors

Seats filled by real models through OpenRouter, one family per seat (DeepSeek, Qwen, Llama, Mistral, Gemma), with the scripted juror kept as a labeled fallback.

- Uses the harness's juror path unchanged: pinned context, untrusted text labeled, commit and reveal.
- A spend cap per day. Rulings record which model answered.
- Done when the docket shows real models' reasoning and dissent, and the About page drops "scripted".

## 3. Browser agents

"Launch a browser agent": the runner creates a simulated agent with a fresh devnet key and 2 devnet SOL, owned by the visitor's session for 24 hours.

- Actions from the agent page: hire a bot, deliver short and be disputed, post a bond, report a bot, apply to the open grant, enter the hackathon with a repo at a commit.
- "Take command" of a seeded bot for 30 minutes.
- No wallet connection needed; keys live in the runner, never in the browser.

## 4. API jurors with OpenRouter

A visitor pastes an OpenRouter key and picks a model; the runner hosts a harness that sits seats with it.

- The key is encrypted at rest, used only for that juror, deleted on stop, with a daily spend cap.
- The juror registers in `verafy_registry` on devnet with a small bond.
- Decision for Rex before building: hosting other people's keys is a security responsibility. Alternative: only cloud boxes and the CLI, where keys stay with the user.

## 5. Cloud boxes and the CLI

- `npx verafy harness join --devnet`: creates a devnet key, takes faucet SOL, registers, bonds, waits for seats.
- One-click buttons that open DigitalOcean or Render with a setup script running the same command.

## 6. Proofs

Replace modeled proof hashes with real proofs of inference where an open model supports them, and say per batch which prompts are proved.

## Design

The screens are in the design canvas "devnet.verafy.ai designs" (map, case, join, agent, template store, docket, pipeline). v0.0.1 builds the map, pipeline, docket, templates, join (honest version) and about.
