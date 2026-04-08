import { NextRequest, NextResponse } from "next/server";

/**
 * Accurate Restriction Analysis Endpoint
 *
 * This endpoint proxies requests to the Python Biopython service for production-grade accuracy.
 * The Python service uses Biopython for precise restriction enzyme analysis.
 *
 * In production, ensure the Python service is running at the configured URL.
 */

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sequence, enzymes } = body;

    // Validate input
    if (!sequence) {
      return NextResponse.json(
        { error: "Sequence is required" },
        { status: 400 },
      );
    }

    if (!enzymes || !Array.isArray(enzymes) || enzymes.length === 0) {
      return NextResponse.json(
        { error: "At least one enzyme must be specified" },
        { status: 400 },
      );
    }

    // Call the actual Python Biopython service for accurate results
    try {
      const response = await fetch(`${PYTHON_SERVICE_URL}/restriction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sequence,
          enzymes: enzymes || [],
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Python service error: ${response.status} - ${errorText}`,
        );
      }

      const pythonResult = await response.json();

      // Transform Python service response to match our API format
      return NextResponse.json({
        sequence: pythonResult.sequence || sequence.toUpperCase(),
        analysisResults: pythonResult.analysis_results || {},
        totalEnzymes: pythonResult.total_enzymes || enzymes.length,
        processingMode: "accurate",
        processingNote:
          "🔬 Processed with Python Biopython - Production-grade accuracy",
      });
    } catch (pythonError: any) {
      console.error("Python service unavailable:", pythonError.message);

      // If Python service is unavailable, return a helpful error
      return NextResponse.json(
        {
          error: "Python Biopython service is not available",
          message:
            "The accurate mode requires the Python service to be running. Please start the Python service or use Fast mode for JavaScript-based analysis.",
          pythonServiceUrl: PYTHON_SERVICE_URL,
          processingMode: "accurate",
          fallbackSuggestion:
            "Switch to Fast mode for instant JavaScript-based analysis",
        },
        { status: 503 },
      );
    }
  } catch (error: any) {
    console.error("Error in accurate restriction analysis:", error);
    return NextResponse.json(
      { error: "Failed to analyze restriction sites", details: error.message },
      { status: 500 },
    );
  }
}
