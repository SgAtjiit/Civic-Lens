import { NextResponse } from "next/server";
import JSON5 from "json5";

function extractJsonObject(text: string) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return cleaned;
  return cleaned.slice(first, last + 1);
}

export async function POST(req: Request) {
  try {
    const { image, lat, lng } = await req.json();

    if (!image || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: image, lat, lng" },
        { status: 400 }
      );
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json(
        { error: "OpenRouter API Key not configured. Please add OPENROUTER_API_KEY to your .env file." },
        { status: 500 }
      );
    }

    const payload = {
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "system",
          content:
            "You are a civil engineering assistant analyzing road infrastructure. Look at the provided image. Identify the primary issue (e.g., Pothole, Broken Pavement, Waterlogging) and assign a severity score from 1 (minor) to 5 (critical hazard). Return your response strictly as a JSON object with the keys: 'issue_type', 'severity' (number 1-5), and 'brief_description'. Return ONLY valid JSON, without any markdown formatting or extra text.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Evaluate this image of road infrastructure." },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openRouterKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "CivicLens",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API Error:", errorData);
      return NextResponse.json(
        { error: "Failed to communicate with OpenRouter API" },
        { status: 502 }
      );
    }

    const data = await response.json();
    let resultText = data.choices?.[0]?.message?.content || "";

    const jsonish = extractJsonObject(resultText);

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(jsonish);
    } catch {
      try {
        parsedResult = JSON5.parse(jsonish);
      } catch {
        console.error("Failed to parse AI response:", resultText);
        return NextResponse.json(
          { error: "AI returned invalid JSON format" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      issue_type: parsedResult.issue_type || "Unknown Issue",
      severity: Number(parsedResult.severity) || 1,
      brief_description: parsedResult.brief_description || "No description provided.",
      lat,
      lng,
    });
  } catch (error: any) {
    console.error("Evaluation error:", error);
    return NextResponse.json(
      { error: "Internal server error during evaluation" },
      { status: 500 }
    );
  }
}
