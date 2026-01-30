import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  try {
    const currentUserId = await getCurrentUserId();

    // Fetch posts with user information - trying different table and column names
    let posts: any[] = [];
    let postsError = null;

    const tryFetchPosts = async (tableName: string, userJoin: string) => {
      // First try with created_at
      let result = await supabase
        .from(tableName)
        .select(`
          id, content, created_at, media_url, media_type, user_id,
          ${userJoin} (id, name, email)
        `)
        .order('created_at', { ascending: false });

      // If created_at fails, try with createdAt
      if (result.error && (result.error.code === '42703' || result.error.message?.includes('created_at'))) {
        result = await supabase
          .from(tableName)
          .select(`
            id, content, "createdAt", media_url, media_type, user_id,
            ${userJoin} (id, name, email)
          `)
          .order('createdAt', { ascending: false }) as any;
      }

      return { data: result.data, error: result.error };
    };

    const { data: p1, error: pe1 } = await tryFetchPosts('Post', 'User!user_id');
    if (pe1 && pe1.code === 'PGRST205') {
      const { data: p2, error: pe2 } = await tryFetchPosts('post', 'user!user_id');
      if (pe2 && pe2.code === 'PGRST205') {
        const { data: p3, error: pe3 } = await tryFetchPosts('posts', 'user!user_id');
        if (!pe3) {
          posts = p3 || [];
        } else {
          postsError = pe3;
        }
      } else if (!pe2) {
        posts = p2 || [];
      } else {
        postsError = pe2;
      }
    } else if (!pe1) {
      posts = p1 || [];
    } else {
      postsError = pe1;
    }

    if (postsError) {
      console.error("Feed Fetch Error:", postsError);
      return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
    }

    if (!posts) {
      return NextResponse.json([]);
    }

    // Fetch comments and likes separately
    const postIds = posts.map((post: any) => post.id);
    
    // Get comments for all posts - trying different table and column names
    let comments: any[] = [];
    let commentsError = null;

    // Try 'Comment' with 'created_at'
    const tryFetchComments = async (tableName: string, userJoin: string) => {
      // First try with created_at
      let result = await supabase
        .from(tableName)
        .select(`id, content, created_at, post_id, user_id, ${userJoin} (name)`)
        .in('post_id', postIds);

      // If created_at fails, try with createdAt
      if (result.error && (result.error.code === '42703' || result.error.message?.includes('created_at'))) {
        result = await supabase
          .from(tableName)
          .select(`id, content, "createdAt", post_id, user_id, ${userJoin} (name)`)
          .in('post_id', postIds) as any;
      }

      return { data: result.data, error: result.error };
    };

    // Try sequence: Comment, comment, comments
    const { data: d1, error: e1 } = await tryFetchComments('Comment', 'User!user_id');
    if (e1 && e1.code === 'PGRST205') {
      const { data: d2, error: e2 } = await tryFetchComments('comment', 'user!user_id');
      if (e2 && e2.code === 'PGRST205') {
        const { data: d3, error: e3 } = await tryFetchComments('comments', 'user!user_id');
        if (!e3) {
          comments = d3 || [];
        } else if (e3.code === 'PGRST205') {
          // Table missing, but we handle it gracefully
          comments = [];
          console.log("Note: Comments table is missing from Supabase. Feed will show no comments.");
        } else {
          commentsError = e3;
        }
      } else if (!e2) {
        comments = d2 || [];
      } else {
        commentsError = e2;
      }
    } else if (!e1) {
      comments = d1 || [];
    } else {
      // If it's not a PGRST205, but some other error (like join failure), try a simpler join
      const { data: dSimple, error: eSimple } = await supabase
        .from('Comment')
        .select(`id, content, post_id, user_id`)
        .in('post_id', postIds);
      
      if (!eSimple) {
        comments = dSimple || [];
      } else if (eSimple.code === 'PGRST205') {
        comments = [];
      } else {
        commentsError = e1;
      }
    }

    if (commentsError) {
      console.error("Comments Fetch Error (Final):", commentsError);
    }

    // Get likes for all posts - trying 'like' if 'Like' fails
    let { data: likes, error: likesError } = await supabase
      .from('Like')
      .select('post_id, user_id')
      .in('post_id', postIds);

    if (likesError && likesError.code === 'PGRST205') {
      console.log("Like table not found, trying 'like'...");
      const { data: altLikes, error: altLikesError } = await supabase
        .from('like')
        .select('post_id, user_id')
        .in('post_id', postIds);
      
      if (altLikesError && altLikesError.code === 'PGRST205') {
        console.log("like table not found, trying 'likes'...");
        const { data: pluralLikes, error: pluralLikesError } = await supabase
          .from('likes')
          .select('post_id, user_id')
          .in('post_id', postIds);
        
        if (!pluralLikesError) {
          likes = pluralLikes;
          likesError = null;
        }
      } else if (!altLikesError) {
        likes = altLikes;
        likesError = null;
      }
    }

    if (likesError) {
      console.error("Likes Fetch Error:", likesError);
    }

    const formattedPosts = posts.map((post: any) => {
      const postComments = comments?.filter((comment: any) => comment.post_id === post.id) || [];
      const postLikes = likes?.filter((like: any) => like.post_id === post.id) || [];
      
      return {
        id: post.id,
        content: post.content,
        createdAt: post.created_at || post.createdAt,
        mediaUrl: post.media_url,
        mediaType: post.media_type,
        author: post.User?.name || post.User?.email || post.user?.name || post.user?.email || "Unknown",
        likesCount: postLikes.length,
        likedByMe: currentUserId && postLikes.some((like: any) => like.user_id === currentUserId),
        comments: postComments.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.created_at || comment.createdAt,
          author: comment.User?.name || comment.user?.name || "Unknown",
        })),
      };
    });

    return NextResponse.json(formattedPosts);
  } catch (error) {
    console.error("Feed Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
