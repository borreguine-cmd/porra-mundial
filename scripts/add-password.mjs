import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_Kv7ot8NXgsZO@ep-plain-hat-abohg820-pooler.eu-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require');

await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`;
console.log('✓ Columna password_hash añadida');
