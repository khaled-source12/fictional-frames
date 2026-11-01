
"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { supabase } from "../../lib/supabase";

type Issue = {
  id: string;
  title: string;
};

type AiResult = {
  title: string;
  description: string;
  story: string;
  intention: string;
};

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);

  const [issueId, setIssueId] = useState("");
  const [issueTitle, setIssueTitle] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [story, setStory] = useState("");
  const [location, setLocation] = useState("");
  const [camera, setCamera] = useState("");
  const [lens, setLens] = useState("");
  const [aperture, setAperture] = useState("");
  const [shutter, setShutter] = useState("");
  const [iso, setIso] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // AI Writing Assistant
  const [aiNotes, setAiNotes] = useState("");
  const [aiStyle, setAiStyle] = useState("editorial");
  const [aiBusy, setAiBusy] = useState(false);
  const [intention, setIntention] = useState("");

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data: auth } = await supabase.auth.getUser();
    setUser(auth.user);

    if (!auth.user) {
      setAuthorized(false);
      setIssues([]);
      return;
    }

    const { data: admin, error: adminError } =
      await supabase.rpc("is_admin");

    const allowed = !adminError && admin === true;
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
    void refresh();
  }, []);

  async function login(e: FormEvent) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      await refresh();
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setAuthorized(false);
    setIssues([]);
    setMessage("");
  }

  function slugify(value: string) {
    return value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function createIssue() {
    if (!issueTitle.trim()) return;

    setBusy(true);
    setMessage("");

    try {
      const slug = slugify(issueTitle) || crypto.randomUUID();

      const { data, error } = await supabase
        .from("issues")
        .insert({
          title: issueTitle.trim(),
          slug,
          published: true,
        })
        .select("id")
        .single();

      if (error) throw error;

      setIssueTitle("");
      await refresh();

      if (data?.id) setIssueId(data.id);

      setMessage("Monthly issue created successfully!");
    } catch (error: any) {
      setMessage(error.message || "Could not create issue.");
    } finally {
      setBusy(false);
    }
  }

  async function generateWriting() {
    if (!aiNotes.trim()) {
      setMessage("Add a few notes about the photograph first.");
      return;
    }

    setAiBusy(true);
    setMessage("Generating your editorial writing...");

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.access_token) {
        throw new Error("Please sign in again.");
      }

      const response = await fetch("/api/ai-writing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({
          notes: aiNotes,
          title,
          location,
          style: aiStyle,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "AI generation failed."
        );
      }

      const generated = result as AiResult;

      setTitle(generated.title || "");
      setDescription(generated.description || "");
      setStory(generated.story || "");
      setIntention(generated.intention || "");

      setMessage(
        "AI draft generated. Review and edit the text before publishing."
      );
    } catch (error: any) {
      setMessage(error.message || "AI generation failed.");
    } finally {
      setAiBusy(false);
    }
  }

  async function upload(e: FormEvent) {
    e.preventDefault();

    if (!file || !issueId || !title.trim()) {
      setMessage("Select an issue, image and photograph title.");
      return;
    }

    setBusy(true);
    setMessage("Uploading photograph...");

    try {
      const extension = file.name
        .split(".")
        .pop()
        ?.toLowerCase();

      if (
        !["jpg", "jpeg", "png", "webp"].includes(extension || "")
      ) {
        throw new Error("Select a JPEG, PNG or WebP image.");
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
          title: title.trim(),
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
      setDescription("");
      setStory("");
      setIntention("");
      setAiNotes("");
      setFile(null);
    } catch (error: any) {
      setMessage(error.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const fieldStyle: CSSProperties = {
    width: "100%",
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: 6,
    marginBottom: 14,
    color: "#111",
    background: "#fff",
  };

  const buttonStyle: CSSProperties = {
    padding: "12px 20px",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  };

  return (
    <main
      style={{
        maxWidth: 760,
        margin: "60px auto",
        padding: 24,
        color: "#111",
        background: "#fff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>
        Fictional Frames
      </h1>

      <p style={{ marginBottom: 30 }}>
        Photography Publishing Dashboard
      </p>

      {!user ? (
        <form onSubmit={login}>
          <h2 style={{ fontSize: 22, marginBottom: 16 }}>
            Admin Login
          </h2>

          <input
            style={fieldStyle}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            style={fieldStyle}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button style={buttonStyle} type="submit">
            Sign In
          </button>
        </form>
      ) : !authorized ? (
        <div>
          <p>This account is not authorized to publish.</p>
          <button
            style={{ ...buttonStyle, marginTop: 16 }}
            onClick={signOut}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            style={buttonStyle}
            onClick={signOut}
          >
            Sign Out
          </button>

          <hr style={{ margin: "30px 0" }} />

          <h2 style={{ fontSize: 24, marginBottom: 16 }}>
            Create Monthly Issue
          </h2>

          <input
            style={fieldStyle}
            placeholder="e.g. November in Cairo"
            value={issueTitle}
            onChange={(e) => setIssueTitle(e.target.value)}
          />

          <button
            style={buttonStyle}
            type="button"
            disabled={busy}
            onClick={createIssue}
          >
            Create Issue
          </button>

          <hr style={{ margin: "30px 0" }} />

          <h2 style={{ fontSize: 24, marginBottom: 16 }}>
            Publish a Photograph
          </h2>

          <section
            style={{
              padding: 24,
              marginBottom: 30,
              background: "#f7f7f5",
              border: "1px solid #ddd",
              borderRadius: 10,
            }}
          >
            <h3
              style={{
                fontSize: 22,
                marginBottom: 12,
              }}
            >
              ✨ AI Writing Assistant
            </h3>

            <p
              style={{
                color: "#555",
                lineHeight: 1.7,
                marginBottom: 18,
              }}
            >
              Tell the AI what you photographed, what
              caught your attention, and what you wanted
              to communicate. It will prepare an editable
              journal entry.
            </p>

            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Your photograph notes
            </label>

            <textarea
              style={{
                ...fieldStyle,
                minHeight: 140,
                resize: "vertical",
              }}
              placeholder="Example: I photographed a modern building in New Cairo during golden hour. I was interested in the contrast between its geometric lines and the warm afternoon light..."
              value={aiNotes}
              onChange={(e) => setAiNotes(e.target.value)}
            />

            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Writing style
            </label>

            <select
              style={fieldStyle}
              value={aiStyle}
              onChange={(e) => setAiStyle(e.target.value)}
            >
              <option value="editorial">
                Fine-art editorial
              </option>
              <option value="documentary">
                Documentary storytelling
              </option>
              <option value="poetic">
                Cinematic and poetic
              </option>
              <option value="minimal">
                Minimal and factual
              </option>
            </select>

            <button
              style={buttonStyle}
              type="button"
              disabled={aiBusy || busy}
              onClick={generateWriting}
            >
              {aiBusy
                ? "Generating..."
                : "✨ Generate with AI"}
            </button>

            <p
              style={{
                marginTop: 14,
                color: "#666",
                fontSize: 13,
              }}
            >
              AI-generated text is a draft. Review all
              details before publishing.
            </p>
          </section>

          <form onSubmit={upload}>
            <label>Monthly issue</label>

            <select
              style={fieldStyle}
              value={issueId}
              onChange={(e) => setIssueId(e.target.value)}
              required
            >
              <option value="">Select monthly issue</option>

              {issues.map((issue) => (
                <option key={issue.id} value={issue.id}>
                  {issue.title}
                </option>
              ))}
            </select>

            <label>Photograph image</label>

            <input
              style={fieldStyle}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
              required
            />

            <label>Photograph title</label>
            <input
              style={fieldStyle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Photograph title"
              required
            />

            <label>Description</label>
            <textarea
              style={{
                ...fieldStyle,
                minHeight: 90,
                resize: "vertical",
              }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
            />

            <label>Story behind the photograph</label>
            <textarea
              style={{
                ...fieldStyle,
                minHeight: 180,
                resize: "vertical",
              }}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="The story behind this frame"
            />

            <label>Artistic intention — AI draft</label>
            <textarea
              style={{
                ...fieldStyle,
                minHeight: 90,
                resize: "vertical",
              }}
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="What you wanted to communicate"
            />

            <p
              style={{
                color: "#777",
                fontSize: 12,
                marginBottom: 20,
              }}
            >
              Artistic intention is editable but is not
              yet saved to the database.
            </p>

            {[
              {
                label: "Location",
                value: location,
                setter: setLocation,
              },
              {
                label: "Camera",
                value: camera,
                setter: setCamera,
              },
              {
                label: "Lens",
                value: lens,
                setter: setLens,
              },
              {
                label: "Aperture",
                value: aperture,
                setter: setAperture,
              },
              {
                label: "Shutter speed",
                value: shutter,
                setter: setShutter,
              },
              {
                label: "ISO",
                value: iso,
                setter: setIso,
              },
            ].map((field) => (
              <div key={field.label}>
                <label>{field.label}</label>
                <input
                  style={fieldStyle}
                  value={field.value}
                  onChange={(e) =>
                    field.setter(e.target.value)
                  }
                  placeholder={field.label}
                />
              </div>
            ))}

            <button
              style={buttonStyle}
              type="submit"
              disabled={busy || aiBusy}
            >
              {busy
                ? "Please wait..."
                : "Publish Photograph"}
            </button>
          </form>
        </>
      )}

      <p
        role="status"
        style={{
          marginTop: 24,
          padding: message ? 12 : 0,
          background: message ? "#f4f4f4" : "transparent",
          borderRadius: 6,
        }}
      >
        {message}
      </p>
    </main>
  );
}
