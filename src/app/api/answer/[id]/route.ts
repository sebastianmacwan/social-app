import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { addPoints } from "@/lib/rewards";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        console.log("answer table not found, trying 'answers'...");
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

    // Check ownership (authorId -> author_id or user_id)
    const authorId = answer.authorId || answer.author_id || answer.user_id;
    if (authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete answer - trying different table names
    let { error: deleteError } = await supabase
      .from("Answer")
      .delete()
      .eq("id", answerId);

    if (deleteError && deleteError.code === 'PGRST205') {
      const { error: altDeleteError } = await supabase
        .from("answer")
        .delete()
        .eq("id", answerId);
      
      if (altDeleteError && altDeleteError.code === 'PGRST205') {
        deleteError = (await supabase
          .from("answers")
          .delete()
          .eq("id", answerId)).error;
      } else {
        deleteError = altDeleteError;
      }
    }

    if (deleteError) {
      console.error("Delete Answer Error:", deleteError);
      return NextResponse.json({ error: "Failed to delete answer" }, { status: 500 });
    }

    // Deduct points (reversing the +5 for answering)
    await addPoints(userId, -5, "Removed answer");

    return NextResponse.json({ success: true, message: "Answer deleted and points deducted" });

  } catch (error) {
    console.error("Delete Answer Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
