const PLACEHOLDER_IMAGE = "assets/logo-mark.svg";
const OUTFIT_KEY = "cgh_outfits_v1";
const GA4_KEY = "cgh_ga4_id";
const META_PIXEL_KEY = "cgh_meta_pixel_id";

const defaultContent = {
  socials: [
    { id: "social-justus-ig", platform: "Instagram", url: "https://www.instagram.com/gymie.fitness?igsh=MWo1bHBiOHk5Mm1zOQ==", handle: "Justus Kinyua" },
    { id: "social-justus-tt", platform: "TikTok", url: "https://vm.tiktok.com/ZS9eoF6s5E3L6-mSwNl/", handle: "Justus Kinyua" },
    { id: "social-justus-fb", platform: "Facebook", url: "https://www.facebook.com/share/1KoyUwx134/", handle: "Justus Kinyua" },
    { id: "social-justus-wa", platform: "WhatsApp", url: "https://wa.me/254793791623", handle: "+254 793 791 623" }
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
  lastReceipt: null,
  lastDonationId: "",
  lastDonationReceipt: null
};

const isLowPowerDevice = (() => {
  const cores = Number(navigator.hardwareConcurrency || 0);
  const mem = Number(navigator.deviceMemory || 0);
  return (cores > 0 && cores <= 4) || (mem > 0 && mem <= 4);
})();

const el = {
  year: document.getElementById("year"),
  navToggle: document.querySelector(".menu-toggle"),
  nav: document.querySelector(".main-nav"),
  adminKey: document.getElementById("admin-key"),
  adminKeyFoundation: document.getElementById("admin-key-foundation"),
  adminKeySubscribers: document.getElementById("admin-key-subscribers"),
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
  quickSocialLinks: document.getElementById("quick-social-links"),
  contactSocialLinks: document.getElementById("contact-social-links"),
  whatsappChatFloat: document.getElementById("whatsapp-chat-float"),
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
  bbqInquiry: document.getElementById("bbq-inquiry"),
  donorForm: document.getElementById("partner-form")
  ,
  donationForm: document.getElementById("donation-form"),
  donationMethod: document.getElementById("donation-method"),
  donationName: document.getElementById("donation-name"),
  donationEmail: document.getElementById("donation-email"),
  donationPhone: document.getElementById("donation-phone"),
  donationAmount: document.getElementById("donation-amount"),
  donationMessage: document.getElementById("donation-message"),
  donationStatus: document.getElementById("donation-status"),
  donationPaymentDetails: document.getElementById("donation-payment-details"),
  downloadDonationsBtn: document.getElementById("download-donations-btn"),
  downloadDonationReceiptBtn: document.getElementById("download-donation-receipt-btn"),
  donationConfirmForm: document.getElementById("donation-confirm-form"),
  donationConfirmId: document.getElementById("donation-confirm-id"),
  donationConfirmRef: document.getElementById("donation-confirm-ref"),
  donationAdminList: document.getElementById("donation-admin-list"),
  subscriberForm: document.getElementById("subscriber-form"),
  subscriberName: document.getElementById("subscriber-name"),
  subscriberEmail: document.getElementById("subscriber-email"),
  subscriberConsent: document.getElementById("subscriber-consent"),
  subscriberStatus: document.getElementById("subscriber-status"),
  downloadSubscribersBtn: document.getElementById("download-subscribers-btn"),
  refreshSubscribersBtn: document.getElementById("refresh-subscribers-btn"),
  subscriberAdminList: document.getElementById("subscriber-admin-list"),
  trackingForm: document.getElementById("tracking-form"),
  ga4Id: document.getElementById("ga4-id"),
  metaPixelId: document.getElementById("meta-pixel-id"),
  trackingStatus: document.getElementById("tracking-status"),
  quickCheckoutPanels: Array.from(document.querySelectorAll(".quick-checkout-panel")),
  globalSearchForm: document.getElementById("global-search-form"),
  globalSearchInput: document.getElementById("global-search-input"),
  globalSearchResults: document.getElementById("global-search-results")
};

function formatKes(value) {
  return `KES ${Number(value || 0).toLocaleString("en-KE")}`;
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function debounce(fn, delay = 160) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

function adminKey() {
  return (el.adminKey?.value || el.adminKeyFoundation?.value || "").trim();
}

function setAdminKeyEverywhere(value) {
  const key = String(value || "").trim();
  if (el.adminKey) el.adminKey.value = key;
  if (el.adminKeyFoundation) el.adminKeyFoundation.value = key;
  if (el.adminKeySubscribers) el.adminKeySubscribers.value = key;
  return key;
}

function ensureAdminKey(actionLabel = "continue") {
  const current = adminKey();
  if (current) return current;
  const entered = window.prompt(`Enter admin key to ${actionLabel}:`) || "";
  return setAdminKeyEverywhere(entered);
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

function requireAdminForEdit(actionLabel = "edit content") {
  if (adminKey()) return true;
  toast(`Enter admin key to ${actionLabel}.`, "warn");
  return false;
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
  if (Array.isArray(el.quickCheckoutPanels)) {
    el.quickCheckoutPanels.forEach((panel) => {
      const statusNode = panel.querySelector(".quick-payment-status");
      if (statusNode) statusNode.textContent = msg;
    });
  }
}

function setPaymentHint(msg) {
  if (el.paymentHint) el.paymentHint.textContent = msg;
}

function setDonationStatus(msg) {
  if (el.donationStatus) el.donationStatus.textContent = msg;
}

function setSubscriberStatus(msg) {
  if (el.subscriberStatus) el.subscriberStatus.textContent = msg;
}

function setTrackingStatus(msg) {
  if (el.trackingStatus) el.trackingStatus.textContent = msg;
}

function injectGa4(measurementId) {
  if (!measurementId || document.getElementById("ga4-loader")) return;
  const src = document.createElement("script");
  src.id = "ga4-loader";
  src.async = true;
  src.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(src);

  const inline = document.createElement("script");
  inline.id = "ga4-inline";
  inline.textContent = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${measurementId}');`;
  document.head.appendChild(inline);
}

function injectMetaPixel(pixelId) {
  if (!pixelId || document.getElementById("meta-pixel-inline")) return;
  const script = document.createElement("script");
  script.id = "meta-pixel-inline";
  script.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${pixelId}');fbq('track', 'PageView');`;
  document.head.appendChild(script);
}

function loadTrackingSettings() {
  const ga4 = String(localStorage.getItem(GA4_KEY) || "").trim();
  const pixel = String(localStorage.getItem(META_PIXEL_KEY) || "").trim();
  if (el.ga4Id) el.ga4Id.value = ga4;
  if (el.metaPixelId) el.metaPixelId.value = pixel;
  if (ga4) injectGa4(ga4);
  if (pixel) injectMetaPixel(pixel);
  setTrackingStatus(ga4 || pixel ? "Tracking IDs loaded." : "Tracking not configured yet.");
}

function saveTrackingSettings() {
  const ga4 = String(el.ga4Id?.value || "").trim();
  const pixel = String(el.metaPixelId?.value || "").trim();
  if (ga4) localStorage.setItem(GA4_KEY, ga4); else localStorage.removeItem(GA4_KEY);
  if (pixel) localStorage.setItem(META_PIXEL_KEY, pixel); else localStorage.removeItem(META_PIXEL_KEY);
  if (ga4) injectGa4(ga4);
  if (pixel) injectMetaPixel(pixel);
  setTrackingStatus("Tracking IDs saved.");
  toast("Tracking configuration saved.", "ok");
}

function laneFromKind(kind) {
  if (kind === "ticket") return "Tickets";
  if (kind === "livestock") return "Livestock";
  if (kind === "bbq") return "BBQ";
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

function buildDonationReceiptHtml(receipt) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Donation Receipt ${receipt.receipt_number}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
    .box { border: 1px solid #ddd; border-radius: 8px; padding: 14px; }
  </style>
</head>
<body>
  <h1>Cowboys Group Holdings Foundation</h1>
  <h2>Donation Receipt</h2>
  <div class="box">
    <p><strong>Receipt No:</strong> ${receipt.receipt_number}</p>
    <p><strong>Donation ID:</strong> ${receipt.donation_id}</p>
    <p><strong>Status:</strong> ${receipt.status}</p>
    <p><strong>Donor:</strong> ${receipt.name || "N/A"}</p>
    <p><strong>Email:</strong> ${receipt.email || "N/A"}</p>
    <p><strong>Phone:</strong> ${receipt.phone || "N/A"}</p>
    <p><strong>Amount:</strong> ${formatKes(receipt.amount_kes || 0)}</p>
    <p><strong>Payment Method:</strong> ${receipt.method || "manual"}</p>
    <p><strong>Payment Reference:</strong> ${receipt.reference_code || "Pending confirmation"}</p>
    <p><strong>Submitted:</strong> ${formatDateTime(receipt.created_at)}</p>
    <p><strong>Confirmed:</strong> ${formatDateTime(receipt.confirmed_at)}</p>
    <p><strong>Message:</strong> ${receipt.message || "N/A"}</p>
  </div>
</body>
</html>`;
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
  return `<img class="outfit-image expandable-media" src="${mediaSrc(path)}" alt="${alt}" loading="lazy" onerror="this.onerror=null;this.src='${mediaSrc(PLACEHOLDER_IMAGE)}'">`;
}

function renderCart() {
  if (!el.cartItems || !el.cartTotal || !el.cartCount) return;
  el.cartItems.innerHTML = "";
  if (el.cartLane) el.cartLane.textContent = cartLaneName();

  if (!state.cart.length) {
    el.cartItems.appendChild(emptyNode("Cart is empty."));
    el.cartTotal.textContent = "KES 0";
    el.cartCount.textContent = "0";
    renderQuickCheckoutPanels();
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
  renderQuickCheckoutPanels();
}

function syncPaymentInputs(methodValue, phoneValue, sourcePanel = null) {
  const method = String(methodValue || "manual");
  const phone = String(phoneValue || "").trim();
  if (el.paymentMethod) el.paymentMethod.value = method;
  if (el.paymentPhone) el.paymentPhone.value = phone;
  if (!Array.isArray(el.quickCheckoutPanels)) return;
  el.quickCheckoutPanels.forEach((panel) => {
    if (sourcePanel && panel === sourcePanel) return;
    const methodNode = panel.querySelector(".quick-payment-method");
    const phoneNode = panel.querySelector(".quick-payment-phone");
    if (methodNode) methodNode.value = method;
    if (phoneNode) phoneNode.value = phone;
  });
}

function populateQuickPaymentMethods(methods = ["manual"]) {
  if (!Array.isArray(el.quickCheckoutPanels)) return;
  el.quickCheckoutPanels.forEach((panel) => {
    const select = panel.querySelector(".quick-payment-method");
    if (!select) return;
    const current = String(select.value || "");
    select.innerHTML = "";
    methods.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m === "mpesa" ? "M-Pesa (STK Push)" : "Manual M-Pesa (Till)";
      select.appendChild(opt);
    });
    select.value = methods.includes(current) ? current : methods[0];
  });
}

function renderQuickCheckoutPanels() {
  if (!Array.isArray(el.quickCheckoutPanels) || !el.quickCheckoutPanels.length) return;
  const currentLane = cartLaneName();
  const total = state.cart.reduce((sum, item) => sum + (Number(item.price || 0) * Math.max(1, Number(item.qty || 1))), 0);

  el.quickCheckoutPanels.forEach((panel) => {
    const laneTarget = String(panel.dataset.lane || "");
    const countNode = panel.querySelector(".quick-cart-count");
    const laneNode = panel.querySelector(".quick-cart-lane");
    const itemsNode = panel.querySelector(".quick-cart-items");
    const totalNode = panel.querySelector(".quick-cart-total");
    const placeNode = panel.querySelector(".quick-place-order");
    if (laneNode) laneNode.textContent = laneTarget;
    if (!countNode || !itemsNode || !totalNode) return;

    itemsNode.innerHTML = "";

    if (!state.cart.length) {
      countNode.textContent = "0";
      totalNode.textContent = "KES 0";
      itemsNode.appendChild(emptyNode(`${laneTarget} cart is empty.`));
      if (placeNode) placeNode.disabled = false;
      return;
    }

    if (currentLane !== laneTarget) {
      countNode.textContent = String(state.cart.length);
      totalNode.textContent = formatKes(total);
      itemsNode.appendChild(emptyNode(`Cart currently contains ${currentLane}. Complete or clear it first.`));
      if (placeNode) placeNode.disabled = true;
      return;
    }

    state.cart.forEach((item) => {
      const qty = Math.max(1, Number(item.qty || 1));
      const itemTotal = Number(item.price || 0) * qty;
      const li = document.createElement("li");
      li.textContent = `${item.name} x${qty} - ${formatKes(itemTotal)}`;
      itemsNode.appendChild(li);
    });
    countNode.textContent = String(state.cart.length);
    totalNode.textContent = formatKes(total);
    if (placeNode) placeNode.disabled = false;
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildSearchIndex() {
  const links = [];
  links.push({ label: "Home", href: "#home", type: "Section" });
  links.push({ label: "Shop / Outfits", href: "#apparel", type: "Section" });
  links.push({ label: "Events", href: "#events", type: "Section" });
  links.push({ label: "BBQ", href: "#bbq", type: "Section" });
  links.push({ label: "Livestock", href: "#livestock", type: "Section" });
  links.push({ label: "Foundation", href: "#foundation", type: "Section" });
  links.push({ label: "Corporate Hub", href: "CORPORATE_HUB.html", type: "Page" });
  links.push({ label: "Invest With Us", href: "INVEST_WITH_US.html", type: "Page" });
  links.push({ label: "Partner With Us", href: "PARTNER_WITH_US.html", type: "Page" });
  links.push({ label: "Team SOP Guide", href: "TEAM_ADMIN_SOP.html", type: "Page" });
  links.push({ label: "Donor Guide", href: "DONOR_GUIDE.html", type: "Page" });

  (state.content.outfits || []).forEach((x) => {
    const id = x.id ? `outfit-${x.id}` : "apparel";
    links.push({ label: x.name, href: `#${id}`, type: "Outfit" });
  });
  (state.content.events || []).forEach((x) => {
    const id = x.id ? `event-${x.id}` : "events";
    links.push({ label: x.title, href: `#${id}`, type: "Event" });
  });
  (state.content.livestock || []).forEach((x) => {
    const id = x.id ? `livestock-${x.id}` : "livestock";
    links.push({ label: x.name, href: `#${id}`, type: "Livestock" });
  });
  (state.content.decor || []).forEach((x) => {
    const id = x.id ? `decor-${x.id}` : "decor";
    links.push({ label: x.name, href: `#${id}`, type: "Decor" });
  });
  (state.content.team || []).forEach((x) => {
    const id = x.id ? `team-${x.id}` : "media";
    links.push({ label: x.name, href: `#${id}`, type: "Team" });
  });
  return links;
}

function renderSearchResults(query) {
  if (!el.globalSearchResults) return;
  const q = String(query || "").trim().toLowerCase();
  if (!q) {
    el.globalSearchResults.hidden = true;
    el.globalSearchResults.innerHTML = "";
    return;
  }
  const matches = buildSearchIndex()
    .filter((x) => String(x.label || "").toLowerCase().includes(q))
    .slice(0, 10);

  if (!matches.length) {
    el.globalSearchResults.hidden = false;
    el.globalSearchResults.innerHTML = `<div class="gallery-empty">No results found.</div>`;
    return;
  }

  el.globalSearchResults.hidden = false;
  el.globalSearchResults.innerHTML = matches.map((m) => {
    return `<a class="search-result-link" href="${m.href}">${escapeHtml(m.label)} <span class="fine">(${escapeHtml(m.type)})</span></a>`;
  }).join("");
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
      card.className = "outfit-card search-target";
      if (item.id) card.id = `outfit-${item.id}`;
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
    card.className = "product-card search-target";
    if (item.id) card.id = `event-${item.id}`;
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
    card.className = "product-card search-target";
    if (item.id) card.id = `livestock-${item.id}`;
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
    card.className = "product-card search-target";
    if (item.id) card.id = `decor-${item.id}`;
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
    if (isLowPowerDevice) {
      card.innerHTML = `
        ${maybeImage(v.poster || PLACEHOLDER_IMAGE, v.title || "Video preview")}
        <div class="video-body">${v.title || "Untitled Video"} <span class="fine">(Lite preview mode)</span></div>
      `;
      el.videoGallery.appendChild(card);
      return;
    }
    card.innerHTML = `
      ${v.src ? `<video loop muted playsinline preload="none" controlslist="nodownload noplaybackrate nofullscreen" disablepictureinpicture data-src="${mediaSrc(v.src)}" ${v.poster ? `poster="${mediaSrc(v.poster)}"` : ""}></video>` : ""}
      <div class="video-body">${v.title || "Untitled Video"}</div>
    `;
    const video = card.querySelector("video");
    if (video) {
      // Force silent playback at runtime even if browser restores prior media state.
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.controls = false;
      video.addEventListener("volumechange", () => {
        if (!video.muted || video.volume !== 0) {
          video.muted = true;
          video.volume = 0;
        }
      });
      const sourceUrl = video.dataset.src;
      const attachSource = () => {
        if (!sourceUrl) return;
        if (!video.querySelector("source")) {
          const source = document.createElement("source");
          source.src = sourceUrl;
          video.appendChild(source);
          video.load();
        }
      };
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              attachSource();
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          });
        }, { threshold: 0.35 });
        observer.observe(video);
      } else {
        attachSource();
      }
    }
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
    row.className = "team-row search-target";
    if (p.id) row.id = `team-${p.id}`;
    row.innerHTML = `
      ${p.photo ? `<img class="team-photo expandable-media" src="${mediaSrc(p.photo)}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='${mediaSrc(PLACEHOLDER_IMAGE)}'">` : ""}
      <strong>${p.name}</strong><br>${p.role || ""}<br>${p.bio || ""}
      ${adminOnly(`<div class="outfit-actions top-space"><button class="delete-outfit delete-team-item" type="button" data-id="${p.id}">Remove</button></div>`)}
    `;
    el.teamGrid.appendChild(row);
  });
}

function jumpToSearchHref(href) {
  const targetHref = String(href || "");
  if (!targetHref.startsWith("#")) {
    window.location.href = targetHref;
    return;
  }
  const id = targetHref.slice(1);
  const node = document.getElementById(id);
  if (!node) {
    window.location.hash = targetHref;
    return;
  }
  node.scrollIntoView({ behavior: "smooth", block: "start" });
  node.classList.remove("search-hit");
  window.setTimeout(() => node.classList.add("search-hit"), 80);
  window.setTimeout(() => node.classList.remove("search-hit"), 1800);
  history.replaceState(null, "", targetHref);
}

function prefetchInternalPages() {
  const pages = [
    "CORPORATE_HUB.html",
    "INVEST_WITH_US.html",
    "PARTNER_WITH_US.html",
    "TEAM_ADMIN_SOP.html",
    "DONOR_GUIDE.html",
    "EVENT_CAMPAIGN_BUILDER.html"
  ];
  const run = () => {
    pages.forEach((href) => {
      if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = href;
      document.head.appendChild(link);
    });
  };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 1200 });
  } else {
    window.setTimeout(run, 350);
  }
}

function setupMediaViewer() {
  const modal = document.createElement("div");
  modal.className = "media-lightbox";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="media-lightbox-content" role="dialog" aria-modal="true" aria-label="Expanded photo viewer">
      <button class="media-lightbox-close" type="button">Close</button>
      <img class="media-lightbox-image" src="" alt="">
      <div class="media-lightbox-caption"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const closeBtn = modal.querySelector(".media-lightbox-close");
  const image = modal.querySelector(".media-lightbox-image");
  const caption = modal.querySelector(".media-lightbox-caption");

  const closeViewer = () => {
    modal.hidden = true;
    image.src = "";
    image.alt = "";
    caption.textContent = "";
  };

  const openViewer = (src, altText) => {
    image.src = src;
    image.alt = altText || "Expanded photo";
    caption.textContent = altText || "";
    modal.hidden = false;
  };

  closeBtn?.addEventListener("click", closeViewer);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeViewer();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeViewer();
  });
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".expandable-media, .showcase-tile img");
    if (!img) return;
    openViewer(img.currentSrc || img.src, img.alt || "");
  });
}

function renderSocials() {
  if (!el.socialsGrid) return;
  el.socialsGrid.innerHTML = "";
  if (!state.content.socials.length) {
    el.socialsGrid.appendChild(emptyNode("No social links yet."));
    renderGlobalSocialLinks();
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
  renderGlobalSocialLinks();
}

function renderGlobalSocialLinks() {
  const quick = el.quickSocialLinks;
  const contact = el.contactSocialLinks;
  if (quick) quick.innerHTML = "";
  if (contact) contact.innerHTML = "";

  const rows = Array.isArray(state.content.socials) ? state.content.socials.filter((s) => s && s.url) : [];
  if (!rows.length) {
    if (quick) quick.innerHTML = `<span class="fine">Social links will appear here after setup.</span>`;
    if (contact) contact.appendChild(emptyNode("No social links yet."));
    if (el.whatsappChatFloat) el.whatsappChatFloat.hidden = true;
    return;
  }

  rows.forEach((s) => {
    const label = `${s.platform}${s.handle ? ` • ${s.handle}` : ""}`;
    if (quick) {
      const a = document.createElement("a");
      a.className = "quick-social-pill";
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noreferrer noopener";
      a.textContent = s.platform;
      quick.appendChild(a);
    }
    if (contact) {
      const row = document.createElement("div");
      row.className = "social-row";
      row.innerHTML = `<a class="social-link" href="${s.url}" target="_blank" rel="noreferrer noopener">${label}</a>`;
      contact.appendChild(row);
    }
  });

  const whatsapp = rows.find((s) => /whatsapp/i.test(String(s.platform || "")) || /wa\.me/i.test(String(s.url || "")));
  if (el.whatsappChatFloat) {
    if (whatsapp && whatsapp.url) {
      el.whatsappChatFloat.href = whatsapp.url;
      el.whatsappChatFloat.hidden = false;
    } else {
      el.whatsappChatFloat.hidden = true;
    }
  }
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
  setupRevealAnimations();
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
      populateQuickPaymentMethods(methods);
      syncPaymentInputs(el.paymentMethod?.value || methods[0] || "manual", el.paymentPhone?.value || "");
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

function renderDonationPaymentDetails(manual = {}) {
  if (!el.donationPaymentDetails) return;
  const rows = [];
  if (manual.till_number) rows.push(`<div><strong>Till Number:</strong> ${manual.till_number}</div>`);
  if (manual.paybill_number) rows.push(`<div><strong>Paybill:</strong> ${manual.paybill_number}</div>`);
  if (manual.account_number) rows.push(`<div><strong>Account Number:</strong> ${manual.account_number}</div>`);
  if (manual.bank_name) rows.push(`<div><strong>Bank:</strong> ${manual.bank_name}</div>`);
  if (manual.bank_account_name) rows.push(`<div><strong>Bank Account Name:</strong> ${manual.bank_account_name}</div>`);
  if (manual.bank_account_number) rows.push(`<div><strong>Bank Account Number:</strong> ${manual.bank_account_number}</div>`);
  if (manual.bank_branch) rows.push(`<div><strong>Bank Branch:</strong> ${manual.bank_branch}</div>`);
  if (manual.bank_swift) rows.push(`<div><strong>SWIFT:</strong> ${manual.bank_swift}</div>`);
  if (!rows.length) rows.push("<div>No donation payment details configured yet.</div>");
  el.donationPaymentDetails.innerHTML = rows.join("");
}

async function loadDonationConfig() {
  try {
    const response = await fetch("/api/donations/config");
    if (!response.ok) throw new Error(String(response.status));
    const cfg = await response.json();
    const methods = Array.isArray(cfg.methods) ? cfg.methods : ["manual"];
    if (el.donationMethod) {
      el.donationMethod.innerHTML = "";
      methods.forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m === "manual" ? "Manual Transfer" : m;
        el.donationMethod.appendChild(opt);
      });
    }
    renderDonationPaymentDetails(cfg.manual || {});
  } catch {
    renderDonationPaymentDetails({});
    setDonationStatus("Could not load donation config.");
  }
}

async function submitDonationIntent() {
  const name = String(el.donationName?.value || "").trim();
  const email = String(el.donationEmail?.value || "").trim();
  const phone = String(el.donationPhone?.value || "").trim();
  const amountKes = Number(el.donationAmount?.value || 0);
  const method = String(el.donationMethod?.value || "manual");
  const message = String(el.donationMessage?.value || "").trim();

  if (!name || !Number.isFinite(amountKes) || amountKes < 1) {
    setDonationStatus("Enter valid donor name and donation amount.");
    return;
  }

  setDonationStatus("Submitting donation intent...");
  try {
    const response = await fetch("/api/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        amount_kes: amountKes,
        method,
        message
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setDonationStatus(`Donation failed: ${data.error || "Request failed."}`);
      return;
    }
    state.lastDonationId = data.donation_id || "";
    state.lastDonationReceipt = null;
    setDonationStatus(`Donation recorded: ${data.donation_id} | Receipt Ref: ${data.donation_reference || "-"}. Complete transfer and share your payment reference with admin.`);
    el.donationForm?.reset();
    if (isAdminMode()) await loadDonationAdminList();
  } catch {
    setDonationStatus("Donation request failed. Check server and retry.");
  }
}

async function fetchDonationReceipt(donationId) {
  const response = await fetch(`/api/donations/receipt?donation_id=${encodeURIComponent(donationId)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to fetch donation receipt.");
  return data.receipt;
}

async function handleDownloadDonationReceipt() {
  const donationId = state.lastDonationId || String(el.donationConfirmId?.value || "").trim();
  if (!donationId) {
    toast("No donation ID available yet. Submit donation first.", "warn");
    return;
  }
  try {
    const receipt = await fetchDonationReceipt(donationId);
    state.lastDonationReceipt = receipt;
    const safe = String(receipt.receipt_number || donationId).replace(/[^a-zA-Z0-9_-]/g, "_");
    const html = buildDonationReceiptHtml(receipt);
    downloadTextFile(`donation-receipt-${safe}.html`, html, "text/html;charset=utf-8");
    toast("Donation receipt downloaded.", "ok");
  } catch (err) {
    toast(err.message || "Could not download donation receipt.", "warn");
  }
}

function donationsToCsv(rows) {
  const header = ["id", "donation_reference", "name", "email", "phone", "amount_kes", "method", "status", "reference_code", "created_at", "confirmed_at", "message"];
  const esc = (v) => {
    const s = String(v ?? "");
    if (/[\",\\n]/.test(s)) return `"${s.replace(/\"/g, "\"\"")}"`;
    return s;
  };
  const lines = [header.join(",")];
  rows.forEach((r) => {
    const line = [
      r.id, r.donation_reference, r.name, r.email, r.phone, r.amount_kes, r.method,
      r.status, r.reference_code, r.created_at, r.confirmed_at, r.message
    ].map(esc).join(",");
    lines.push(line);
  });
  return lines.join("\\n");
}

async function downloadDonationsCsv() {
  if (!requireAdminForEdit("download donor records")) return;
  try {
    const response = await fetch("/api/donations?limit=500", {
      headers: { "x-admin-key": adminKey() }
    });
    const data = await response.json();
    if (!response.ok) {
      toast(data.error || "Could not load donations.", "warn");
      return;
    }
    const csv = donationsToCsv(Array.isArray(data.donations) ? data.donations : []);
    downloadTextFile(`donations-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
    toast("Donations CSV downloaded.", "ok");
  } catch {
    toast("Failed to download donations CSV.", "warn");
  }
}

function renderDonationAdminList(rows = []) {
  if (!el.donationAdminList) return;
  el.donationAdminList.innerHTML = "";
  if (!rows.length) {
    el.donationAdminList.appendChild(emptyNode("No donation records found."));
    return;
  }
  rows.slice(0, 20).forEach((row) => {
    const node = document.createElement("div");
    node.className = "team-row";
    const quickConfirmBtn = (row.status !== "confirmed" && isAdminMode())
      ? `<div class="outfit-actions top-space"><button class="btn btn-primary confirm-donation-row" type="button" data-id="${row.id}">Confirm</button></div>`
      : "";
    node.innerHTML = `
      <strong>${row.name || "Donor"}</strong> - ${formatKes(row.amount_kes || 0)}<br>
      ID: ${row.id || "-"}<br>
      Receipt Ref: ${row.donation_reference || "-"}<br>
      Status: ${row.status || "-"}<br>
      Ref: ${row.reference_code || "Pending"}<br>
      ${row.phone || row.email || ""}
      ${quickConfirmBtn}
    `;
    el.donationAdminList.appendChild(node);
  });
}

async function loadDonationAdminList() {
  if (!isAdminMode()) {
    renderDonationAdminList([]);
    return;
  }
  try {
    const response = await fetch("/api/donations?limit=50", {
      headers: { "x-admin-key": adminKey() }
    });
    const data = await response.json();
    if (!response.ok) {
      renderDonationAdminList([]);
      return;
    }
    renderDonationAdminList(Array.isArray(data.donations) ? data.donations : []);
  } catch {
    renderDonationAdminList([]);
  }
}

async function confirmDonationFromAdminForm() {
  const key = ensureAdminKey("confirm donation");
  if (!key) {
    toast("Enter admin key to confirm donation.", "warn");
    return;
  }
  const donationId = String(el.donationConfirmId?.value || "").trim();
  const referenceCode = String(el.donationConfirmRef?.value || "").trim();
  if (!donationId || !referenceCode) {
    toast("Provide donation ID and reference code.", "warn");
    return;
  }
  try {
    const response = await fetch("/api/donations/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": key
      },
      body: JSON.stringify({
        donation_id: donationId,
        reference_code: referenceCode
      })
    });
    const data = await response.json();
    if (!response.ok) {
      toast(data.error || "Donation confirmation failed.", "warn");
      return;
    }
    toast(`Donation confirmed: ${data.donation_id}`, "ok");
    if (el.donationConfirmRef) el.donationConfirmRef.value = "";
    await loadDonationAdminList();
  } catch {
    toast("Could not confirm donation.", "warn");
  }
}

async function confirmDonationById(donationId) {
  const key = ensureAdminKey("confirm donation");
  if (!key) {
    toast("Enter admin key to confirm donation.", "warn");
    return;
  }
  const referenceCode = String(window.prompt("Enter M-Pesa/Bank reference code:") || "").trim();
  if (!referenceCode) {
    toast("Reference code is required.", "warn");
    return;
  }
  try {
    const response = await fetch("/api/donations/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": key
      },
      body: JSON.stringify({
        donation_id: donationId,
        reference_code: referenceCode
      })
    });
    const data = await response.json();
    if (!response.ok) {
      toast(data.error || "Donation confirmation failed.", "warn");
      return;
    }
    toast(`Donation confirmed: ${data.donation_id}`, "ok");
    await loadDonationAdminList();
  } catch {
    toast("Could not confirm donation.", "warn");
  }
}

async function submitSubscriber() {
  const name = String(el.subscriberName?.value || "").trim();
  const email = String(el.subscriberEmail?.value || "").trim();
  const consent = Boolean(el.subscriberConsent?.checked);
  if (!email) {
    setSubscriberStatus("Email is required.");
    return;
  }
  if (!consent) {
    setSubscriberStatus("Please accept consent to subscribe.");
    return;
  }
  setSubscriberStatus("Submitting subscription...");
  try {
    const response = await fetch("/api/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, consent: true })
    });
    const data = await response.json();
    if (!response.ok) {
      setSubscriberStatus(`Subscribe failed: ${data.error || "Request failed."}`);
      return;
    }
    setSubscriberStatus("Subscribed successfully. You will receive updates.");
    el.subscriberForm?.reset();
    if (isAdminMode()) await loadSubscriberAdminList();
  } catch {
    setSubscriberStatus("Subscription request failed.");
  }
}

function renderSubscriberAdminList(rows = []) {
  if (!el.subscriberAdminList) return;
  el.subscriberAdminList.innerHTML = "";
  if (!rows.length) {
    el.subscriberAdminList.appendChild(emptyNode("No subscribers yet."));
    return;
  }
  rows.slice(0, 50).forEach((row) => {
    const node = document.createElement("div");
    node.className = "team-row";
    node.innerHTML = `
      <strong>${row.name || "Subscriber"}</strong><br>
      ${row.email || "-"}<br>
      Status: ${row.status || "-"}<br>
      Joined: ${formatDateTime(row.created_at)}
    `;
    el.subscriberAdminList.appendChild(node);
  });
}

async function loadSubscriberAdminList() {
  if (!isAdminMode()) {
    renderSubscriberAdminList([]);
    return;
  }
  try {
    const response = await fetch("/api/subscribers?limit=500", {
      headers: { "x-admin-key": adminKey() }
    });
    const data = await response.json();
    if (!response.ok) {
      renderSubscriberAdminList([]);
      return;
    }
    renderSubscriberAdminList(Array.isArray(data.subscribers) ? data.subscribers : []);
  } catch {
    renderSubscriberAdminList([]);
  }
}

function subscribersToCsv(rows) {
  const header = ["id", "name", "email", "status", "consent", "source", "created_at", "updated_at"];
  const esc = (v) => {
    const s = String(v ?? "");
    if (/[\",\\n]/.test(s)) return `"${s.replace(/\"/g, "\"\"")}"`;
    return s;
  };
  const lines = [header.join(",")];
  rows.forEach((r) => {
    const line = [r.id, r.name, r.email, r.status, r.consent, r.source, r.created_at, r.updated_at].map(esc).join(",");
    lines.push(line);
  });
  return lines.join("\\n");
}

async function downloadSubscribersCsv() {
  const key = ensureAdminKey("download subscriber list");
  if (!key) return;
  try {
    const response = await fetch("/api/subscribers?limit=2000", {
      headers: { "x-admin-key": key }
    });
    const data = await response.json();
    if (!response.ok) {
      toast(data.error || "Could not load subscribers.", "warn");
      return;
    }
    const csv = subscribersToCsv(Array.isArray(data.subscribers) ? data.subscribers : []);
    downloadTextFile(`subscribers-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
    toast("Subscribers CSV downloaded.", "ok");
  } catch {
    toast("Failed to download subscribers CSV.", "warn");
  }
}

function bindForms() {
  el.checkoutBtn?.addEventListener("click", () => {
    startCheckout();
  });
  el.paymentMethod?.addEventListener("change", () => {
    syncPaymentInputs(el.paymentMethod?.value || "manual", el.paymentPhone?.value || "");
  });
  el.paymentPhone?.addEventListener("input", () => {
    syncPaymentInputs(el.paymentMethod?.value || "manual", el.paymentPhone?.value || "");
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
    if (!requireAdminForEdit("add outfit stock")) return;
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
    if (!requireAdminForEdit("reset outfit demo data")) return;
    state.content.outfits = structuredClone(defaultContent.outfits);
    localStorage.setItem(OUTFIT_KEY, JSON.stringify(state.content.outfits));
    renderOutfits();
  });

  el.eventForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!requireAdminForEdit("add event")) return;
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
    if (!requireAdminForEdit("add livestock listing")) return;
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
    if (!requireAdminForEdit("add decor item")) return;
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
    if (!requireAdminForEdit("add team profile")) return;
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
    if (!requireAdminForEdit("add social link")) return;
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
    if (!requireAdminForEdit("add description")) return;
    const title = String(document.getElementById("description-title")?.value || "").trim();
    const text = String(document.getElementById("description-text")?.value || "").trim();
    if (!title || !text) return notify("Provide valid description.");
    state.content.descriptions.unshift({ id: uid("desc"), title, text });
    el.descriptionForm.reset();
    renderCommunity();
  });

  el.partnerFormAdmin?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!requireAdminForEdit("add partner")) return;
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
    if (!requireAdminForEdit("add review")) return;
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
    if (!requireAdminForEdit("upload media")) return;
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

  el.bbqInquiry?.addEventListener("submit", (e) => {
    e.preventDefault();
    notify("BBQ inquiry received. Team will confirm package options and pricing.");
    el.bbqInquiry.reset();
  });

  el.donorForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    notify("Partnership request received. MOU discussion will be scheduled.");
    el.donorForm.reset();
  });

  el.donationForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    submitDonationIntent();
  });
  el.downloadDonationsBtn?.addEventListener("click", () => {
    downloadDonationsCsv();
  });
  el.downloadDonationReceiptBtn?.addEventListener("click", () => {
    handleDownloadDonationReceipt();
  });
  el.donationConfirmForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    confirmDonationFromAdminForm();
  });
  el.subscriberForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    submitSubscriber();
  });
  el.downloadSubscribersBtn?.addEventListener("click", () => {
    downloadSubscribersCsv();
  });
  el.refreshSubscribersBtn?.addEventListener("click", () => {
    loadSubscriberAdminList();
  });
  el.trackingForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    saveTrackingSettings();
  });
  const onSearchInput = debounce(() => {
    renderSearchResults(el.globalSearchInput?.value || "");
  }, 140);
  el.globalSearchInput?.addEventListener("input", onSearchInput);
  el.globalSearchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = String(el.globalSearchInput?.value || "").trim();
    renderSearchResults(query);
    const first = el.globalSearchResults?.querySelector("a.search-result-link");
    if (first) jumpToSearchHref(first.getAttribute("href"));
  });
  el.globalSearchResults?.addEventListener("click", (e) => {
    const anchor = e.target.closest("a.search-result-link");
    if (!anchor) return;
    e.preventDefault();
    jumpToSearchHref(anchor.getAttribute("href"));
    if (el.globalSearchResults) el.globalSearchResults.hidden = true;
  });
  document.addEventListener("click", (e) => {
    const node = e.target;
    if (!(node instanceof Element)) return;
    if (!node.closest(".global-search-form") && !node.closest("#global-search-results")) {
      if (el.globalSearchResults) {
        el.globalSearchResults.hidden = true;
      }
    }
  });
  if (Array.isArray(el.quickCheckoutPanels)) {
    el.quickCheckoutPanels.forEach((panel) => {
      const methodNode = panel.querySelector(".quick-payment-method");
      const phoneNode = panel.querySelector(".quick-payment-phone");
      const placeNode = panel.querySelector(".quick-place-order");
      const clearNode = panel.querySelector(".quick-clear-cart");
      const receiptNode = panel.querySelector(".quick-download-receipt");
      const ticketsNode = panel.querySelector(".quick-download-tickets");

      methodNode?.addEventListener("change", () => {
        syncPaymentInputs(methodNode.value, phoneNode?.value || "", panel);
      });
      phoneNode?.addEventListener("input", () => {
        syncPaymentInputs(methodNode?.value || "manual", phoneNode.value || "", panel);
      });
      placeNode?.addEventListener("click", () => {
        syncPaymentInputs(methodNode?.value || "manual", phoneNode?.value || "", panel);
        startCheckout();
      });
      clearNode?.addEventListener("click", () => {
        state.cart = [];
        renderCart();
        setPaymentStatus("Cart cleared.");
      });
      receiptNode?.addEventListener("click", () => {
        handleDownloadReceipt();
      });
      ticketsNode?.addEventListener("click", () => {
        handleDownloadTickets();
      });
    });
  }

  document.addEventListener("click", (e) => {
    const addCart = e.target.closest(".add-to-cart");
    if (addCart) {
      const card = addCart.closest(".product-card");
      const name = addCart.dataset.name || card?.getAttribute("data-name") || "Item";
      const price = Number(addCart.dataset.price || card?.getAttribute("data-price") || 0);
      const kind = addCart.dataset.kind || "product";
      addItemToCart({ name, price, qty: 1, kind });
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

    const quickConfirm = e.target.closest(".confirm-donation-row");
    if (quickConfirm) {
      const donationId = String(quickConfirm.dataset.id || "").trim();
      if (!donationId) return;
      confirmDonationById(donationId);
      return;
    }

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
  el.adminKey?.addEventListener("input", () => {
    setAdminKeyEverywhere(el.adminKey.value);
    renderAll();
    loadDonationAdminList();
    loadSubscriberAdminList();
  });
  el.adminKeyFoundation?.addEventListener("input", () => {
    setAdminKeyEverywhere(el.adminKeyFoundation.value);
    renderAll();
    loadDonationAdminList();
    loadSubscriberAdminList();
  });
  el.adminKeySubscribers?.addEventListener("input", () => {
    setAdminKeyEverywhere(el.adminKeySubscribers.value);
    renderAll();
    loadDonationAdminList();
    loadSubscriberAdminList();
  });
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

let revealObserver;
function setupRevealAnimations() {
  const nodes = document.querySelectorAll(".reveal");
  if (!nodes.length) return;

  if (!("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("in-view"));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
  }

  nodes.forEach((node) => {
    if (!node.classList.contains("in-view")) revealObserver.observe(node);
  });
}

(async function boot() {
  if (el.year) el.year.textContent = String(new Date().getFullYear());
  if (isLowPowerDevice) {
    document.body.classList.add("lite-mode");
  }
  setupNav();
  setupMediaViewer();
  prefetchInternalPages();
  await loadContent();
  await loadPaymentConfig();
  await loadDonationConfig();
  bindForms();
  loadTrackingSettings();
  renderAll();
  await loadDonationAdminList();
  await loadSubscriberAdminList();
})();
