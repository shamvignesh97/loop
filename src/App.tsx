import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { InstallPrompt } from './components/InstallPrompt'
import { Nav } from './components/Nav'
import { UpdatePrompt } from './components/UpdatePrompt'
import { useLoopStore } from './hooks/useLoopStore'
import { ChatThread } from './pages/ChatThread'
import { Chats } from './pages/Chats'
import { ForYou } from './pages/ForYou'
import { Onboarding } from './pages/Onboarding'
import { People } from './pages/People'
import { PersonProfile } from './pages/PersonProfile'
import { Taste } from './pages/Taste'

export default function App() {
  const store = useLoopStore()
  const location = useLocation()
  const showNav =
    store.state.onboarded && !location.pathname.startsWith('/chats/')

  if (!store.state.onboarded) {
    return (
      <>
        <InstallPrompt />
        <UpdatePrompt />
        <Onboarding onDone={store.completeOnboarding} />
      </>
    )
  }

  return (
    <div className="app-shell">
      <InstallPrompt />
      <UpdatePrompt />
      {showNav && <Nav store={store} />}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/foryou" replace />} />
          <Route path="/foryou" element={<ForYou store={store} />} />
          <Route path="/chats" element={<Chats store={store} />} />
          <Route path="/chats/:id" element={<ChatThread store={store} />} />
          <Route path="/people" element={<People store={store} />} />
          <Route path="/people/:id" element={<PersonProfile store={store} />} />
          <Route path="/taste" element={<Taste store={store} />} />
          <Route path="*" element={<Navigate to="/foryou" replace />} />
        </Routes>
      </main>
    </div>
  )
}
