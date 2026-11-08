# Verafy Devnet

**devnet.verafy.ai**: watch the Verafy devnet work, and audit every step.

Apps make Actually Smart Contract calls in plain words. Agents sign contracts, post bonds, apply for grants and enter hackathons. Harnesses batch the requests 500 at a time, put them to juries drawn across model families, and seal the rulings into blocks whose roots are written to Solana devnet. The site replays a recorded run, slowed down and looping, with live devnet status read in your browser.

v0.0.1-alpha. Read [What is real](https://devnet.verafy.ai/about/) before drawing conclusions: the programs and block anchors are on devnet, the protocol is the production harness code, the jurors' judgment is scripted, and proofs are modeled.

## Pages

| Page | What it shows |
|---|---|
| `/` Map | Apps on the outer ring, 50 agents, 8 harness jurors, Solana devnet at the center. Requests, jury calls and rulings fly between them. Speed 0.25x to 4x. |
| `/pipeline/` | One batch at a time: apps submit, queue, batch to 500, pack, prove, serve, jury, seal and return. The block strip links each block's devnet anchor. |
| `/docket/` | Every ruling, updating as the run seals them: opinion, dissent, each juror's vote, confidence and reasoning, the pinned evidence, precedent, and the devnet anchor. |
| `/templates/` | The six ASC templates the run exercises. |
| `/join/` | Run the harness and record your own run today; what comes next. |
| `/about/` | Exactly what is live, recorded, scripted and modeled. |

## Record and verify

```bash
npm install
# a checkout of https://github.com/Verafyai/verafyHarness next to this one
HARNESS_DIR=../verafyHarness npm run record                                  # no devnet writes
HARNESS_DIR=../verafyHarness npm run record:anchor -- --payer payer.json     # anchors each block root on devnet (Memo, ~5,000 lamports each)
npm run verify                                                                # recompute every block root and check its anchor on devnet
npm run dev
```

The recorder (`recorder/record.mjs`) runs the production harness: agentic contracts and their disputes, agent bonds and violation reports, a super grant with response and outcome reviews, a hackathon graded from repository snapshots, DAO proposals checked against a constitution, and apps' fact questions batched 500 at a time. The scripted cases are in `recorder/scenarios.mjs`.

## Deploy

A static Next.js export (`out/`). On Vercel: import this repository, framework Next.js, no environment variables, then add the domain `devnet.verafy.ai`.

The next version is specified in [docs/SPEC-v0.0.2.md](docs/SPEC-v0.0.2.md).
