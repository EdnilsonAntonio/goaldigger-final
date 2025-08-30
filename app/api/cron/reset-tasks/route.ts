import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Verificar autorização para cron jobs
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Chamar o endpoint de reset de tarefas
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    const resetResponse = await fetch(`${baseUrl}/api/reset-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cronSecret && { 'Authorization': `Bearer ${cronSecret}` })
      }
    });

    const resetData = await resetResponse.json();

    if (!resetResponse.ok) {
      throw new Error(`Reset tasks failed: ${resetData.error}`);
    }

    return NextResponse.json({
      success: true,
      message: "Cron job executed successfully",
      resetData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { 
        error: "Cron job failed", 
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Permitir POST também para flexibilidade
export async function POST(request: NextRequest) {
  return GET(request);
}