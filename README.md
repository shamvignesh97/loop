# Loop

A chatting app whose inbox is ranked like a For You feed.

Loop ports a public-style ranking equation into conversations, blending Instagram Reels-style dwell signals with X-style conversation weights.

## What it does

- **Onboarding** -- pick two or more tags (or start with Funny + looks)
- **For You** -- contacts scored like clips; skip, like, share, or open
- **Chats** -- a ranked inbox that reorders every 5 actions
- **Taste** -- live tag/author affinities and the boredom window
- **Why this** -- sheet from For You cards: IG vs X blend (55/45) breakdown
- **Bottom tabs** -- For You / Chats / Taste (mobile-app shell)

Contacts reply in character via the xAI API (grok-4.5) when XAI_API_KEY is set, and fall back to written lines when it is not.

## Ranking (the product)

```
p(loop action) = softmax(tag fit + author fit + boredom + fatigue)
preds          = map Loop probs -> IG Reels + X signals
ig             = sum IG_REELS[k] * preds[k]
x              = sum X_WEIGHTS[k] * preds[k]
score          = 0.55 * ig + 0.45 * x
```

**IG Reels weights** -- watch 4.5, send 3.8, like 0.8, save 1.2, skip -2, completion 2.5

**X weights** -- favorite 0.5, reply 5, retweet 1, quote 5, share 2, share_via_dm 5, share_via_copy_link 20, follow_author 4, not_interested -43.2

**Loop -> signal map** -- like->favorite/like; reply->reply; share->share/send; share_copy->share_via_copy_link; dwell->watch; skip->not_interested

```
explore = 8% epsilon-greedy swap with a nearby candidate
update  = +0.15 x strength on tags, +0.08 x strength on author
rerank  = every 5 consumed items
```

Same author clusters share affinity (Jordan + Rafi, Nico + Asha, Priya + Tess, Elena + Yumi).

## Run locally

Install deps, then start the Vite dev server on port 8080.

## Try

1. Pick funny and looks
2. Like Mira
3. Open a chat and reply
4. Skip cards and watch re-rank
