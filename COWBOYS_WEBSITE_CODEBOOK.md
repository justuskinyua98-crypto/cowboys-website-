# Cowboys Website Codebook (Step-by-Step + Full Code)

This file contains:
- build timeline (step-by-step)
- key git commits
- full source code snapshots (current)

---

## 1) Build Timeline

```text
79b9cc3 Initial project snapshot
b665131 Add project setup guide and env template
2aba8b7 Add section-specific placeholder images and map content
f114a18 Map team photos and improve team image framing
d1fe6e9 Mute videos by default
daf8fe1 Normalize media paths for reliable image/video loading
4942996 Fix media URL handling for images across page contexts
f4dd312 Map uploaded media across sections and add showcase videos
f81b469 Harden API handling, headers, and rate limits
2ff7b86 Polish UX: admin-only controls, toasts, and faster media loading
2fd3ec6 Add SEO metadata, sitemap, and robots setup
33130ba Add printable project build guidebook
```

## 2) Setup Commands Used

```bash
cd "/Users/justusmurerwa/Documents/cwboys website"
git init -b main
git add .
git commit -m "Initial project snapshot"
npm start
```

---

## 3) package.json

```json
{
  "name": "cowboys-group-holdings-site",
  "version": "1.0.0",
  "private": true,
  "description": "Cowboys Group Holdings website with lightweight backend",
  "scripts": {
    "start": "node server.js"
  }
}
```

## 4) server.js

```js
const fs = require('fs');
const fsp = require('fs/promises');
const http = require('http');
const path = require('path');
const { URL } = require('url');
const dns = require('dns');

const ROOT = process.cwd();
const CONTENT_PATH = path.join(ROOT, 'data', 'content.json');
const PAYMENTS_PATH = path.join(ROOT, 'data', 'payments.json');
const ADMIN_KEY = process.env.ADMIN_KEY || 'change-me-admin-key';
const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '127.0.0.1';
const BODY_LIMIT_BYTES = Number(process.env.BODY_LIMIT_BYTES || 12_000_000);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

const M_PESA = {
  baseUrl: process.env.M_PESA_BASE_URL || 'https://sandbox.safaricom.co.ke',
  consumerKey: process.env.M_PESA_CONSUMER_KEY || '',
  consumerSecret: process.env.M_PESA_CONSUMER_SECRET || '',
  shortcode: process.env.M_PESA_SHORTCODE || '',
  passkey: process.env.M_PESA_PASSKEY || '',
  callbackUrl: process.env.M_PESA_CALLBACK_URL || ''
};
const MANUAL_PAYMENT = {
  tillNumber: process.env.MANUAL_TILL_NUMBER || '',
  payeeName: process.env.MANUAL_PAYEE_NAME || 'Cowboys Group Holdings'
};
const PAYMENT_POLICY = {
  mpesaPendingTimeoutMin: Number(process.env.MPESA_PENDING_TIMEOUT_MIN || 20),
  manualPendingTimeoutHours: Number(process.env.MANUAL_PENDING_TIMEOUT_HOURS || 48)
};

const RATE_LIMIT_CONFIG = {
  checkout: { windowMs: 60_000, max: 20 },
  confirmManual: { windowMs: 60_000, max: 30 },
  mediaUpload: { windowMs: 60_000, max: 40 }
};
const RATE_LIMIT_STORE = new Map();

// Some networks resolve dual-stack hosts but only allow IPv4 egress reliably.
dns.setDefaultResultOrder('ipv4first');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime'
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function errInfo(err) {
  return {
    message: err?.message || 'Unknown error',
    code: err?.code || err?.cause?.code || null,
    cause: err?.cause?.message || null
  };
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let data = '';

    const fail = (err) => {
      if (settled) return;
      settled = true;
      req.destroy();
      reject(err);
    };

    const done = () => {
      if (settled) return;
      settled = true;
      resolve(data);
    };

    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > BODY_LIMIT_BYTES) fail(new Error('Payload too large'));
    });
    req.on('end', done);
    req.on('error', fail);
  });
}

function parseJson(raw, fallback = null) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function readContent() {
  const raw = await fsp.readFile(CONTENT_PATH, 'utf8');
  return JSON.parse(raw);
}

async function writeContent(content) {
  await fsp.writeFile(CONTENT_PATH, JSON.stringify(content, null, 2), 'utf8');
}

async function readPayments() {
  try {
    const raw = await fsp.readFile(PAYMENTS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.orders)) return { orders: [] };
    return parsed;
  } catch {
    return { orders: [] };
  }
}

async function writePayments(payments) {
  await fsp.writeFile(PAYMENTS_PATH, JSON.stringify(payments, null, 2), 'utf8');
}

function isAuthed(req) {
  return req.headers['x-admin-key'] === ADMIN_KEY;
}

function safeJoin(base, relativePath) {
  const normalized = path.normalize(relativePath).replace(/^([/\\])+/, '');
  const full = path.join(base, normalized);
  if (!full.startsWith(base)) return null;
  return full;
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').trim();
  if (forwarded) return forwarded.split(',')[0].trim();
  return String(req.socket?.remoteAddress || 'unknown');
}

function hitRateLimit(req, key, config) {
  const now = Date.now();
  const bucketKey = `${key}:${getClientIp(req)}`;
  const existing = RATE_LIMIT_STORE.get(bucketKey);

  if (!existing || now - existing.startedAt > config.windowMs) {
    RATE_LIMIT_STORE.set(bucketKey, { count: 1, startedAt: now });
    return { limited: false, retryAfterSec: 0 };
  }

  existing.count += 1;
  RATE_LIMIT_STORE.set(bucketKey, existing);

  if (existing.count <= config.max) return { limited: false, retryAfterSec: 0 };

  const retryMs = Math.max(1_000, config.windowMs - (now - existing.startedAt));
  return { limited: true, retryAfterSec: Math.ceil(retryMs / 1_000) };
}

function cacheControlFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'no-cache';
  if (ext === '.json') return 'no-store';
  return 'public, max-age=86400';
}

function isMpesaConfigured() {
  return Boolean(
    M_PESA.consumerKey &&
    M_PESA.consumerSecret &&
    M_PESA.shortcode &&
    M_PESA.passkey &&
    M_PESA.callbackUrl
  );
}

function paymentMethods() {
  return isMpesaConfigured() ? ['manual', 'mpesa'] : ['manual'];
}

function normalizeKenyanPhone(input) {
  const raw = String(input || '').replace(/\s+/g, '').replace(/-/g, '');
  if (!raw) return '';
  if (raw.startsWith('+254')) return `254${raw.slice(4)}`;
  if (raw.startsWith('254')) return raw;
  if (raw.startsWith('07') && raw.length === 10) return `254${raw.slice(1)}`;
  if (raw.startsWith('01') && raw.length === 10) return `254${raw.slice(1)}`;
  return raw;
}

function mpesaTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function sanitizeItem(rawItem) {
  const name = String(rawItem?.name || 'Item').trim().slice(0, 140);
  const rawKind = String(rawItem?.kind || 'product').trim().toLowerCase();
  const kind = ['product', 'ticket', 'livestock'].includes(rawKind) ? rawKind : 'product';
  const qty = Math.max(1, Number(rawItem?.qty || 1));
  const unitPrice = Math.max(0, Math.round(Number(rawItem?.price || 0)));
  return {
    name: name || 'Item',
    kind,
    qty,
    price: unitPrice,
    total: unitPrice * qty
  };
}

function laneFromKind(kind) {
  if (kind === 'ticket') return 'tickets';
  if (kind === 'livestock') return 'livestock';
  return 'apparel';
}

function makeTicketCode(orderId, index) {
  const base = String(orderId || '').replace(/^order-/, '').slice(-6);
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CGH-TKT-${base}-${index + 1}-${rnd}`;
}

function buildTicketsFromItems(orderId, items, status) {
  const tickets = [];
  items.forEach((item, index) => {
    if (item.kind !== 'ticket') return;
    tickets.push({
      id: `${orderId}-ticket-${index + 1}`,
      code: makeTicketCode(orderId, index),
      event_name: item.name,
      status: status === 'paid' ? 'issued' : 'pending_payment'
    });
  });
  return tickets;
}

function makeReceiptNumber(order) {
  const date = new Date(order.created_at || Date.now());
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const suffix = String(order.id || '').replace(/^order-/, '').slice(-6);
  return `CGH-${y}${m}${d}-${suffix}`;
}

function orderToReceipt(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = items.reduce((sum, item) => sum + Number(item.total || item.price || 0), 0);
  return {
    receipt_number: makeReceiptNumber(order),
    order_id: order.id,
    created_at: order.created_at,
    method: order.method,
    status: order.status,
    phone: order.phone,
    amount_kes: order.amount_kes,
    subtotal_kes: subtotal,
    transaction_code: order.manual_transaction_code || null,
    paid_at: order.paid_at || null,
    items,
    tickets: Array.isArray(order.tickets) ? order.tickets : []
  };
}

function getMetadataValue(metadata, key) {
  if (!Array.isArray(metadata)) return null;
  const found = metadata.find((x) => x?.Name === key);
  return found ? found.Value : null;
}

function isOrderExpired(order) {
  const createdAtMs = Date.parse(order?.created_at || '');
  if (!Number.isFinite(createdAtMs)) return false;
  const ageMs = Date.now() - createdAtMs;
  if (order.status === 'pending') {
    return ageMs > PAYMENT_POLICY.mpesaPendingTimeoutMin * 60 * 1000;
  }
  if (order.status === 'awaiting_manual_confirmation') {
    return ageMs > PAYMENT_POLICY.manualPendingTimeoutHours * 60 * 60 * 1000;
  }
  return false;
}

function applyAutoExpiry(order) {
  if (!order || !isOrderExpired(order)) return false;
  order.status = 'expired';
  if (order.method === 'mpesa') {
    order.result_desc = `Payment window expired after ${PAYMENT_POLICY.mpesaPendingTimeoutMin} minutes.`;
  } else {
    order.result_desc = `Manual payment window expired after ${PAYMENT_POLICY.manualPendingTimeoutHours} hours.`;
  }
  return true;
}

function applyExpiryToAllOrders(payments) {
  let changed = false;
  for (const order of payments.orders || []) {
    changed = applyAutoExpiry(order) || changed;
  }
  return changed;
}

async function getMpesaAccessToken() {
  const credentials = Buffer.from(`${M_PESA.consumerKey}:${M_PESA.consumerSecret}`).toString('base64');
  let response;
  try {
    response = await fetch(`${M_PESA.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${credentials}` }
    });
  } catch (err) {
    const info = errInfo(err);
    throw new Error(`M-Pesa OAuth network failure: ${JSON.stringify(info)}`);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`M-Pesa OAuth failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  if (!data.access_token) throw new Error('No M-Pesa access token returned');
  return data.access_token;
}

async function initiateMpesaStk({ amountKes, phone, orderId }) {
  const token = await getMpesaAccessToken();
  const timestamp = mpesaTimestamp();
  const password = Buffer.from(`${M_PESA.shortcode}${M_PESA.passkey}${timestamp}`).toString('base64');
  const phoneNumber = normalizeKenyanPhone(phone);

  const payload = {
    BusinessShortCode: M_PESA.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.max(1, Math.round(Number(amountKes))),
    PartyA: phoneNumber,
    PartyB: M_PESA.shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: M_PESA.callbackUrl,
    AccountReference: orderId,
    TransactionDesc: 'Cowboys Group Holdings Checkout'
  };

  let response;
  try {
    response = await fetch(`${M_PESA.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    const info = errInfo(err);
    throw new Error(`M-Pesa STK network failure: ${JSON.stringify(info)}`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`M-Pesa STK failed: ${response.status} ${JSON.stringify(data)}`);
  }

  if (data.ResponseCode !== '0') {
    throw new Error(`M-Pesa STK rejected: ${JSON.stringify(data)}`);
  }

  return data;
}

async function handleApi(req, res, urlObj) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      ...SECURITY_HEADERS,
      'Cache-Control': 'no-store',
      Allow: 'GET,POST,PUT,OPTIONS'
    });
    res.end();
    return true;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      now: new Date().toISOString(),
      uptime_seconds: Math.round(process.uptime())
    });
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/content') {
    try {
      const content = await readContent();
      return sendJson(res, 200, content);
    } catch (err) {
      return sendJson(res, 500, { error: 'Failed to read content', detail: err.message });
    }
  }

  if (req.method === 'PUT' && urlObj.pathname === '/api/content') {
    if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' });

    try {
      const raw = await readBody(req);
      const next = parseJson(raw);
      if (!next || typeof next !== 'object') {
        return sendJson(res, 400, { error: 'Invalid JSON body.' });
      }
      await writeContent(next);
      return sendJson(res, 200, { ok: true });
    } catch (err) {
      return sendJson(res, 400, { error: 'Invalid content payload', detail: err.message });
    }
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/payments/config') {
    return sendJson(res, 200, {
      mpesa_enabled: isMpesaConfigured(),
      methods: paymentMethods(),
      manual: {
        enabled: true,
        till_number: MANUAL_PAYMENT.tillNumber,
        payee_name: MANUAL_PAYMENT.payeeName
      }
    });
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/payments/checkout') {
    const rate = hitRateLimit(req, 'checkout', RATE_LIMIT_CONFIG.checkout);
    if (rate.limited) {
      res.setHeader('Retry-After', String(rate.retryAfterSec));
      return sendJson(res, 429, { error: 'Too many checkout attempts. Please retry shortly.' });
    }

    try {
      const raw = await readBody(req);
      const payload = parseJson(raw);
      if (!payload || typeof payload !== 'object') {
        return sendJson(res, 400, { error: 'Invalid JSON body.' });
      }

      const method = String(payload.method || 'manual').toLowerCase();
      const amountKes = Number(payload.amount_kes || 0);
      const phone = normalizeKenyanPhone(payload.phone || '');
      const items = (Array.isArray(payload.items) ? payload.items : []).map(sanitizeItem);
      const orderId = `order-${Date.now()}`;
      const lanes = [...new Set(items.map((item) => laneFromKind(item.kind)))];

      if (!Number.isFinite(amountKes) || amountKes < 1) {
        return sendJson(res, 400, { error: 'Amount must be at least KES 1.' });
      }
      if (!items.length) {
        return sendJson(res, 400, { error: 'At least one item is required.' });
      }
      if (lanes.length > 1) {
        return sendJson(res, 400, {
          error: 'Do not mix product types in one order. Checkout apparel, tickets, and livestock separately.'
        });
      }
      if (!phone || !/^254\d{9}$/.test(phone)) {
        return sendJson(res, 400, { error: 'Use a valid Kenyan phone format like 254712345678.' });
      }
      if (!paymentMethods().includes(method)) {
        return sendJson(res, 400, { error: 'Invalid payment method.' });
      }
      if (method === 'mpesa' && !isMpesaConfigured()) {
        return sendJson(res, 503, { error: 'M-Pesa is not configured on server.' });
      }

      const payments = await readPayments();
      if (applyExpiryToAllOrders(payments)) {
        await writePayments(payments);
      }
      const order = {
        id: orderId,
        method,
        status: method === 'manual' ? 'awaiting_manual_confirmation' : 'pending',
        amount_kes: Math.round(amountKes),
        phone,
        items,
        lane: lanes[0],
        created_at: new Date().toISOString(),
        mpesa_checkout_request_id: null,
        mpesa_merchant_request_id: null,
        result_code: null,
        result_desc: null,
        paid_at: null,
        manual_transaction_code: null,
        tickets: []
      };
      order.tickets = buildTicketsFromItems(order.id, order.items, order.status);

      payments.orders.unshift(order);
      await writePayments(payments);

      if (method === 'manual') {
        const till = MANUAL_PAYMENT.tillNumber || 'your till number';
        order.result_desc = `Manual payment selected. Send KES ${order.amount_kes} to Till ${till}, then share M-Pesa transaction code with support for confirmation.`;
        await writePayments(payments);
        return sendJson(res, 200, {
          ok: true,
          order_id: orderId,
          status: order.status,
          message: order.result_desc,
          manual: {
            till_number: MANUAL_PAYMENT.tillNumber,
            payee_name: MANUAL_PAYMENT.payeeName
          }
        });
      }

      const stk = await initiateMpesaStk({ amountKes, phone, orderId });

      order.mpesa_checkout_request_id = stk.CheckoutRequestID || null;
      order.mpesa_merchant_request_id = stk.MerchantRequestID || null;
      order.result_desc = stk.CustomerMessage || stk.ResponseDescription || 'STK sent';
      await writePayments(payments);

      return sendJson(res, 200, {
        ok: true,
        order_id: orderId,
        status: order.status,
        message: order.result_desc
      });
    } catch (err) {
      return sendJson(res, 500, { error: 'Checkout initiation failed', detail: err.message });
    }
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/payments/status') {
    const orderId = String(urlObj.searchParams.get('order_id') || '').trim();
    if (!orderId) return sendJson(res, 400, { error: 'order_id is required' });

    const payments = await readPayments();
    if (applyExpiryToAllOrders(payments)) {
      await writePayments(payments);
    }
    const order = payments.orders.find((x) => x.id === orderId);
    if (!order) return sendJson(res, 404, { error: 'Order not found' });

    return sendJson(res, 200, {
      ok: true,
      order_id: order.id,
      method: order.method,
      lane: order.lane || null,
      status: order.status,
      amount_kes: order.amount_kes,
      result_desc: order.result_desc,
      paid_at: order.paid_at
    });
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/payments/receipt') {
    const orderId = String(urlObj.searchParams.get('order_id') || '').trim();
    if (!orderId) return sendJson(res, 400, { error: 'order_id is required' });

    const payments = await readPayments();
    if (applyExpiryToAllOrders(payments)) {
      await writePayments(payments);
    }
    const order = payments.orders.find((x) => x.id === orderId);
    if (!order) return sendJson(res, 404, { error: 'Order not found' });
    if (order.status !== 'paid') {
      return sendJson(res, 409, { error: 'Payment not yet confirmed. Receipt is available after payment confirmation.' });
    }

    return sendJson(res, 200, { ok: true, receipt: orderToReceipt(order) });
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/payments/confirm-manual') {
    const rate = hitRateLimit(req, 'confirm-manual', RATE_LIMIT_CONFIG.confirmManual);
    if (rate.limited) {
      res.setHeader('Retry-After', String(rate.retryAfterSec));
      return sendJson(res, 429, { error: 'Too many confirmation attempts. Please retry shortly.' });
    }

    if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' });
    try {
      const raw = await readBody(req);
      const payload = parseJson(raw || '{}', {});
      const orderId = String(payload.order_id || '').trim();
      const transactionCode = String(payload.transaction_code || '').trim().toUpperCase();
      if (!orderId) return sendJson(res, 400, { error: 'order_id is required.' });
      if (!transactionCode) return sendJson(res, 400, { error: 'transaction_code is required.' });

      const payments = await readPayments();
      if (applyExpiryToAllOrders(payments)) {
        await writePayments(payments);
      }
      const order = payments.orders.find((x) => x.id === orderId);
      if (!order) return sendJson(res, 404, { error: 'Order not found.' });
      if (order.method !== 'manual') return sendJson(res, 400, { error: 'Order is not manual payment.' });
      if (order.status === 'paid') return sendJson(res, 409, { error: 'Order is already marked paid.' });
      if (order.status === 'expired') return sendJson(res, 409, { error: 'Order has expired and cannot be confirmed.' });
      if (order.status === 'failed') return sendJson(res, 409, { error: 'Order is failed and cannot be confirmed.' });

      order.status = 'paid';
      order.paid_at = new Date().toISOString();
      order.manual_transaction_code = transactionCode;
      order.result_desc = `Manual payment confirmed. Transaction ${transactionCode}.`;
      if (Array.isArray(order.tickets)) {
        order.tickets = order.tickets.map((t) => ({ ...t, status: 'issued' }));
      }
      await writePayments(payments);

      return sendJson(res, 200, { ok: true, order_id: order.id, status: order.status });
    } catch (err) {
      return sendJson(res, 400, { error: 'Invalid confirmation payload', detail: err.message });
    }
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/payments/orders') {
    if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' });
    const laneFilter = String(urlObj.searchParams.get('lane') || '').trim();
    const statusFilter = String(urlObj.searchParams.get('status') || '').trim();
    const limit = Math.max(1, Math.min(200, Number(urlObj.searchParams.get('limit') || 50)));

    const payments = await readPayments();
    if (applyExpiryToAllOrders(payments)) {
      await writePayments(payments);
    }

    let orders = Array.isArray(payments.orders) ? payments.orders.slice() : [];
    if (laneFilter) orders = orders.filter((x) => String(x.lane || '') === laneFilter);
    if (statusFilter) orders = orders.filter((x) => String(x.status || '') === statusFilter);
    orders = orders.slice(0, limit);

    return sendJson(res, 200, {
      ok: true,
      count: orders.length,
      orders: orders.map((o) => ({
        id: o.id,
        lane: o.lane || null,
        method: o.method,
        status: o.status,
        amount_kes: o.amount_kes,
        phone: o.phone,
        created_at: o.created_at,
        paid_at: o.paid_at,
        result_desc: o.result_desc,
        transaction_code: o.manual_transaction_code || null
      }))
    });
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/payments/mpesa/callback') {
    try {
      const raw = await readBody(req);
      const payload = parseJson(raw || '{}', {});
      const callback = payload?.Body?.stkCallback || {};

      const checkoutRequestId = callback.CheckoutRequestID;
      const resultCode = Number(callback.ResultCode);
      const resultDesc = String(callback.ResultDesc || '');
      if (!checkoutRequestId) {
        return sendJson(res, 200, { ResultCode: 0, ResultDesc: 'Accepted' });
      }

      const payments = await readPayments();
      const order = payments.orders.find((x) => x.mpesa_checkout_request_id === checkoutRequestId);
      if (!order) {
        return sendJson(res, 200, { ResultCode: 0, ResultDesc: 'Accepted' });
      }
      if (order.method !== 'mpesa') {
        return sendJson(res, 200, { ResultCode: 0, ResultDesc: 'Accepted' });
      }
      if (order.status === 'paid' && resultCode === 0) {
        return sendJson(res, 200, { ResultCode: 0, ResultDesc: 'Accepted' });
      }
      if (applyAutoExpiry(order)) {
        await writePayments(payments);
        return sendJson(res, 200, { ResultCode: 0, ResultDesc: 'Accepted' });
      }

      order.result_code = resultCode;
      order.result_desc = resultDesc;
      order.callback_received_at = new Date().toISOString();

      if (resultCode === 0) {
        const metadata = callback.CallbackMetadata?.Item || [];
        const amountValue = Number(getMetadataValue(metadata, 'Amount'));
        const phoneValue = normalizeKenyanPhone(getMetadataValue(metadata, 'PhoneNumber') || '');
        const mpesaCode = String(getMetadataValue(metadata, 'MpesaReceiptNumber') || '').trim().toUpperCase();
        const amountMatches = Number.isFinite(amountValue) && Number(amountValue) === Number(order.amount_kes);
        const phoneMatches = !phoneValue || phoneValue === order.phone;

        if (!amountMatches || !phoneMatches) {
          order.status = 'flagged';
          order.result_desc = 'Payment callback mismatch detected. Order flagged for review.';
        } else {
          order.status = 'paid';
          order.paid_at = new Date().toISOString();
          order.manual_transaction_code = mpesaCode || order.manual_transaction_code || null;
          if (Array.isArray(order.tickets)) {
            order.tickets = order.tickets.map((t) => ({ ...t, status: 'issued' }));
          }
        }
      } else {
        order.status = 'failed';
      }
      await writePayments(payments);

      return sendJson(res, 200, { ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (err) {
      return sendJson(res, 400, { ResultCode: 1, ResultDesc: `Callback parse failed: ${err.message}` });
    }
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/media') {
    const rate = hitRateLimit(req, 'media-upload', RATE_LIMIT_CONFIG.mediaUpload);
    if (rate.limited) {
      res.setHeader('Retry-After', String(rate.retryAfterSec));
      return sendJson(res, 429, { error: 'Too many upload requests. Please retry shortly.' });
    }

    if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' });

    try {
      const raw = await readBody(req);
      const payload = parseJson(raw);
      if (!payload || typeof payload !== 'object') {
        return sendJson(res, 400, { error: 'Invalid JSON body.' });
      }
      const fileName = String(payload.filename || '').trim();
      const base64Data = String(payload.base64 || '').trim();
      const folder = String(payload.folder || 'outfits').trim();

      if (!fileName || !base64Data) {
        return sendJson(res, 400, { error: 'filename and base64 are required' });
      }

      const targetFolder = safeJoin(path.join(ROOT, 'assets'), folder);
      if (!targetFolder) return sendJson(res, 400, { error: 'Invalid folder path' });

      await fsp.mkdir(targetFolder, { recursive: true });

      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fullPath = safeJoin(targetFolder, safeName);
      if (!fullPath) return sendJson(res, 400, { error: 'Invalid file name' });

      const noPrefix = base64Data.includes(',') ? base64Data.split(',').pop() : base64Data;
      const buffer = Buffer.from(noPrefix, 'base64');
      await fsp.writeFile(fullPath, buffer);

      const rel = path.relative(ROOT, fullPath).replaceAll(path.sep, '/');
      return sendJson(res, 200, { ok: true, path: rel });
    } catch (err) {
      return sendJson(res, 400, { error: 'Invalid media payload', detail: err.message });
    }
  }

  return false;
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(filePath);

  stream.on('open', () => {
    res.writeHead(200, {
      ...SECURITY_HEADERS,
      'Cache-Control': cacheControlFor(filePath),
      'Content-Type': contentType
    });
  });

  stream.on('error', () => {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  });

  stream.pipe(res);
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url || '/', `http://${req.headers.host}`);

  if (urlObj.pathname.startsWith('/api/')) {
    const handled = await handleApi(req, res, urlObj);
    if (handled !== false) return;
    return sendJson(res, 404, { error: 'API route not found' });
  }

  const requestPath = urlObj.pathname === '/' ? '/index.html' : urlObj.pathname;
  const target = safeJoin(ROOT, requestPath);

  if (!target) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  try {
    const stat = await fsp.stat(target);
    if (stat.isDirectory()) {
      return serveFile(res, path.join(target, 'index.html'));
    }
    return serveFile(res, target);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(PORT, HOST, async () => {
  await fsp.mkdir(path.join(ROOT, 'data'), { recursive: true });
  try {
    await fsp.access(PAYMENTS_PATH);
  } catch {
    await writePayments({ orders: [] });
  }

  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log('Set ADMIN_KEY and M-PESA env vars before production use.');
});
```

## 5) script.js

```js
const PLACEHOLDER_IMAGE = "assets/logo-mark.svg";
const OUTFIT_KEY = "cgh_outfits_v1";

const defaultContent = {
  socials: [
    { id: "social-1", platform: "Instagram", url: "https://instagram.com/", handle: "@cowboysgroup" },
    { id: "social-2", platform: "TikTok", url: "https://tiktok.com/@", handle: "@cowboysgroup" },
    { id: "social-3", platform: "Facebook", url: "https://facebook.com/", handle: "Cowboys Group Holdings" },
    { id: "social-4", platform: "YouTube", url: "https://youtube.com/@", handle: "@cowboysgroup" },
    { id: "social-5", platform: "WhatsApp", url: "https://wa.me/254793791623", handle: "+254 793 791 623" }
  ],
  team: [
    { id: "team-1", name: "Leadership Desk", role: "Holding Company Coordination", photo: PLACEHOLDER_IMAGE, bio: "Coordinating ventures, partnerships, and community programs across the ecosystem." },
    { id: "team-2", name: "Events & Experience Team", role: "Events, Tickets, Artist Bookings", photo: PLACEHOLDER_IMAGE, bio: "Running western-themed events, festivals, and family experiences with clear operations." },
    { id: "team-3", name: "Commerce & Marketplace Team", role: "Apparel, Livestock, Decor", photo: PLACEHOLDER_IMAGE, bio: "Managing stock quality, product listings, and customer order fulfillment." }
  ],
  videos: [
    { title: "Ranch Life Preview", src: "", poster: PLACEHOLDER_IMAGE, category: "ranch" },
    { title: "Events Highlight Reel", src: "", poster: PLACEHOLDER_IMAGE, category: "events" }
  ],
  outfits: [
    { id: "adult-1", collection: "adults", name: "Cowboys Heritage Denim Shirt", price: 4200, image: PLACEHOLDER_IMAGE, description: "Premium western-inspired adult fit" },
    { id: "adult-2", collection: "adults", name: "Ranch Work Jacket", price: 6800, image: PLACEHOLDER_IMAGE, description: "All-season rugged jacket for ranch and city wear" },
    { id: "kids-1", collection: "kids", name: "Little Rider Weekend Set", price: 3200, image: PLACEHOLDER_IMAGE, description: "Kids-friendly fabric with playful western styling" },
    { id: "kids-2", collection: "kids", name: "Kids Rodeo Hoodie", price: 2800, image: PLACEHOLDER_IMAGE, description: "Warm and durable hoodie for active children" },
    { id: "acc-1", collection: "accessories", name: "Heritage Leather Belt", price: 3500, image: PLACEHOLDER_IMAGE, description: "Hand-finished leather belt" },
    { id: "acc-2", collection: "accessories", name: "Bull Horn Signature Cap", price: 1800, image: PLACEHOLDER_IMAGE, description: "Daily wear cap with culture-forward mark" }
  ],
  events: [
    { id: "event-1", title: "Nairobi Ranch Night Experience", date: "2026-12-18", venue: "Karen, Nairobi", performers: "Live Band + DJ + Dance Crew", ticket_kes: 2000, poster: "" },
    { id: "event-2", title: "Western Family Sunday", date: "2026-12-27", venue: "Naivasha Grounds", performers: "Kids Dance, MC, Live Entertainment", ticket_kes: 1200, poster: "" },
    { id: "event-3", title: "Classic Cars & Cowboys Showcase", date: "2026-11-07", venue: "Nairobi Motor Hub", performers: "Car Clubs, Motorcycle Clubs, Guest Artists", ticket_kes: 1500, poster: "" }
  ],
  livestock: [
    { id: "stock-1", name: "Goat - Premium Festive", weight_kg: 38, rate_per_kg_kes: 680, status: "Available", image: "" },
    { id: "stock-2", name: "Goat - Standard Select", weight_kg: 31, rate_per_kg_kes: 620, status: "Available", image: "" },
    { id: "stock-3", name: "Cattle - Prime Butchery Grade", weight_kg: 290, rate_per_kg_kes: 470, status: "Limited", image: "" }
  ],
  decor: [
    { id: "decor-1", name: "Rustic Event Decor Package", category: "Service", price_kes: 25000, description: "Full setup for weddings, launches, private parties, and western-themed events.", image: "" },
    { id: "decor-2", name: "Fresh Flower Ceremony Bundle", category: "Fresh Flowers", price_kes: 8500, description: "Fresh flower curation for events and home gifting.", image: "" },
    { id: "decor-3", name: "Rustic Home Accent Set", category: "Rustic Decor", price_kes: 6200, description: "Handpicked pieces for homes, restaurants, and lodge interiors.", image: "" }
  ],
  descriptions: [
    { id: "desc-1", title: "Community-First Ecosystem", text: "Built with creators, ranchers, families, and partners for shared growth and trusted collaboration." },
    { id: "desc-2", title: "Kids Corner Commitment", text: "A safe and joyful experience for children through family events, age-appropriate fashion, and talent growth pathways." },
    { id: "desc-3", title: "Inclusive Kenya Commitment", text: "Open to youth, adults, PWD communities, small businesses, and large institutions across Kenya and beyond." }
  ],
  partners: [
    { id: "partner-1", name: "Ranchers & Livestock Network", email: "partnerships@cowboysgroupholdings.co.ke", description: "Seasonal goat and cattle collaboration for festive commerce." },
    { id: "partner-2", name: "Events & Artist Collaboration Desk", email: "events@cowboysgroupholdings.co.ke", description: "Talent booking, event production, and entertainment partnerships." },
    { id: "partner-3", name: "Foundation Partnerships Unit", email: "foundation@cowboysgroupholdings.co.ke", description: "MoUs, donor partnerships, and social impact programs." }
  ],
  reviews: [
    { id: "review-1", name: "Community Member", text: "The platform is clear, welcoming, and truly reflects Kenyan culture.", rating: 5 },
    { id: "review-2", name: "Event Client", text: "Ticketing, decor, and communication were smooth from start to finish.", rating: 5 },
    { id: "review-3", name: "Family Shopper", text: "Kids and adult apparel sections are easy to browse and very practical.", rating: 5 }
  ]
};

const state = {
  cart: [],
  content: structuredClone(defaultContent),
  lastOrderId: "",
  lastReceipt: null
};

const el = {
  year: document.getElementById("year"),
  navToggle: document.querySelector(".menu-toggle"),
  nav: document.querySelector(".main-nav"),
  adminKey: document.getElementById("admin-key"),
  cartCount: document.getElementById("cart-count"),
  cartLane: document.getElementById("cart-lane"),
  cartItems: document.getElementById("cart-items"),
  cartTotal: document.getElementById("cart-total"),
  clearCartBtn: document.getElementById("clear-cart-btn"),
  checkoutBtn: document.getElementById("checkout-btn"),
  downloadReceiptBtn: document.getElementById("download-receipt-btn"),
  downloadTicketBtn: document.getElementById("download-ticket-btn"),
  paymentMethod: document.getElementById("payment-method"),
  paymentPhone: document.getElementById("payment-phone"),
  paymentStatus: document.getElementById("payment-status"),
  paymentHint: document.getElementById("payment-hint"),
  confirmOrderId: document.getElementById("confirm-order-id"),
  confirmTxCode: document.getElementById("confirm-tx-code"),
  confirmAdminKey: document.getElementById("confirm-admin-key"),
  confirmPaymentBtn: document.getElementById("confirm-payment-btn"),
  galleries: {
    adults: document.getElementById("gallery-adults"),
    kids: document.getElementById("gallery-kids"),
    accessories: document.getElementById("gallery-accessories")
  },
  eventsGrid: document.getElementById("events-grid"),
  livestockGrid: document.getElementById("livestock-grid"),
  decorGrid: document.getElementById("decor-grid"),
  videoGallery: document.getElementById("video-gallery"),
  teamGrid: document.getElementById("team-grid"),
  socialsGrid: document.getElementById("social-links"),
  descriptionsGrid: document.getElementById("description-grid"),
  partnersGrid: document.getElementById("partners-grid"),
  reviewsGrid: document.getElementById("reviews-grid"),
  outfitForm: document.getElementById("outfit-form"),
  resetOutfitsBtn: document.getElementById("reset-outfits"),
  saveOutfitsBtn: document.getElementById("save-backend"),
  eventForm: document.getElementById("event-form"),
  saveEventsBtn: document.getElementById("save-events-backend"),
  livestockForm: document.getElementById("livestock-form"),
  saveLivestockBtn: document.getElementById("save-livestock-backend"),
  decorForm: document.getElementById("decor-form"),
  saveDecorBtn: document.getElementById("save-decor-backend"),
  teamForm: document.getElementById("team-form"),
  saveTeamBtn: document.getElementById("save-team-backend"),
  socialForm: document.getElementById("social-form"),
  saveSocialsBtn: document.getElementById("save-socials-backend"),
  descriptionForm: document.getElementById("description-form"),
  saveDescriptionsBtn: document.getElementById("save-descriptions-backend"),
  partnerFormAdmin: document.getElementById("partner-form-admin"),
  savePartnersBtn: document.getElementById("save-partners-backend"),
  reviewForm: document.getElementById("review-form"),
  saveReviewsBtn: document.getElementById("save-reviews-backend"),
  uploadForm: document.getElementById("media-upload-form"),
  uploadResult: document.getElementById("upload-result"),
  artistInquiry: document.getElementById("artist-inquiry"),
  donorForm: document.getElementById("partner-form")
};

function formatKes(value) {
  return `KES ${Number(value || 0).toLocaleString("en-KE")}`;
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function adminKey() {
  return (el.adminKey?.value || "").trim();
}

function notify(msg) {
  alert(msg);
}

function isAdminMode() {
  return Boolean(adminKey());
}

function adminOnly(html) {
  return isAdminMode() ? html : "";
}

function toast(message, tone = "info") {
  const id = "app-toast";
  let node = document.getElementById(id);
  if (!node) {
    node = document.createElement("div");
    node.id = id;
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    document.body.appendChild(node);
  }
  node.textContent = message;
  node.className = `app-toast show ${tone}`;
  window.clearTimeout(toast._timer);
  toast._timer = window.setTimeout(() => {
    const liveNode = document.getElementById(id);
    if (liveNode) liveNode.classList.remove("show");
  }, 2800);
}

function mediaSrc(path) {
  const raw = String(path || "").trim();
  if (!raw) return PLACEHOLDER_IMAGE;
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  return encodeURI(raw.replace(/\\/g, "/").replace(/^\.?\//, ""));
}

function setPaymentStatus(msg) {
  if (el.paymentStatus) el.paymentStatus.textContent = msg;
}

function setPaymentHint(msg) {
  if (el.paymentHint) el.paymentHint.textContent = msg;
}

function laneFromKind(kind) {
  if (kind === "ticket") return "Tickets";
  if (kind === "livestock") return "Livestock";
  return "Apparel";
}

function cartLaneName() {
  if (!state.cart.length) return "None";
  return laneFromKind(state.cart[0].kind || "product");
}

function addItemToCart(nextItem) {
  const nextLane = laneFromKind(nextItem.kind || "product");
  if (state.cart.length) {
    const currentLane = laneFromKind(state.cart[0].kind || "product");
    if (currentLane !== nextLane) {
      notify(`Please complete or clear the ${currentLane} cart first. ${nextLane} must be checked out separately.`);
      return false;
    }
  }
  state.cart.push(nextItem);
  renderCart();
  return true;
}

function safeFilePart(value) {
  return String(value || "order").replace(/[^a-zA-Z0-9_-]/g, "_");
}

function downloadTextFile(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatDateTime(value) {
  if (!value) return "N/A";
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? String(value) : dt.toLocaleString("en-KE");
}

function buildReceiptHtml(receipt) {
  const rows = (receipt.items || []).map((item) => `
    <tr>
      <td>${item.name || "Item"}</td>
      <td>${item.kind || "product"}</td>
      <td>${item.qty || 1}</td>
      <td>${formatKes(item.price || 0)}</td>
      <td>${formatKes(item.total || item.price || 0)}</td>
    </tr>
  `).join("");
  const tickets = (receipt.tickets || []).length
    ? `<h3>Ticket Codes</h3><ul>${receipt.tickets.map((t) => `<li>${t.event_name} - ${t.code} (${t.status})</li>`).join("")}</ul>`
    : "<p>No tickets in this order.</p>";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${receipt.receipt_number}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f7f2e8; }
  </style>
</head>
<body>
  <h1>Cowboys Group Holdings</h1>
  <p><strong>Receipt:</strong> ${receipt.receipt_number}</p>
  <p><strong>Order ID:</strong> ${receipt.order_id}</p>
  <p><strong>Status:</strong> ${receipt.status}</p>
  <p><strong>Created:</strong> ${formatDateTime(receipt.created_at)}</p>
  <p><strong>Paid At:</strong> ${formatDateTime(receipt.paid_at)}</p>
  <p><strong>Phone:</strong> ${receipt.phone || "N/A"}</p>
  <p><strong>Amount:</strong> ${formatKes(receipt.amount_kes || 0)}</p>
  <p><strong>Transaction:</strong> ${receipt.transaction_code || "Pending confirmation"}</p>
  <table>
    <thead>
      <tr>
        <th>Item</th><th>Type</th><th>Qty</th><th>Unit Price</th><th>Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  ${tickets}
</body>
</html>`;
}

async function fetchReceipt(orderId) {
  const response = await fetch(`/api/payments/receipt?order_id=${encodeURIComponent(orderId)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Receipt not available");
  return data.receipt;
}

async function handleDownloadReceipt() {
  const orderId = state.lastOrderId;
  if (!orderId) return notify("Place an order first, then download receipt.");
  try {
    const receipt = await fetchReceipt(orderId);
    state.lastReceipt = receipt;
    const html = buildReceiptHtml(receipt);
    downloadTextFile(`receipt-${safeFilePart(receipt.order_id)}.html`, html, "text/html;charset=utf-8");
  } catch (err) {
    notify(err?.message || "Could not download receipt. Please try again.");
  }
}

async function handleDownloadTickets() {
  const orderId = state.lastOrderId;
  if (!orderId) return notify("No order found yet.");
  try {
    const receipt = state.lastReceipt || await fetchReceipt(orderId);
    const tickets = Array.isArray(receipt.tickets) ? receipt.tickets : [];
    if (!tickets.length) return notify("This order has no tickets.");
    const body = [
      `Cowboys Group Holdings Ticket Pack`,
      `Order: ${receipt.order_id}`,
      `Receipt: ${receipt.receipt_number}`,
      `Status: ${receipt.status}`,
      "",
      ...tickets.map((t) => `${t.event_name} | Code: ${t.code} | Status: ${t.status}`)
    ].join("\n");
    downloadTextFile(`tickets-${safeFilePart(receipt.order_id)}.txt`, body);
  } catch (err) {
    notify(err?.message || "Could not download tickets right now.");
  }
}

async function confirmManualPaymentFromAdminForm() {
  const orderId = String(el.confirmOrderId?.value || "").trim();
  const transactionCode = String(el.confirmTxCode?.value || "").trim().toUpperCase();
  const adminKeyValue = String(el.confirmAdminKey?.value || "").trim();
  if (!orderId || !transactionCode || !adminKeyValue) {
    notify("Enter order ID, transaction code, and admin key.");
    return;
  }

  try {
    const response = await fetch("/api/payments/confirm-manual", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKeyValue
      },
      body: JSON.stringify({
        order_id: orderId,
        transaction_code: transactionCode
      })
    });
    const data = await response.json();
    if (!response.ok) {
      notify(data.error || "Payment confirmation failed.");
      return;
    }

    state.lastOrderId = orderId;
    setPaymentStatus(`Payment confirmed for ${orderId}. Receipt and ticket download are now enabled.`);
    if (el.confirmTxCode) el.confirmTxCode.value = "";
    try {
      state.lastReceipt = await fetchReceipt(orderId);
    } catch {}
  } catch {
    notify("Could not confirm payment. Check server and admin key.");
  }
}

function emptyNode(message) {
  const d = document.createElement("div");
  d.className = "gallery-empty";
  d.textContent = message;
  return d;
}

function maybeImage(path, alt = "") {
  if (!path) return "";
  return `<img class="outfit-image" src="${mediaSrc(path)}" alt="${alt}" loading="lazy" onerror="this.onerror=null;this.src='${mediaSrc(PLACEHOLDER_IMAGE)}'">`;
}

function renderCart() {
  if (!el.cartItems || !el.cartTotal || !el.cartCount) return;
  el.cartItems.innerHTML = "";
  if (el.cartLane) el.cartLane.textContent = cartLaneName();

  if (!state.cart.length) {
    el.cartItems.appendChild(emptyNode("Cart is empty."));
    el.cartTotal.textContent = "KES 0";
    el.cartCount.textContent = "0";
    return;
  }

  let total = 0;
  state.cart.forEach((item) => {
    const qty = Math.max(1, Number(item.qty || 1));
    total += Number(item.price || 0) * qty;
    const li = document.createElement("li");
    const itemTotal = Number(item.price || 0) * qty;
    li.textContent = `${item.name} x${qty} - ${formatKes(itemTotal)}`;
    el.cartItems.appendChild(li);
  });
  el.cartTotal.textContent = formatKes(total);
  el.cartCount.textContent = String(state.cart.length);
}

function renderOutfits() {
  ["adults", "kids", "accessories"].forEach((collection) => {
    const container = el.galleries[collection];
    if (!container) return;
    container.innerHTML = "";

    const items = state.content.outfits.filter((x) => x.collection === collection);
    if (!items.length) {
      container.appendChild(emptyNode("No items yet. Add from Admin Photo Manager."));
      return;
    }

    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "outfit-card";
      card.innerHTML = `
        ${maybeImage(item.image, item.name)}
        <div class="outfit-body">
          <p class="outfit-name">${item.name}</p>
          <p class="outfit-meta">${formatKes(item.price)} • ${item.description || ""}</p>
          <div class="outfit-actions">
            <button class="btn btn-primary add-to-cart" type="button" data-name="${item.name}" data-price="${item.price}">Add To Cart</button>
            ${adminOnly(`<button class="delete-outfit delete-outfit-item" type="button" data-id="${item.id}">Remove</button>`)}
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  });
}

function renderEvents() {
  if (!el.eventsGrid) return;
  el.eventsGrid.innerHTML = "";
  if (!state.content.events.length) {
    el.eventsGrid.appendChild(emptyNode("No events yet. Add one using Admin Ticket Manager."));
    return;
  }

  state.content.events.forEach((item) => {
    const dateLabel = item.date ? new Date(item.date).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" }) : "TBA";
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      ${maybeImage(item.poster, item.title)}
      <h3>${item.title}</h3>
      <p>Date: ${dateLabel}</p>
      <p>Venue: ${item.venue || "TBA"}</p>
      <p>Performers: ${item.performers || "TBA"}</p>
      <p>Ticket: ${formatKes(item.ticket_kes)}</p>
      <div class="outfit-actions">
        <button class="btn btn-primary ticket-btn" type="button" data-event="${item.title}" data-price="${Number(item.ticket_kes || 0)}">Buy Ticket</button>
        ${adminOnly(`<button class="delete-outfit delete-event-item" type="button" data-id="${item.id}">Remove</button>`)}
      </div>
    `;
    el.eventsGrid.appendChild(card);
  });
}

function renderLivestock() {
  if (!el.livestockGrid) return;
  el.livestockGrid.innerHTML = "";
  if (!state.content.livestock.length) {
    el.livestockGrid.appendChild(emptyNode("No livestock listings yet. Add one using Admin Livestock Manager."));
    return;
  }

  state.content.livestock.forEach((item) => {
    const total = Number(item.weight_kg || 0) * Number(item.rate_per_kg_kes || 0);
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      ${maybeImage(item.image, item.name)}
      <h3>${item.name}</h3>
      <p>Live Weight: ${item.weight_kg}kg</p>
      <p>Rate: ${formatKes(item.rate_per_kg_kes)} per kg</p>
      <p>Estimated Total: ${formatKes(total)}</p>
      <p>Status: ${item.status}</p>
      <div class="outfit-actions">
        <button class="btn btn-ghost reserve-btn" type="button" data-item="${item.name}" data-price="${total}">Reserve Animal</button>
        ${adminOnly(`<button class="delete-outfit delete-livestock-item" type="button" data-id="${item.id}">Remove</button>`)}
      </div>
    `;
    el.livestockGrid.appendChild(card);
  });
}

function renderDecor() {
  if (!el.decorGrid) return;
  el.decorGrid.innerHTML = "";
  if (!state.content.decor.length) {
    el.decorGrid.appendChild(emptyNode("No decor items yet. Add from Admin Decor Manager."));
    return;
  }

  state.content.decor.forEach((item) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      ${maybeImage(item.image, item.name)}
      <h3>${item.name}</h3>
      <p>Category: ${item.category}</p>
      <p>Price: ${formatKes(item.price_kes)}</p>
      <p>${item.description || ""}</p>
      <div class="outfit-actions">
        <button class="btn btn-ghost decor-inquiry" type="button" data-action="${item.name}">Request Item</button>
        ${adminOnly(`<button class="delete-outfit delete-decor-item" type="button" data-id="${item.id}">Remove</button>`)}
      </div>
    `;
    el.decorGrid.appendChild(card);
  });
}

function renderVideos() {
  if (!el.videoGallery) return;
  el.videoGallery.innerHTML = "";
  if (!state.content.videos.length) {
    el.videoGallery.appendChild(emptyNode("No videos yet. Add in data/content.json or upload media."));
    return;
  }
  state.content.videos.forEach((v) => {
    const card = document.createElement("article");
    card.className = "video-card";
    card.innerHTML = `
      ${v.src ? `<video controls muted playsinline preload="none" ${v.poster ? `poster="${mediaSrc(v.poster)}"` : ""}><source src="${mediaSrc(v.src)}"></video>` : ""}
      <div class="video-body">${v.title || "Untitled Video"}</div>
    `;
    el.videoGallery.appendChild(card);
  });
}

function renderTeam() {
  if (!el.teamGrid) return;
  el.teamGrid.innerHTML = "";
  if (!state.content.team.length) {
    el.teamGrid.appendChild(emptyNode("No team profiles yet."));
    return;
  }
  state.content.team.forEach((p) => {
    const row = document.createElement("div");
    row.className = "team-row";
    row.innerHTML = `
      ${p.photo ? `<img class="team-photo" src="${mediaSrc(p.photo)}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='${mediaSrc(PLACEHOLDER_IMAGE)}'">` : ""}
      <strong>${p.name}</strong><br>${p.role || ""}<br>${p.bio || ""}
      ${adminOnly(`<div class="outfit-actions top-space"><button class="delete-outfit delete-team-item" type="button" data-id="${p.id}">Remove</button></div>`)}
    `;
    el.teamGrid.appendChild(row);
  });
}

function renderSocials() {
  if (!el.socialsGrid) return;
  el.socialsGrid.innerHTML = "";
  if (!state.content.socials.length) {
    el.socialsGrid.appendChild(emptyNode("No social links yet."));
    return;
  }
  state.content.socials.forEach((s) => {
    const row = document.createElement("div");
    row.className = "social-row";
    row.innerHTML = `
      <a class="social-link" href="${s.url || '#'}" target="_blank" rel="noreferrer noopener">${s.platform}${s.handle ? ` • ${s.handle}` : ""}</a>
      ${adminOnly(`<div class="outfit-actions top-space"><button class="delete-outfit delete-social-item" type="button" data-id="${s.id}">Remove</button></div>`)}
    `;
    el.socialsGrid.appendChild(row);
  });
}

function renderCommunity() {
  if (el.descriptionsGrid) {
    el.descriptionsGrid.innerHTML = "";
    if (!state.content.descriptions.length) {
      el.descriptionsGrid.appendChild(emptyNode("No descriptions yet."));
    } else {
      state.content.descriptions.forEach((d) => {
        const row = document.createElement("div");
        row.className = "team-row";
        row.innerHTML = `<strong>${d.title}</strong><br>${d.text}${adminOnly(`<div class="outfit-actions top-space"><button class="delete-outfit delete-description-item" data-id="${d.id}">Remove</button></div>`)}`;
        el.descriptionsGrid.appendChild(row);
      });
    }
  }

  if (el.partnersGrid) {
    el.partnersGrid.innerHTML = "";
    if (!state.content.partners.length) {
      el.partnersGrid.appendChild(emptyNode("No partners yet."));
    } else {
      state.content.partners.forEach((p) => {
        const row = document.createElement("div");
        row.className = "team-row";
        row.innerHTML = `<strong>${p.name}</strong><br>${p.description || ""}<br>${p.email || ""}${adminOnly(`<div class="outfit-actions top-space"><button class="delete-outfit delete-partner-item" data-id="${p.id}">Remove</button></div>`)}`;
        el.partnersGrid.appendChild(row);
      });
    }
  }

  if (el.reviewsGrid) {
    el.reviewsGrid.innerHTML = "";
    if (!state.content.reviews.length) {
      el.reviewsGrid.appendChild(emptyNode("No reviews yet."));
    } else {
      state.content.reviews.forEach((r) => {
        const row = document.createElement("div");
        row.className = "team-row";
        row.innerHTML = `<strong>${r.name}</strong> (${r.rating}/5)<br>${r.text}${adminOnly(`<div class="outfit-actions top-space"><button class="delete-outfit delete-review-item" data-id="${r.id}">Remove</button></div>`)}`;
        el.reviewsGrid.appendChild(row);
      });
    }
  }
}

function renderAll() {
  renderOutfits();
  renderEvents();
  renderLivestock();
  renderDecor();
  renderVideos();
  renderTeam();
  renderSocials();
  renderCommunity();
  renderCart();
}

async function loadContent() {
  try {
    toast("Loading site content...", "info");
    const response = await fetch("/api/content");
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    state.content = { ...structuredClone(defaultContent), ...data };
    if (!Array.isArray(state.content.outfits) || !state.content.outfits.length) {
      const local = localStorage.getItem(OUTFIT_KEY);
      if (local) state.content.outfits = JSON.parse(local);
    }
    toast("Content loaded.", "ok");
  } catch {
    state.content = structuredClone(defaultContent);
    try {
      const local = localStorage.getItem(OUTFIT_KEY);
      if (local) state.content.outfits = JSON.parse(local);
    } catch {}
    toast("Loaded fallback content (server unavailable).", "warn");
  }
}

async function saveContent(scope) {
  const key = adminKey();
  if (!key) {
    notify("Enter admin key first.");
    return;
  }
  try {
    const response = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify(state.content)
    });
    if (!response.ok) throw new Error(String(response.status));
    toast(`${scope} saved successfully.`, "ok");
  } catch {
    toast("Save failed. Check admin key and server status.", "warn");
  }
}

async function uploadMedia(file, folder) {
  const key = adminKey();
  if (!key) {
    notify("Enter admin key before upload.");
    return null;
  }

  const toBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const response = await fetch("/api/media", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": key },
    body: JSON.stringify({ filename: file.name, base64: toBase64, folder })
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.path || null;
}

async function startCheckout() {
  if (!state.cart.length) {
    notify("Your cart is empty. Add products first.");
    return;
  }

  const method = String(el.paymentMethod?.value || "manual");
  const phone = String(el.paymentPhone?.value || "").trim();
  const amountKes = state.cart.reduce((sum, item) => sum + (Number(item.price || 0) * Math.max(1, Number(item.qty || 1))), 0);

  if (!phone) {
    notify("Enter customer phone in format 2547XXXXXXXX.");
    return;
  }

  setPaymentStatus("Starting payment...");

  try {
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method,
        phone,
        amount_kes: amountKes,
        items: state.cart
      })
    });

    const data = await response.json();
    if (!response.ok) {
      setPaymentStatus(`Payment error: ${data.error || "Failed"}`);
      return;
    }

    state.lastOrderId = data.order_id || "";
    state.lastReceipt = null;
    if (el.confirmOrderId && data.order_id) el.confirmOrderId.value = data.order_id;
    setPaymentStatus(data.message || "Order placed.");
    if (data.order_id) {
      pollPaymentStatus(data.order_id);
    }

    if (method === "manual" && data.order_id) {
      const till = data?.manual?.till_number ? `Till ${data.manual.till_number}` : "the business till";
      const payee = data?.manual?.payee_name || "Cowboys Group Holdings";
      setPaymentStatus(`Order ${data.order_id} created. Pay ${formatKes(amountKes)} to ${till} (${payee}), then share your M-Pesa code for confirmation.`);
      state.cart = [];
      renderCart();
      return;
    }
  } catch {
    setPaymentStatus("Payment request failed. Check server and configuration.");
  }
}

function pollPaymentStatus(orderId) {
  let attempts = 0;
  const timer = setInterval(async () => {
    attempts += 1;
    try {
      const response = await fetch(`/api/payments/status?order_id=${encodeURIComponent(orderId)}`);
      const data = await response.json();
      if (!response.ok) return;

      if (data.status === "paid") {
        clearInterval(timer);
        setPaymentStatus(`Payment successful: ${formatKes(data.amount_kes)} received.`);
        try {
          state.lastReceipt = await fetchReceipt(orderId);
        } catch {}
        state.cart = [];
        renderCart();
        return;
      }

      if (data.status === "failed") {
        clearInterval(timer);
        setPaymentStatus(`Payment failed: ${data.result_desc || "Transaction not completed."}`);
        return;
      }

      setPaymentStatus(`Waiting for payment confirmation... (${attempts})`);
      if (attempts >= 30) {
        clearInterval(timer);
        setPaymentStatus("Still pending. Confirm on phone and retry status shortly.");
      }
    } catch {
      if (attempts >= 30) {
        clearInterval(timer);
        setPaymentStatus("Status check stopped. Please retry checkout.");
      }
    }
  }, 4000);
}

async function loadPaymentConfig() {
  try {
    const response = await fetch("/api/payments/config");
    if (!response.ok) throw new Error(String(response.status));
    const cfg = await response.json();

    if (el.paymentMethod) {
      const methods = Array.isArray(cfg.methods) ? cfg.methods : ["manual"];
      el.paymentMethod.innerHTML = "";
      methods.forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m === "mpesa" ? "M-Pesa (STK Push)" : "Manual M-Pesa (Till)";
        el.paymentMethod.appendChild(opt);
      });
    }

    const till = cfg?.manual?.till_number || "";
    if (till) {
      setPaymentHint(`Manual mode active: customers pay directly to Till ${till}, then payment is confirmed by admin.`);
    } else {
      setPaymentHint("Manual mode active: set MANUAL_TILL_NUMBER on server to display your Till.");
    }
  } catch {
    setPaymentHint("Could not load payment settings. Checkout may be limited.");
  }
}

function bindForms() {
  el.checkoutBtn?.addEventListener("click", () => {
    startCheckout();
  });
  el.downloadReceiptBtn?.addEventListener("click", () => {
    handleDownloadReceipt();
  });
  el.downloadTicketBtn?.addEventListener("click", () => {
    handleDownloadTickets();
  });
  el.clearCartBtn?.addEventListener("click", () => {
    state.cart = [];
    renderCart();
    setPaymentStatus("Cart cleared.");
  });
  el.confirmPaymentBtn?.addEventListener("click", () => {
    confirmManualPaymentFromAdminForm();
  });

  el.outfitForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(el.outfitForm);
    const collection = String(fd.get("outfit-collection") || document.getElementById("outfit-collection")?.value || "adults");
    const name = String(fd.get("outfit-name") || document.getElementById("outfit-name")?.value || "").trim();
    const price = Number(document.getElementById("outfit-price")?.value || 0);
    const image = String(document.getElementById("outfit-image")?.value || "").trim() || PLACEHOLDER_IMAGE;
    const description = String(document.getElementById("outfit-description")?.value || "").trim();
    if (!name || !Number.isFinite(price)) return notify("Provide valid outfit details.");
    state.content.outfits.unshift({ id: uid("outfit"), collection, name, price, image, description });
    localStorage.setItem(OUTFIT_KEY, JSON.stringify(state.content.outfits));
    el.outfitForm.reset();
    renderOutfits();
  });

  el.resetOutfitsBtn?.addEventListener("click", () => {
    state.content.outfits = structuredClone(defaultContent.outfits);
    localStorage.setItem(OUTFIT_KEY, JSON.stringify(state.content.outfits));
    renderOutfits();
  });

  el.eventForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = String(document.getElementById("event-title")?.value || "").trim();
    const date = String(document.getElementById("event-date")?.value || "");
    const venue = String(document.getElementById("event-venue")?.value || "").trim();
    const performers = String(document.getElementById("event-performers")?.value || "").trim();
    const ticket_kes = Number(document.getElementById("event-price")?.value || 0);
    const poster = String(document.getElementById("event-poster")?.value || "").trim();
    if (!title || !date || !venue || !Number.isFinite(ticket_kes)) return notify("Provide valid event details.");
    state.content.events.unshift({ id: uid("event"), title, date, venue, performers, ticket_kes, poster });
    el.eventForm.reset();
    renderEvents();
  });

  el.livestockForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = String(document.getElementById("livestock-name")?.value || "").trim();
    const weight_kg = Number(document.getElementById("livestock-weight")?.value || 0);
    const rate_per_kg_kes = Number(document.getElementById("livestock-rate")?.value || 0);
    const status = String(document.getElementById("livestock-status")?.value || "Available");
    const image = String(document.getElementById("livestock-image")?.value || "").trim();
    if (!name || weight_kg <= 0 || !Number.isFinite(rate_per_kg_kes)) return notify("Provide valid livestock details.");
    state.content.livestock.unshift({ id: uid("stock"), name, weight_kg, rate_per_kg_kes, status, image });
    el.livestockForm.reset();
    renderLivestock();
  });

  el.decorForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = String(document.getElementById("decor-name")?.value || "").trim();
    const category = String(document.getElementById("decor-category")?.value || "Service");
    const price_kes = Number(document.getElementById("decor-price")?.value || 0);
    const description = String(document.getElementById("decor-description")?.value || "").trim();
    const image = String(document.getElementById("decor-image")?.value || "").trim();
    if (!name || !Number.isFinite(price_kes)) return notify("Provide valid decor details.");
    state.content.decor.unshift({ id: uid("decor"), name, category, price_kes, description, image });
    el.decorForm.reset();
    renderDecor();
  });

  el.teamForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = String(document.getElementById("team-name")?.value || "").trim();
    const role = String(document.getElementById("team-role")?.value || "").trim();
    const photo = String(document.getElementById("team-photo")?.value || "").trim() || PLACEHOLDER_IMAGE;
    const bio = String(document.getElementById("team-bio")?.value || "").trim();
    if (!name || !role) return notify("Provide valid team details.");
    state.content.team.unshift({ id: uid("team"), name, role, photo, bio });
    el.teamForm.reset();
    renderTeam();
  });

  el.socialForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const platform = String(document.getElementById("social-platform")?.value || "").trim();
    const handle = String(document.getElementById("social-handle")?.value || "").trim();
    const url = String(document.getElementById("social-url")?.value || "").trim();
    if (!platform || !url) return notify("Provide valid social details.");
    state.content.socials.unshift({ id: uid("social"), platform, handle, url });
    el.socialForm.reset();
    renderSocials();
  });

  el.descriptionForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = String(document.getElementById("description-title")?.value || "").trim();
    const text = String(document.getElementById("description-text")?.value || "").trim();
    if (!title || !text) return notify("Provide valid description.");
    state.content.descriptions.unshift({ id: uid("desc"), title, text });
    el.descriptionForm.reset();
    renderCommunity();
  });

  el.partnerFormAdmin?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = String(document.getElementById("partner-name")?.value || "").trim();
    const email = String(document.getElementById("partner-email")?.value || "").trim();
    const description = String(document.getElementById("partner-description")?.value || "").trim();
    if (!name || !email) return notify("Provide valid partner details.");
    state.content.partners.unshift({ id: uid("partner"), name, email, description });
    el.partnerFormAdmin.reset();
    renderCommunity();
  });

  el.reviewForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = String(document.getElementById("review-name")?.value || "").trim();
    const text = String(document.getElementById("review-text")?.value || "").trim();
    const rating = Number(document.getElementById("review-rating")?.value || 5);
    if (!name || !text) return notify("Provide valid review.");
    state.content.reviews.unshift({ id: uid("review"), name, text, rating: Math.max(1, Math.min(5, rating)) });
    el.reviewForm.reset();
    renderCommunity();
  });

  el.uploadForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const folder = String(document.getElementById("upload-folder")?.value || "outfits");
    const fileInput = document.getElementById("upload-file");
    const file = fileInput?.files?.[0];
    if (!file) return notify("Choose a file first.");
    const result = await uploadMedia(file, folder);
    if (!result) return notify("Upload failed. Check admin key and server status.");
    if (el.uploadResult) el.uploadResult.value = result;
    notify(`Upload successful: ${result}`);
  });

  el.artistInquiry?.addEventListener("submit", (e) => {
    e.preventDefault();
    notify("Artist inquiry submitted. Options and rates will be shared.");
    el.artistInquiry.reset();
  });

  el.donorForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    notify("Partnership request received. MOU discussion will be scheduled.");
    el.donorForm.reset();
  });

  document.addEventListener("click", (e) => {
    const addCart = e.target.closest(".add-to-cart");
    if (addCart) {
      const card = addCart.closest(".product-card");
      const name = addCart.dataset.name || card?.getAttribute("data-name") || "Item";
      const price = Number(addCart.dataset.price || card?.getAttribute("data-price") || 0);
      addItemToCart({ name, price, qty: 1, kind: "product" });
      return;
    }

    const ticket = e.target.closest(".ticket-btn");
    if (ticket) {
      const eventName = ticket.dataset.event || "Event Ticket";
      const price = Number(ticket.dataset.price || 0);
      if (!price) return notify("Ticket price is missing. Update event ticket price.");
      addItemToCart({ name: `${eventName} Ticket`, price, qty: 1, kind: "ticket" });
      return;
    }

    const reserve = e.target.closest(".reserve-btn");
    if (reserve) {
      const animalName = reserve.dataset.item || "Livestock";
      const price = Number(reserve.dataset.price || 0);
      if (!price) return notify("Livestock price not available.");
      addItemToCart({ name: `${animalName} (Livestock)`, price, qty: 1, kind: "livestock" });
      return;
    }

    const decor = e.target.closest(".decor-inquiry");
    if (decor) return notify(`${decor.dataset.action || "Decor request"} inquiry received.`);

    const del = e.target.closest(".delete-outfit");
    if (!del) return;
    if (!isAdminMode()) {
      toast("Enter admin key to remove items.", "warn");
      return;
    }
    const id = del.dataset.id;
    if (!id) return;

    const map = [
      ["delete-outfit-item", "outfits"],
      ["delete-event-item", "events"],
      ["delete-livestock-item", "livestock"],
      ["delete-decor-item", "decor"],
      ["delete-team-item", "team"],
      ["delete-social-item", "socials"],
      ["delete-description-item", "descriptions"],
      ["delete-partner-item", "partners"],
      ["delete-review-item", "reviews"]
    ];

    for (const [klass, key] of map) {
      if (del.classList.contains(klass)) {
        state.content[key] = state.content[key].filter((x) => x.id !== id);
        if (key === "outfits") localStorage.setItem(OUTFIT_KEY, JSON.stringify(state.content.outfits));
        renderAll();
        return;
      }
    }
  });

  el.saveOutfitsBtn?.addEventListener("click", () => saveContent("Outfits"));
  el.saveEventsBtn?.addEventListener("click", () => saveContent("Events"));
  el.saveLivestockBtn?.addEventListener("click", () => saveContent("Livestock"));
  el.saveDecorBtn?.addEventListener("click", () => saveContent("Decor"));
  el.saveTeamBtn?.addEventListener("click", () => saveContent("Team"));
  el.saveSocialsBtn?.addEventListener("click", () => saveContent("Socials"));
  el.saveDescriptionsBtn?.addEventListener("click", () => saveContent("Descriptions"));
  el.savePartnersBtn?.addEventListener("click", () => saveContent("Partners"));
  el.saveReviewsBtn?.addEventListener("click", () => saveContent("Reviews"));
  el.adminKey?.addEventListener("input", () => renderAll());
}

function setupNav() {
  if (!el.navToggle || !el.nav) return;
  el.navToggle.addEventListener("click", () => {
    const isExpanded = el.navToggle.getAttribute("aria-expanded") === "true";
    el.navToggle.setAttribute("aria-expanded", String(!isExpanded));
    el.nav.classList.toggle("open");
  });

  el.nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      el.nav.classList.remove("open");
      el.navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

(async function boot() {
  if (el.year) el.year.textContent = String(new Date().getFullYear());
  setupNav();
  await loadContent();
  await loadPaymentConfig();
  bindForms();
  renderAll();
})();
```

## 6) styles.css

```css
:root {
  --paper: #f6efdd;
  --cream: #fff9ec;
  --gold: #d39a38;
  --rust: #a9532d;
  --oak: #2d231d;
  --ink: #2f2a24;
  --line: rgba(45, 35, 29, 0.16);
  --ok: #2f8b44;
  --warn: #ac6b0f;
  --shadow: 0 20px 45px rgba(18, 11, 7, 0.16);
  --radius-lg: 18px;
  --radius-md: 12px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
  font-family: "Manrope", sans-serif;
  color: var(--ink);
  line-height: 1.6;
  background:
    radial-gradient(circle at 12% 8%, rgba(255, 249, 236, 0.95), transparent 28%),
    radial-gradient(circle at 88% 12%, rgba(211, 154, 56, 0.22), transparent 35%),
    linear-gradient(135deg, #ead6b4 0%, #f6efdd 48%, #e7c99d 100%);
}

.site-header,
.section,
.site-footer {
  width: min(1120px, 92vw);
  margin-inline: auto;
}

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 0;
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(9px);
  background: rgba(246, 239, 221, 0.84);
}

.brand {
  text-decoration: none;
  color: var(--oak);
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.brand-mark {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  box-shadow: 0 7px 16px rgba(30, 23, 19, 0.24);
}

.brand-text {
  display: grid;
  gap: 0.08rem;
}

.brand-top {
  font-family: "Alfa Slab One", serif;
  letter-spacing: 0.02em;
  font-size: clamp(1.05rem, 2.1vw, 1.45rem);
}

.brand-bottom {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 800;
  color: rgba(47, 42, 36, 0.78);
}

.main-nav {
  display: flex;
  gap: 0.8rem;
}

.main-nav a {
  text-decoration: none;
  font-weight: 800;
  color: var(--oak);
  padding: 0.35rem 0.45rem;
  border-radius: 8px;
}

.main-nav a:hover,
.main-nav a:focus-visible {
  background: rgba(169, 83, 45, 0.12);
  outline: none;
}

.menu-toggle {
  display: none;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.48rem 0.82rem;
  background: var(--cream);
  font-weight: 700;
}

.section {
  padding: clamp(2.8rem, 6vw, 4.7rem) 0;
}

.reveal {
  animation: rise 0.7s ease both;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.kicker {
  text-transform: uppercase;
  font-size: 0.74rem;
  letter-spacing: 0.17em;
  font-weight: 800;
  color: var(--rust);
  margin-bottom: 0.7rem;
}

h1,
h2,
h3 {
  line-height: 1.2;
  color: var(--oak);
}

h1 {
  font-size: clamp(2rem, 5.2vw, 3.4rem);
  margin-bottom: 1rem;
}

h2 {
  font-size: clamp(1.5rem, 3.3vw, 2.35rem);
  margin-bottom: 0.7rem;
}

h3 {
  font-size: 1.13rem;
  margin-bottom: 0.45rem;
}

.section-heading {
  margin-bottom: 1.3rem;
  display: grid;
  gap: 0.45rem;
}

.section-heading .kicker {
  display: inline-flex;
  width: fit-content;
  padding: 0.2rem 0.62rem;
  border-radius: 999px;
  background: rgba(169, 83, 45, 0.13);
  border: 1px solid rgba(169, 83, 45, 0.24);
}

.section-heading h2 {
  font-size: clamp(1.7rem, 3.8vw, 2.7rem);
  font-weight: 800;
}

.hero {
  display: grid;
  grid-template-columns: 1.12fr 0.88fr;
  gap: 1.1rem;
}

.hero-copy,
.hero-card,
.product-card,
.cart-panel,
.inquiry-form,
.foundation-card {
  background: var(--cream);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
}

.hero-copy,
.hero-card,
.foundation-card {
  padding: clamp(1.2rem, 3vw, 2.2rem);
}

.hero-card {
  background: linear-gradient(170deg, #2f251f 0%, #1d1613 100%);
}

.hero-card h2,
.hero-card li {
  color: #fff6e8;
}

.hero-card ul {
  list-style: none;
  display: grid;
  gap: 0.7rem;
  margin-top: 1rem;
}

.hero-scene {
  border: 1px solid rgba(255, 246, 232, 0.22);
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 0.9rem;
}

.hero-scene svg {
  display: block;
  width: 100%;
  height: auto;
}

.horse-wrap {
  animation: horse-run 1.22s ease-in-out infinite;
  transform-origin: 170px 132px;
}

.leg-front {
  animation: legs-front 0.46s linear infinite alternate;
  transform-origin: 182px 126px;
}

.leg-back {
  animation: legs-back 0.46s linear infinite alternate-reverse;
  transform-origin: 112px 126px;
}

.rider {
  animation: rider-bounce 0.6s ease-in-out infinite;
  transform-origin: 147px 90px;
}

.dust {
  animation: dust-shift 1s ease-out infinite;
}

.cowboy-stand {
  animation: stand-breathe 2.8s ease-in-out infinite;
  transform-origin: 44px 108px;
}

.sun-glow {
  animation: sun-pulse 2.8s ease-in-out infinite;
}

.acacia {
  animation: sway 3.4s ease-in-out infinite;
  transform-origin: 52px 90px;
}

@keyframes horse-run {
  0% { transform: translateX(0) translateY(0); }
  30% { transform: translateX(8px) translateY(-1px); }
  60% { transform: translateX(14px) translateY(0); }
  100% { transform: translateX(0) translateY(0); }
}

@keyframes legs-front {
  from { transform: rotate(9deg); }
  to { transform: rotate(-9deg); }
}

@keyframes legs-back {
  from { transform: rotate(-9deg); }
  to { transform: rotate(9deg); }
}

@keyframes rider-bounce {
  0% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
  100% { transform: translateY(0); }
}

@keyframes dust-shift {
  0% { transform: translateX(0) scale(1); opacity: 0.58; }
  100% { transform: translateX(16px) scale(1.08); opacity: 0.2; }
}

@keyframes stand-breathe {
  0% { transform: translateY(0); }
  50% { transform: translateY(-1px); }
  100% { transform: translateY(0); }
}

@keyframes sun-pulse {
  0% { opacity: 0.86; }
  50% { opacity: 1; }
  100% { opacity: 0.86; }
}

@keyframes sway {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(1.5deg); }
  100% { transform: rotate(0deg); }
}

@media (prefers-reduced-motion: reduce) {
  .horse-wrap,
  .leg-front,
  .leg-back,
  .rider,
  .dust,
  .cowboy-stand,
  .sun-glow,
  .acacia {
    animation: none;
  }
}

.hero-actions {
  margin-top: 1.2rem;
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.ranch-feature {
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  gap: 1rem;
  background: var(--cream);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: 1rem;
}

.ranch-copy {
  padding: 0.4rem 0.4rem 0.4rem 0.2rem;
}

.ranch-scene-wrap {
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  background: #2a1f17;
}

.ranch-scene-wrap svg {
  display: block;
  width: 100%;
  height: auto;
}

.faith-strip {
  background: linear-gradient(110deg, #fff3dd 0%, #f6e8cd 55%, #f2dfbe 100%);
  border: 1px solid var(--line);
  border-left: 6px solid var(--rust);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: 1.15rem 1.2rem;
}

.faith-strip h3 {
  margin-bottom: 0.4rem;
}

.journey-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.9rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-weight: 800;
  border-radius: 999px;
  padding: 0.72rem 1rem;
  border: 1px solid transparent;
  cursor: pointer;
}

.btn-primary {
  background: var(--oak);
  color: #fff7e9;
}

.btn-ghost {
  border-color: var(--line);
  color: var(--oak);
  background: transparent;
}

.split {
  display: grid;
  grid-template-columns: 1.4fr 0.6fr;
  gap: 1rem;
}

.top-space {
  margin-top: 1rem;
}

.bottom-space {
  margin-bottom: 1rem;
}

.gallery-manager {
  background: var(--cream);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: 1rem;
}

.compact-heading h2 {
  font-size: clamp(1.2rem, 2vw, 1.55rem);
}

.admin-form {
  margin-top: 0.5rem;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.8rem;
}

.admin-form label:nth-child(5),
.admin-form .admin-actions,
.admin-form #save-backend,
.admin-form .fine {
  grid-column: 1 / -1;
}

.admin-actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.gallery-grid {
  margin-top: 0.7rem;
  display: grid;
  gap: 0.65rem;
}

.outfit-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fffef9;
  overflow: hidden;
}

.outfit-image {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: linear-gradient(145deg, #f2e0bf, #ebd0a3);
}

.outfit-body {
  padding: 0.7rem;
}

.outfit-name {
  font-weight: 800;
  color: var(--oak);
}

.outfit-meta {
  font-size: 0.87rem;
  color: rgba(47, 42, 36, 0.82);
  margin: 0.2rem 0 0.45rem;
}

.gallery-empty {
  border: 1px dashed var(--line);
  border-radius: 10px;
  padding: 0.65rem;
  font-size: 0.86rem;
  color: rgba(47, 42, 36, 0.7);
}

.outfit-actions {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.video-card {
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
  background: #fffef9;
}

.video-card video {
  width: 100%;
  display: block;
  background: #1d1713;
}

.video-body {
  padding: 0.55rem 0.65rem 0.7rem;
}

.team-row,
.social-row {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  background: #fffef9;
}

.team-row {
  display: grid;
  gap: 0.6rem;
}

.team-photo {
  display: block;
  width: 100%;
  max-width: 280px;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  object-position: top center;
  border-radius: 10px;
  background: linear-gradient(145deg, #f2e0bf, #ebd0a3);
}

.social-link {
  font-weight: 800;
  text-decoration: none;
}

.delete-outfit {
  border: 1px solid rgba(169, 83, 45, 0.35);
  background: transparent;
  color: var(--rust);
  border-radius: 999px;
  padding: 0.38rem 0.6rem;
  font-weight: 700;
  cursor: pointer;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.card-grid.three {
  grid-template-columns: repeat(3, 1fr);
}

.product-card,
.cart-panel,
.inquiry-form {
  padding: 1.1rem;
}

.product-card label,
.inquiry-form label {
  display: grid;
  gap: 0.35rem;
  font-weight: 700;
  margin: 0.5rem 0;
}

select,
input,
textarea {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.68rem;
  font-family: inherit;
}

.stock {
  display: inline-block;
  font-size: 0.74rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  margin-bottom: 0.5rem;
}

.in-stock {
  color: var(--ok);
  background: rgba(47, 139, 68, 0.13);
}

.low-stock {
  color: var(--warn);
  background: rgba(172, 107, 15, 0.16);
}

.cart-panel h3 {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#cart-count {
  background: rgba(169, 83, 45, 0.16);
  color: var(--rust);
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
}

.cart-items {
  list-style: none;
  margin: 0.8rem 0;
  display: grid;
  gap: 0.45rem;
}

.cart-items li {
  font-size: 0.92rem;
  border-bottom: 1px dashed var(--line);
  padding-bottom: 0.35rem;
}

.cart-total {
  margin-bottom: 0.8rem;
}

.fine {
  margin-top: 0.7rem;
  font-size: 0.82rem;
  color: rgba(47, 42, 36, 0.78);
}

.inquiry-form {
  display: grid;
  gap: 0.55rem;
  margin-top: 1rem;
}

.pillars {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pillars span {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
  font-weight: 700;
  background: rgba(211, 154, 56, 0.12);
}

.site-footer {
  padding: 2rem 0 3rem;
  color: rgba(47, 42, 36, 0.83);
  font-size: 0.94rem;
}

a {
  color: var(--rust);
}

#app-toast {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 1200;
  max-width: min(420px, 92vw);
  border-radius: 10px;
  padding: 0.7rem 0.85rem;
  color: #fff;
  background: rgba(31, 41, 55, 0.95);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  transform: translateY(12px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.16s ease, transform 0.16s ease;
}

#app-toast.show {
  opacity: 1;
  transform: translateY(0);
}

#app-toast.ok {
  background: rgba(6, 95, 70, 0.95);
}

#app-toast.warn {
  background: rgba(146, 64, 14, 0.96);
}

@media (min-width: 981px) {
  .team-row {
    grid-template-columns: 220px 1fr;
    align-items: start;
  }

  .team-photo {
    max-width: 220px;
  }
}

@media (max-width: 980px) {
  .hero,
  .ranch-feature,
  .split,
  .collection-grid,
  .admin-form,
  .card-grid,
  .card-grid.three,
  .journey-grid {
    grid-template-columns: 1fr;
  }

  .menu-toggle {
    display: inline-flex;
  }

  .main-nav {
    position: absolute;
    top: 68px;
    right: 4vw;
    width: min(240px, 88vw);
    flex-direction: column;
    gap: 0.35rem;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: var(--cream);
    box-shadow: var(--shadow);
    padding: 0.7rem;
    opacity: 0;
    transform: scale(0.95);
    pointer-events: none;
    transition: 0.18s ease;
  }

  .main-nav.open {
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
  }

  .brand-mark {
    width: 44px;
    height: 44px;
  }
}
```

## 7) index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cowboys Group Holdings | Kenya Culture, Events, Apparel & Livestock</title>
    <meta
      name="description"
      content="Cowboys Group Holdings is a Kenya-based platform for culture-led events, apparel, livestock marketplace, decor services, and community impact."
    />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="author" content="Cowboys Group Holdings" />
    <meta name="theme-color" content="#8f6036" />
    <link rel="canonical" href="https://cowboysgroupholdings.co.ke/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Cowboys Group Holdings" />
    <meta property="og:title" content="Cowboys Group Holdings | Kenya Culture, Events, Apparel & Livestock" />
    <meta
      property="og:description"
      content="Explore Cowboys Group Holdings: events, apparel, livestock, decor, and foundation programs across Kenya."
    />
    <meta property="og:url" content="https://cowboysgroupholdings.co.ke/" />
    <meta property="og:image" content="https://cowboysgroupholdings.co.ke/assets/logo-primary.svg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Cowboys Group Holdings | Kenya Culture, Events, Apparel & Livestock" />
    <meta
      name="twitter:description"
      content="Kenya-based culture platform for events, apparel, livestock commerce, decor services, and impact initiatives."
    />
    <meta name="twitter:image" content="https://cowboysgroupholdings.co.ke/assets/logo-primary.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Manrope:wght@400;500;700;800&display=swap"
      rel="stylesheet"
    />
    <link rel="icon" type="image/svg+xml" href="assets/logo-mark.svg" />
    <link rel="stylesheet" href="styles.css" />
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Cowboys Group Holdings",
        "url": "https://cowboysgroupholdings.co.ke/",
        "logo": "https://cowboysgroupholdings.co.ke/assets/logo-mark.svg",
        "description": "Kenya-based culture-driven holding company for events, apparel, livestock, decor, and impact programs.",
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "+254793791623",
            "contactType": "customer support",
            "areaServed": "KE"
          }
        ],
        "sameAs": [
          "https://www.instagram.com/gymie.fitness",
          "https://www.facebook.com/share/1KoyUwx134/"
        ]
      }
    </script>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="#home">
        <img class="brand-mark" src="assets/logo-mark.svg" alt="Cowboys Group Holdings logo" />
        <span class="brand-text">
          <span class="brand-top">Cowboys Group Holdings</span>
          <span class="brand-bottom">Culture. Business. Legacy.</span>
        </span>
      </a>

      <button class="menu-toggle" aria-expanded="false" aria-controls="main-nav">Menu</button>

      <nav id="main-nav" class="main-nav" aria-label="Primary navigation">
        <a href="#home">Home</a>
        <a href="#journey">Journey</a>
        <a href="#apparel">Shop</a>
        <a href="#events">Events</a>
        <a href="#media">Media</a>
        <a href="#foundation">Foundation</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>

    <main id="home">
      <section class="hero section reveal">
        <div class="hero-copy">
          <p class="kicker">Kenya-Born Holding Company</p>
          <h1>Culture-driven businesses that people can feel in real life.</h1>
          <p>
            From marketing and apparel to events, livestock commerce, and community programs, this
            platform is structured as one trusted ecosystem for step-by-step discovery and action.
          </p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#journey">Start Guided Journey</a>
            <a class="btn btn-ghost" href="#apparel">Go To Shop</a>
          </div>
        </div>

        <aside class="hero-card" aria-label="What makes us different">
          <h2>What Makes Us Different</h2>
          <ul>
            <li>One holding company, multiple focused business units</li>
            <li>Revenue + culture + community impact working together</li>
            <li>Built for partnerships, joint ventures, and expansion</li>
            <li>Friendly brand for kids, youth, adults, and families</li>
          </ul>
        </aside>
      </section>

      <section class="section reveal">
        <div class="ranch-feature">
          <div class="ranch-copy">
            <p class="kicker">Kenyan Ranch Life</p>
            <h2>Horse and cowboy culture is part of our identity.</h2>
            <p>
              This is the heart of the brand: authentic ranch storytelling, family-friendly energy,
              and modern culture experiences rooted in Kenyan landscapes.
            </p>
          </div>
          <div class="ranch-scene-wrap" aria-hidden="true">
            <svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#ffcf86" />
                  <stop offset="58%" stop-color="#f3a35f" />
                  <stop offset="100%" stop-color="#b96b39" />
                </linearGradient>
                <linearGradient id="ground2" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#6d4728" />
                  <stop offset="100%" stop-color="#8f6036" />
                </linearGradient>
                <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#865634" />
                  <stop offset="100%" stop-color="#6e4628" />
                </linearGradient>
                <linearGradient id="horseBody2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#2c221b" />
                  <stop offset="100%" stop-color="#120d09" />
                </linearGradient>
              </defs>
              <rect width="640" height="230" fill="url(#sky2)" />
              <rect y="230" width="640" height="130" fill="url(#ground2)" />
              <circle class="sun-glow" cx="534" cy="72" r="42" fill="#ffd76f" />
              <path d="M0 240 C120 208, 240 205, 360 234 C455 254, 560 250, 640 236 L640 360 L0 360 Z" fill="url(#hill2)"/>
              <path d="M0 255 C130 225, 270 232, 422 254 C523 267, 588 264, 640 255 L640 360 L0 360 Z" fill="#7f5430"/>
              <g class="acacia" transform="translate(100 210)">
                <rect x="46" y="32" width="12" height="58" fill="#2f2419" />
                <ellipse cx="52" cy="28" rx="66" ry="24" fill="#24351f" />
              </g>
              <g class="cowboy-stand" transform="translate(448 205)">
                <ellipse cx="42" cy="108" rx="26" ry="8" fill="#221711" opacity="0.45"/>
                <circle cx="44" cy="28" r="10" fill="#120d0a"/>
                <path d="M30 22 C35 12, 56 11, 60 22 C52 18, 39 18, 30 22 Z" fill="#21150f"/>
                <rect x="39" y="38" width="12" height="35" rx="4" fill="#18120d"/>
                <rect x="27" y="44" width="10" height="22" rx="4" fill="#18120d"/>
                <rect x="53" y="44" width="10" height="22" rx="4" fill="#18120d"/>
                <rect x="38" y="72" width="7" height="36" rx="3" fill="#120d0a"/>
                <rect x="47" y="72" width="7" height="36" rx="3" fill="#120d0a"/>
              </g>
              <g class="horse-wrap" transform="translate(190 210)">
                <ellipse cx="158" cy="112" rx="32" ry="10" fill="#1d130e" opacity="0.52"/>
                <ellipse cx="96" cy="110" rx="26" ry="8" fill="#1d130e" opacity="0.45"/>
                <path d="M28 113 C44 99, 108 92, 176 99 C220 104, 258 116, 278 114 C270 128, 238 137, 170 137 C101 137, 44 131, 28 113 Z" fill="url(#horseBody2)"/>
                <path d="M196 98 C206 82, 224 75, 246 75 C254 75, 259 83, 253 90 C246 99, 220 106, 205 112 Z" fill="url(#horseBody2)"/>
                <path d="M245 75 L262 65 L252 88 Z" fill="#0e0907"/>
                <path d="M89 99 C75 85, 56 77, 42 81 C55 86, 66 95, 82 108 Z" fill="#0e0907"/>
                <path d="M216 101 C198 95, 165 95, 138 102 C165 104, 193 108, 217 113 Z" stroke="#f1dca9" stroke-width="2" fill="none"/>
                <g class="leg-set leg-front">
                  <rect x="164" y="126" width="10" height="54" rx="4" fill="#120d0a" />
                  <rect x="194" y="126" width="10" height="54" rx="4" fill="#120d0a" />
                </g>
                <g class="leg-set leg-back">
                  <rect x="90" y="126" width="10" height="54" rx="4" fill="#120d0a" />
                  <rect x="122" y="126" width="10" height="54" rx="4" fill="#120d0a" />
                </g>
                <path d="M38 112 C10 96, 8 77, 26 70 C12 76, 10 97, 34 117 Z" fill="#17100c" />
                <g class="rider">
                  <circle cx="147" cy="58" r="9" fill="#140f0b"/>
                  <path d="M134 54 C138 44, 154 44, 160 54 C151 50, 141 50, 134 54 Z" fill="#20140e"/>
                  <rect x="142" y="66" width="10" height="28" rx="4" fill="#1b130e"/>
                  <rect x="132" y="72" width="8" height="22" rx="3" fill="#1b130e"/>
                  <rect x="152" y="72" width="8" height="22" rx="3" fill="#1b130e"/>
                  <rect x="139" y="92" width="7" height="26" rx="3" fill="#120d0a"/>
                  <rect x="148" y="92" width="7" height="26" rx="3" fill="#120d0a"/>
                </g>
                <g class="dust">
                  <ellipse cx="52" cy="174" rx="22" ry="6" fill="#d39b6f" opacity="0.5"/>
                  <ellipse cx="78" cy="176" rx="19" ry="6" fill="#d39b6f" opacity="0.4"/>
                  <ellipse cx="107" cy="175" rx="18" ry="5" fill="#d39b6f" opacity="0.34"/>
                </g>
              </g>
            </svg>
          </div>
        </div>
      </section>

      <section class="section reveal">
        <div class="faith-strip">
          <p class="kicker">Christian Foundation</p>
          <h3>Strong faith, honest business, and servant leadership.</h3>
          <p>
            Christian values guide this platform: integrity, stewardship, compassion, and
            excellence in service to clients, teams, and communities.
          </p>
        </div>
      </section>

      <section id="journey" class="section reveal">
        <div class="section-heading">
          <p class="kicker">Guided Journey</p>
          <h2>Explore the company in a clear step-by-step order.</h2>
        </div>
        <div class="journey-grid">
          <article class="product-card">
            <p class="stock in-stock">Step 1</p>
            <h3>Who We Are</h3>
            <p>Identity, mission, values, and inclusive culture commitment.</p>
            <a class="btn btn-ghost" href="#identity">Open Step</a>
          </article>
          <article class="product-card">
            <p class="stock in-stock">Step 2</p>
            <h3>Marketing Engine</h3>
            <p>See how branding, media, and campaigns drive all other ventures.</p>
            <a class="btn btn-ghost" href="#marketing">Open Step</a>
          </article>
          <article class="product-card">
            <p class="stock in-stock">Step 3</p>
            <h3>Apparel Commerce</h3>
            <p>Discover stock structure for adults, kids, and accessories.</p>
            <a class="btn btn-ghost" href="#apparel">Open Step</a>
          </article>
          <article class="product-card">
            <p class="stock in-stock">Step 4</p>
            <h3>Events & Tickets</h3>
            <p>Upcoming experiences, performers, and ticketing flow.</p>
            <a class="btn btn-ghost" href="#events">Open Step</a>
          </article>
          <article class="product-card">
            <p class="stock in-stock">Step 5</p>
            <h3>Goat & Cattle Sales</h3>
            <p>Festive-season livestock listings by weight and reservation.</p>
            <a class="btn btn-ghost" href="#livestock">Open Step</a>
          </article>
          <article class="product-card">
            <p class="stock in-stock">Step 6</p>
            <h3>Kids Corner</h3>
            <p>Family-safe experiences, kids fashion, and child-friendly programming.</p>
            <a class="btn btn-ghost" href="#kids-corner">Open Step</a>
          </article>
          <article class="product-card">
            <p class="stock in-stock">Step 7</p>
            <h3>Collaborations</h3>
            <p>Brands, classic cars, ranchers, and creators working together.</p>
            <a class="btn btn-ghost" href="#collaborations">Open Step</a>
          </article>
          <article class="product-card">
            <p class="stock in-stock">Step 8</p>
            <h3>Foundation Mission</h3>
            <p>Mission, vision, and donor-trust partnership model.</p>
            <a class="btn btn-ghost" href="#foundation">Open Step</a>
          </article>
        </div>
      </section>

      <section id="identity" class="section reveal">
        <div class="section-heading">
          <p class="kicker">Step 1: Who We Are</p>
          <h2>A culture-first Kenyan holding company built for long-term impact.</h2>
        </div>
        <div class="card-grid three">
          <article class="product-card">
            <h3>Identity</h3>
            <p>Culture-first holding platform rooted in Kenyan lifestyle and enterprise.</p>
          </article>
          <article class="product-card">
            <h3>Mission</h3>
            <p>Build profitable, inclusive, and trusted businesses that uplift people and communities.</p>
          </article>
          <article class="product-card">
            <h3>Values</h3>
            <p>Faith, integrity, excellence, inclusion, and long-term stewardship.</p>
          </article>
        </div>
      </section>

      <section id="marketing" class="section reveal">
        <div class="section-heading">
          <p class="kicker">Step 2: Marketing</p>
          <h2>The growth engine that powers every venture.</h2>
        </div>
        <div class="card-grid three">
          <article class="product-card">
            <h3>Brand & Creative</h3>
            <p>Identity systems, visual campaigns, and storytelling for businesses and artists.</p>
          </article>
          <article class="product-card">
            <h3>Digital Campaigns</h3>
            <p>Social media, paid promotions, and launch strategies for products and events.</p>
          </article>
          <article class="product-card">
            <h3>Partnership Promotion</h3>
            <p>Classic cars, ranchers, creators, and brands promoted under one trusted network.</p>
          </article>
        </div>
      </section>

      <section id="apparel" class="section reveal">
        <div class="section-heading">
          <p class="kicker">Step 3: Apparel & Merch Shop</p>
          <h2>Visible stock lanes for adults, kids, and accessories.</h2>
        </div>

        <div class="gallery-manager top-space">
          <div class="section-heading compact-heading">
            <p class="kicker">Admin Photo Manager</p>
            <h2>Add new outfit stock without editing code.</h2>
          </div>
          <form id="outfit-form" class="inquiry-form admin-form">
            <label>Collection
              <select id="outfit-collection" required>
                <option value="adults">Adults</option>
                <option value="kids">Kids</option>
                <option value="accessories">Accessories</option>
              </select>
            </label>
            <label>Item Name
              <input id="outfit-name" type="text" placeholder="Western Denim Jacket" required />
            </label>
            <label>Price (KES)
              <input id="outfit-price" type="number" min="0" step="100" placeholder="4200" required />
            </label>
            <label>Image Path or URL
              <input
                id="outfit-image"
                type="text"
                placeholder="assets/outfits/denim-jacket.jpg or https://..."
                required
              />
            </label>
            <label>Description
              <input id="outfit-description" type="text" placeholder="Unisex drop, premium cotton" />
            </label>
            <div class="admin-actions">
              <button class="btn btn-primary" type="submit">Add Outfit</button>
              <button class="btn btn-ghost" id="reset-outfits" type="button">Reset Demo Data</button>
            </div>
            <label>Admin Key (for backend save)
              <input id="admin-key" type="password" placeholder="Your backend admin key" />
            </label>
            <button class="btn btn-ghost" id="save-backend" type="button">Save Outfits To Backend</button>
            <p class="fine">
              Tip: place images in `assets/outfits/` and paste the path here.
            </p>
          </form>
        </div>

        <div class="collection-grid top-space">
          <article class="product-card">
            <h3>Adults Collection</h3>
            <p>Latest adult stock and lifestyle fits.</p>
            <div id="gallery-adults" class="gallery-grid"></div>
          </article>
          <article class="product-card">
            <h3>Kids Collection</h3>
            <p>Family-friendly, durable, and playful looks.</p>
            <div id="gallery-kids" class="gallery-grid"></div>
          </article>
          <article class="product-card">
            <h3>Accessories</h3>
            <p>Caps, belts, leather, and signature items.</p>
            <div id="gallery-accessories" class="gallery-grid"></div>
          </article>
        </div>

        <div class="split top-space">
          <div class="card-grid">
            <article class="product-card" data-name="Cowboys Heritage Tee" data-price="2200">
              <p class="stock in-stock">In Stock</p>
              <h3>Cowboys Heritage Tee</h3>
              <p>KES 2,200</p>
              <label>Size
                <select>
                  <option>S</option><option>M</option><option>L</option><option>XL</option>
                </select>
              </label>
              <button class="btn btn-primary add-to-cart">Add To Cart</button>
            </article>
            <article class="product-card" data-name="Rustic Leather Belt" data-price="3500">
              <p class="stock in-stock">In Stock</p>
              <h3>Rustic Leather Belt</h3>
              <p>KES 3,500</p>
              <label>Size
                <select>
                  <option>30</option><option>32</option><option>34</option><option>36</option>
                </select>
              </label>
              <button class="btn btn-primary add-to-cart">Add To Cart</button>
            </article>
            <article class="product-card" data-name="Bull Horn Cap" data-price="1800">
              <p class="stock low-stock">Low Stock</p>
              <h3>Bull Horn Cap</h3>
              <p>KES 1,800</p>
              <label>Color
                <select>
                  <option>Black</option><option>Khaki</option><option>Brown</option>
                </select>
              </label>
              <button class="btn btn-primary add-to-cart">Add To Cart</button>
            </article>
            <article class="product-card" data-name="Ranch Kids Hoodie" data-price="2600">
              <p class="stock in-stock">In Stock</p>
              <h3>Ranch Kids Hoodie</h3>
              <p>KES 2,600</p>
              <label>Size
                <select>
                  <option>4-6</option><option>7-9</option><option>10-12</option>
                </select>
              </label>
              <button class="btn btn-primary add-to-cart">Add To Cart</button>
            </article>
          </div>

          <aside class="cart-panel">
            <h3>Cart <span id="cart-count">0</span></h3>
            <p class="fine"><strong>Checkout Lane:</strong> <span id="cart-lane">None</span></p>
            <ul id="cart-items" class="cart-items"></ul>
            <p class="cart-total">Total: <strong id="cart-total">KES 0</strong></p>
            <button id="clear-cart-btn" class="btn btn-ghost" type="button">Clear Cart</button>
            <label>Payment Method
              <select id="payment-method">
                <option value="manual">Manual M-Pesa (Till)</option>
                <option value="mpesa">M-Pesa (STK Push)</option>
              </select>
            </label>
            <label>Customer Phone (2547XXXXXXXX)
              <input id="payment-phone" type="text" placeholder="254712345678" />
            </label>
            <button id="checkout-btn" class="btn btn-primary">Place Order</button>
            <button id="download-receipt-btn" class="btn btn-ghost" type="button">Download Receipt</button>
            <button id="download-ticket-btn" class="btn btn-ghost" type="button">Download Ticket(s)</button>
            <p id="payment-status" class="fine"></p>
            <p id="payment-hint" class="fine"></p>
            <hr />
            <h4>Admin: Confirm Manual Payment</h4>
            <label>Order ID
              <input id="confirm-order-id" type="text" placeholder="order-..." />
            </label>
            <label>M-Pesa Transaction Code
              <input id="confirm-tx-code" type="text" placeholder="TXYZ123456" />
            </label>
            <label>Admin Key
              <input id="confirm-admin-key" type="password" placeholder="same ADMIN_KEY used on server" />
            </label>
            <button id="confirm-payment-btn" class="btn btn-primary" type="button">Confirm Payment</button>
            <p class="fine">Affiliate-ready: partner links and referral codes can be connected in backend phase.</p>
          </aside>
        </div>
      </section>

      <section id="events" class="section reveal">
        <div class="section-heading">
          <p class="kicker">Step 4: Events, Tickets & Talent</p>
          <h2>Publish upcoming events and sell tickets from one place.</h2>
        </div>
        <div class="gallery-manager">
          <div class="section-heading compact-heading">
            <p class="kicker">Admin Ticket Manager</p>
            <h2>Add or update events and ticket pricing.</h2>
          </div>
          <form id="event-form" class="inquiry-form admin-form">
            <label>Event Title
              <input id="event-title" type="text" placeholder="Nairobi Ranch Night" required />
            </label>
            <label>Date
              <input id="event-date" type="date" required />
            </label>
            <label>Venue
              <input id="event-venue" type="text" placeholder="Karen, Nairobi" required />
            </label>
            <label>Performers
              <input id="event-performers" type="text" placeholder="DJ + Live Band" required />
            </label>
            <label>Ticket Price (KES)
              <input id="event-price" type="number" min="0" step="100" placeholder="2000" required />
            </label>
            <label>Poster/Flyer Image Path
              <input id="event-poster" type="text" placeholder="assets/events/ranch-night-poster.jpg" />
            </label>
            <div class="admin-actions">
              <button class="btn btn-primary" type="submit">Add Event</button>
              <button class="btn btn-ghost" id="save-events-backend" type="button">Save Events To Backend</button>
            </div>
          </form>
        </div>

        <div id="events-grid" class="card-grid three top-space">
        </div>

        <form class="inquiry-form" id="artist-inquiry">
          <h3>Hire Artists / MCs / Dancers</h3>
          <label>Name <input type="text" required /></label>
          <label>Email <input type="email" required /></label>
          <label>Event Type <input type="text" placeholder="Wedding, launch, festival..." required /></label>
          <label>Message <textarea rows="4" placeholder="Who do you want to hire and for what date?"></textarea></label>
          <button class="btn btn-primary" type="submit">Send Artist Inquiry</button>
        </form>
      </section>

      <section id="livestock" class="section reveal">
        <div class="section-heading">
          <p class="kicker">Step 5: Goat & Cattle Marketplace</p>
          <h2>Festive season livestock reservations by weight.</h2>
        </div>
        <div class="gallery-manager">
          <div class="section-heading compact-heading">
            <p class="kicker">Admin Livestock Manager</p>
            <h2>Add goats and cattle by weight and price per kg.</h2>
          </div>
          <form id="livestock-form" class="inquiry-form admin-form">
            <label>Animal Name
              <input id="livestock-name" type="text" placeholder="Goat - Premium" required />
            </label>
            <label>Live Weight (kg)
              <input id="livestock-weight" type="number" min="1" step="1" placeholder="38" required />
            </label>
            <label>Price per kg (KES)
              <input id="livestock-rate" type="number" min="0" step="10" placeholder="680" required />
            </label>
            <label>Status
              <select id="livestock-status" required>
                <option>Available</option>
                <option>Limited</option>
                <option>Reserved</option>
              </select>
            </label>
            <label>Photo Path
              <input id="livestock-image" type="text" placeholder="assets/livestock/goat-premium.jpg" />
            </label>
            <div class="admin-actions">
              <button class="btn btn-primary" type="submit">Add Listing</button>
              <button class="btn btn-ghost" id="save-livestock-backend" type="button">Save Livestock To Backend</button>
            </div>
          </form>
        </div>

        <div id="livestock-grid" class="card-grid three top-space">
        </div>
      </section>

      <section id="decor" class="section reveal">
        <div class="section-heading">
          <p class="kicker">Decor & Flowers</p>
          <h2>Hire decoration teams or buy fresh and rustic flower products.</h2>
        </div>
        <div class="gallery-manager">
          <div class="section-heading compact-heading">
            <p class="kicker">Admin Decor Manager</p>
            <h2>Add decor services and flower products.</h2>
          </div>
          <form id="decor-form" class="inquiry-form admin-form">
            <label>Item Name
              <input id="decor-name" type="text" placeholder="Decor Hire Package" required />
            </label>
            <label>Category
              <select id="decor-category" required>
                <option>Service</option>
                <option>Fresh Flowers</option>
                <option>Rustic Decor</option>
              </select>
            </label>
            <label>Price (KES)
              <input id="decor-price" type="number" min="0" step="100" placeholder="15000" required />
            </label>
            <label>Description
              <input id="decor-description" type="text" placeholder="Rustic weddings and private events" required />
            </label>
            <label>Image Path
              <input id="decor-image" type="text" placeholder="assets/decor/rustic-setup.jpg" />
            </label>
            <div class="admin-actions">
              <button class="btn btn-primary" type="submit">Add Decor Item</button>
              <button class="btn btn-ghost" id="save-decor-backend" type="button">Save Decor To Backend</button>
            </div>
          </form>
        </div>
        <div id="decor-grid" class="card-grid three top-space">
        </div>
      </section>

      <section id="media" class="section reveal">
        <div class="section-heading">
          <p class="kicker">Media & Team</p>
          <h2>Videos, people, and social channels driving the movement.</h2>
        </div>
        <div class="gallery-manager">
          <div class="section-heading compact-heading">
            <p class="kicker">Admin Team & Social Manager</p>
            <h2>Add team profiles and social media links.</h2>
          </div>
          <form id="team-form" class="inquiry-form admin-form">
            <label>Team Member Name
              <input id="team-name" type="text" placeholder="Team Member Name" required />
            </label>
            <label>Role
              <input id="team-role" type="text" placeholder="Operations Lead" required />
            </label>
            <label>Photo Path
              <input id="team-photo" type="text" placeholder="assets/team/member.jpg" />
            </label>
            <label>Bio
              <input id="team-bio" type="text" placeholder="Culture and partnerships lead" />
            </label>
            <div class="admin-actions">
              <button class="btn btn-primary" type="submit">Add Team Profile</button>
              <button class="btn btn-ghost" id="save-team-backend" type="button">Save Team To Backend</button>
            </div>
          </form>
          <form id="social-form" class="inquiry-form admin-form top-space">
            <label>Platform
              <input id="social-platform" type="text" placeholder="Instagram" required />
            </label>
            <label>Handle
              <input id="social-handle" type="text" placeholder="@cowboysgroup" />
            </label>
            <label>URL
              <input id="social-url" type="url" placeholder="https://instagram.com/..." required />
            </label>
            <div class="admin-actions">
              <button class="btn btn-primary" type="submit">Add Social Link</button>
              <button class="btn btn-ghost" id="save-socials-backend" type="button">Save Socials To Backend</button>
            </div>
          </form>
          <form id="media-upload-form" class="inquiry-form admin-form top-space">
            <label>Upload Folder
              <select id="upload-folder" required>
                <option value="outfits">Outfits</option>
                <option value="events">Events</option>
                <option value="livestock">Livestock</option>
                <option value="decor">Decor</option>
                <option value="team">Team</option>
                <option value="videos">Videos</option>
              </select>
            </label>
            <label>Choose File
              <input id="upload-file" type="file" required />
            </label>
            <div class="admin-actions">
              <button class="btn btn-primary" type="submit">Upload File To Server</button>
            </div>
            <label>Uploaded Path
              <input id="upload-result" type="text" readonly placeholder="Uploaded file path appears here" />
            </label>
            <p class="fine">Upload once, then paste this path into outfit/event/livestock/decor/team forms.</p>
          </form>
        </div>
        <div class="card-grid three">
          <article class="product-card">
            <h3>Featured Videos</h3>
            <div id="video-gallery" class="gallery-grid"></div>
          </article>
          <article class="product-card">
            <h3>Team & Faces</h3>
            <div id="team-grid" class="gallery-grid"></div>
          </article>
          <article class="product-card">
            <h3>Social Channels</h3>
            <div id="social-links" class="gallery-grid"></div>
          </article>
        </div>
      </section>

      <section id="kids-corner" class="section reveal">
        <div class="section-heading">
          <p class="kicker">Step 6: Kids Corner</p>
          <h2>A safe, joyful, and growth-centered space for children and families.</h2>
        </div>
        <div class="card-grid three">
          <article class="product-card">
            <h3>Kids Fashion Lane</h3>
            <p>Age-appropriate apparel stock, updated regularly with practical size options.</p>
          </article>
          <article class="product-card">
            <h3>Family Event Tracks</h3>
            <p>Child-friendly event schedules with clear programming, security, and guidance.</p>
          </article>
          <article class="product-card">
            <h3>Talent Growth</h3>
            <p>Dance, arts, and culture exposure programs that nurture confidence and discipline.</p>
          </article>
        </div>
      </section>

      <section id="collaborations" class="section reveal">
        <div class="section-heading">
          <p class="kicker">Step 7: Collaborations</p>
          <h2>Partner-driven growth across culture, enterprise, and community impact.</h2>
        </div>
        <div class="card-grid three">
          <article class="product-card">
            <h3>Classic Cars & Bikes</h3>
            <p>Joint showcases and campaigns with owners clubs for events and content promotion.</p>
          </article>
          <article class="product-card">
            <h3>Ranchers & Producers</h3>
            <p>Structured livestock and rural commerce collaboration with transparent listing standards.</p>
          </article>
          <article class="product-card">
            <h3>Brand & Creator Network</h3>
            <p>Cross-promotion for artists, businesses, and institutions through one ecosystem.</p>
          </article>
        </div>
      </section>

      <section id="community" class="section reveal">
        <div class="section-heading">
          <p class="kicker">Descriptions, Partners & Reviews</p>
          <h2>Public trust content: descriptions, partner contacts, emails, and testimonials.</h2>
        </div>
        <div class="gallery-manager">
          <form id="description-form" class="inquiry-form admin-form">
            <label>Description Title
              <input id="description-title" type="text" placeholder="Who this platform serves" required />
            </label>
            <label>Description Text
              <input id="description-text" type="text" placeholder="Built with creators, ranchers, families, and partners" required />
            </label>
            <div class="admin-actions">
              <button class="btn btn-primary" type="submit">Add Description</button>
              <button class="btn btn-ghost" id="save-descriptions-backend" type="button">Save Descriptions</button>
            </div>
          </form>
          <form id="partner-form-admin" class="inquiry-form admin-form top-space">
            <label>Partner Name
              <input id="partner-name" type="text" placeholder="Partner Company" required />
            </label>
            <label>Partner Email
              <input id="partner-email" type="email" placeholder="partner@company.com" required />
            </label>
            <label>Partner Description
              <input id="partner-description" type="text" placeholder="Event production and logistics partner" />
            </label>
            <div class="admin-actions">
              <button class="btn btn-primary" type="submit">Add Partner</button>
              <button class="btn btn-ghost" id="save-partners-backend" type="button">Save Partners</button>
            </div>
          </form>
          <form id="review-form" class="inquiry-form admin-form top-space">
            <label>Reviewer Name
              <input id="review-name" type="text" placeholder="Client Name" required />
            </label>
            <label>Review Text
              <input id="review-text" type="text" placeholder="Amazing experience and clear communication." required />
            </label>
            <label>Rating (1-5)
              <input id="review-rating" type="number" min="1" max="5" step="1" value="5" required />
            </label>
            <div class="admin-actions">
              <button class="btn btn-primary" type="submit">Add Review</button>
              <button class="btn btn-ghost" id="save-reviews-backend" type="button">Save Reviews</button>
            </div>
          </form>
        </div>
        <div class="card-grid three top-space">
          <article class="product-card">
            <h3>Descriptions</h3>
            <div id="description-grid" class="gallery-grid"></div>
          </article>
          <article class="product-card">
            <h3>Partners & Emails</h3>
            <div id="partners-grid" class="gallery-grid"></div>
          </article>
          <article class="product-card">
            <h3>Reviews</h3>
            <div id="reviews-grid" class="gallery-grid"></div>
          </article>
        </div>
      </section>

      <section id="foundation" class="section reveal">
        <div class="section-heading">
          <p class="kicker">Step 8: Foundation</p>
          <h2>Mission, vision, and donor-trust model for measurable impact.</h2>
        </div>
        <div class="card-grid three bottom-space">
          <article class="product-card">
            <h3>Mission</h3>
            <p>Empower youth, support vulnerable groups, and build opportunities through culture and enterprise.</p>
          </article>
          <article class="product-card">
            <h3>Vision</h3>
            <p>A united Kenya where talent, dignity, and inclusive growth are accessible to all communities.</p>
          </article>
          <article class="product-card">
            <h3>Trust Promise</h3>
            <p>Transparent reporting, clear programs, and accountable partnerships with donors and institutions.</p>
          </article>
        </div>
        <div class="split">
          <div class="foundation-card">
            <p>
              The foundation arm runs transparent charity programs, publishes impact reports, and
              executes MoUs with schools, companies, and development partners.
            </p>
            <div class="pillars">
              <span>Youth Mentorship</span>
              <span>PWD Inclusion</span>
              <span>Talent Scholarships</span>
              <span>Faith & Values Programs</span>
            </div>
          </div>
          <form class="inquiry-form" id="partner-form">
            <h3>MOU / Donor Partnership Inquiry</h3>
            <label>Organization <input type="text" required /></label>
            <label>Email <input type="email" required /></label>
            <label>Partnership Goal <input type="text" required /></label>
            <label>Message <textarea rows="4"></textarea></label>
            <button class="btn btn-primary" type="submit">Submit Partnership Request</button>
          </form>
        </div>
      </section>

      <!--
        FUTURE IDEA (MANUAL ENABLE LATER):
        Furniture vertical (rustic + custom premium).
        Keep hidden for now until pricing, supplier mapping, and fulfillment process are finalized.
      -->

      <section id="contact" class="section reveal">
        <div class="section-heading">
          <p class="kicker">Contact</p>
          <h2>Let us build this culture together.</h2>
        </div>
        <div class="card-grid three">
          <article class="product-card">
            <h3>Leadership Office</h3>
            <p>Cowboys Group Holdings Team</p>
          </article>
          <article class="product-card">
            <h3>Email</h3>
            <p><a href="mailto:justuskinyua98@gmail.com">justuskinyua98@gmail.com</a></p>
          </article>
          <article class="product-card">
            <h3>Phone</h3>
            <p><a href="tel:+254793791623">+254 793 791 623</a></p>
          </article>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <p>© <span id="year"></span> Cowboys Group Holdings. Kenya United: faith-led, inclusive, culture-strong.</p>
    </footer>

    <script src="script.js"></script>
  </body>
</html>
```

## 8) data/content.json

```json
{
  "brand": {
    "name": "Cowboys Group Holdings",
    "tagline": "Culture. Business. Legacy.",
    "faith_statement": "Faith-led leadership, honest business, and community stewardship."
  },
  "socials": [
    {
      "id": "social-teddy-ig",
      "platform": "Instagram",
      "handle": "Teddy Otieno",
      "url": "https://www.instagram.com/teddy0tieno?igsh=MXV2cDVyNW9vbzJucQ=="
    },
    {
      "id": "social-teddy-tt",
      "platform": "TikTok",
      "handle": "Teddy Otieno",
      "url": "https://www.tiktok.com/@teddy0tieno"
    },
    {
      "id": "social-aaron-ig",
      "platform": "Instagram",
      "handle": "Aaron Sang",
      "url": "https://www.instagram.com/aaron_sang_?igsh=MW5qYWRzd2dremh5OQ=="
    },
    {
      "id": "social-aaron-tt",
      "platform": "TikTok",
      "handle": "Aaron Sang",
      "url": "https://www.tiktok.com/@aaronksang?_r=1&_t=ZS-94KfzZFkM7h"
    },
    {
      "id": "social-justus-fb",
      "platform": "Facebook",
      "handle": "Justus Kinyua",
      "url": "https://www.facebook.com/share/1KoyUwx134/"
    },
    {
      "id": "social-justus-tt",
      "platform": "TikTok",
      "handle": "Justus Kinyua",
      "url": "https://vm.tiktok.com/ZS9eoF6s5E3L6-mSwNl/"
    },
    {
      "id": "social-justus-ig",
      "platform": "Instagram",
      "handle": "Justus Kinyua",
      "url": "https://www.instagram.com/gymie.fitness?igsh=MWo1bHBiOHk5Mm1zOQ=="
    }
  ],
  "team": [
    {
      "id": "team-1",
      "name": "Justus Kinyua",
      "role": "Chief Executive Officer (CEO)",
      "photo": "assets/team/justus-kinyua.jpeg",
      "bio": "Leading Cowboys Group Holdings strategy, partnerships, and growth."
    },
    {
      "id": "team-2",
      "name": "Teddy Otieno",
      "role": "Chief Financial Officer (CFO)",
      "photo": "assets/team/teddy-otieno.jpg",
      "bio": "Overseeing financial planning, controls, and sustainable business performance."
    },
    {
      "id": "team-3",
      "name": "Aaron Sang",
      "role": "Chief Marketing Officer (CMO)",
      "photo": "assets/team/aaron-sang.jpg",
      "bio": "Driving brand, campaigns, and audience growth across all company ventures."
    }
  ],
  "videos": [
    {
      "id": "video-1",
      "title": "Ranch Life Preview",
      "src": "assets/videos/ranch-life-preview.mp4",
      "poster": "assets/events/event-nairobi-ranch-night.jpg",
      "category": "ranch"
    },
    {
      "id": "video-2",
      "title": "Events Highlight Reel",
      "src": "assets/videos/events-highlight-reel.mov",
      "poster": "assets/events/event-western-family-sunday.jpg",
      "category": "events"
    },
    {
      "id": "video-3",
      "title": "Livestock Market Reel",
      "src": "assets/videos/livestock-market-reel.mov",
      "poster": "assets/livestock/livestock-cattle-prime.jpg",
      "category": "livestock"
    },
    {
      "id": "video-4",
      "title": "Cowboys Fashion Reel",
      "src": "assets/videos/fashion-reel.mov",
      "poster": "assets/outfits/adults-ranch-jacket.jpg",
      "category": "fashion"
    }
  ],
  "decor": [
    {
      "id": "decor-1",
      "name": "Rustic Event Decor Package",
      "category": "Service",
      "price_kes": 25000,
      "description": "Full setup for weddings, launches, private parties, and western-themed events.",
      "image": "assets/placeholders/decor.svg"
    },
    {
      "id": "decor-2",
      "name": "Fresh Flower Ceremony Bundle",
      "category": "Fresh Flowers",
      "price_kes": 8500,
      "description": "Fresh flower curation for events and home gifting.",
      "image": "assets/placeholders/decor.svg"
    },
    {
      "id": "decor-3",
      "name": "Rustic Home Accent Set",
      "category": "Rustic Decor",
      "price_kes": 6200,
      "description": "Handpicked pieces for homes, restaurants, and lodge interiors.",
      "image": "assets/placeholders/decor.svg"
    }
  ],
  "outfits": [
    {
      "id": "adult-1",
      "collection": "adults",
      "name": "Cowboys Heritage Denim Shirt",
      "price": 4200,
      "image": "assets/outfits/adults-heritage-denim.jpg",
      "description": "Premium western-inspired adult fit"
    },
    {
      "id": "adult-2",
      "collection": "adults",
      "name": "Ranch Work Jacket",
      "price": 6800,
      "image": "assets/outfits/adults-ranch-jacket.jpg",
      "description": "All-season rugged jacket for ranch and city wear"
    },
    {
      "id": "kids-1",
      "collection": "kids",
      "name": "Little Rider Weekend Set",
      "price": 3200,
      "image": "assets/outfits/kids-little-rider.jpg",
      "description": "Kids-friendly fabric with playful western styling"
    },
    {
      "id": "kids-2",
      "collection": "kids",
      "name": "Kids Rodeo Hoodie",
      "price": 2800,
      "image": "assets/outfits/kids-rodeo-hoodie.jpeg",
      "description": "Warm and durable hoodie for active children"
    },
    {
      "id": "acc-1",
      "collection": "accessories",
      "name": "Heritage Leather Belt",
      "price": 3500,
      "image": "assets/outfits/accessories-heritage-belt.jpeg",
      "description": "Hand-finished leather belt"
    },
    {
      "id": "acc-2",
      "collection": "accessories",
      "name": "Bull Horn Signature Cap",
      "price": 1800,
      "image": "assets/outfits/accessories-bull-horn-cap.jpeg",
      "description": "Daily wear cap with culture-forward mark"
    }
  ],
  "events": [
    {
      "id": "event-1",
      "title": "Nairobi Ranch Night Experience",
      "date": "2026-12-18",
      "venue": "Karen, Nairobi",
      "performers": "Live Band + DJ + Dance Crew",
      "ticket_kes": 2000,
      "poster": "assets/events/event-nairobi-ranch-night.jpg"
    },
    {
      "id": "event-2",
      "title": "Western Family Sunday",
      "date": "2026-12-27",
      "venue": "Naivasha Grounds",
      "performers": "Kids Dance, MC, Live Entertainment",
      "ticket_kes": 1200,
      "poster": "assets/events/event-western-family-sunday.jpg"
    },
    {
      "id": "event-3",
      "title": "Classic Cars & Cowboys Showcase",
      "date": "2026-11-07",
      "venue": "Nairobi Motor Hub",
      "performers": "Car Clubs, Motorcycle Clubs, Guest Artists",
      "ticket_kes": 1500,
      "poster": "assets/events/event-classic-cars-showcase.jpg"
    }
  ],
  "livestock": [
    {
      "id": "stock-1",
      "name": "Goat - Premium Festive",
      "weight_kg": 38,
      "rate_per_kg_kes": 680,
      "status": "Available",
      "image": "assets/livestock/livestock-goat-premium.jpg"
    },
    {
      "id": "stock-2",
      "name": "Goat - Standard Select",
      "weight_kg": 31,
      "rate_per_kg_kes": 620,
      "status": "Available",
      "image": "assets/livestock/livestock-goat-standard.jpg"
    },
    {
      "id": "stock-3",
      "name": "Cattle - Prime Butchery Grade",
      "weight_kg": 290,
      "rate_per_kg_kes": 470,
      "status": "Limited",
      "image": "assets/livestock/livestock-cattle-prime.jpg"
    }
  ],
  "descriptions": [
    {
      "id": "desc-1",
      "title": "Community-First Ecosystem",
      "text": "Built with creators, ranchers, families, and partners for shared growth and trusted collaboration."
    },
    {
      "id": "desc-2",
      "title": "Kids Corner Commitment",
      "text": "A safe and joyful experience for children through family events, age-appropriate fashion, and talent growth pathways."
    },
    {
      "id": "desc-3",
      "title": "Inclusive Kenya Commitment",
      "text": "Open to youth, adults, PWD communities, small businesses, and large institutions across Kenya and beyond."
    }
  ],
  "partners": [
    {
      "id": "partner-1",
      "name": "Ranchers & Livestock Network",
      "email": "partnerships@cowboysgroupholdings.co.ke",
      "description": "Seasonal goat and cattle collaboration for festive commerce."
    },
    {
      "id": "partner-2",
      "name": "Events & Artist Collaboration Desk",
      "email": "events@cowboysgroupholdings.co.ke",
      "description": "Talent booking, event production, and entertainment partnerships."
    },
    {
      "id": "partner-3",
      "name": "Foundation Partnerships Unit",
      "email": "foundation@cowboysgroupholdings.co.ke",
      "description": "MoUs, donor partnerships, and social impact programs."
    }
  ],
  "reviews": [
    {
      "id": "review-1",
      "name": "Community Member",
      "text": "The platform is clear, welcoming, and truly reflects Kenyan culture.",
      "rating": 5
    },
    {
      "id": "review-2",
      "name": "Event Client",
      "text": "Ticketing, decor, and communication were smooth from start to finish.",
      "rating": 5
    },
    {
      "id": "review-3",
      "name": "Family Shopper",
      "text": "Kids and adult apparel sections are easy to browse and very practical.",
      "rating": 5
    }
  ]
}
```

## 9) SEO Files

### robots.txt

```txt
User-agent: *
Allow: /

Sitemap: https://cowboysgroupholdings.co.ke/sitemap.xml
```

### sitemap.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://cowboysgroupholdings.co.ke/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

## 10) Environment Template

```env
ADMIN_KEY=change-this-admin-key
PORT=8000
HOST=127.0.0.1

# Manual payment fallback
MANUAL_TILL_NUMBER=5628570
MANUAL_PAYEE_NAME=Cowboys Group Holdings

# Optional M-Pesa STK config
M_PESA_BASE_URL=https://sandbox.safaricom.co.ke
M_PESA_CONSUMER_KEY=
M_PESA_CONSUMER_SECRET=
M_PESA_SHORTCODE=
M_PESA_PASSKEY=
M_PESA_CALLBACK_URL=

# Optional payment expiry policy
MPESA_PENDING_TIMEOUT_MIN=20
MANUAL_PENDING_TIMEOUT_HOURS=48
```

---

End of codebook.
