import pg from 'pg';

const connectionString = 'postgresql://postgres.sfmzelhjgidhgafmyvrm:jay%40gmail.com@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function query() {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    
    // Check users in auth.users matching email
    const users = await client.query(`
      SELECT id, email, created_at FROM auth.users WHERE email = 'guest@grandazure.com'
    `);
    console.log("auth.users matching guest@grandazure.com:");
    users.rows.forEach(u => console.log(`  id: ${u.id}, created_at: ${u.created_at}`));

    // Check profiles
    const profiles = await client.query(`
      SELECT id, email, role, created_at FROM public.profiles WHERE email = 'guest@grandazure.com'
    `);
    console.log("\nprofiles matching guest@grandazure.com:");
    profiles.rows.forEach(p => console.log(`  id: ${p.id}, role: ${p.role}, created_at: ${p.created_at}`));

    // Check reservations and their profile_ids
    const res = await client.query(`
      SELECT id, confirmation_number, profile_id, guest_id, created_at 
      FROM reservations 
      WHERE profile_id IN (
        SELECT id FROM public.profiles WHERE email = 'guest@grandazure.com'
      ) OR guest_id IN (
        SELECT id FROM guests WHERE email = 'guest@grandazure.com'
      )
    `);
    console.log("\nreservations linked to guest@grandazure.com:");
    res.rows.forEach(r => {
      console.log(`  conf: ${r.confirmation_number}`);
      console.log(`  profile_id on reservation: ${r.profile_id}`);
      console.log(`  guest_id on reservation: ${r.guest_id}`);
      console.log(`  created_at: ${r.created_at}`);
    });

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

query();
