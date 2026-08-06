import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Get auth header from request to check if user is logged in
    const authHeader = request.headers.get('authorization');

    // Create Supabase client with the user's session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    // Get current user session
    const { data: { user } } = await supabase.auth.getUser();

    // Store FCM token in Supabase with user association
    const { data, error } = await supabase
      .from('fcm_tokens')
      .upsert(
        {
          token,
          user_id: user?.id || null, // Associate with user if logged in
          device_type: 'android',
          active: true, // Set active when token is saved/updated
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'token',
        }
      );

    if (error) {
      console.error('Error saving FCM token:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ FCM token saved ${user ? `for user ${user.id}` : 'anonymously'}`);
    return NextResponse.json({ success: true, data, userId: user?.id });
  } catch (error) {
    console.error('Error in save-fcm-token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
