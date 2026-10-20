"use client";

import { useEffect, useState } from "react";
import { fetchUnicefAnnouncements, addUnicefAnnouncement, saveUnicefSettings } from "@/lib/unicef/api";
import { useUnicefAccess } from "@/lib/unicef/useUnicefAccess";
import { unicefButtonClass, unicefCardClass, unicefInputClass } from "@/components/unicef/ui";

export default function UnicefInfoPage() {
  const { user, settings, setSettings, officer } = useUnicefAccess();
  const [draft, setDraft] = useState(settings.infoHtml);
  const [editing, setEditing] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setDraft(settings.infoHtml);
  }, [settings.infoHtml]);

  useEffect(() => {
    let cancelled = false;
    fetchUnicefAnnouncements()
      .then((rows) => {
        if (!cancelled) setAnnouncements(rows);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const saveInfo = async () => {
    if (!user) return;
    await saveUnicefSettings({ ...settings, infoHtml: draft }, user.uid);
    setSettings({ ...settings, infoHtml: draft });
    setEditing(false);
    setMessage("Info saved.");
  };

  const postAnnouncement = async (e) => {
    e.preventDefault();
    if (!user || !title.trim() || !body.trim()) return;
    await addUnicefAnnouncement({ title: title.trim(), body: body.trim(), authorUid: user.uid });
    setTitle("");
    setBody("");
    setAnnouncements(await fetchUnicefAnnouncements());
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Info</h1>
        {officer ? (
          <button type="button" onClick={() => (editing ? saveInfo() : setEditing(true))} className={unicefButtonClass}>
            {editing ? "Save" : "Edit"}
          </button>
        ) : null}
      </div>
      {message ? <p className="text-sm text-green-800">{message}</p> : null}
      {editing ? (
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={12} className={unicefInputClass} />
      ) : (
        <article className={`${unicefCardClass} whitespace-pre-wrap p-5 text-sm leading-relaxed`}>{settings.infoHtml}</article>
      )}

      <section>
        <h2 className="text-xl font-semibold">Announcements</h2>
        <ul className="mt-3 space-y-3">
          {announcements.length === 0 ? <li className="text-sm text-slate-500">No announcements yet.</li> : null}
          {announcements.map((item) => (
            <li key={item.id} className={`${unicefCardClass} p-4`}>
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.body}</p>
            </li>
          ))}
        </ul>
        {officer ? (
          <form onSubmit={postAnnouncement} className={`${unicefCardClass} mt-4 space-y-2 p-4`}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={unicefInputClass} />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" rows={4} className={unicefInputClass} />
            <button type="submit" className={unicefButtonClass}>Post announcement</button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
