/**
 * order_requests / order_request_items / order_request_status_history
 * data access — shared by src/pages/api/checkout.ts (insert, own-row
 * RLS) and the admin order-requests pages/routes (list/get/status
 * changes, admin-role RLS). See supabase/migrations/
 * 20260819130000_order_requests.sql for the full schema/RLS reasoning.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CheckoutSubmission } from './form-validation';

export type OrderRequestStatus =
  'new' | 'reviewing' | 'contacted' | 'approved' | 'declined' | 'completed' | 'cancelled';

export const ORDER_REQUEST_STATUSES: OrderRequestStatus[] = [
  'new',
  'reviewing',
  'contacted',
  'approved',
  'declined',
  'completed',
  'cancelled',
];

export interface OrderRequestRow {
  id: string;
  request_number: string;
  researcher_user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_line1: string;
  shipping_line2: string | null;
  shipping_city: string;
  shipping_region: string;
  shipping_postal_code: string;
  shipping_country: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  customer_notes: string | null;
  status: OrderRequestStatus;
  is_test_order: boolean;
  admin_email_sent: boolean;
  customer_email_sent: boolean;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface OrderRequestItemRow {
  id: string;
  order_request_id: string;
  product_name: string;
  product_spec: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface OrderRequestStatusHistoryRow {
  id: string;
  order_request_id: string;
  previous_status: OrderRequestStatus | null;
  new_status: OrderRequestStatus;
  changed_by: string | null;
  changed_at: string;
  note: string | null;
}

/** Inserts the order_requests row + its line items in that order — the
 * parent row must exist before RLS's order_request_items_insert_own
 * subquery-ownership check can pass for the items. Called with the
 * submitting researcher's own user-scoped client (checkout.ts) —
 * RLS (`researcher_user_id = auth.uid()`) is the real boundary, not
 * this function. Returns the inserted order so the caller can build
 * the notification emails/push event from real, saved data. */
export async function insertOrderRequest(
  client: SupabaseClient,
  input: {
    requestNumber: string;
    researcherUserId: string;
    data: CheckoutSubmission;
    isTestOrder: boolean;
  },
): Promise<OrderRequestRow> {
  const { data: order, error } = await client
    .from('order_requests')
    .insert({
      request_number: input.requestNumber,
      researcher_user_id: input.researcherUserId,
      customer_name: input.data.name,
      customer_email: input.data.email,
      customer_phone: input.data.phone || null,
      shipping_line1: input.data.address.line1,
      shipping_line2: input.data.address.line2 || null,
      shipping_city: input.data.address.city,
      shipping_region: input.data.address.region,
      shipping_postal_code: input.data.address.postalCode,
      shipping_country: input.data.address.country,
      subtotal: input.data.subtotal,
      shipping_cost: input.data.shipping,
      total: input.data.total,
      customer_notes: input.data.notes || null,
      is_test_order: input.isTestOrder,
    })
    .select('*')
    .single();
  if (error) throw error;

  const items = input.data.items.map((item) => ({
    order_request_id: order.id,
    product_name: item.name,
    product_spec: item.spec,
    quantity: item.quantity,
    unit_price: item.price,
  }));
  const { error: itemsError } = await client.from('order_request_items').insert(items);
  if (itemsError) throw itemsError;

  return order as OrderRequestRow;
}

export async function markOrderRequestEmailSent(
  client: SupabaseClient,
  orderId: string,
  field: 'admin_email_sent' | 'customer_email_sent',
): Promise<void> {
  const { error } = await client
    .from('order_requests')
    .update({ [field]: true })
    .eq('id', orderId);
  if (error) {
    console.error(`order_requests.${field} update failed:`, error.message);
  }
}

// ---------------------------------------------------------------------
// Admin read/list/status-change surface
// ---------------------------------------------------------------------
export interface OrderRequestListFilters {
  status?: OrderRequestStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'newest' | 'oldest' | 'total_desc' | 'total_asc';
  page: number;
  pageSize: number;
}

export interface OrderRequestListRow extends OrderRequestRow {
  item_count: number;
}

export async function listOrderRequestsForAdmin(
  client: SupabaseClient,
  filters: OrderRequestListFilters,
): Promise<{ rows: OrderRequestListRow[]; total: number }> {
  let query = client
    .from('order_requests')
    .select('*, order_request_items(count)', { count: 'exact' });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.dateFrom) query = query.gte('submitted_at', filters.dateFrom);
  if (filters.dateTo) query = query.lte('submitted_at', filters.dateTo);
  if (filters.search) {
    const term = filters.search.trim();
    if (term) {
      query = query.or(
        `request_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_email.ilike.%${term}%`,
      );
    }
  }

  switch (filters.sort) {
    case 'oldest':
      query = query.order('submitted_at', { ascending: true });
      break;
    case 'total_desc':
      query = query.order('total', { ascending: false });
      break;
    case 'total_asc':
      query = query.order('total', { ascending: true });
      break;
    default:
      query = query.order('submitted_at', { ascending: false });
  }

  const start = (filters.page - 1) * filters.pageSize;
  const end = start + filters.pageSize - 1;
  const { data, count, error } = await query.range(start, end);
  if (error) throw error;
  const rows = (data ?? []).map((row) => {
    const { order_request_items, ...rest } = row as OrderRequestRow & {
      order_request_items: { count: number }[];
    };
    return { ...rest, item_count: order_request_items?.[0]?.count ?? 0 };
  });
  return { rows, total: count ?? 0 };
}

export async function getOrderRequestCounts(
  client: SupabaseClient,
): Promise<Record<OrderRequestStatus, number> & { total: number }> {
  const { data, error } = await client.from('order_requests').select('status');
  if (error) throw error;
  const counts = Object.fromEntries(ORDER_REQUEST_STATUSES.map((s) => [s, 0])) as Record<
    OrderRequestStatus,
    number
  >;
  for (const row of data ?? []) {
    const status = row.status as OrderRequestStatus;
    if (status in counts) counts[status]++;
  }
  const total = (data ?? []).length;
  return { ...counts, total };
}

export interface OrderRequestDetail {
  order: OrderRequestRow;
  items: OrderRequestItemRow[];
  history: OrderRequestStatusHistoryRow[];
}

export async function getOrderRequestDetail(
  client: SupabaseClient,
  id: string,
): Promise<OrderRequestDetail | null> {
  const { data: order, error } = await client
    .from('order_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!order) return null;

  const [{ data: items, error: itemsError }, { data: history, error: historyError }] =
    await Promise.all([
      client
        .from('order_request_items')
        .select('*')
        .eq('order_request_id', id)
        .order('created_at', { ascending: true }),
      client
        .from('order_request_status_history')
        .select('*')
        .eq('order_request_id', id)
        .order('changed_at', { ascending: false }),
    ]);
  if (itemsError) throw itemsError;
  if (historyError) throw historyError;

  return {
    order: order as OrderRequestRow,
    items: (items ?? []) as OrderRequestItemRow[],
    history: (history ?? []) as OrderRequestStatusHistoryRow[],
  };
}

/** Re-fetches the current status server-side (never trusts a
 * client-supplied "previous status") before writing the update + the
 * append-only history row, both under the caller's own admin-scoped
 * JWT — RLS enforces has_min_role('admin') on both writes. */
export async function updateOrderRequestStatus(
  client: SupabaseClient,
  input: { orderId: string; newStatus: OrderRequestStatus; changedBy: string; note?: string },
): Promise<{ previousStatus: OrderRequestStatus }> {
  const { data: current, error: fetchError } = await client
    .from('order_requests')
    .select('status')
    .eq('id', input.orderId)
    .single();
  if (fetchError) throw fetchError;
  const previousStatus = current.status as OrderRequestStatus;

  const { error: updateError } = await client
    .from('order_requests')
    .update({ status: input.newStatus })
    .eq('id', input.orderId);
  if (updateError) throw updateError;

  const { error: historyError } = await client.from('order_request_status_history').insert({
    order_request_id: input.orderId,
    previous_status: previousStatus,
    new_status: input.newStatus,
    changed_by: input.changedBy,
    note: input.note || null,
  });
  if (historyError) throw historyError;

  return { previousStatus };
}
