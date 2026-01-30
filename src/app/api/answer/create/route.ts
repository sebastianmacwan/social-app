import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { addPoints } from "@/lib/rewards";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questionId, content } = await req.json();

    if (!questionId || !content) {
      return NextResponse.json({ error: "Question ID and content required" }, { status: 400 });
    }

    const answerData = {
      content,
      question_id: questionId,
      author_id: userId,
    };

    // Create answer - trying different table names
    let { data: answer, error: insertError } = await supabase
      .from("Answer")
      .insert(answerData)
      .select()
      .single();

    if (insertError && insertError.code === 'PGRST205') {
      console.log("Answer table not found, trying 'answer'...");
      const { data: altAnswer, error: altAnswerError } = await supabase
        .from("answer")
        .insert(answerData)
        .select()
        .single();
      
      if (altAnswerError && altAnswerError.code === 'PGRST205') {
        console.log("answer table not found, trying 'answers'...");
        const { data: pluralAnswer, error: pluralAnswerError } = await supabase
          .from("answers")
          .insert(answerData)
          .select()
          .single();
        
        answer = pluralAnswer;
        insertError = pluralAnswerError;
      } else {
        answer = altAnswer;
        insertError = altAnswerError;
      }
    }

    if (insertError) {
      console.error("Create Answer Error:", insertError);
      return NextResponse.json({ error: "Failed to create answer" }, { status: 500 });
    }

    // Award 5 points for answering
    await addPoints(userId, 5, "Answered a question");

    return NextResponse.json(answer, { status: 201 });

  } catch (error) {
    console.error("Create Answer Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
