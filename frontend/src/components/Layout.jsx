import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../app/auth/AuthContext.jsx";

function SearchIcon() {
  return (
    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchText, setSearchText] = useState(searchParams.get("q") ?? "");

  const isCustomer = user?.role === "customer";

  useEffect(() => {
    setSearchText(searchParams.get("q") ?? "");
  }, [searchParams]);

  function updateCustomerSearch(value) {
    setSearchText(value);
    const trimmed = value.trim();
    const next = new URLSearchParams();
    const currentCategory = searchParams.get("category");
    if (trimmed) next.set("q", trimmed);
    if (currentCategory) next.set("category", currentCategory);
    const query = next.toString();
    navigate(`/vendors${query ? `?${query}` : ""}`, { replace: location.pathname === "/vendors" });
  }

  return (
    <>
      <div className="header">
        <div className="header-inner">
          <div className="topbar-left">
            <Link to="/" className="brand">
              <span className="brand-dot" aria-hidden="true" />
              <span>Localink</span>
            </Link>
            <div className="muted" style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 13 }}>
              <span style={{ fontWeight: 800, color: "#0f172a" }}>{isCustomer ? "Customer" : "Vendor"}</span>
              <span>-</span>
              <span>{user?.location || "San Francisco, CA"}</span>
            </div>
          </div>

          {isCustomer ? (
            <div className="search" aria-label="Search vendors">
              <SearchIcon />
              <input
                className="input"
                placeholder="Search vendors, categories, or location"
                value={searchText}
                onChange={(e) => updateCustomerSearch(e.target.value)}
              />
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          <div className="row" style={{ alignItems: "center" }}>
            {user?.role === "vendor" ? (
              <Link className="btn secondary" to="/vendor/dashboard">
                Dashboard
              </Link>
            ) : null}
            {user ? (
              <span className="pill">
                <span style={{ fontWeight: 900 }}>{user.name}</span>
                <span className="badge gray">{user.role}</span>
              </span>
            ) : null}
            <button
              className="btn"
              onClick={() => {
                logout();
                navigate("/auth");
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      <div className="container">
        <Outlet />
      </div>
    </>
  );
}
