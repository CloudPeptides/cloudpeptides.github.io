import { describe, expect, it } from 'vitest';
import {
  insertOrderRequest,
  updateOrderRequestStatus,
  type OrderRequestRow,
} from '../../src/lib/order-requests';
import type { CheckoutSubmission } from '../../src/lib/form-validation';

const SAMPLE_SUBMISSION: CheckoutSubmission = {
  name: 'Jordan Customer',
  email: 'jordan@example.com',
  phone: '555-0100',
  address: {
    line1: '1 Lab Way',
    line2: '',
    city: 'Springfield',
    region: 'IL',
    postalCode: '62701',
    country: 'US',
  },
  notes: 'Please ship discreetly.',
  items: [
    {
      productId: 'cp-s1',
      optionCode: 'SM10',
      name: 'CP-S1',
      spec: '10mg',
      quantity: 2,
      price: 89.99,
    },
    {
      productId: 'cp-t2',
      optionCode: 'TR15',
      name: 'CP-T2',
      spec: '15mg',
      quantity: 1,
      price: 129.99,
    },
  ],
  subtotal: 309.97,
  shipping: 0,
  total: 309.97,
};

/** A minimal fake Supabase client covering exactly the chains
 * src/lib/order-requests.ts calls. */
function fakeClient(opts: {
  insertedOrder?: Partial<OrderRequestRow>;
  currentStatus?: string;
  captureInserts?: { orders: unknown[]; items: unknown[]; history: unknown[] };
}) {
  const captured = opts.captureInserts ?? { orders: [], items: [], history: [] };

  const client = {
    from(table: string) {
      if (table === 'order_requests') {
        return {
          insert(row: unknown) {
            captured.orders.push(row);
            return {
              select: () => ({
                single: async () => ({
                  data: { id: 'order-1', ...opts.insertedOrder },
                  error: null,
                }),
              }),
            };
          },
          select() {
            return {
              eq: () => ({
                single: async () => ({
                  data: { status: opts.currentStatus ?? 'new' },
                  error: null,
                }),
              }),
            };
          },
          update() {
            return { eq: async () => ({ error: null }) };
          },
        };
      }
      if (table === 'order_request_items') {
        return {
          insert: async (rows: unknown[]) => {
            captured.items.push(...rows);
            return { error: null };
          },
        };
      }
      if (table === 'order_request_status_history') {
        return {
          insert: async (row: unknown) => {
            captured.history.push(row);
            return { error: null };
          },
        };
      }
      throw new Error(`unexpected table in test fake: ${table}`);
    },
  };

  return { client, captured };
}

describe('insertOrderRequest', () => {
  it('maps the checkout submission into the order_requests row exactly — never trusting anything beyond what validateCheckoutSubmission already resolved', async () => {
    const { client, captured } = fakeClient({});
    await insertOrderRequest(client as never, {
      requestNumber: 'CP-2026-0001',
      researcherUserId: 'user-1',
      data: SAMPLE_SUBMISSION,
      isTestOrder: true,
    });

    expect(captured.orders).toHaveLength(1);
    const row = captured.orders[0] as Record<string, unknown>;
    expect(row.request_number).toBe('CP-2026-0001');
    expect(row.researcher_user_id).toBe('user-1');
    expect(row.customer_name).toBe('Jordan Customer');
    expect(row.customer_email).toBe('jordan@example.com');
    expect(row.shipping_line1).toBe('1 Lab Way');
    expect(row.shipping_line2).toBeNull(); // empty string -> null, not stored as ''
    expect(row.subtotal).toBe(309.97);
    expect(row.total).toBe(309.97);
    expect(row.is_test_order).toBe(true);
  });

  it('inserts one line item per submitted item, as a price snapshot (name/spec/quantity/unit_price only)', async () => {
    const { client, captured } = fakeClient({});
    await insertOrderRequest(client as never, {
      requestNumber: 'CP-2026-0002',
      researcherUserId: 'user-2',
      data: SAMPLE_SUBMISSION,
      isTestOrder: false,
    });

    expect(captured.items).toHaveLength(2);
    expect(captured.items[0]).toMatchObject({
      order_request_id: 'order-1',
      product_name: 'CP-S1',
      product_spec: '10mg',
      quantity: 2,
      unit_price: 89.99,
    });
    expect(captured.items[1]).toMatchObject({
      order_request_id: 'order-1',
      product_name: 'CP-T2',
      product_spec: '15mg',
      quantity: 1,
      unit_price: 129.99,
    });
  });
});

describe('updateOrderRequestStatus', () => {
  it('re-fetches the current status server-side rather than trusting a client-supplied "previous status"', async () => {
    const { client, captured } = fakeClient({ currentStatus: 'reviewing' });

    const { previousStatus } = await updateOrderRequestStatus(client as never, {
      orderId: 'order-1',
      newStatus: 'approved',
      changedBy: 'admin-1',
      note: 'Looks good.',
    });

    expect(previousStatus).toBe('reviewing');
    expect(captured.history).toHaveLength(1);
    expect(captured.history[0]).toMatchObject({
      order_request_id: 'order-1',
      previous_status: 'reviewing',
      new_status: 'approved',
      changed_by: 'admin-1',
      note: 'Looks good.',
    });
  });

  it('records the acting admin, timestamp fields, and both statuses in the same append-only row', async () => {
    const { client, captured } = fakeClient({ currentStatus: 'new' });
    await updateOrderRequestStatus(client as never, {
      orderId: 'order-9',
      newStatus: 'contacted',
      changedBy: 'admin-2',
    });

    const entry = captured.history[0] as Record<string, unknown>;
    expect(entry.previous_status).toBe('new');
    expect(entry.new_status).toBe('contacted');
    expect(entry.changed_by).toBe('admin-2');
    expect(entry.note).toBeNull();
  });
});
