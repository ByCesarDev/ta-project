/**
 * ==============================================================================
 * TOTALANIME 2.0 - PRODUCTION AUTH MIGRATION & CUTOVER PIPELINE
 * Archivo: scripts/migrate-users.ts
 * ==============================================================================
 * 
 * Propósito:
 * 1. Migra cuentas de usuario legacy con hash MD5 a Supabase GoTrue Auth en Producción.
 * 2. Utiliza la Supabase Admin API (SUPABASE_SECRET_KEY / Service Role) para aprovisionamiento seguro.
 * 3. Registra correspondencia exacta en `public.migration_user_map (legacy_id -> supabase_uuid)`.
 * 4. Asigna perfiles públicos (avatar, bio) y roles RBAC ('admin', 'moderator', 'user').
 * 5. Gestiona restablecimiento de contraseña:
 *    - Si --send-email: Despacha correo real mediante Supabase Auth SMTP.
 *    - Si manual: Genera action_link administrativo sin exponerlo en logs por defecto.
 * 6. Protege flags de seguridad en `app_metadata` (inmutable por el cliente).
 * 7. Fail-fast: Si cualquier usuario o etapa falla, acumula errores y finaliza con exit code 1.
 * 
 * Uso:
 *   npx tsx scripts/migrate-users.ts [--dry-run] [--send-email] [--output-secure-links]
 * 
 * Variables de Entorno:
 *   SUPABASE_URL=https://kifhkrbvxzdubfoglvvk.supabase.co
 *   SUPABASE_SECRET_KEY=sb_secret_... (o legacy SUPABASE_SERVICE_ROLE_KEY)
 *   PASSWORD_RESET_REDIRECT_URL=https://totalanime.com/auth/reset-password
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

// Catálogo verificado de usuarios legacy (totalanime (2).sql)
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

interface UserMigrationReport {
    legacy_id: number;
    username: string;
    email: string;
    supabase_uuid: string;
    role: string;
    action: 'created' | 'linked_existing' | 'dry_run';
    recovery_status: 'email_dispatched' | 'link_generated' | 'dry_run' | 'failed';
    secure_link?: string;
    stages: {
        auth: boolean;
        map: boolean;
        profile: boolean;
        role: boolean;
        recovery: boolean;
    };
    status: 'completed' | 'failed';
}

interface StageFailure {
    legacy_id: number;
    email: string;
    stage: string;
    error: string;
}

async function runMigration() {
    const isDryRun = process.argv.includes('--dry-run');
    const sendEmail = process.argv.includes('--send-email');
    const outputSecureLinks = process.argv.includes('--output-secure-links');

    console.log('='.repeat(80));
    console.log(' TOTALANIME 2.0 - PRODUCTION AUTH MIGRATION & CUTOVER PIPELINE');
    console.log('='.repeat(80));
    console.log(`Modo:                     ${isDryRun ? 'DRY-RUN (Simulación sin escrituras)' : 'PRODUCCIÓN / LIVE'}`);
    console.log(`Envío SMTP Automático:    ${sendEmail ? 'ACTIVADO (supabase.auth.resetPasswordForEmail)' : 'DESACTIVADO (Admin recovery links)'}`);
    console.log(`Exposición de Credenciales: ${outputSecureLinks ? 'REVELAR EN TERMINAL (--output-secure-links)' : 'PROTEGIDO (Oculto en logs)'}`);
    
    const isLocal = !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('localhost') || process.env.SUPABASE_URL.includes('127.0.0.1');
    const defaultLocalKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
    
    const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
    
    // Soporte prioritario para claves modernas SUPABASE_SECRET_KEY (sb_secret_...) con fallback a SUPABASE_SERVICE_ROLE_KEY
    const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || (isLocal ? defaultLocalKey : undefined);

    // URL de redirección determinista para reset de contraseña
    const defaultRedirect = isLocal ? 'http://127.0.0.1:5173/auth/reset-password' : 'https://totalanime.com/auth/reset-password';
    const redirectUrl = process.env.PASSWORD_RESET_REDIRECT_URL || defaultRedirect;

    if (!secretKey && !isDryRun) {
        console.error('\n❌ ERROR FATAL: Falta la variable SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY) para entorno remoto.');
        console.error('Para ejecutar el cutover de autenticación en Supabase Cloud:');
        console.error('  $env:SUPABASE_URL="https://<project-ref>.supabase.co"');
        console.error('  $env:SUPABASE_SECRET_KEY="sb_secret_..." (o SUPABASE_SERVICE_ROLE_KEY)');
        console.error('  $env:PASSWORD_RESET_REDIRECT_URL="https://totalanime.com/auth/reset-password"');
        console.error('  npm run migrate:users\n');
        process.exit(1);
    }

    console.log(`Target URL:               ${supabaseUrl}`);
    console.log(`Password Reset Redirect:  ${redirectUrl}`);
    console.log(`Usuarios a migrar:        ${LEGACY_USERS.length}\n`);

    const supabase = !isDryRun && secretKey ? createClient(supabaseUrl, secretKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }) : null as any;

    const reports: UserMigrationReport[] = [];
    const failures: StageFailure[] = [];

    for (const legacy of LEGACY_USERS) {
        console.log(`[+] Procesando Legacy User #${legacy.legacy_id} (${legacy.username} <${legacy.email}>)...`);

        const report: UserMigrationReport = {
            legacy_id: legacy.legacy_id,
            username: legacy.username,
            email: legacy.email,
            supabase_uuid: '',
            role: legacy.role,
            action: 'created',
            recovery_status: 'failed',
            stages: {
                auth: false,
                map: false,
                profile: false,
                role: false,
                recovery: false
            },
            status: 'failed'
        };

        if (isDryRun) {
            report.supabase_uuid = `dry-run-uuid-00000000000${legacy.legacy_id}`;
            report.action = 'dry_run';
            report.recovery_status = 'dry_run';
            report.stages = { auth: true, map: true, profile: true, role: true, recovery: true };
            report.status = 'completed';
            report.secure_link = `${redirectUrl}?token=dry_run_token_${legacy.legacy_id}`;
            reports.push(report);
            console.log(`   [DRY-RUN] Simulado exitosamente -> UUID: ${report.supabase_uuid}`);
            continue;
        }

        let userUuid = '';

        // ------------------------------------------------------------------
        // ETAPA 1: Auth GoTrue (Buscar existente o Crear)
        // ------------------------------------------------------------------
        try {
            const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) {
                throw new Error(`Error en listUsers: ${listError.message}`);
            }

            const existingUser = listData.users.find(u => u.email?.toLowerCase() === legacy.email.toLowerCase());

            if (existingUser) {
                userUuid = existingUser.id;
                report.action = 'linked_existing';
                console.log(`   ℹ️ Usuario preexistente en auth.users con UUID: ${userUuid}`);

                // Actualizar metadata: app_metadata (protegido) y user_metadata (username)
                const { error: updateError } = await supabase.auth.admin.updateUserById(userUuid, {
                    app_metadata: {
                        ...(existingUser.app_metadata || {}),
                        legacy_id: legacy.legacy_id,
                        password_reset_required: true,
                        migrated_at: new Date().toISOString()
                    },
                    user_metadata: {
                        ...(existingUser.user_metadata || {}),
                        username: legacy.username
                    }
                });

                if (updateError) {
                    throw new Error(`Error al actualizar metadata de usuario existente: ${updateError.message}`);
                }
            } else {
                // Crear usuario con contraseña temporal de alta entropía
                const temporaryPassword = crypto.randomBytes(32).toString('base64') + '!Aa9#';

                const { data: createData, error: createError } = await supabase.auth.admin.createUser({
                    email: legacy.email,
                    email_confirm: true,
                    password: temporaryPassword,
                    app_metadata: {
                        provider: 'email',
                        providers: ['email'],
                        legacy_id: legacy.legacy_id,
                        password_reset_required: true,
                        migrated_at: new Date().toISOString()
                    },
                    user_metadata: {
                        username: legacy.username
                    }
                });

                if (createError || !createData.user) {
                    throw new Error(`Error al crear usuario en Supabase Auth: ${createError?.message || 'Sin retorno de usuario'}`);
                }

                userUuid = createData.user.id;
                report.action = 'created';
                console.log(`   ✅ Creado en auth.users con UUID: ${userUuid}`);
            }

            report.supabase_uuid = userUuid;
            report.stages.auth = true;
        } catch (err: any) {
            console.error(`   ❌ [STAGE AUTH] ${err.message}`);
            failures.push({ legacy_id: legacy.legacy_id, email: legacy.email, stage: 'auth.users', error: err.message });
            reports.push(report);
            continue; // No continuar con FKs si falló Auth
        }

        // ------------------------------------------------------------------
        // ETAPA 2: Registro en public.migration_user_map
        // ------------------------------------------------------------------
        try {
            const { error: mapError } = await supabase
                .from('migration_user_map')
                .upsert({
                    legacy_id: legacy.legacy_id,
                    supabase_uuid: userUuid,
                    username: legacy.username,
                    email: legacy.email,
                    migrated_at: new Date().toISOString()
                }, { onConflict: 'legacy_id' });

            if (mapError) throw mapError;
            report.stages.map = true;
            console.log(`   ✅ migration_user_map registrado (${legacy.legacy_id} -> ${userUuid})`);
        } catch (err: any) {
            console.error(`   ❌ [STAGE MAP] ${err.message}`);
            failures.push({ legacy_id: legacy.legacy_id, email: legacy.email, stage: 'migration_user_map', error: err.message });
        }

        // ------------------------------------------------------------------
        // ETAPA 3: Perfil Público (public.profiles)
        // ------------------------------------------------------------------
        try {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userUuid,
                    username: legacy.username,
                    avatar_url: legacy.avatar_url,
                    bio: legacy.bio,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (profileError) throw profileError;
            report.stages.profile = true;
            console.log(`   ✅ public.profiles actualizado`);
        } catch (err: any) {
            console.error(`   ❌ [STAGE PROFILE] ${err.message}`);
            failures.push({ legacy_id: legacy.legacy_id, email: legacy.email, stage: 'profiles', error: err.message });
        }

        // ------------------------------------------------------------------
        // ETAPA 4: Rol RBAC (public.user_roles)
        // ------------------------------------------------------------------
        try {
            const { error: roleError } = await supabase
                .from('user_roles')
                .upsert({
                    user_id: userUuid,
                    role: legacy.role,
                    status: 'active',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (roleError) throw roleError;
            report.stages.role = true;
            console.log(`   ✅ public.user_roles asignado: '${legacy.role}' (active)`);
        } catch (err: any) {
            console.error(`   ❌ [STAGE ROLE] ${err.message}`);
            failures.push({ legacy_id: legacy.legacy_id, email: legacy.email, stage: 'user_roles', error: err.message });
        }

        // ------------------------------------------------------------------
        // ETAPA 5: Restablecimiento de Contraseña (Email SMTP o Admin Link)
        // ------------------------------------------------------------------
        try {
            if (sendEmail) {
                // Envío real a través del servicio de correo/SMTP configurado en Supabase
                const { error: resetEmailError } = await supabase.auth.resetPasswordForEmail(legacy.email, {
                    redirectTo: redirectUrl
                });

                if (resetEmailError) throw resetEmailError;

                report.recovery_status = 'email_dispatched';
                report.stages.recovery = true;
                console.log(`   📧 Correo oficial de recuperación enviado exitosamente a ${legacy.email}`);
            } else {
                // Generación de link administrativo seguro (sin enviar email)
                const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
                    type: 'recovery',
                    email: legacy.email,
                    options: {
                        redirectTo: redirectUrl
                    }
                });

                if (linkError || !linkData.properties?.action_link) {
                    throw new Error(linkError?.message || 'No se generó el action_link');
                }

                report.secure_link = linkData.properties.action_link;
                report.recovery_status = 'link_generated';
                report.stages.recovery = true;
                console.log(`   🔗 Enlace de recuperación generado de forma segura.`);
            }
        } catch (err: any) {
            console.error(`   ❌ [STAGE RECOVERY] ${err.message}`);
            failures.push({ legacy_id: legacy.legacy_id, email: legacy.email, stage: 'password_recovery', error: err.message });
        }

        // Evaluar completitud total del usuario
        if (report.stages.auth && report.stages.map && report.stages.profile && report.stages.role && report.stages.recovery) {
            report.status = 'completed';
        }

        reports.push(report);
    }

    // ------------------------------------------------------------------
    // REPORTE DE RESULTADOS Y AUDITORÍA FINAL
    // ------------------------------------------------------------------
    console.log('\n' + '='.repeat(80));
    console.log(' RESUMEN DEL CUTOVER DE AUTENTICACIÓN');
    console.log('='.repeat(80));

    console.table(reports.map(r => ({
        'Legacy ID': r.legacy_id,
        'Username': r.username,
        'Email': r.email,
        'Supabase UUID': r.supabase_uuid ? `${r.supabase_uuid.substring(0, 18)}...` : 'N/A',
        'Rol': r.role,
        'Acción': r.action,
        'Recuperación': r.recovery_status,
        'Resultado': r.status === 'completed' ? '✅ COMPLETO' : '❌ FALLIDO'
    })));

    // Manejo seguro de enlaces
    if (!sendEmail) {
        console.log('\n' + '-'.repeat(80));
        console.log(' CREDENCIALES DE RECUPERACIÓN DE CONTRASEÑA:');
        console.log('-'.repeat(80));

        if (outputSecureLinks) {
            for (const r of reports) {
                console.log(`• ${r.username} (${r.email}):`);
                console.log(`  Link: ${r.secure_link || 'N/A'}\n`);
            }
        } else {
            console.log('🔒 Los enlaces temporales han sido generados pero se omiten por seguridad.');
            console.log('   Para visualizarlos en una terminal segura, ejecute con:');
            console.log('   npm run migrate:users -- --output-secure-links');
            console.log('   O para enviarlos automáticamente por email, ejecute con:');
            console.log('   npm run migrate:users -- --send-email');
        }
    }

    // Comprobación de fallo global (Fail-fast con exit code 1)
    if (failures.length > 0) {
        console.log('\n' + '='.repeat(80));
        console.log(` ❌ MIGRACIÓN INCOMPLETA: Se detectaron ${failures.length} fallos durante el cutover:`);
        console.log('='.repeat(80));
        for (const f of failures) {
            console.error(`  - User #${f.legacy_id} (${f.email}) en etapa [${f.stage}]: ${f.error}`);
        }
        console.error('\nTerminando proceso con error (exit code 1).');
        process.exit(1);
    }

    console.log('\n' + '='.repeat(80));
    console.log(' ✅ CUTOVER DE AUTENTICACIÓN COMPLETADO AL 100% SIN ERRORES');
    console.log('='.repeat(80) + '\n');
}

runMigration().catch(err => {
    console.error('\n❌ Fatal Error no capturado durante la migración:', err);
    process.exit(1);
});
