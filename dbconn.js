
import { createClient } from '@supabase/supabase-js'

import dotenv from 'dotenv';

dotenv.config();


const sb = createClient('https://pvpzmbourdefgtknwrep.supabase.co', process.env.DBKEY);

export default sb;