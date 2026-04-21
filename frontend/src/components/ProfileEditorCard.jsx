import React, { useEffect, useState } from "react";
import { useAuth } from "../app/auth/AuthContext.jsx";
import { Field } from "./Field.jsx";

export function ProfileEditorCard({ title, subtitle }) {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "",
    location: "",
    phone: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isVendor = user?.role === "vendor";

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      email: user.email ?? "",
      category: user.category ?? "",
      location: user.location ?? "",
      phone: user.phone ?? "",
    });
  }, [user]);

  const canSave =
    Boolean(form.name.trim() && form.email.trim()) &&
    (!isVendor || Boolean(form.category.trim() && form.location.trim() && form.phone.trim()));

  if (!user) return null;

  function updateField(key, value) {
    setSuccess("");
    setError("");
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await updateProfile({
        name: form.name,
        email: form.email,
        location: form.location,
        phone: form.phone,
        ...(isVendor ? { category: form.category } : {}),
      });
      setSuccess(isVendor ? "Vendor profile updated." : "Profile updated.");
    } catch (err) {
      setError(err.message || "Could not update your profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="vendor-meta">
        <div>
          <div className="title">{title}</div>
          <div className="subtitle" style={{ marginTop: 6 }}>{subtitle}</div>
        </div>
        <span className="badge gray">{user.role}</span>
      </div>

      <form className="profile-form" onSubmit={onSubmit}>
        <div className="profile-grid">
          <Field label="Name">
            <input className="input" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
          </Field>
          <Field label="Email">
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field label="Location" hint={isVendor ? "Shown to customers" : "Optional"}>
            <input
              className="input"
              value={form.location}
              onChange={(event) => updateField("location", event.target.value)}
              autoComplete="address-level2"
            />
          </Field>
          <Field label={isVendor ? "Phone" : "Phone (optional)"} hint={isVendor ? "Used for direct calls" : undefined}>
            <input
              className="input"
              type="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              autoComplete="tel"
            />
          </Field>
          {isVendor ? (
            <Field label="Category" hint="Bakery, Grocery, Repairs, Services">
              <input className="input" value={form.category} onChange={(event) => updateField("category", event.target.value)} />
            </Field>
          ) : null}
        </div>

        {error ? <div className="danger">{error}</div> : null}
        {success ? <div style={{ color: "#166534", fontWeight: 800 }}>{success}</div> : null}

        <div className="row">
          <button className="btn" disabled={!canSave || busy} type="submit">
            {busy ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
