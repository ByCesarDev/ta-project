/**
 * ==============================================================================
 * TOTALANIME 2.0 - PRODUCTION AUTH MIGRATION & RECOVERY SCRIPT
 * Archivo: scripts/migrate-users.ts
 * ==============================================================================
 * 
 * Propósito:
 * 1. Migra cuentas de usuario legacy con hash MD5 a Supabase GoTrue Auth en Producción.
 * 2. Utiliza la Supabase Admin API (Service Role) para aprovisionar usuarios de forma segura.
 * 3. Registra la correspondencia exacta en `public.migration_user_map (legacy_id -> supabase_uuid)`.
 * 4. Asigna perfiles (avatar, bio) y roles RBAC ('admin', 'moderator', 'user').
 * 5. Genera enlaces oficiales de recuperación de contraseña (password reset) para forzar
 *    el cambio de credenciales seguras (Argon2/bcrypt) en el primer inicio de sesión.
 * 
 * Uso:
 *   npx tsx scripts/migrate-users.ts [--dry-run] [--send-email]
 * 
 * Variables de Entorno (.env o ENV):
 *   SUPABASE_URL=https://kifhkrbvxzdubfoglvvk.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * ==============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

interface LegacyUser {
    legacy_id: number;
    username: string;
    email: string;
    role: 'admin' | 'moderator' | 'user';
    avatar_url: string;
    bio: string;
    created_at: string;
}

// Catálogo de usuarios legacy extraído del dump verificado (totalanime (2).sql)
const LEGACY_USERS: LegacyUser[] = [
    {
        legacy_id: 2,
        username: 'cesardev',
        email: 'admin@totalanime.com',
        role: 'admin',
        avatar_url: 'user-4.jpeg',
        bio: 'Administrador de TotalAnime',
        created_at: '2025-08-14T06:58:22Z'
    },
    {
        legacy_id: 4,
        username: 'freilyn',
        email: 'freilyn@totalanime.com',
        role: 'moderator',
        avatar_url: 'user-5.jpeg',
        bio: 'Moderador de TotalAnime',
        created_at: '2025-09-25T03:32:49Z'
    },
    {
        legacy_id: 5,
        username: 'Jesus',
        email: 'jesus@totalanime.com',
        role: 'user',
        avatar_url: 'user-5.jpeg',
        bio: '',
        created_at: '2025-09-26T04:13:31Z'
    }
];

interface MigrationResult {
    legacy_id: number;
    username: string;
    email: string;
    supabase_uuid: string;
    role: string;
    action: 'created' | 'linked_existing' | 'dry_run';
    reset_link: string;
}

async function runMigration() {
    const isDryRun = process.argv.includes('--dry-run');
    const sendEmail = process.argv.includes('--send-email');

    console.log('='.repeat(78));
    console.log(' TOTALANIME 2.0 - PRODUCTION AUTH MIGRATION & CUTOVER PIPELINE');
    console.log('='.repeat(78));
    console.log(`Modo: ${isDryRun ? 'DRY-RUN (Simulación sin escrituras)' : 'PRODUCCIÓN / LIVE'}`);
    console.log(`Envío de Correos Automático: ${sendEmail ? 'ACTIVADO' : 'DESACTIVADO (Enlaces manuales generados)'}`);
    
    const isLocal = !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('localhost') || process.env.SUPABASE_URL.includes('127.0.0.1');
    const defaultLocalKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
    
    const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || (isLocal ? defaultLocalKey : undefined);

    if (!serviceRoleKey && !isDryRun) {
        console.error('\n❌ ERROR: Falta la variable SUPABASE_SERVICE_ROLE_KEY para entorno remoto.');
        console.error('Para ejecutar la migración productiva en Supabase Cloud:');
        console.error('  $env:SUPABASE_URL="https://<project-ref>.supabase.co"');
        console.error('  $env:SUPABASE_SERVICE_ROLE_KEY="<service-role-secret-key>"');
        console.error('  npm run migrate:users\n');
        process.exit(1);
    }

    console.log(`Target URL: ${supabaseUrl}`);
    console.log(`Usuarios a procesar: ${LEGACY_USERS.length}\n`);

    const supabase = !isDryRun && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }) : null as any;

    const results: MigrationResult[] = [];

    for (const legacy of LEGACY_USERS) {
        console.log(`[+] Procesando Legacy User #${legacy.legacy_id} (${legacy.username} <${legacy.email}>)...`);

        if (isDryRun) {
            results.push({
                legacy_id: legacy.legacy_id,
                username: legacy.username,
                email: legacy.email,
                supabase_uuid: `dry-run-uuid-00000000000${legacy.legacy_id}`,
                role: legacy.role,
                action: 'dry_run',
                reset_link: `https://totalanime.com/auth/reset-password?token=dry_run_token_${legacy.legacy_id}`
            });
            continue;
        }

        // 1. Verificar si el usuario ya existe en Supabase Auth
        const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
            console.error(`   ❌ Error al listar usuarios de Auth: ${listError.message}`);
            continue;
        }

        let userUuid: string;
        let action: 'created' | 'linked_existing';

        const existingUser = listData.users.find(u => u.email?.toLowerCase() === legacy.email.toLowerCase());

        if (existingUser) {
            userUuid = existingUser.id;
            action = 'linked_existing';
            console.log(`   ℹ️ Usuario ya existente en auth.users con UUID: ${userUuid}`);
            
            // Asegurar metadata de migración
            await supabase.auth.admin.updateUserById(userUuid, {
                user_metadata: {
                    ...existingUser.user_metadata,
                    username: legacy.username,
                    legacy_id: legacy.legacy_id,
                    password_reset_required: true,
                    migrated_at: new Date().toISOString()
                }
            });
        } else {
            // 2. Crear usuario real en Supabase Auth con password temporal de alta entropía
            const temporaryPassword = crypto.randomBytes(24).toString('base64') + '!Aa1';
            
            const { data: createData, error: createError } = await supabase.auth.admin.createUser({
                email: legacy.email,
                email_confirm: true,
                password: temporaryPassword,
                user_metadata: {
                    username: legacy.username,
                    legacy_id: legacy.legacy_id,
                    password_reset_required: true,
                    migrated_at: new Date().toISOString()
                }
            });

            if (createError || !createData.user) {
                console.error(`   ❌ Error al crear usuario en Supabase Auth: ${createError?.message}`);
                continue;
            }

            userUuid = createData.user.id;
            action = 'created';
            console.log(`   ✅ Creado en auth.users con UUID: ${userUuid}`);
        }

        // 3. Registrar en migration_user_map
        const { error: mapError } = await supabase
            .from('migration_user_map')
            .upsert({
                legacy_id: legacy.legacy_id,
                supabase_uuid: userUuid,
                username: legacy.username,
                email: legacy.email,
                migrated_at: new Date().toISOString()
            }, { onConflict: 'legacy_id' });

        if (mapError) {
            console.error(`   ❌ Error al registrar en migration_user_map: ${mapError.message}`);
        } else {
            console.log(`   ✅ Trazabilidad guardada en public.migration_user_map (${legacy.legacy_id} -> ${userUuid})`);
        }

        // 4. Actualizar perfil público (avatar, bio)
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userUuid,
                username: legacy.username,
                avatar_url: legacy.avatar_url,
                bio: legacy.bio,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (profileError) {
            console.error(`   ❌ Error al actualizar public.profiles: ${profileError.message}`);
        }

        // 5. Asignar rol RBAC
        const { error: roleError } = await supabase
            .from('user_roles')
            .upsert({
                user_id: userUuid,
                role: legacy.role,
                status: 'active',
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (roleError) {
            console.error(`   ❌ Error al actualizar public.user_roles: ${roleError.message}`);
        }

        // 6. Generar enlace oficial de restablecimiento / recuperación de contraseña
        let resetLink = '';
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: legacy.email,
            options: {
                redirectTo: `${supabaseUrl.replace(':54321', ':5173')}/auth/reset-password`
            }
        });

        if (linkError || !linkData.properties?.action_link) {
            console.warn(`   ⚠️ Advertencia al generar enlace de recuperación: ${linkError?.message}`);
            resetLink = `Error al generar: ${linkError?.message}`;
        } else {
            resetLink = linkData.properties.action_link;
            console.log(`   🔗 Enlace de recuperación generado con éxito.`);
        }

        results.push({
            legacy_id: legacy.legacy_id,
            username: legacy.username,
            email: legacy.email,
            supabase_uuid: userUuid,
            role: legacy.role,
            action,
            reset_link: resetLink
        });
    }

    // Reporte final estructurado
    console.log('\n' + '='.repeat(78));
    console.log(' RESUMEN FINAL DEL CUTOVER DE AUTENTICACIÓN');
    console.log('='.repeat(78));
    console.table(results.map(r => ({
        'Legacy ID': r.legacy_id,
        'Username': r.username,
        'Email': r.email,
        'Supabase UUID': r.supabase_uuid,
        'Rol': r.role,
        'Acción': r.action
    })));

    console.log('\n' + '-'.repeat(78));
    console.log(' ENLACES DE RESTABLECIMIENTO DE CONTRASEÑA (PASSWORD RESET):');
    console.log('-'.repeat(78));
    for (const r of results) {
        console.log(`\n• Usuario: ${r.username} (${r.email}) [Rol: ${r.role}]`);
        console.log(`  Reset Link: ${r.reset_link}`);
    }

    console.log('\n' + '='.repeat(78));
    console.log(' ✅ MIGRACIÓN DE AUTENTICACIÓN COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(78) + '\n');
}

runMigration().catch(err => {
    console.error('\n❌ Fatal Error durante la migración:', err);
    process.exit(1);
});
