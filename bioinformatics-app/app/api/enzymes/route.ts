import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Proxy request to the Nest.js backend
    const response = await fetch("http://localhost:3001/api/analyze/enzymes", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching enzymes:", error);
    return NextResponse.json(
      { error: "Failed to fetch enzymes" },
      { status: 500 },
    );
  }
}
