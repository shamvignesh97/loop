# Loop

A chatting app whose inbox is ranked like a For You feed.

Loop ports the public-style ranking equation (predicted actions × unequal weights, boredom, session fatigue, epsilon-greedy exploration) into conversations. Every like, skip, dwell, share, and reply moves your taste — then the next chat is already waiting.

## What it does

- **Onboarding** — pick two or more tags (or start with Funny + looks)
- **For You** — contacts scored like clips; skip, like, share, or open
- **Chats** — a ranked inbox that reorders every 5 actions
- **Taste** — live tag/author affinities and the boredom window
- **Why this** — the ranking breakdown: `score = Σ p(action) × weight`

Contacts reply in character via the xAI API (`grok-4.5`) when `XAI_API_KEY` is set, and fall back to written lines when it is not.

## Ranking (the product)

```
p(action)  = sigmoid(tag fit + author fit + boredom + fatigue)
score      = Σ p(action) × weight
weights    = like 0.5 · reply 2 · share 4 · rewatch 3 · dwell 1.5 · skip −2
explore    = 8% epsilon-greedy swap with a nearby candidate
update     = +0.15 × strength on tags, +0.08 × strength on author
rerank     = every 5 consumed items
```

Same author clusters share affinity (Jordan + Rafi, Nico + Asha, Priya + Tess, Elena + Yumi), so a like in one thread lifts the sibling.

## Run locally

```bash
npm install
npm run dev
```

The app listens on port 8080. Optional: copy `.env.example` to `.env` and set `XAI_API_KEY` (or export it) so replies are generated live via the Vite `/api/chat` proxy (`grok-4.5`, then `grok-3` / `grok-2`).

This repository is a Vite + React + TypeScript SPA (React Router). Taste is stored in `localStorage` under `loop-chat-v2` — no accounts, no database.

## Try

1. Pick **funny** and **looks**, or mash **Funny + looks**
2. Like Mira — dance/funny cools off, looks people rise
3. Open a chat and reply — session counter ticks, score panel updates
4. Skip a few cards and watch the feed re-rank
