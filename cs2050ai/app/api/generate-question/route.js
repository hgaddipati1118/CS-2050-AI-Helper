import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const {splitText, tags, categories, pastQuestions} = await req.json();
    console.log('splitText:', splitText);
    console.log('tags:', tags);
    console.log('categories:', categories);

    if (!splitText|| !tags) {
      return NextResponse.json({ error: 'splitText and tags required' }, { status: 400 });
    }

    const category = categories.length > 0 ? categories[Math.floor(Math.random() * categories.length)]: "general";
    let filteredText = ""
    for (let i = 0; i < splitText.length; i++) {
        if (category == "general"){
            filteredText += splitText[i] + "\n";
        }
        else {
            for (let j = 0; j < tags[i].length; j++) {
                if (tags[i][j] == category) {
                    filteredText += splitText[i] + "\n";
                    break;
                }
            }
        }
    }
    // Prepare messages for ChatGPT
    const messages = [
      { role: "system", content: `Based on the text provided can you generate me a free answer question that an MIT student would have in latex code please. Please only give the question no answer, and only latex code for the question. JUST GIVE LATEX CODE NOTHING ELSE I should be able to paste it into react-latex-next <Latex> and </Latex tag and have it work :)
        Make sure the question is unique and not from past questions and not copied from the text. You can not use { or }` },
      { role: "user", content: `Context: ${filteredText} past questions: ${pastQuestions}` }
    ];

    // Call ChatGPT API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 10000,
    });

    const answer = completion.choices[0].message.content.replace("latex", "").replace("```", "").replace("```","").trim();
    console.log('Answer:', answer);
    return NextResponse.json({ answer, tags });
  } catch (error) {
    console.error('Error processing request:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: 'An error occurred while processing your request', details: error.message }, { status: 500 });
  }
}
