import type { AppLoadContext } from 'react-router';
import type { ReportReason } from '@/lib/moderation';
import { createSupabaseAdminClient } from '@/lib/supabase-admin.server';
import { createSupabaseServerClient } from '@/lib/supabase.server';

export async function submitReport(
  request: Request,
  context: AppLoadContext,
  input: { roomId: string; reason: ReportReason; details: string },
): Promise<void> {
  const admin = createSupabaseAdminClient(context);

  if (!admin) {
    throw new Error('La moderación no está configurada.');
  }

  const supabase = createSupabaseServerClient(request, context);
  let reporterId: string | null = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.client.auth.getUser();
    reporterId = user?.id ?? null;
  }

  const { error } = await admin.from('reports').insert({
    room_id: input.roomId,
    reason: input.reason,
    details: input.details.slice(0, 500),
    reporter_id: reporterId,
  });

  if (error) {
    throw new Error(`No se pudo registrar el reporte: ${error.message}`);
  }
}

export interface OpenReport {
  id: string;
  roomId: string;
  roomTitle: string;
  reason: string;
  details: string;
  createdAt: string;
}

export async function loadOpenReports(
  context: AppLoadContext,
): Promise<OpenReport[]> {
  const admin = createSupabaseAdminClient(context);

  if (!admin) {
    return [];
  }

  const { data: reports, error } = await admin
    .from('reports')
    .select('id, room_id, reason, details, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    throw new Error(`No se pudieron cargar los reportes: ${error.message}`);
  }

  const rows = (reports ?? []) as {
    id: string;
    room_id: string;
    reason: string;
    details: string | null;
    created_at: string;
  }[];
  const roomIds = Array.from(new Set(rows.map((row) => row.room_id)));
  const titles = new Map<string, string>();

  if (roomIds.length > 0) {
    const { data: rooms } = await admin
      .from('rooms')
      .select('id, title')
      .in('id', roomIds);

    for (const room of (rooms ?? []) as { id: string; title: string }[]) {
      titles.set(String(room.id), String(room.title));
    }
  }

  return rows.map((row) => ({
    id: String(row.id),
    roomId: String(row.room_id),
    roomTitle: titles.get(String(row.room_id)) ?? 'Habitación',
    reason: String(row.reason),
    details: row.details ?? '',
    createdAt: String(row.created_at),
  }));
}

export async function resolveReport(
  context: AppLoadContext,
  reportId: string,
  decision: 'hide' | 'dismiss',
): Promise<void> {
  const admin = createSupabaseAdminClient(context);

  if (!admin) {
    throw new Error('La moderación no está configurada.');
  }

  const { data: report, error: reportError } = await admin
    .from('reports')
    .select('id, room_id')
    .eq('id', reportId)
    .maybeSingle();

  if (reportError || !report) {
    throw new Error('El reporte no existe.');
  }

  const { error } = await admin
    .from('reports')
    .update({
      status: decision === 'hide' ? 'actioned' : 'dismissed',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) {
    throw new Error(`No se pudo resolver el reporte: ${error.message}`);
  }

  if (decision === 'hide') {
    await admin
      .from('rooms')
      .update({ visibility: 'suspended' })
      .eq('id', report.room_id);

    await admin.from('moderation_actions').insert({
      room_id: report.room_id,
      action: 'suspend',
      notes: 'Suspendida desde la cola de moderación',
    });
  }
}
