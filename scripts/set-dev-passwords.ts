/**
 * ==============================================================================
 * TOTALANIME 2.0 - SET DEV PASSWORDS FOR LOCAL TESTING
 * Archivo: scripts/set-dev-passwords.ts
 * ==============================================================================
 * 
 * Permite establecer contraseñas directas y conocidas para los usuarios de prueba
 * en Supabase Cloud / Local sin tener que esperar emails de confirmación o tokens.
 * 
 * Uso:
 *   npx tsx scripts/set-dev-passwords.ts [password]
 * 
 * Contraseñas por defecto si no se especifica:
 *   - admin@totalanime.com   -> Admin1234!
 *   - freilyn@totalanime.com -> Mod1234!
 *   - jesus@totalanime.com   -> User1234!
 * ==============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!secretKey) {
    console.error('❌ Falta SUPABASE_SECRET_KEY en .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const TARGET_USERS = [
    { email: 'admin@totalanime.com', defaultPass: 'Admin1234!', role: 'admin' },
    { email: 'freilyn@totalanime.com', defaultPass: 'Mod1234!', role: 'moderator' },
    { email: 'jesus@totalanime.com', defaultPass: 'User1234!', role: 'user' },
];

async function main() {
    console.log('='.repeat(70));
    console.log(' TOTALANIME 2.0 - ASIGNADOR DE CONTRASEÑAS PARA TESTING');
    console.log('='.repeat(70));

    const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) {
        console.error('❌ Error listando usuarios:', listErr.message);
        process.exit(1);
    }

    const customPass = process.argv[2];

    for (const target of TARGET_USERS) {
        const found = usersData.users.find(u => u.email?.toLowerCase() === target.email.toLowerCase());
        if (!found) {
            console.log(`⚠️ Usuario ${target.email} no encontrado en auth.users. ¿Corriste migrate:users?`);
            continue;
        }

        const newPassword = customPass || target.defaultPass;

        const { error: updateErr } = await supabase.auth.admin.updateUserById(found.id, {
            password: newPassword,
            email_confirm: true
        });

        if (updateErr) {
            console.error(`❌ Error actualizando ${target.email}:`, updateErr.message);
        } else {
            console.log(`✅ [${target.role.toUpperCase()}] ${target.email} -> Contraseña fijada: "${newPassword}"`);
        }
    }

    console.log('='.repeat(70));
    console.log('¡Listo! Ya puedes iniciar sesión en el panel Admin o Web con estas credenciales.\n');
}

main().catch(console.error);
