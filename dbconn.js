
import { createClient } from '@supabase/supabase-js'

const sb = createClient('https://pvpzmbourdefgtknwrep.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2cHptYm91cmRlZmd0a253cmVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwODg0NiwiZXhwIjoyMDYwMTg0ODQ2fQ.7gg2aSbKWLkbUvjZJfA9Ik8qfNqnhla1KDq8uEASAMQ');

export default sb;