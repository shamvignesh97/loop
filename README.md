# Loop

A chatting app whose inbox is ranked like a For You feed.

Loop ports a public-style ranking equation into conversations, blending Instagram Reels-style dwell signals with X-style conversation weights.

## What it does

- **Auth** -- Google (Gmail) or phone OTP via Firebase Authentication
- **Onboarding** -- pick two or more tags (or start with Funny + looks)
- **For You** -- contacts scored like clips; skip, like, share, or open
- **Chats** -- a ranked inbox that reorders every 5 actions
- **People** -- cast directory with search, tag filters, Follow / Mute, and person profiles
- **Taste** -- live tag/author affinities, boredom window, and account menu
- **Why this** -- sheet from For You cards: IG vs X blend (55/45) breakdown
- **Bottom tabs** -- For You / Chats / People / Taste (mobile-app shell)

Contacts reply in character via the xAI API (grok-4.5) when the chat API key env var is set, and fall back to written lines when it is not.

## Multi-user auth (Firebase)

Other people must sign in with **Google** or **phone number (OTP)** before using the app. Identity is shared across devices for that account — taste and follows are keyed by Firebase Auth UID:

- Local key: `loop-chat-v2:uid:<firebaseUid>`
- Optional cloud: Firestore `users/{uid}/data/loop` (debounced writes; falls back to localStorage if rules/env are missing)
- One-time migrate: anonymous browser state is copied into the uid bucket on first login when empty
- Dev bypass: only when `import.meta.env.DEV` and Firebase env vars are missing (`Continue locally (dev)`)

### Firebase console steps

1. Create (or open) a Firebase project and add a **Web** app.
2. **Authentication → Sign-in method**: enable **Google** and **Phone**.
3. **Authentication → Settings → Authorized domains**: add `localhost` and `loop-seven-opal.vercel.app`.
4. For Phone: keep reCAPTCHA enabled (Loop uses invisible reCAPTCHA in the SPA).
5. (Optional) **Firestore Database**: create a database. Suggested rules (adjust for prod):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/data/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

6. Copy the web config into env vars (see below). Do not commit real keys.

### Env vars (Vite + Vercel)

| Name | Where |
|------|--------|
| `VITE_FIREBASE_API_KEY` | Firebase web config `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `XAI_API_KEY` | Optional chat proxy (server / Vite middleware) |

Locally: copy `.env.example` → `.env.local`. On Vercel: Project → Settings → Environment Variables (Production), then redeploy.

If env is missing in production, Loop shows a setup screen instead of crashing.

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

Same author clusters share affinity (Mira + Kai, Jordan + Rafi, Nico + Asha, Priya + Tess, Elena + Yumi, Sam + Rio). Following boosts ranking via author affinity and the X `follow_author` signal; muted people are hidden from For You.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill Firebase + optional XAI_API_KEY
npm run dev                  # http://localhost:8080
```

Without Firebase keys, DEV mode offers a local bypass so you can still use the app.

```bash
npm test
npm run build
```

Default build base is root. Pages builds use the build:pages script (sets Vite base under /loop/).

## Hosting notes

Import the GitHub repo on Vercel with Vite defaults. Connect Git so main redeploys. Set the `VITE_FIREBASE_*` vars, then redeploy. See root config for SPA rewrites and the api folder for the chat proxy. PWA shows Refresh when a new service worker is ready.

Live: https://loop-seven-opal.vercel.app

## Try

1. Sign in with Google or phone
2. Pick funny and looks
3. Like Mira
4. Open a chat and reply
5. Skip cards and watch re-rank
6. Open People, follow someone, and check their profile
7. Open the avatar menu → Sign out
