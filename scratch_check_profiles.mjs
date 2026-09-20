import pg from 'pg';

const connectionString = 'postgresql://postgres.sfmzelhjgidhgafmyvrm:jay%40gmail.com@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function checkProfiles() {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    
    // Check all guest profiles
    const res = await client.query(`
      SELECT id, email, first_name, last_name, role, created_at 
      FROM public.profiles 
      WHERE role = 'guest'
    `);
    console.log("All guest profiles:");
    res.rows.forEach(p => console.log(`  - id: ${p.id}, email: ${p.email}, name: ${p.first_name} ${p.last_name}`));

    // Check all reservations with profile details
    const res2 = await client.query(`
      SELECT r.id, r.confirmation_number, r.profile_id, r.guest_id, r.status, p.email as profile_email, g.email as guest_email
      FROM reservations r
      LEFT JOIN profiles p ON p.id = r.profile_id
      LEFT JOIN guests g ON g.id = r.guest_id
    `);
    console.log("\nAll reservations in DB:");
    res2.rows.forEach(r => console.log(`  - conf: ${r.confirmation_number}, profile: ${r.profile_id} (${r.profile_email}), guest: ${r.guest_id} (${r.guest_email}), status: ${r.status}`));

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

checkProfiles();
