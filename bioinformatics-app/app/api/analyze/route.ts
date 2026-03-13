import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sequence, type } = body;

    // Validate input
    if (!sequence || !type) {
      return NextResponse.json(
        { error: "Sequence and type are required" },
        { status: 400 },
      );
    }

    // Proxy request to the Nest.js backend
    const response = await fetch("http://localhost:3001/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sequence, type }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const backendData = await response.json();

    // Map snake_case to camelCase for frontend
    const frontendData = {
      sequence: backendData.sequence || "",
      sequenceType: backendData.sequence_type || "dna",
      length: backendData.length || 0,
      gcContent: backendData.gc_content || 0,
      molecularWeight: backendData.molecular_weight || 0,
      reverseComplement: backendData.reverse_complement || "",
      transcription: backendData.transcription || "",
      translation: backendData.translation || "",
      orfRegions: backendData.orf_regions || [],
      errors: backendData.errors || [],
      isValid: backendData.is_valid || false,
    };

    return NextResponse.json(frontendData);
  } catch (error) {
    console.error("Error analyzing sequence:", error);
    return NextResponse.json(
      { error: "Failed to analyze sequence" },
      { status: 500 },
    );
  }
}
