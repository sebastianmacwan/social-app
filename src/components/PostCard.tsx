"use client";

import { useState } from "react";
import { useEffect } from "react";



export default function PostCard({ post, onDelete, onLike }: any) {
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [liked, setLiked] = useState<boolean>(post.likedByMe);
  const [likesCount, setLikesCount] = useState<number>(post.likesCount);

  useEffect(() => {
    setLiked(post.likedByMe);
    setLikesCount(post.likesCount);
  }, [post.likedByMe, post.likesCount]);


  /* ================= LIKE ================= */
  const handleLike = async () => {
    if (loading) return;
    setLoading(true);

    const res = await fetch(`/api/post/${post.id}/like`, {
      method: "POST",
    });

    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    }

    setLoading(false);
  };


  /* ================= DELETE ================= */
  const handleDelete = async () => {
    const ok = confirm("Are you sure you want to delete this post?");
    if (!ok) return;

    await fetch(`/api/post/${post.id}`, { method: "DELETE" });
    onDelete(post.id);
  };

  /* ================= SHARE ================= */
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Check out this post",
          text: post.content || "",
          url: window.location.href,
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const formattedDate = new Date(post.createdAt || post.created_at).toLocaleDateString();

  /* ================= COMMENT ================= */
  const handleComment = async () => {
    if (!comment.trim() || commentLoading) return;
    setCommentLoading(true);
    setCommentError("");

    const res = await fetch(`/api/post/${post.id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment }),
    });

    if (res.ok) {
      const newComment = await res.json();
      setComments((prev: any[]) => [newComment, ...prev]);
      setComment("");
    } else {
      const data = await res.json();
      setCommentError(data.error || "Failed to add comment");
    }

    setCommentLoading(false);
  };
  return (
    <div className="bg-white border rounded-xl shadow-sm p-4 sm:p-6 space-y-4">

      {/* POST HEADER */}
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-gray-900">{post.user?.name ?? "User"}</p>
        <p className="text-xs text-gray-500">
          {new Date(post.createdAt).toLocaleString()}
        </p>
      </div>

      {/* CONTENT */}
      <p className="text-gray-800 leading-relaxed">{post.content}</p>

      {/* MEDIA */}
      {post.mediaType === "image" && (
        <img
          src={post.mediaUrl}
          alt="Post media"
          className="w-full rounded-lg max-h-[400px] object-cover"
        />
      )}

      {post.mediaType === "video" && (
        <video
          src={post.mediaUrl}
          controls
          className="w-full rounded-lg"
        />
      )}

      {/* ACTIONS */}
      <div className="flex items-center gap-4 text-sm pt-2">
        <button
          onClick={handleLike}
          disabled={loading}
          className="flex items-center gap-1 hover:opacity-80"
        >
          {liked ? "❤️" : "🤍"} {likesCount}
        </button>

        <button
          onClick={handleShare}
          className="text-gray-600 hover:underline"
        >
          🔗 Share
        </button>

        <button
          onClick={handleDelete}
          className="text-red-600 hover:underline ml-auto"
        >
          Delete
        </button>
      </div>

      {/* COMMENTS */}
      <div className="pt-3 border-t space-y-3">
        <h4 className="font-semibold text-sm">Comments</h4>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            placeholder="Write a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 border rounded px-3 py-2 text-sm"
          />

          <button
            onClick={handleComment}
            disabled={commentLoading}
            className="bg-black text-white text-sm px-4 py-2 rounded hover:opacity-90"
          >
            Comment
          </button>
        </div>

        {commentError && (
          <p className="text-xs text-red-500">{commentError}</p>
        )}

        {comments.length === 0 && (
          <p className="text-xs text-gray-400">No comments yet</p>
        )}

        <div className="space-y-2">
          {comments.map((c: any) => (
            <div
              key={c.id}
              className="bg-gray-50 rounded p-2 text-sm"
            >
              <p className="text-gray-800">{c.content}</p>
              <p className="text-xs text-gray-400">
                {new Date(c.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );

}
