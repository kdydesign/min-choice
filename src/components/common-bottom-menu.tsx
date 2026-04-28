import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChildSelectionRequiredDialog } from "../features/children/components/child-selection-required-dialog";
import { useAppStore } from "../store/use-app-store";
import { AppIcon } from "./icons/app-icon";

export function CommonBottomMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedChildId = useAppStore((state) => state.selectedChildId);
  const [isSelectionDialogOpen, setSelectionDialogOpen] = useState(false);
  const blockedTabRef = useRef<HTMLAnchorElement | null>(null);

  const guardedTabs = useMemo(() => new Set(["/", "/history"]), []);

  useEffect(() => {
    if (isSelectionDialogOpen && selectedChildId) {
      setSelectionDialogOpen(false);
    }
  }, [isSelectionDialogOpen, selectedChildId]);

  function handleTabPress(event: MouseEvent<HTMLAnchorElement>, nextPath: string) {
    if (nextPath === location.pathname) {
      return;
    }

    if (!guardedTabs.has(nextPath)) {
      return;
    }

    if (selectedChildId) {
      return;
    }

    event.preventDefault();
    blockedTabRef.current = event.currentTarget;
    setSelectionDialogOpen(true);
  }

  function handleCloseDialog() {
    setSelectionDialogOpen(false);
    window.requestAnimationFrame(() => {
      blockedTabRef.current?.focus();
    });
  }

  function handleMoveToProfile() {
    setSelectionDialogOpen(false);
    blockedTabRef.current = null;
    navigate("/profile");
  }

  return (
    <>
      <nav className="common-bottom-menu" aria-label="주요 탐색">
        <div className="common-bottom-menu-inner">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `common-bottom-menu-item ${isActive ? "active" : ""}`}
            onClick={(event) => handleTabPress(event, "/")}
          >
            {({ isActive }) => (
              <>
                <span className="common-bottom-menu-icon">
                  <AppIcon name="navToday" size={24} active={isActive} />
                </span>
                <span className="common-bottom-menu-label">오늘</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) => `common-bottom-menu-item ${isActive ? "active" : ""}`}
            onClick={(event) => handleTabPress(event, "/history")}
          >
            {({ isActive }) => (
              <>
                <span className="common-bottom-menu-icon">
                  <AppIcon name="navHistory" size={24} active={isActive} />
                </span>
                <span className="common-bottom-menu-label">최근</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/shopping"
            className={({ isActive }) => `common-bottom-menu-item ${isActive ? "active" : ""}`}
          >
            {({ isActive }) => (
              <>
                <span className="common-bottom-menu-icon">
                  <AppIcon name="navShopping" size={24} active={isActive} />
                </span>
                <span className="common-bottom-menu-label">찾기</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `common-bottom-menu-item ${isActive ? "active" : ""}`}
          >
            {({ isActive }) => (
              <>
                <span className="common-bottom-menu-icon">
                  <AppIcon name="navProfile" size={24} active={isActive} />
                </span>
                <span className="common-bottom-menu-label">프로필</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>

      <ChildSelectionRequiredDialog
        open={isSelectionDialogOpen}
        onClose={handleCloseDialog}
        onConfirm={handleMoveToProfile}
      />
    </>
  );
}
