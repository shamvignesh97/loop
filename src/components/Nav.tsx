import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'

function IconForYou({ active }: { active: boolean }) {
  return (
    <svg
      className="tab-icon"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 3.2 4.5 9.2V20a1 1 0 0 0 1 1h4.2v-6.2h4.6V21H18.5a1 1 0 0 0 1-1V9.2L12 3.2Z"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.6}
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.18 : 0}
      />
    </svg>
  )
}

function IconChats({ active }: { active: boolean }) {
  return (
    <svg
      className="tab-icon"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4.2 3.2A.6.6 0 0 1 5.8 17.7V15A2.5 2.5 0 0 1 5 12.5v-6Z"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.6}
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.18 : 0}
      />
    </svg>
  )
}

function IconTaste({ active }: { active: boolean }) {
  return (
    <svg
      className="tab-icon"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 4.5c2.8 2.6 7 5.7 7 10a5 5 0 0 1-10 0c0-1.4.5-2.7 1.2-3.8"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.6}
        strokeLinecap="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.18 : 0}
      />
      <circle
        cx="9.2"
        cy="9.2"
        r="1.2"
        fill="currentColor"
        opacity={active ? 1 : 0.7}
      />
    </svg>
  )
}

export function Nav() {
  return (
    <>
      <header className="top-brand">
        <NavLink to="/foryou" className="nav-brand" aria-label="Loop home">
          <Logo size="sm" />
        </NavLink>
      </header>
      <nav className="bottom-nav" aria-label="Primary">
        <NavLink to="/foryou" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          {({ isActive }) => (
            <>
              <IconForYou active={isActive} />
              <span className="tab-label">For You</span>
            </>
          )}
        </NavLink>
        <NavLink to="/chats" end className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          {({ isActive }) => (
            <>
              <IconChats active={isActive} />
              <span className="tab-label">Chats</span>
            </>
          )}
        </NavLink>
        <NavLink to="/taste" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          {({ isActive }) => (
            <>
              <IconTaste active={isActive} />
              <span className="tab-label">Taste</span>
            </>
          )}
        </NavLink>
      </nav>
    </>
  )
}
