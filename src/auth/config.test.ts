import { describe, expect, it } from 'vitest'
import { isFirebaseConfigured, type FirebaseWebConfig } from './config'
import { storageUidKey, tasteKeyForUid } from './types'

describe('isFirebaseConfigured', () => {
  it('requires apiKey, authDomain, projectId, appId', () => {
    const empty: FirebaseWebConfig = {
      apiKey: '',
      authDomain: '',
      projectId: '',
      appId: '',
      messagingSenderId: '',
      storageBucket: '',
    }
    expect(isFirebaseConfigured(empty)).toBe(false)
    expect(
      isFirebaseConfigured({
        ...empty,
        apiKey: 'a',
        authDomain: 'x.firebaseapp.com',
        projectId: 'p',
        appId: '1:2:web:3',
      }),
    ).toBe(true)
  })
})

describe('uid storage keys', () => {
  it('prefixes firebase uid', () => {
    expect(storageUidKey('abc')).toBe('uid:abc')
    expect(tasteKeyForUid('abc')).toBe('loop-chat-v2:uid:abc')
  })
})
