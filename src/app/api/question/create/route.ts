import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { getDailyQuestionLimit } from "@/lib/postRules";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content required" }, { status: 400 });
    }

    // Find user
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('subscription_plan')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check Limit
    const subscriptionPlan = user.subscription_plan || "FREE";
    const limit = getDailyQuestionLimit(subscriptionPlan);

    if (limit !== Infinity) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Count today's questions
      let { count, error: countError } = await supabase
        .from("Question")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId)
        .gte("created_at", today.toISOString());

      if (countError && countError.code === 'PGRST205') {
        const { count: altCount, error: altCountError } = await supabase
          .from("question")
          .select("*", { count: "exact", head: true })
          .eq("author_id", userId)
          .gte("created_at", today.toISOString());
        
        if (altCountError && altCountError.code === 'PGRST205') {
          const { count: pluralCount, error: pluralCountError } = await supabase
            .from("questions")
            .select("*", { count: "exact", head: true })
            .eq("author_id", userId)
            .gte("created_at", today.toISOString());
          
          count = pluralCount;
          countError = pluralCountError;
        } else {
          count = altCount;
          countError = altCountError;
        }
      }

      if (count !== null && count >= limit) {
        return NextResponse.json(
          { error: `Daily question limit reached for ${subscriptionPlan} plan.` },
          { status: 403 }
        );
      }
    }

    const questionData = {
      title,
      content,
      author_id: userId,
    };

    // Create question - trying different table names
    let { data: question, error: insertError } = await supabase
      .from("Question")
      .insert(questionData)
      .select()
      .single();

    if (insertError && insertError.code === 'PGRST205') {
      console.log("Question table not found, trying 'question'...");
      const { data: altQuestion, error: altQuestionError } = await supabase
        .from("question")
        .insert(questionData)
        .select()
        .single();
      
      if (altQuestionError && altQuestionError.code === 'PGRST205') {
        console.log("question table not found, trying 'questions'...");
        const { data: pluralQuestion, error: pluralQuestionError } = await supabase
          .from("questions")
          .insert(questionData)
          .select()
          .single();
        
        question = pluralQuestion;
        insertError = pluralQuestionError;
      } else {
        question = altQuestion;
        insertError = altQuestionError;
      }
    }

    if (insertError) {
      console.error("Create Question Error:", insertError);
      return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
    }

    return NextResponse.json(question, { status: 201 });

  } catch (error) {
    console.error("Create Question Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
