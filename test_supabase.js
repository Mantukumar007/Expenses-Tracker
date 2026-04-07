import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aitrmuqeahpzbtvfgtoa.supabase.co';
const supabaseAnonKey = 'sb_publishable_M4GU-92QX2Xt1I5ceUQmAw_aMuyMwCP';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Testing connection...");
  const { data, error } = await supabase.from('transactions').select('*').limit(1);
  if (error) {
    console.error("Fetch Error:", error);
  } else {
    console.log("Fetch Success. Rows:", data.length);
  }

  const { data: iData, error: iError } = await supabase.from('transactions').insert({
    amount: 10,
    category: 'test',
    payment_mode: 'UPI',
    type: 'expense'
  });
  if (iError) {
    console.error("Insert Error:", iError);
  } else {
    console.log("Insert Success!");
  }
}

test();
