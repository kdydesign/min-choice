import { NavLink } from "react-router-dom";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.75L12 4L20 10.75V19C20 19.5523 19.5523 20 19 20H15V14.5H9V20H5C4.44772 20 4 19.5523 4 19V10.75Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3.5V6.5M17 3.5V6.5M4.5 9H19.5M6 20H18C18.8284 20 19.5 19.3284 19.5 18.5V6.5C19.5 5.67157 18.8284 5 18 5H6C5.17157 5 4.5 5.67157 4.5 6.5V18.5C4.5 19.3284 5.17157 20 6 20Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12.75A3.75 3.75 0 1 0 12 5.25A3.75 3.75 0 0 0 12 12.75Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 20.5C4.5 16.9101 7.85786 14 12 14C16.1421 14 19.5 16.9101 19.5 20.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CommonBottomMenu() {
  return (
    <nav className="common-bottom-menu" aria-label="주요 탐색">
      <div className="common-bottom-menu-inner">
        <NavLink to="/" end className={({ isActive }) => `common-bottom-menu-item ${isActive ? "active" : ""}`}>
          <span className="common-bottom-menu-icon">
            <HomeIcon />
          </span>
          <span className="common-bottom-menu-label">오늘 식단</span>
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) => `common-bottom-menu-item ${isActive ? "active" : ""}`}
        >
          <span className="common-bottom-menu-icon">
            <CalendarIcon />
          </span>
          <span className="common-bottom-menu-label">최근 식단</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `common-bottom-menu-item ${isActive ? "active" : ""}`}
        >
          <span className="common-bottom-menu-icon">
            <UserIcon />
          </span>
          <span className="common-bottom-menu-label">아이 프로필</span>
        </NavLink>
      </div>
    </nav>
  );
}
