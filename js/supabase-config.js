// --- Supabase Configuration ---
// Make sure to replace these values with your actual Supabase Project URL and Anon Key!
// You can get this from the Supabase Dashboard -> Project Settings -> API.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://jlyuhfxewmfubitgvamz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0X8tkfKE4p6DDtbCpLSUKw_uGZ590d3';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };
