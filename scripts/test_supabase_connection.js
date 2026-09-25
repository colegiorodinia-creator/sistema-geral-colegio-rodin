const SUPABASE_URL = 'https://jhjzyoztidfwzqeblhch.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoanp5b3p0aWRmd3pxZWJsaGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTc3NjAwMH0.placeholder';

async function testSupabase() {
  console.log('Testing Supabase REST API connection to profiles table with correct ref (jhjzyoztidfwzqeblhch)...');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    console.log('Response status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (e) {
    console.error('Error connecting to Supabase:', e);
  }
}

testSupabase();
