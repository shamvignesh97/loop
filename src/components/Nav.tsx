import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'

export function Nav() {
  return (
    <nav className="top-nav">
      <NavLink to="/foryou" className="nav-brand">
        <Logo size="sm" />
      </NavLink>
      <div className="nav-links">
        <NavLink to="/foryou">For You</NavLink>
        <NavLink to="/chats">Chats</NavLink>
        <NavLink to="/taste">Taste</NavLink>
      </div>
    </nav>
  )
}
