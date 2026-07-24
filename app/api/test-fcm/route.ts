import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    console.log('Test FCM endpoint called with token:', token);

    // Call the Supabase Edge Function directly to test
    const response = await fetch(
      'https://xjozstiklaqtgdmamfue.supabase.co/functions/v1/send-fcm-notification',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqb3pzdGlrbGFxdGdkbWFtZnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MTc2OTYsImV4cCI6MjA5OTE5MzY5Nn0.Rh3RC4uVl9qlod04iG8jQYnqUHbP1nJ7_jQ1duOkDIE',
        },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'Testing FCM from API endpoint',
          data: {
            type: 'order',
            tableNumber: '1',
          },
        }),
      }
    );

    const result = await response.json();

    return NextResponse.json({
      success: true,
      token,
      edgeFunctionResult: result,
    });
  } catch (error: any) {
    console.error('Error in test-fcm:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test FCM endpoint - use POST with { "token": "your-fcm-token" }',
  });
}
