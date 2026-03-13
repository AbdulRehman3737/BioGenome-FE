import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sequence, enzymes } = body;

    // Validate input
    if (!sequence || !enzymes) {
      return NextResponse.json(
        { error: "Sequence and enzymes are required" },
        { status: 400 },
      );
    }

    // Proxy request to the Nest.js backend
    const response = await fetch(
      "http://localhost:3001/api/analyze/restriction",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sequence, enzymes }),
      },
    );

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const backendData = await response.json();

    // Map snake_case to camelCase for frontend
    const frontendData = {
      sequence: backendData.sequence || "",
      analysisResults: backendData.analysis_results || {},
      totalEnzymes: backendData.total_enzymes || 0,
    };

    // Map recognition_sequence to recognitionSequence for each enzyme
    if (frontendData.analysisResults) {
      Object.keys(frontendData.analysisResults).forEach((enzyme) => {
        const result = frontendData.analysisResults[enzyme];
        if (result.recognition_sequence) {
          result.recognitionSequence = result.recognition_sequence;
          delete result.recognition_sequence;
        }
      });
    }

    return NextResponse.json(frontendData);
  } catch (error) {
    console.error("Error in restriction analysis:", error);
    return NextResponse.json(
      { error: "Failed to analyze restriction sites" },
      { status: 500 },
    );
  }
}
