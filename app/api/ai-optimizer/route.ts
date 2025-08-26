import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";



export async function POST(request: NextRequest) {
  try {
    const { message, financialData, userId } = await request.json();

    if (!message || !financialData) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }


    // Stream the response
    

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of streamResult.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error in AI optimizer:", error);
    return NextResponse.json(
      { error: "Failed to stream AI response" },
      { status: 500 }
    );
  }
}
