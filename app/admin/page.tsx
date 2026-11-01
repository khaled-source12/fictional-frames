
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);
  const [issueId, setIssueId] = useState("");
  const [issueTitle, setIssueTitle] = useState("");
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [camera, setCamera] = useState("");
  const [lens, setLens] = useState("");
  const [aperture, setAperture] = useState("");
  const [shutter, setShutter] = useState("");
  const [iso, setIso] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data: auth } = await supabase.auth.getUser();
    setUser(auth.user);

    if (!auth.user) {
      setAuthorized(false);
      return;
    }

    const { data: admin } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    const allowed = !!admin;
    setAuthorized(allowed);

    if (allowed) {
      const { data } = await supabase
        .from("issues")
        .select("id,title")
        .order("created_at", { ascending: false });
      setIssues(data || []);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    if (error) setMessage(error.message);
    else await refresh();
  }

  function slugify(value: string) {
    return value.toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function createIssue() {
    if (!issueTitle.trim()) return;
    setBusy(true);
    const slug = slugify(issueTitle) || crypto.randomUUID();

    const { error } = await supabase
      .from("issues")
      .insert({
        title: issueTitle,
        slug,
        published: true,
      });

    setMessage(error ? error.message : "Issue created!");
    setIssueTitle("");
    await refresh();
    setBusy(false);
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();

    if (!file || !issueId || !title.trim()) {
      setMessage("Select an issue, title and image.");
      return;
    }

    setBusy(true);
    setMessage("Uploading...");

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!["jpg", "jpeg", "png", "webp"].includes(extension || "")) {
        throw new Error("Please select a JPEG, PNG or WebP image.");
      }

      if (file.size > 20 * 1024 * 1024) {
        throw new Error("Image must be 20 MB or smaller.");
      }

      const path = `${crypto.randomUUID()}.${extension}`;

      const { error: storageError } = await supabase.storage
        .from("photographs")
        .upload(path, file, { upsert: false });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage
        .from("photographs")
        .getPublicUrl(path);

      const { error: dbError } = await supabase
        .from("photos")
        .insert({
          issue_id: issueId,
          title,
          image_url: urlData.publicUrl,
          description,
          story,
          location,
          camera,
          lens,
          aperture,
          shutter_speed: shutter,
          iso: iso ? Number(iso) : null,
          published: true,
        });

      if (dbError) {
        await supabase.storage
          .from("photographs")
          .remove([path]);
        throw dbError;
      }

      setMessage("Photograph published successfully!");
      setTitle("");
      setStory("");
      setDescription("");
      setFile(null);
    } catch (err: any) {
      setMessage(err.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: 6,
    marginBottom: 14,
    color: "#111",
    background: "#fff",
  };

  return (
    <main style={{
      maxWidth: 720,
      margin: "60px auto",
      padding: 24,
      color: "#111",
      background: "#fff",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>
        Fictional Frames
      </h1>
      <p style={{ marginBottom: 30 }}>
        Photography Publishing Dashboard
      </p>

      {!user ? (
        <form onSubmit={login}>
          <h2>Admin Login</h2>
          <input style={fieldStyle} type="email"
            placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required />
          <input style={fieldStyle} type="password"
            placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Sign In</button>
        </form>
      ) : !authorized ? (
        <p>This account is not authorized to publish.</p>
      ) : (
        <>
          <button onClick={async () => {
            await supabase.auth.signOut();
            setUser(null);
            setAuthorized(false);
          }}>Sign Out</button>

          <hr style={{ margin: "30px 0" }} />

          <h2>Create Monthly Issue</h2>
          <input style={fieldStyle}
            placeholder="e.g. November in Cairo"
            value={issueTitle}
            onChange={e => setIssueTitle(e.target.value)} />
          <button disabled={busy} onClick={createIssue}>
            Create Issue
          </button>

          <hr style={{ margin: "30px 0" }} />

          <h2>Publish a Photograph</h2>
          <form onSubmit={upload}>
            <select style={fieldStyle}
              value={issueId}
              onChange={e => setIssueId(e.target.value)}
              required>
              <option value="">Select monthly issue</option>
              {issues.map(issue => (
                <option key={issue.id} value={issue.id}>
                  {issue.title}
                </option>
              ))}
            </select>

            <input style={fieldStyle} type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={e => setFile(e.target.files?.[0] || null)}
              required />

            {[
              ["Photograph title", title, setTitle],
              ["Description", description, setDescription],
              ["Story behind the photograph", story, setStory],
              ["Location", location, setLocation],
              ["Camera", camera, setCamera],
              ["Lens", lens, setLens],
              ["Aperture", aperture, setAperture],
              ["Shutter speed", shutter, setShutter],
              ["ISO", iso, setIso],
            ].map(([label, value, setter]: any) => (
              <div key={label}>
                <label>{label}</label>
                <input style={fieldStyle}
                  value={value}
                  onChange={e => setter(e.target.value)}
                  placeholder={label} />
              </div>
            ))}

            <button type="submit" disabled={busy}>
              {busy ? "Please wait..." : "Publish Photograph"}
            </button>
          </form>
        </>
      )}

      <p role="status" style={{ marginTop: 20 }}>
        {message}
      </p>
    </main>
  );
}
