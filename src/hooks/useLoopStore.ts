import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { scheduleFirestoreSave, loadFromFirestore } from '../auth/sync'
import { CAST, getContact } from '../data/cast'
import {
  applyAction,
  markReranked,
  rankContacts,
  shouldRerank,
} from '../ranking/engine'
import type { Action, ScoredCandidate } from '../ranking/types'
import {
  authProfileId,
  createProfile,
  deleteProfile,
  ensureProfiles,
  getActiveProfile,
  listProfiles,
  migrateAnonymousIntoUid,
  renameProfile,
  setActiveProfileId,
  type ProfileMeta,
} from '../storage/profiles'
import {
  type PersistedLoop,
  defaultPersisted,
  loadPersisted,
  normalizePersisted,
  savePersisted,
} from '../storage/taste'

export function useLoopStore(authUid: string, displayName?: string) {
  const profileKey = authProfileId(authUid)

  const [profiles, setProfiles] = useState<ProfileMeta[]>(() =>
    listProfiles(),
  )
  const [activeProfileId, setActiveId] = useState(() => {
    migrateAnonymousIntoUid(authUid)
    ensureProfiles()
    return profileKey
  })
  const [activeName, setActiveName] = useState(
    () => displayName || getActiveProfile().name,
  )
  const [state, setState] = useState<PersistedLoop>(() =>
    loadPersisted(profileKey),
  )
  const [cloudReady, setCloudReady] = useState(false)
  const profileIdRef = useRef(profileKey)

  // Switch storage bucket when auth uid changes (sign-in / account switch)
  useEffect(() => {
    migrateAnonymousIntoUid(authUid)
    const key = authProfileId(authUid)
    profileIdRef.current = key
    setActiveId(key)
    setActiveName(displayName || 'You')
    setState(loadPersisted(key))
    setCloudReady(false)

    let cancelled = false
    void (async () => {
      const remote = await loadFromFirestore(authUid)
      if (cancelled || !remote) {
        if (!cancelled) setCloudReady(true)
        return
      }
      const local = loadPersisted(key)
      // Prefer cloud if local is empty/unonboarded and cloud has data
      const preferCloud =
        remote.onboarded &&
        (!local.onboarded ||
          local.taste.sessionActions < remote.taste.sessionActions)
      if (preferCloud) {
        const normalized = normalizePersisted(remote)
        savePersisted(normalized, key)
        if (!cancelled) setState(normalized)
      }
      if (!cancelled) setCloudReady(true)
    })()

    return () => {
      cancelled = true
    }
  }, [authUid, displayName])

  useEffect(() => {
    profileIdRef.current = activeProfileId
  }, [activeProfileId])

  useEffect(() => {
    savePersisted(state, profileIdRef.current)
    if (cloudReady && authUid && !authUid.startsWith('dev-')) {
      scheduleFirestoreSave(authUid, state)
    }
  }, [state, cloudReady, authUid])

  const refreshProfiles = useCallback(() => {
    const list = listProfiles()
    setProfiles(list)
    setActiveName(displayName || 'You')
  }, [displayName])

  const social = useMemo(
    () => ({
      followedIds: state.followedIds ?? [],
      mutedIds: state.mutedIds ?? [],
    }),
    [state.followedIds, state.mutedIds],
  )

  const scored: ScoredCandidate[] = useMemo(
    () => rankContacts(CAST, state.taste, () => 0.5, social),
    [state.taste, social],
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
      const socialNow = {
        followedIds: prev.followedIds ?? [],
        mutedIds: prev.mutedIds ?? [],
      }
      if (shouldRerank(taste)) {
        const list = rankContacts(CAST, taste, Math.random, socialNow)
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
      const socialNow = {
        followedIds: prev.followedIds ?? [],
        mutedIds: prev.mutedIds ?? [],
      }
      if (shouldRerank(taste)) {
        rankedIds = rankContacts(CAST, taste, Math.random, socialNow).map(
          (s) => s.id,
        )
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
        const socialNow = {
          followedIds: prev.followedIds ?? [],
          mutedIds: prev.mutedIds ?? [],
        }
        if (shouldRerank(taste)) {
          rankedIds = rankContacts(CAST, taste, Math.random, socialNow).map(
            (s) => s.id,
          )
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

  const switchProfile = useCallback(
    (id: string) => {
      // When authenticated, primary identity is the auth uid bucket.
      if (id === profileIdRef.current) return
      if (id.startsWith('uid:')) {
        savePersisted(state, profileIdRef.current)
        profileIdRef.current = id
        setActiveId(id)
        setState(loadPersisted(id))
        return
      }
      savePersisted(state, profileIdRef.current)
      setActiveProfileId(id)
      profileIdRef.current = id
      setActiveId(id)
      setState(loadPersisted(id))
      refreshProfiles()
    },
    [state, refreshProfiles],
  )

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

  const toggleFollow = useCallback((contactId: string) => {
    const contact = getContact(contactId)
    if (!contact) return
    setState((prev) => {
      const followedIds = [...(prev.followedIds ?? [])]
      const mutedIds = (prev.mutedIds ?? []).filter((id) => id !== contactId)
      const idx = followedIds.indexOf(contactId)
      let taste = prev.taste
      if (idx >= 0) {
        followedIds.splice(idx, 1)
      } else {
        followedIds.push(contactId)
        taste = applyAction(prev.taste, contact, 'like')
        const authors = { ...taste.authors }
        authors[contactId] = Math.min(
          2.5,
          (authors[contactId] ?? 0) + 0.35,
        )
        taste = { ...taste, authors }
      }
      const socialNow = { followedIds, mutedIds }
      let rankedIds = prev.rankedIds
      if (shouldRerank(taste) || idx < 0) {
        rankedIds = rankContacts(CAST, taste, Math.random, socialNow).map(
          (s) => s.id,
        )
        taste = markReranked(taste)
      }
      return { ...prev, followedIds, mutedIds, taste, rankedIds }
    })
  }, [])

  const toggleMute = useCallback((contactId: string) => {
    const contact = getContact(contactId)
    if (!contact) return
    setState((prev) => {
      const mutedIds = [...(prev.mutedIds ?? [])]
      let followedIds = [...(prev.followedIds ?? [])]
      const idx = mutedIds.indexOf(contactId)
      let taste = prev.taste
      if (idx >= 0) {
        mutedIds.splice(idx, 1)
      } else {
        mutedIds.push(contactId)
        followedIds = followedIds.filter((id) => id !== contactId)
        taste = applyAction(prev.taste, contact, 'skip')
        const authors = { ...taste.authors }
        authors[contactId] = Math.max(
          -1.5,
          (authors[contactId] ?? 0) - 0.6,
        )
        taste = { ...taste, authors }
      }
      const socialNow = { followedIds, mutedIds }
      const rankedIds = rankContacts(CAST, taste, Math.random, socialNow).map(
        (s) => s.id,
      )
      taste = markReranked(taste)
      return { ...prev, mutedIds, followedIds, taste, rankedIds }
    })
  }, [])

  const notInterested = useCallback((contactId: string) => {
    const contact = getContact(contactId)
    if (!contact) return
    setState((prev) => {
      const skippedIds = prev.skippedIds.includes(contactId)
        ? prev.skippedIds
        : [...prev.skippedIds, contactId]
      const mutedIds = prev.mutedIds?.includes(contactId)
        ? prev.mutedIds
        : [...(prev.mutedIds ?? []), contactId]
      const followedIds = (prev.followedIds ?? []).filter(
        (id) => id !== contactId,
      )
      let taste = applyAction(prev.taste, contact, 'skip')
      const socialNow = { followedIds, mutedIds }
      const rankedIds = rankContacts(CAST, taste, Math.random, socialNow).map(
        (s) => s.id,
      )
      taste = markReranked(taste)
      return {
        ...prev,
        skippedIds,
        mutedIds,
        followedIds,
        taste,
        rankedIds,
        lastWhyId: contactId,
      }
    })
  }, [])

  /** Strong positive ranking: like + follow-weight boost. */
  const moreLikeThis = useCallback((contactId: string) => {
    const contact = getContact(contactId)
    if (!contact) return
    setState((prev) => {
      let taste = applyAction(prev.taste, contact, 'like')
      taste = applyAction(taste, contact, 'like')
      const likedIds = prev.likedIds.includes(contactId)
        ? prev.likedIds
        : [...prev.likedIds, contactId]
      const skippedIds = prev.skippedIds.filter((id) => id !== contactId)
      const mutedIds = (prev.mutedIds ?? []).filter((id) => id !== contactId)
      const followedIds = [...(prev.followedIds ?? [])]
      if (!followedIds.includes(contactId)) followedIds.push(contactId)
      const authors = { ...taste.authors }
      authors[contactId] = Math.min(2.5, (authors[contactId] ?? 0) + 0.55)
      taste = { ...taste, authors }
      const socialNow = { followedIds, mutedIds }
      const rankedIds = rankContacts(CAST, taste, Math.random, socialNow).map(
        (s) => s.id,
      )
      taste = markReranked(taste)
      return {
        ...prev,
        taste,
        likedIds,
        skippedIds,
        mutedIds,
        followedIds,
        rankedIds,
        lastWhyId: contactId,
      }
    })
  }, [])

  /** Soft demote: skip weight + author/tag down — card stays in feed. */
  const lessLikeThis = useCallback((contactId: string) => {
    const contact = getContact(contactId)
    if (!contact) return
    setState((prev) => {
      let taste = applyAction(prev.taste, contact, 'skip')
      const authors = { ...taste.authors }
      authors[contactId] = Math.max(-1.5, (authors[contactId] ?? 0) - 0.45)
      const tags = { ...taste.tags }
      for (const t of contact.tags) {
        tags[t] = Math.max(-1, (tags[t] ?? 0) - 0.12)
      }
      taste = { ...taste, authors, tags }
      const followedIds = prev.followedIds ?? []
      const mutedIds = prev.mutedIds ?? []
      const socialNow = { followedIds, mutedIds }
      const rankedIds = rankContacts(CAST, taste, Math.random, socialNow).map(
        (s) => s.id,
      )
      taste = markReranked(taste)
      return {
        ...prev,
        taste,
        rankedIds,
        lastWhyId: contactId,
      }
    })
  }, [])

  const restoreState = useCallback((snapshot: PersistedLoop) => {
    setState(normalizePersisted(structuredClone(snapshot)))
  }, [])

  /** Edit onboarding interests from Taste snapshot. */
  const updateSelectedTags = useCallback((tags: string[]) => {
    setState((prev) => {
      const clipped = [...new Set(tags)].slice(0, 5)
      if (clipped.length < 1) return prev
      const tasteTags = { ...prev.taste.tags }
      for (const t of clipped) {
        if ((tasteTags[t] ?? 0) < 0.5) {
          tasteTags[t] = Math.max(tasteTags[t] ?? 0, 0.6)
        }
      }
      for (const t of prev.selectedTags) {
        if (!clipped.includes(t) && (tasteTags[t] ?? 0) > 0) {
          tasteTags[t] = Math.max(0, (tasteTags[t] ?? 0) - 0.25)
        }
      }
      let taste = { ...prev.taste, tags: tasteTags }
      const socialNow = {
        followedIds: prev.followedIds ?? [],
        mutedIds: prev.mutedIds ?? [],
      }
      const rankedIds = rankContacts(CAST, taste, Math.random, socialNow).map(
        (s) => s.id,
      )
      taste = markReranked(taste)
      return { ...prev, selectedTags: clipped, taste, rankedIds }
    })
  }, [])

  const getScore = useCallback(
    (id: string) => scoredMap.get(id),
    [scoredMap],
  )

  useEffect(() => {
    if (state.onboarded && state.rankedIds.length === 0) {
      const list = rankContacts(CAST, state.taste, Math.random, social)
      setState((prev) => ({ ...prev, rankedIds: list.map((s) => s.id) }))
    }
  }, [state.onboarded, state.rankedIds.length, state.taste, social])

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
    toggleFollow,
    toggleMute,
    notInterested,
    moreLikeThis,
    lessLikeThis,
    restoreState,
    updateSelectedTags,
    profiles,
    activeProfileId,
    activeProfileName: activeName,
    switchProfile,
    addProfile,
    updateProfileName,
    removeProfile,
    authUid,
  }
}

export type LoopStore = ReturnType<typeof useLoopStore>
