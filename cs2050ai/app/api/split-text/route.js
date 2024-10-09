import { SECTION_SEPERATOR } from '@/app/constants/constants';
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { split } from 'postcss/lib/list';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { pdfText} = await req.json();

    if (!pdfText) {
      return NextResponse.json({ error: 'PDF text required' }, { status: 400 });
    }

    // Prepare messages for ChatGPT
    const messages = [
      { role: "system", content: "Based on the text provided you need to break down the text into sections where each section is related to one idea. Ideally make these sections as small as possible. Seperate each section with " + SECTION_SEPERATOR },
      { role: "user", content: `Context: ${pdfText}` }
    ];

    // Call ChatGPT API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
    });

    const answer = completion.choices[0].message.content.trim();
    console.log('Answer:', answer.length);
    const splitText = answer.split("%^&");
    console.log('Sections', splitText.length)

    return NextResponse.json({ answer, splitText });
  } catch (error) {
    console.error('Error processing request:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: 'An error occurred while processing your request', details: error.message }, { status: 500 });
  }
}
