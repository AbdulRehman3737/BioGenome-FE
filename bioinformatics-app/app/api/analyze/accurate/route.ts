import { NextRequest, NextResponse } from "next/server";

/**
 * Accurate Analysis Endpoint
 *
 * This endpoint proxies requests to the Python Biopython service for production-grade accuracy.
 * The Python service uses Biopython for precise calculations including:
 * - Exact molecular weight calculations (using actual nucleotide weights)
 * - Precise GC content calculation
 * - Full Biopython-based sequence analysis
 *
 * In production, ensure the Python service is running at the configured URL.
 */

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

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

    // Call the actual Python Biopython service for accurate results
    try {
      const response = await fetch(`${PYTHON_SERVICE_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sequence,
          sequence_type: type,
          analysis_options: {},
        }),
        // Timeout after 30 seconds
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
      // Note: Python gc_fraction returns 0.0-1.0, convert to percentage
      const gcContent = pythonResult.gc_content
        ? Math.round(pythonResult.gc_content * 100 * 100) / 100
        : 0;

      return NextResponse.json({
        sequence: pythonResult.sequence || sequence.toUpperCase(),
        sequenceType: type,
        length: pythonResult.length || sequence.length,
        gcContent: gcContent,
        molecularWeight: pythonResult.molecular_weight || 0,
        reverseComplement: pythonResult.reverse_complement || "",
        transcription: pythonResult.transcription || "",
        translation: pythonResult.translation || "",
        orfRegions: pythonResult.orf_regions || [],
        isValid:
          pythonResult.is_valid !== undefined ? pythonResult.is_valid : true,
        errors: pythonResult.errors || [],
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
    console.error("Error in accurate analysis:", error);
    return NextResponse.json(
      { error: "Failed to analyze sequence", details: error.message },
      { status: 500 },
    );
  }
}
