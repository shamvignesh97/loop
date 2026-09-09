Here are 6 concrete, screen-visible improvements that build on what you already have (reason chips, More like this/Less, tag onboarding, ranked inbox) without ever showing a raw score.

1. Tap-to-expand reason chips → mini action sheet

Why: Right now chips are static labels. Users see "Because you liked X" but the only feedback loop is probably buried elsewhere. Putting the action right where the explanation is closes the loop in one tap.
UI change: Tapping a reason chip on an inbox card expands it inline into a 3-row sheet: "More like this" / "Less like this" / "Mute this topic." Chip stays visible with a subtle checkmark state after selection, and the card gets a brief inline confirmation ("Got it, showing less of this") instead of disappearing abruptly.

2. "You're caught up" session divider

Why: Ranked feeds without a stopping point train users to distrust the ranking ("is there an end, or does it just get worse forever?"). A visible boundary between confidently-ranked and lower-confidence content sets expectations and gives you a place to explain the feed without scores.
UI change: Insert a horizontal divider card after the last high-confidence item: "You're caught up — older & exploratory picks below," with a thin visual style change (slightly muted background) for cards below it.

3. Swipe actions on inbox cards

Why: More like this/Less currently likely require opening a menu or tapping a chip — friction reduces signal volume. Swipe is the fastest gesture on mobile and will meaningfully increase taste-learning data.
UI change: Swipe-right on a card = "More like this" (green checkmark flash), swipe-left = "Less like this" (gray X flash). Card animates back into place (not removed) so users don't fear losing content by swiping.

4. Taste tab: editable interest strength, not scores

Why: The Taste tab is currently likely a static list of onboarding tags. Turning it into a live, editable control surface makes taste learning feel legible and gives users a direct lever instead of only implicit feed signals.
UI change: Each tag shows as a chip with a 3-state pill: Less / Normal / More (segmented, not a slider or number). Tapping cycles the state and updates immediately with a one-line toast: "You'll see more Tamil politics posts." Add a "+ Add interest" chip at the end that opens the same tag picker from onboarding.

5. Progressive tag onboarding nudge (post-signup)

Why: 3-5 tags at signup is a cold start; by session 3-5 you have real behavioral signal to suggest tags the user didn't think to pick initially. This is your highest-leverage lever for inbox quality without any ranking model changes.
UI change: After a user's 3rd session (or ~20 cards seen), insert a one-time inline card in the For You feed: "Based on what you've been reading, add these?" with 3-4 suggested tag chips (tap to add, single dismiss "Not now"). Never repeats more than once every 2 weeks.

6. People tab: qualitative overlap badge

Why: People tab likely just lists connections/suggestions with no context on why someone's there — same "black box" problem as the old inbox before reason chips. A qualitative badge (not a % match score) extends your no-scores philosophy consistently across tabs.
UI change: Add a small badge under each person's name: "Similar taste in Tamil politics" or "New to Loop" or "Mutual: 3 topics" — pulled from the same taste-tag vocabulary used in reason chips, so the language is consistent app-wide.

Top 3 to build this week
Swipe actions on inbox cards — smallest scope (reuses existing More like this/Less logic, just adds a gesture layer), highest immediate lift in signal volume.
Tap-to-expand reason chip action sheet — also reuses existing backend actions, just changes the entry point; ships fast and directly improves the feature you just launched.
"You're caught up" session divider — pure UI/copy, no new logic needed, but has outsized trust impact since it's the first thing that makes the ranked feed feel intentional rather than infinite.

Items 4-6 (Taste tab rework, progressive onboarding, People badges) need either new UI screens or behavioral-signal aggregation — worth scoping for the release after this one.

---

## Shipped from Claude (2026-09-09 IST)

Built top 3 + People qualitative badges (#6):

1. **Swipe on For You cards** — swipe right = More like this (green ✓ flash); swipe left = Less in feed via soft `lessLikeThis` (gray ✕ flash). Card stays in place; vertical scroll preserved (`touch-action: pan-y` + axis lock). Existing More/Less buttons kept.
2. **Tap-to-expand reason chips** — chip opens inline mini sheet: More like this / Less like this / Mute this topic. Checkmark chip state + toast (“Got it, showing less of this”). No raw scores on chips.
3. **“You’re caught up” divider** — after top high-confidence prefix (`caughtUpCount`, median / top 3–5), inserts divider copy; cards below use `.exploratory` muted styling.
4. **People qualitative badges** — replaced score pills with “Similar taste in …”, “Mutual: N topics”, or “New to Loop”. Chats inbox left score/Why-free.

Ship: `npm test` + `npm run build`, push `main`, `npx vercel --prod --yes`.
