import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    "OPENAI_API_KEY is missing. Add it in Vercel Environment Variables."
  );
}

export const openai = new OpenAI({
  apiKey,
});
