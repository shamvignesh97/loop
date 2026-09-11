export const COPY_STRINGS = {
  CLIFFHANGER_FALLBACK: 'Tap to resume conversation...',
  STARTER_LABEL_PREFIX: 'Start with: ',
  STARTER_SENDING: 'Sending choice...',
  MEMORY_CHIP_SINGULAR: '1 Memory',
  MEMORY_CHIP_PLURAL: (count: number) => `${count} Memories`,
  MEMORY_SHEET_TITLE: 'Persona Memory Bank',
  MEMORY_SHEET_EMPTY:
    'No key details remembered yet. Keep chatting to build memories!',
} as const
