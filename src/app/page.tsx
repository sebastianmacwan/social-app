"use client";

import { useEffect, useState } from "react";
import PostForm from "@/components/PostForm";
import PostCard from "@/components/PostCard";
import { useLanguage } from "@/context/LanguageContext";


export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const { t } = useLanguage();




  useEffect(() => {
    fetch("/api/friend/count", {
      credentials: "include",
    })

      .then(res => res.ok ? res.json() : { count: 0 })
      .then(data => setFriendCount(data.count))
      .catch(() => setFriendCount(0));
    fetch("/api/friend/pending", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(setPendingRequests)
      .catch(() => setPendingRequests([]));


    fetch("/api/feed", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        console.log("FEED DATA:", data);
        setPosts(Array.isArray(data) ? data : []);
      })
      .catch(() => setPosts([]));
  }, []);
  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    window.location.href = "/login";
  }
  
  return (
    <main className="min-h-screen bg-gray-50 grid-cols-100 md:grid-cols-3 lg:grid-cols-4 px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* HEADER */}
        <header className="mb-10">
          {/* <h1 className="text-3xl font-extrabold text-gray-900">
            Public Social Space
          </h1>
          <p className="text-gray-500 mt-1">
            Share what's on your mind with the community
          </p> */}
          <h1 className="text-3xl font-extrabold text-gray-900">
  {t.feed.title}
</h1>

<p className="text-gray-500 mt-1">
  {t.feed.subtitle}
</p>


          {/* <nav className="flex gap-6 mt-4 text-sm font-medium">
            <Link href="/friends" className="hover:underline">Friends</Link>
            <Link href="/friends/pending" className="hover:underline">Pending</Link>
            <Link href="/friends/sent" className="hover:underline">Sent</Link>
            <Link href="/profile" className="hover:underline">Profile</Link>
          </nav> */}

          {/* <button
            onClick={handleLogout}
            className="mt-4 text-sm text-red-600 hover:underline"
          >
            Logout
          </button> */}
          <button
  onClick={handleLogout}
  className="mt-4 text-sm text-red-600 hover:underline"
>
  {t.common.logout}
</button>

        </header>

        {/* STATS */}
        <section className="mb-8 bg-white border rounded-xl p-4">
          {/* <p className="text-sm">👥 Friends: <strong>{friendCount}</strong></p>
          <p className="text-sm text-gray-600">
            Daily limit: {friendCount >= 10 ? "Unlimited" : `${friendCount} post(s)`}
          </p> */}
          <p className="text-sm">
  👥 {t.feed.friends}: <strong>{friendCount}</strong>
</p>

<p className="text-sm text-gray-600">
  {t.feed.dailyLimit}:{" "}
  {friendCount >= 10
    ? t.feed.unlimited
    : `${friendCount} ${t.feed.posts}`}
</p>

        </section>

        {/* PENDING REQUESTS */}
        {pendingRequests.length > 0 && (
          <section className="mb-8 bg-white border rounded-xl p-4">
            <h3 className="font-semibold mb-3">Pending Friend Requests</h3>

            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex justify-between items-center mb-3"
              >
                <span>{req.user.name}</span>

                <div className="space-x-2">
                  
                </div>
              </div>
            ))}
          </section>
        )}

        {/* POST FORM */}
        <section className="mb-10">
          <PostForm
            onPostCreated={(newPost) =>
              setPosts((prev) => [newPost, ...prev])
            }
          />
        </section>

        {/* FEED */}
        <section className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border">
              {/* <p className="text-gray-400">No posts yet</p> */}
              <p className="text-gray-400">{t.feed.noPosts}</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={(id: any) =>
                  setPosts((prev) => prev.filter((p) => p.id !== id))
                }
                onLike={(updatedPost: any) =>
                  setPosts((prev) =>
                    prev.map((p) =>
                      p.id === updatedPost.id ? updatedPost : p
                    )
                  )
                }
              />
            ))
          )}
        </section>

      </div>
    </main>
  );

}