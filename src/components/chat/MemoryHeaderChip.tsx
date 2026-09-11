import { COPY_STRINGS } from '../../data/copy'

/** Compact memory count chip in chat header. */
export function MemoryHeaderChip({
  count,
  onOpen,
}: {
  count: number
  onOpen: () => void
}) {
  const label =
    count === 1
      ? COPY_STRINGS.MEMORY_CHIP_SINGULAR
      : COPY_STRINGS.MEMORY_CHIP_PLURAL(count)

  return (
    <button
      type="button"
      className="memory-header-chip"
      onClick={onOpen}
      aria-label={`Open memory bank · ${label}`}
    >
      <span aria-hidden>⚡</span> {label}
    </button>
  )
}
