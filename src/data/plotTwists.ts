export type PlotTwistStarter = {
  label: string
  payload: string
}

/** Two dramatic 1-tap starters per persona, tailored from tags/bio. */
const PLOT_TWISTS: Record<string, PlotTwistStarter[]> = {
  mira: [
    {
      label: 'Accuse',
      payload: "Okay Mira — spill. What happened after the drop that you're not saying?",
    },
    {
      label: 'Cover up',
      payload: "I'll cover for you on the dance floor drama. What do I need to know?",
    },
  ],
  jordan: [
    {
      label: 'Challenge',
      payload: "Challenge: rate my vibe without the soft lighting. Be honest.",
    },
    {
      label: 'Spill secrets',
      payload: "Spill it — whose taste did you just expose, and why?",
    },
  ],
  rafi: [
    {
      label: 'Challenge',
      payload: "Challenge the queue: what's the hottest take you're burying tonight?",
    },
    {
      label: 'Spill secrets',
      payload: "Spill Jordan's voicemail. Don't leave me on the B-side.",
    },
  ],
  nico: [
    {
      label: 'Confront',
      payload: "Confront me — what were you sketching that you shouldn't show?",
    },
    {
      label: 'Spill secrets',
      payload: "Spill the question you were too scared to ask out loud.",
    },
  ],
  asha: [
    {
      label: 'Accuse',
      payload: "Accuse me properly — what did that café ranking say about me?",
    },
    {
      label: 'Cover up',
      payload: "Cover for me if the street food vendors ask. What's the alibi?",
    },
  ],
  priya: [
    {
      label: 'Challenge',
      payload: "Challenge my week: what's actually worth optimizing?",
    },
    {
      label: 'Spill secrets',
      payload: "Spill Tess's brief. What did she already tell you about me?",
    },
  ],
  tess: [
    {
      label: 'Challenge',
      payload: "Challenge accepted — give me a one-set win that actually lands.",
    },
    {
      label: 'Accuse',
      payload: "Accuse Priya with me: she said I'm serious. Prove the set.",
    },
  ],
  elena: [
    {
      label: 'Spill secrets',
      payload: "Spill the margin note — what truth did I almost tell?",
    },
    {
      label: 'Challenge',
      payload: "Challenge me with the hard question from chapter one.",
    },
  ],
  yumi: [
    {
      label: 'Challenge',
      payload: "Challenge: debug my attention. What's the real bug?",
    },
    {
      label: 'Spill secrets',
      payload: "Spill the commit that still has my name on it.",
    },
  ],
  kai: [
    {
      label: 'Accuse',
      payload: "Accuse Mira for me — she changed the eight-count, right?",
    },
    {
      label: 'Challenge',
      payload: "Challenge my footwork. Eight-count check — am I still in?",
    },
  ],
  sam: [
    {
      label: 'Accuse',
      payload: "Accuse whoever tasted first. Who stole the chaos plate?",
    },
    {
      label: 'Cover up',
      payload: "Cover for me at the table — I need a witty food alibi.",
    },
  ],
  rio: [
    {
      label: 'Confront',
      payload: "Confront the frame — who else was standing in golden hour?",
    },
    {
      label: 'Spill secrets',
      payload: "Spill the city ranking you've been hiding.",
    },
  ],
  lex: [
    {
      label: 'Challenge',
      payload: "Challenge the draft — peer-review my attention hypothesis.",
    },
    {
      label: 'Spill secrets',
      payload: "Spill the footnote. What did you write about me?",
    },
  ],
}

const DRAFT_KEY = 'loop_draft_starters_v1'

const FALLBACK: PlotTwistStarter[] = [
  {
    label: 'Challenge',
    payload: 'Challenge my thinking — ask me the hard question.',
  },
  {
    label: 'Spill secrets',
    payload: "Spill a secret you're not supposed to tell me yet.",
  },
]

export function plotTwistsFor(personaId: string): PlotTwistStarter[] {
  return PLOT_TWISTS[personaId] ?? FALLBACK
}

export function loadDraftStarters(): Record<string, string> {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveDraftStarter(personaId: string, payload: string): void {
  try {
    const next = { ...loadDraftStarters(), [personaId]: payload }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

export function consumeDraftStarter(personaId: string): string | null {
  try {
    const all = loadDraftStarters()
    const payload = all[personaId]
    if (!payload) return null
    delete all[personaId]
    localStorage.setItem(DRAFT_KEY, JSON.stringify(all))
    return payload
  } catch {
    return null
  }
}
