const fs = require('fs');
const fsp = require('fs/promises');
const http = require('http');
const path = require('path');
const { URL } = require('url');
const dns = require('dns');
const crypto = require('crypto');

const ROOT = process.cwd();
const CONTENT_PATH = path.join(ROOT, 'data', 'content.json');
const PAYMENTS_PATH = path.join(ROOT, 'data', 'payments.json');
const DONATIONS_PATH = path.join(ROOT, 'data', 'donations.json');
const SUBSCRIBERS_PATH = path.join(ROOT, 'data', 'subscribers.json');
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
const FOUNDATION_PAYMENT = {
  tillNumber: process.env.FOUNDATION_TILL_NUMBER || '',
  paybillNumber: process.env.FOUNDATION_PAYBILL_NUMBER || '',
  accountNumber: process.env.FOUNDATION_ACCOUNT_NUMBER || '',
  bankName: process.env.FOUNDATION_BANK_NAME || '',
  bankAccountName: process.env.FOUNDATION_BANK_ACCOUNT_NAME || '',
  bankAccountNumber: process.env.FOUNDATION_BANK_ACCOUNT_NUMBER || '',
  bankBranch: process.env.FOUNDATION_BANK_BRANCH || '',
  bankSwift: process.env.FOUNDATION_BANK_SWIFT || ''
};
const PAYMENT_POLICY = {
  mpesaPendingTimeoutMin: Number(process.env.MPESA_PENDING_TIMEOUT_MIN || 20),
  manualPendingTimeoutHours: Number(process.env.MANUAL_PENDING_TIMEOUT_HOURS || 48)
};

const RATE_LIMIT_CONFIG = {
  checkout: { windowMs: 60_000, max: 20 },
  confirmManual: { windowMs: 60_000, max: 30 },
  mediaUpload: { windowMs: 60_000, max: 40 },
  donationSubmit: { windowMs: 60_000, max: 30 },
  donationAdmin: { windowMs: 60_000, max: 60 },
  subscribeSubmit: { windowMs: 60_000, max: 40 },
  subscribeAdmin: { windowMs: 60_000, max: 60 }
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

async function readDonations() {
  try {
    const raw = await fsp.readFile(DONATIONS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.donations)) return { donations: [] };
    return parsed;
  } catch {
    return { donations: [] };
  }
}

async function writeDonations(donations) {
  await fsp.writeFile(DONATIONS_PATH, JSON.stringify(donations, null, 2), 'utf8');
}

async function readSubscribers() {
  try {
    const raw = await fsp.readFile(SUBSCRIBERS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.subscribers)) return { subscribers: [] };
    return parsed;
  } catch {
    return { subscribers: [] };
  }
}

async function writeSubscribers(payload) {
  await fsp.writeFile(SUBSCRIBERS_PATH, JSON.stringify(payload, null, 2), 'utf8');
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

function sanitizeEmail(value) {
  return String(value || '').trim().toLowerCase().slice(0, 200);
}

function sanitizePhone(value) {
  return normalizeKenyanPhone(String(value || '').trim()).slice(0, 20);
}

function makeDonationReference(id) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const suffix = String(id || '').replace(/^donation-/, '').slice(-6);
  return `CGH-DON-${y}${m}${day}-${suffix}`;
}

function donationToReceipt(donation) {
  return {
    receipt_number: donation.donation_reference || makeDonationReference(donation.id),
    donation_id: donation.id,
    name: donation.name,
    email: donation.email,
    phone: donation.phone,
    amount_kes: donation.amount_kes,
    method: donation.method,
    status: donation.status,
    reference_code: donation.reference_code || null,
    created_at: donation.created_at,
    confirmed_at: donation.confirmed_at || null,
    message: donation.message || null
  };
}

function makeSubscriberId() {
  return `sub-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function makeSubscriberToken(email) {
  const seed = `${String(email || '').toLowerCase()}-${Date.now()}-${Math.random()}`;
  return Buffer.from(seed).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
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

function buildTicketCode(existingCodes) {
  let code = '';
  do {
    const day = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const randA = crypto.randomBytes(6).toString('hex').toUpperCase();
    const randB = crypto.randomBytes(4).toString('hex').toUpperCase();
    code = `CGH-TKT-${day}-${randA}-${randB}`;
  } while (existingCodes.has(code));
  existingCodes.add(code);
  return code;
}

function collectExistingTicketCodes(payments) {
  const set = new Set();
  for (const order of payments?.orders || []) {
    for (const ticket of order?.tickets || []) {
      if (ticket?.code) set.add(String(ticket.code).toUpperCase());
    }
  }
  return set;
}

function buildTicketsFromItems(orderId, items, status, existingCodes) {
  const tickets = [];
  let serial = 1;
  items.forEach((item) => {
    if (item.kind !== 'ticket') return;
    const qty = Math.max(1, Number(item.qty || 1));
    for (let i = 0; i < qty; i += 1) {
      tickets.push({
        id: `${orderId}-ticket-${serial}`,
        code: buildTicketCode(existingCodes),
        event_name: item.name,
        status: status === 'paid' ? 'issued' : 'pending_payment',
        issued_at: status === 'paid' ? new Date().toISOString() : null,
        redeemed_at: null,
        redeemed_by: null
      });
      serial += 1;
    }
  });
  return tickets;
}

function findTicketByCode(payments, code) {
  const target = String(code || '').trim().toUpperCase();
  if (!target) return null;
  for (const order of payments?.orders || []) {
    const tickets = Array.isArray(order?.tickets) ? order.tickets : [];
    for (let i = 0; i < tickets.length; i += 1) {
      const ticket = tickets[i];
      if (String(ticket?.code || '').toUpperCase() === target) {
        return { order, ticket, ticketIndex: i };
      }
    }
  }
  return null;
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

  if (req.method === 'GET' && urlObj.pathname === '/api/donations/config') {
    return sendJson(res, 200, {
      methods: ['manual'],
      manual: {
        till_number: FOUNDATION_PAYMENT.tillNumber || MANUAL_PAYMENT.tillNumber,
        paybill_number: FOUNDATION_PAYMENT.paybillNumber,
        account_number: FOUNDATION_PAYMENT.accountNumber,
        bank_name: FOUNDATION_PAYMENT.bankName,
        bank_account_name: FOUNDATION_PAYMENT.bankAccountName,
        bank_account_number: FOUNDATION_PAYMENT.bankAccountNumber,
        bank_branch: FOUNDATION_PAYMENT.bankBranch,
        bank_swift: FOUNDATION_PAYMENT.bankSwift
      }
    });
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/subscribers') {
    const rate = hitRateLimit(req, 'subscribe-submit', RATE_LIMIT_CONFIG.subscribeSubmit);
    if (rate.limited) {
      res.setHeader('Retry-After', String(rate.retryAfterSec));
      return sendJson(res, 429, { error: 'Too many subscribe attempts. Please retry shortly.' });
    }

    try {
      const raw = await readBody(req);
      const payload = parseJson(raw);
      if (!payload || typeof payload !== 'object') return sendJson(res, 400, { error: 'Invalid JSON body.' });

      const name = String(payload.name || '').trim().slice(0, 120);
      const email = sanitizeEmail(payload.email);
      const consent = Boolean(payload.consent);
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJson(res, 400, { error: 'Valid email is required.' });
      }
      if (!consent) return sendJson(res, 400, { error: 'Consent is required to subscribe.' });

      const subscribers = await readSubscribers();
      const existing = subscribers.subscribers.find((x) => String(x.email || '').toLowerCase() === email);
      if (existing) {
        existing.name = name || existing.name || null;
        existing.status = 'active';
        existing.updated_at = new Date().toISOString();
        existing.consent = true;
        await writeSubscribers(subscribers);
        return sendJson(res, 200, { ok: true, status: 'active', message: 'Subscription updated.' });
      }

      const record = {
        id: makeSubscriberId(),
        name: name || null,
        email,
        status: 'active',
        consent: true,
        source: 'website',
        unsubscribe_token: makeSubscriberToken(email),
        created_at: new Date().toISOString(),
        updated_at: null
      };
      subscribers.subscribers.unshift(record);
      await writeSubscribers(subscribers);
      return sendJson(res, 200, { ok: true, subscriber_id: record.id, status: record.status });
    } catch (err) {
      return sendJson(res, 400, { error: 'Invalid subscriber payload', detail: err.message });
    }
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/subscribers/unsubscribe') {
    const rate = hitRateLimit(req, 'subscribe-submit', RATE_LIMIT_CONFIG.subscribeSubmit);
    if (rate.limited) {
      res.setHeader('Retry-After', String(rate.retryAfterSec));
      return sendJson(res, 429, { error: 'Too many unsubscribe attempts. Please retry shortly.' });
    }
    try {
      const raw = await readBody(req);
      const payload = parseJson(raw, {});
      const email = sanitizeEmail(payload.email);
      if (!email) return sendJson(res, 400, { error: 'Email is required.' });
      const subscribers = await readSubscribers();
      const found = subscribers.subscribers.find((x) => String(x.email || '').toLowerCase() === email);
      if (!found) return sendJson(res, 404, { error: 'Subscriber not found.' });
      found.status = 'unsubscribed';
      found.updated_at = new Date().toISOString();
      await writeSubscribers(subscribers);
      return sendJson(res, 200, { ok: true, status: found.status });
    } catch (err) {
      return sendJson(res, 400, { error: 'Invalid unsubscribe payload', detail: err.message });
    }
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/subscribers') {
    const rate = hitRateLimit(req, 'subscribe-admin', RATE_LIMIT_CONFIG.subscribeAdmin);
    if (rate.limited) {
      res.setHeader('Retry-After', String(rate.retryAfterSec));
      return sendJson(res, 429, { error: 'Too many requests. Please retry shortly.' });
    }
    if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' });
    const status = String(urlObj.searchParams.get('status') || '').trim().toLowerCase();
    const limit = Math.max(1, Math.min(2000, Number(urlObj.searchParams.get('limit') || 500)));
    const subscribers = await readSubscribers();
    let rows = Array.isArray(subscribers.subscribers) ? subscribers.subscribers.slice() : [];
    if (status) rows = rows.filter((x) => String(x.status || '') === status);
    rows = rows.slice(0, limit);
    return sendJson(res, 200, { ok: true, count: rows.length, subscribers: rows });
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/donations') {
    const rate = hitRateLimit(req, 'donation-submit', RATE_LIMIT_CONFIG.donationSubmit);
    if (rate.limited) {
      res.setHeader('Retry-After', String(rate.retryAfterSec));
      return sendJson(res, 429, { error: 'Too many donation attempts. Please retry shortly.' });
    }

    try {
      const raw = await readBody(req);
      const payload = parseJson(raw);
      if (!payload || typeof payload !== 'object') {
        return sendJson(res, 400, { error: 'Invalid JSON body.' });
      }

      const amountKes = Math.round(Number(payload.amount_kes || 0));
      const donorName = String(payload.name || '').trim().slice(0, 120);
      const donorEmail = sanitizeEmail(payload.email);
      const donorPhone = sanitizePhone(payload.phone);
      const donorMessage = String(payload.message || '').trim().slice(0, 1200);
      const method = String(payload.method || 'manual').trim().toLowerCase();

      if (!donorName) return sendJson(res, 400, { error: 'Donor name is required.' });
      if (!Number.isFinite(amountKes) || amountKes < 1) return sendJson(res, 400, { error: 'Amount must be at least KES 1.' });
      if (donorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) {
        return sendJson(res, 400, { error: 'Invalid email format.' });
      }
      if (donorPhone && !/^254\d{9}$/.test(donorPhone)) {
        return sendJson(res, 400, { error: 'Use a valid Kenyan phone format like 254712345678.' });
      }
      if (method !== 'manual') return sendJson(res, 400, { error: 'Invalid donation method.' });

      const donations = await readDonations();
      const donation = {
        id: `donation-${Date.now()}`,
        donation_reference: null,
        name: donorName,
        email: donorEmail || null,
        phone: donorPhone || null,
        amount_kes: amountKes,
        method,
        status: 'awaiting_confirmation',
        message: donorMessage || null,
        created_at: new Date().toISOString(),
        confirmed_at: null,
        reference_code: null
      };
      donation.donation_reference = makeDonationReference(donation.id);
      donations.donations.unshift(donation);
      await writeDonations(donations);

      return sendJson(res, 200, {
        ok: true,
        donation_id: donation.id,
        donation_reference: donation.donation_reference,
        status: donation.status,
        message: 'Donation pledge received. Complete payment using the foundation account details.'
      });
    } catch (err) {
      return sendJson(res, 400, { error: 'Invalid donation payload', detail: err.message });
    }
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/donations') {
    const rate = hitRateLimit(req, 'donation-admin', RATE_LIMIT_CONFIG.donationAdmin);
    if (rate.limited) {
      res.setHeader('Retry-After', String(rate.retryAfterSec));
      return sendJson(res, 429, { error: 'Too many requests. Please retry shortly.' });
    }
    if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' });
    const limit = Math.max(1, Math.min(500, Number(urlObj.searchParams.get('limit') || 100)));
    const donations = await readDonations();
    return sendJson(res, 200, {
      ok: true,
      count: donations.donations.length,
      donations: donations.donations.slice(0, limit)
    });
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/donations/receipt') {
    const donationId = String(urlObj.searchParams.get('donation_id') || '').trim();
    if (!donationId) return sendJson(res, 400, { error: 'donation_id is required' });
    const donations = await readDonations();
    const item = donations.donations.find((x) => x.id === donationId);
    if (!item) return sendJson(res, 404, { error: 'Donation not found' });
    if (!item.donation_reference) {
      item.donation_reference = makeDonationReference(item.id);
      await writeDonations(donations);
    }
    return sendJson(res, 200, { ok: true, receipt: donationToReceipt(item) });
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/donations/confirm') {
    const rate = hitRateLimit(req, 'donation-admin', RATE_LIMIT_CONFIG.donationAdmin);
    if (rate.limited) {
      res.setHeader('Retry-After', String(rate.retryAfterSec));
      return sendJson(res, 429, { error: 'Too many requests. Please retry shortly.' });
    }
    if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' });

    try {
      const raw = await readBody(req);
      const payload = parseJson(raw || '{}', {});
      const donationId = String(payload.donation_id || '').trim();
      const referenceCode = String(payload.reference_code || '').trim().toUpperCase().slice(0, 80);
      if (!donationId) return sendJson(res, 400, { error: 'donation_id is required.' });
      if (!referenceCode) return sendJson(res, 400, { error: 'reference_code is required.' });

      const donations = await readDonations();
      const item = donations.donations.find((x) => x.id === donationId);
      if (!item) return sendJson(res, 404, { error: 'Donation not found.' });
      if (item.status === 'confirmed') return sendJson(res, 409, { error: 'Donation already confirmed.' });

      item.status = 'confirmed';
      item.confirmed_at = new Date().toISOString();
      item.reference_code = referenceCode;
      await writeDonations(donations);
      return sendJson(res, 200, { ok: true, donation_id: item.id, status: item.status });
    } catch (err) {
      return sendJson(res, 400, { error: 'Invalid confirmation payload', detail: err.message });
    }
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
      const existingCodes = collectExistingTicketCodes(payments);
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
      order.tickets = buildTicketsFromItems(order.id, order.items, order.status, existingCodes);

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
        order.tickets = order.tickets.map((t) => ({ ...t, status: 'issued', issued_at: new Date().toISOString() }));
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

  if (req.method === 'POST' && urlObj.pathname === '/api/tickets/verify') {
    const rate = hitRateLimit(req, 'ticket-verify', RATE_LIMIT_CONFIG.confirmManual);
    if (rate.limited) {
      res.setHeader('Retry-After', String(rate.retryAfterSec));
      return sendJson(res, 429, { error: 'Too many verification attempts. Please retry shortly.' });
    }
    if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' });

    try {
      const raw = await readBody(req);
      const payload = parseJson(raw || '{}', {});
      const code = String(payload.code || '').trim().toUpperCase();
      const action = String(payload.action || 'check').trim().toLowerCase();
      const gate = String(payload.gate || 'entry').trim().slice(0, 64);
      if (!code) return sendJson(res, 400, { error: 'Ticket code is required.' });
      if (!['check', 'redeem'].includes(action)) return sendJson(res, 400, { error: 'action must be check or redeem.' });

      const payments = await readPayments();
      if (applyExpiryToAllOrders(payments)) {
        await writePayments(payments);
      }
      const found = findTicketByCode(payments, code);
      if (!found) return sendJson(res, 404, { ok: false, valid: false, error: 'Ticket not found.' });

      const { order, ticket, ticketIndex } = found;
      if (order.status !== 'paid') {
        return sendJson(res, 409, {
          ok: false,
          valid: false,
          code,
          status: ticket.status,
          event_name: ticket.event_name,
          order_id: order.id,
          message: 'Ticket exists but payment is not confirmed.'
        });
      }

      if (action === 'check') {
        return sendJson(res, 200, {
          ok: true,
          valid: ticket.status === 'issued' || ticket.status === 'redeemed',
          code,
          status: ticket.status,
          event_name: ticket.event_name,
          order_id: order.id,
          redeemed_at: ticket.redeemed_at || null,
          redeemed_by: ticket.redeemed_by || null
        });
      }

      if (ticket.status === 'redeemed') {
        return sendJson(res, 409, {
          ok: false,
          valid: false,
          code,
          status: ticket.status,
          event_name: ticket.event_name,
          order_id: order.id,
          redeemed_at: ticket.redeemed_at || null,
          redeemed_by: ticket.redeemed_by || null,
          message: 'Ticket already used at entry.'
        });
      }

      if (ticket.status !== 'issued') {
        return sendJson(res, 409, {
          ok: false,
          valid: false,
          code,
          status: ticket.status,
          event_name: ticket.event_name,
          order_id: order.id,
          message: 'Ticket is not ready for redemption.'
        });
      }

      const now = new Date().toISOString();
      order.tickets[ticketIndex] = {
        ...ticket,
        status: 'redeemed',
        redeemed_at: now,
        redeemed_by: gate
      };
      await writePayments(payments);

      return sendJson(res, 200, {
        ok: true,
        valid: true,
        redeemed: true,
        code,
        status: 'redeemed',
        event_name: ticket.event_name,
        order_id: order.id,
        redeemed_at: now,
        redeemed_by: gate
      });
    } catch (err) {
      return sendJson(res, 400, { error: 'Invalid ticket verification payload', detail: err.message });
    }
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
            order.tickets = order.tickets.map((t) => ({ ...t, status: 'issued', issued_at: new Date().toISOString() }));
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
  try {
    await fsp.access(DONATIONS_PATH);
  } catch {
    await writeDonations({ donations: [] });
  }
  try {
    await fsp.access(SUBSCRIBERS_PATH);
  } catch {
    await writeSubscribers({ subscribers: [] });
  }

  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log('Set ADMIN_KEY and M-PESA env vars before production use.');
});
