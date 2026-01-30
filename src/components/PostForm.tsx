"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";

export default function PostForm({
  onPostCreated,
}: {
  onPostCreated: (post: any) => void;
}) {
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "">("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { t } = useLanguage();

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setMediaUrl(data.url);
        setMediaType(data.type);
      } else {
        alert("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);

    const res = await fetch("/api/post", {
      method: "POST",
      credentials: "include", // ✅ VERY IMPORTANT
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        mediaUrl,
        mediaType,
      }),
    });


    let data: any = null;
    try {
      data = await res.json();
    } catch {
      alert("Server error. Please try again.");
      return;
    }

    if (!res.ok) {
      alert(data?.error || "Posting failed");
      setLoading(false);
      return;
    }

    onPostCreated(data);


    setContent("");
    setMediaUrl("");
    setMediaType("");
    setLoading(false);
  }

  return (
  <form
    onSubmit={submit}
    className="bg-white border rounded-xl shadow-sm p-4 sm:p-6 mb-8 space-y-4"
  >
    {/* <h2 className="text-lg font-semibold text-gray-900">
      Create a post
    </h2> */}
    <h2>{t.feed.createPost}</h2>
<p>{t.feed.user}</p>


    {/* CONTENT */}
    <textarea
      placeholder="What's on your mind?"
      value={content}
      onChange={(e) => setContent(e.target.value)}
      className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
      rows={3}
    />

    {/* FILE UPLOAD */}
    <div>
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleFileUpload}
        disabled={uploading}
        className="w-full border rounded-lg px-3 py-2 text-sm"
      />
      {uploading && <p>Uploading...</p>}
    </div>

    {/* MEDIA URL */}
    <input
      placeholder="Media URL (optional)"
      value={mediaUrl}
      onChange={(e) => setMediaUrl(e.target.value)}
      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
    />

    {/* MEDIA TYPE + ACTION */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <select
        value={mediaType}
        onChange={(e) => setMediaType(e.target.value as any)}
        className="border rounded-lg px-3 py-2 text-sm w-full sm:w-40"
      >
        <option value="">No Media</option>
        <option value="image">Image</option>
        <option value="video">Video</option>
      </select>

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white px-6 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Posting..." : "Post"}
      </button>
    </div>
  </form>
);

}
