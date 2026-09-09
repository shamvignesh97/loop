import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CAST, getContact } from '../data/cast'
import {
  applyAction,
  markReranked,
  rankContacts,
  shouldRerank,
} from '../ranking/engine'
import type { Action, ScoredCandidate } from '../ranking/types'
import {
  createProfile,
  deleteProfile,
  ensureProfiles,
  getActiveProfile,
  listProfiles,
  renameProfile,
  setActiveProfileId,
  type ProfileMeta,
} from '../storage/profiles'
import {
  type PersistedLoop,
  defaultPersisted,
  loadPersisted,
  savePersisted,
} from '../storage/taste'

export function useLoopStore() {
  const [profiles, setProfiles] = useState<ProfileMeta[]>(() =>
    listProfiles(),
  )
  const [activeProfileId, setActiveId] = useState(() => {
    ensureProfiles()
    return getActiveProfile().id
  })
  const [activeName, setActiveName] = useState(() => getActiveProfile().name)
  const [state, setState] = useState<PersistedLoop>(() =>
    loadPersisted(activeProfileId),
  )
  const profileIdRef = useRef(activeProfileId)

  useEffect(() => {
    profileIdRef.current = activeProfileId
  }, [activeProfileId])

  useEffect(() => {
    savePersisted(state, profileIdRef.current)
  }, [state])

  const refreshProfiles = useCallback(() => {
    const list = listProfiles()
    setProfiles(list)
    const active = list.find((p) => p.id === profileIdRef.current) ?? list[0]
    setActiveName(active.name)
  }, [])

  const scored: ScoredCandidate[] = useMemo(
    () => rankContacts(CAST, state.taste, () => 0.5),
    [state.taste],
  )

  const scoredMap = useMemo(() => {
    return new Map(scored.map((s) => [s.id, s]))
  }, [scored])

  const rankedContacts = useMemo(() => {
    const order =
      state.rankedIds.length > 0 ? state.rankedIds : scored.map((s) => s.id)
    return order
      .map((id) => {
        const c = getContact(id)
        const sc = scoredMap.get(id)
        if (!c || !sc) return null
        return { contact: c, scored: sc }
      })
      .filter(Boolean) as {
      contact: (typeof CAST)[0]
      scored: ScoredCandidate
    }[]
  }, [scored, scoredMap, state.rankedIds])

  const completeOnboarding = useCallback((tags: string[]) => {
    const base = defaultPersisted(tags)
    base.onboarded = true
    base.selectedTags = tags
    const list = rankContacts(CAST, base.taste)
    base.rankedIds = list.map((s) => s.id)
    setState(base)
  }, [])

  const consume = useCallback((contactId: string, action: Action) => {
    const contact = getContact(contactId)
    if (!contact) return
    setState((prev) => {
      let taste = applyAction(prev.taste, contact, action)
      const skippedIds = [...prev.skippedIds]
      const likedIds = [...prev.likedIds]
      const sharedIds = [...prev.sharedIds]
      if (action === 'skip' && !skippedIds.includes(contactId)) {
        skippedIds.push(contactId)
      }
      if (action === 'like' && !likedIds.includes(contactId)) {
        likedIds.push(contactId)
      }
      if (
        (action === 'share' || action === 'share_copy') &&
        !sharedIds.includes(contactId)
      ) {
        sharedIds.push(contactId)
      }

      let rankedIds = prev.rankedIds
      if (shouldRerank(taste)) {
        const list = rankContacts(CAST, taste)
        rankedIds = list.map((s) => s.id)
        taste = markReranked(taste)
      }

      const threads = { ...prev.threads }
      if (!threads[contactId] && action !== 'skip') {
        threads[contactId] = [
          {
            id: `${contactId}-open`,
            from: 'them',
            text: contact.opening,
            at: Date.now(),
          },
        ]
      }

      return {
        ...prev,
        taste,
        skippedIds,
        likedIds,
        sharedIds,
        rankedIds,
        threads,
        lastWhyId: contactId,
      }
    })
  }, [])

  const openChat = useCallback((contactId: string) => {
    const contact = getContact(contactId)
    if (!contact) return
    setState((prev) => {
      const threads = { ...prev.threads }
      if (!threads[contactId]) {
        threads[contactId] = [
          {
            id: `${contactId}-open`,
            from: 'them',
            text: contact.opening,
            at: Date.now(),
          },
        ]
      }
      let taste = applyAction(prev.taste, contact, 'dwell')
      let rankedIds = prev.rankedIds
      if (shouldRerank(taste)) {
        rankedIds = rankContacts(CAST, taste).map((s) => s.id)
        taste = markReranked(taste)
      }
      return { ...prev, threads, taste, rankedIds, lastWhyId: contactId }
    })
  }, [])

  const sendMessage = useCallback(
    (contactId: string, text: string, reply: string) => {
      const contact = getContact(contactId)
      if (!contact) return
      setState((prev) => {
        const threads = { ...prev.threads }
        const existing = threads[contactId] ? [...threads[contactId]] : []
        const now = Date.now()
        existing.push({
          id: `${contactId}-me-${now}`,
          from: 'me',
          text,
          at: now,
        })
        existing.push({
          id: `${contactId}-them-${now + 1}`,
          from: 'them',
          text: reply,
          at: now + 1,
        })
        threads[contactId] = existing
        let taste = applyAction(prev.taste, contact, 'reply')
        let rankedIds = prev.rankedIds
        if (shouldRerank(taste)) {
          rankedIds = rankContacts(CAST, taste).map((s) => s.id)
          taste = markReranked(taste)
        }
        return { ...prev, threads, taste, rankedIds, lastWhyId: contactId }
      })
    },
    [],
  )

  const resetAll = useCallback(() => {
    setState(defaultPersisted())
  }, [])

  const switchProfile = useCallback((id: string) => {
    if (id === profileIdRef.current) return
    savePersisted(state, profileIdRef.current)
    setActiveProfileId(id)
    profileIdRef.current = id
    setActiveId(id)
    setState(loadPersisted(id))
    refreshProfiles()
  }, [state, refreshProfiles])

  const addProfile = useCallback(
    (name: string) => {
      savePersisted(state, profileIdRef.current)
      const profile = createProfile(name)
      profileIdRef.current = profile.id
      setActiveId(profile.id)
      setState(defaultPersisted())
      refreshProfiles()
    },
    [state, refreshProfiles],
  )

  const updateProfileName = useCallback(
    (id: string, name: string) => {
      renameProfile(id, name)
      refreshProfiles()
    },
    [refreshProfiles],
  )

  const removeProfile = useCallback(
    (id: string) => {
      if (profiles.length <= 1) return
      const wasActive = id === profileIdRef.current
      if (wasActive) {
        savePersisted(state, profileIdRef.current)
      }
      const next = deleteProfile(id)
      refreshProfiles()
      if (wasActive) {
        profileIdRef.current = next.activeId
        setActiveId(next.activeId)
        setState(loadPersisted(next.activeId))
      }
    },
    [profiles.length, state, refreshProfiles],
  )

  const getScore = useCallback(
    (id: string) => scoredMap.get(id),
    [scoredMap],
  )

  useEffect(() => {
    if (state.onboarded && state.rankedIds.length === 0) {
      const list = rankContacts(CAST, state.taste)
      setState((prev) => ({ ...prev, rankedIds: list.map((s) => s.id) }))
    }
  }, [state.onboarded, state.rankedIds.length, state.taste])

  return {
    state,
    scored,
    rankedContacts,
    completeOnboarding,
    consume,
    openChat,
    sendMessage,
    resetAll,
    getScore,
    profiles,
    activeProfileId,
    activeProfileName: activeName,
    switchProfile,
    addProfile,
    updateProfileName,
    removeProfile,
  }
}

export type LoopStore = ReturnType<typeof useLoopStore>
