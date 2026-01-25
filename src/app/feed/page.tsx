
"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/PostCard";
import PostForm from "@/components/PostForm";
import { useLanguage } from "@/context/LanguageContext";

interface Post {
  id: string;
  content: string;
  createdAt: string;
  mediaUrl?: string;
  mediaType?: string;
  author: string;
  likesCount: number;
  likedByMe: boolean;
  comments: {
    id: string;
    content: string;
    createdAt: string;
    author: string;
  }[];
}

export default function Feed() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/feed");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleNewPost = () => {
    fetchPosts(); // Refresh posts
  };

  const handleDelete = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>{t.feed.title}</h1>
      <PostForm onPostCreated={handleNewPost} />
      {posts.length === 0 ? (
        <p>{t.feed.noPosts}</p>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDelete={handleDelete}
            onLike={() => fetchPosts()} // Refresh after like
          />
        ))
      )}
    </main>
  );
}
