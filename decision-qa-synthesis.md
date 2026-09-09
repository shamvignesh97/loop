# Loop decision Q&A synthesis

Sources: `chatgpt-qa-round.md`, `claude-qa-round.md`.  
Context: young adults on a ranked persona-chat PWA; retention risks = opaque feed, empty chats, personas looking like real SMS; goal = trust + first-message activation + visible taste control. Already shipped: swipe More/Less + undo, reason-chip sheet, caught-up divider, People badges + Persona label, Taste muted list, tag onboarding, Firebase auth.

## Where ChatGPT and Claude agreed

Both framed Loop as a **conversation discovery** product, not a pure feed. Shared diagnosis:

| Risk | Shared fix direction |
|------|----------------------|
| Empty chat stalls activation | First-message help on zero-user-message threads |
| Personas feel like SMS/humans | Explicit persona labeling / disclosure |
| Return habit is weak | Surface “continue” for existing threads |
| Opaque ranking | Explainability without raw scores (already partly shipped) |

Both also avoided rebuilding shipped work (swipe, undo, chips, divider, muted list, badges).

## Where they diverged

| | ChatGPT (final top 3) | Claude (final top 3) |
|--|----------------------|----------------------|
| For You | Conversation preview hook + Start Chat on cards | “Why this persona” strip; card body opens chat |
| Chat empty state | Starter **buttons** only (“First Message Accelerator”) | **Persona intro bubble** (opening/bio) + placeholder “Reply to…” |
| Trust cue | Stronger permanent persona identity in chat (emoji/header copy) | **One-time** micro-disclosure on first chat open (localStorage) |
| Chats list | **Continue Thread** card (top of Chats) | Not in final 3 (earlier rounds focused on For You/Taste) |
| Scope bias | Activation + return habit | Activation + persona clarity at moment of ambiguity |

ChatGPT’s earlier longlist also pushed a Why-This drawer and Undo Recovery Center; Claude’s earlier longlists pushed mute recovery and swipe polish — both largely already shipped by the time of the final pick.

## Final decision (this ship)

Blend the non-overlapping, highest-leverage pieces that attack **empty chat → first message → return**, without new APIs or ranking changes:

1. **Empty-chat activation (Claude intro + ChatGPT starters)**  
   On chats with no user messages yet: distinct persona intro (opening + bio), composer placeholder `Reply to {name}…`, and 3–4 tag-based starter pills that send on tap and hide after the first user message.

2. **First-chat micro-disclosure (Claude)**  
   One-time dismissible banner: “{Name} is an AI persona, not a real person.” + Got it; `localStorage` key `loop-persona-disclosure-seen`; low-contrast dark bar; never again after dismiss.

3. **Continue thread card on Chats (ChatGPT)**  
   If any threads exist: top card with persona, last preview, Persona badge, Continue CTA; then “All chats” list. No online/typing; non-SMS look.

4. **Light touch — For You Start/Open chat (easy win from both)**  
   Clear Start chat / Open chat CTA on For You cards without breaking swipe, undo toast, or reason-chip sheet.

### Explicitly deferred

- ChatGPT “Conversation Preview Hook” as a new copy block (cards already show opening + tags).  
- Full Why-This trust drawer redesign / full-width reason strip rework.  
- Undo Recovery Center in Taste (seven-day history UI).  
- Permanent alarming “not a real contact” header chrome (Persona badge + one-time disclosure preferred).

### Definition of done

New user can open a clearly labeled persona chat, see an intro + starters, send a first message in one tap, dismiss the AI disclosure once, and later resume via the Continue card on Chats.
