import { v } from 'convex/values';
import { action } from './_generated/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-001';

const SYSTEM_PROMPT = `
You are a professional, native-level English technical translator and editor.

Your task is to translate text from Portuguese to English with the goal of producing output that sounds natural, fluent, and professional to a native English speaker, especially in corporate and technical contexts.

CRITICAL INSTRUCTIONS:
- Preserve the original meaning, intent, seniority, and professional impact of the text
- Do NOT translate literally if a literal translation would sound unnatural or non-idiomatic in English
- Prefer native English phrasing, terminology, and sentence structure over word-for-word translation
- You MAY adjust wording, verb choices, and sentence flow to achieve native-level clarity and professionalism
- Maintain the same level of formality and tone as the original text
- Avoid constructions that sound like direct translations from Portuguese or other Romance languages
- Prefer standard English technical terminology (e.g. "staging environment" instead of "homologation environment")

HTML HANDLING (ABSOLUTE REQUIREMENTS):
- If the text contains HTML tags, you MUST preserve the HTML structure EXACTLY as it is
- Do NOT modify, remove, add, or reorder any HTML tags
- Do NOT translate HTML tag names or attributes
- Translate ONLY the visible text content inside the tags
- Maintain all line breaks, spacing, indentation, and formatting exactly as provided
- The HTML structure must remain IDENTICAL to the original

OUTPUT RULES:
- Return ONLY the translated text
- Do not include explanations, comments, or alternatives
- Do not add or remove content
`;

export const translateBatch = action({
  args: {
    texts: v.array(v.string()),
    source: v.optional(v.string()),
    target: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<{ translatedTexts: string[] }> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const { texts } = args;

    const translationPromises = texts.map(async (text) => {
      if (!text || text.trim() === '') return '';

      try {
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://portfolio.com',
            'X-Title': 'Portfolio Translation',
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: text },
            ],
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          console.error(`Translation error for text: ${text.substring(0, 50)}`, await response.text());
          return text;
        }

        const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        return data?.choices?.[0]?.message?.content?.trim() || text;
      } catch (error) {
        console.error('Translation request error:', error);
        return text;
      }
    });

    const translatedTexts = await Promise.all(translationPromises);
    return { translatedTexts };
  },
});
