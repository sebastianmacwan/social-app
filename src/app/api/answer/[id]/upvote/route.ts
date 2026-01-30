import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { addPoints } from "@/lib/rewards";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json(); // 'upvote' or 'downvote'
    const answerId = params.id;

    // Find answer - trying different table names
    let { data: answer, error: fetchError } = await supabase
      .from("Answer")
      .select("*")
      .eq("id", answerId)
      .single();

    if (fetchError && fetchError.code === 'PGRST205') {
      console.log("Answer table not found, trying 'answer'...");
      const { data: altAnswer, error: altAnswerError } = await supabase
        .from("answer")
        .select("*")
        .eq("id", answerId)
        .single();
      
      if (altAnswerError && altAnswerError.code === 'PGRST205') {
        const { data: pluralAnswer, error: pluralAnswerError } = await supabase
          .from("answers")
          .select("*")
          .eq("id", answerId)
          .single();
        
        answer = pluralAnswer;
        fetchError = pluralAnswerError;
      } else {
        answer = altAnswer;
        fetchError = altAnswerError;
      }
    }

    if (fetchError || !answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    let newUpvotes = answer.upvotes || 0;
    const authorId = answer.authorId || answer.author_id || answer.user_id;

    if (action === 'upvote') {
      newUpvotes++;
      
      // Update answer - trying different table names
      let { error: updateError } = await supabase
        .from("Answer")
        .update({ upvotes: newUpvotes })
        .eq("id", answerId);

      if (updateError && updateError.code === 'PGRST205') {
        const { error: altUpdateError } = await supabase
          .from("answer")
          .update({ upvotes: newUpvotes })
          .eq("id", answerId);
        
        if (altUpdateError && altUpdateError.code === 'PGRST205') {
          updateError = (await supabase
            .from("answers")
            .update({ upvotes: newUpvotes })
            .eq("id", answerId)).error;
        } else {
          updateError = altUpdateError;
        }
      }

      if (updateError) {
        console.error("Upvote Update Error:", updateError);
        return NextResponse.json({ error: "Failed to upvote" }, { status: 500 });
      }

      // Reward: If 5 upvotes, add 5 points to AUTHOR
      if (newUpvotes === 5) {
        await addPoints(authorId, 5, "Answer received 5 upvotes");
      }

    } else if (action === 'downvote') {
      newUpvotes--;
      
      // Update answer - trying different table names
      let { error: updateError } = await supabase
        .from("Answer")
        .update({ upvotes: newUpvotes })
        .eq("id", answerId);

      if (updateError && updateError.code === 'PGRST205') {
        const { error: altUpdateError } = await supabase
          .from("answer")
          .update({ upvotes: newUpvotes })
          .eq("id", answerId);
        
        if (altUpdateError && altUpdateError.code === 'PGRST205') {
          updateError = (await supabase
            .from("answers")
            .update({ upvotes: newUpvotes })
            .eq("id", answerId)).error;
        } else {
          updateError = altUpdateError;
        }
      }

      if (updateError) {
        console.error("Downvote Update Error:", updateError);
        return NextResponse.json({ error: "Failed to downvote" }, { status: 500 });
      }
      
      // Deduct 2 points from author for downvote
      await addPoints(authorId, -2, "Answer downvoted");
    }

    return NextResponse.json({ upvotes: newUpvotes });

  } catch (error) {
    console.error("Upvote Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
