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
  return `<img class="outfit-image" src="${path}" alt="${alt}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">`;
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
            <button class="delete-outfit delete-outfit-item" type="button" data-id="${item.id}">Remove</button>
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
        <button class="delete-outfit delete-event-item" type="button" data-id="${item.id}">Remove</button>
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
        <button class="delete-outfit delete-livestock-item" type="button" data-id="${item.id}">Remove</button>
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
        <button class="delete-outfit delete-decor-item" type="button" data-id="${item.id}">Remove</button>
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
      ${v.src ? `<video controls preload="metadata" ${v.poster ? `poster="${v.poster}"` : ""}><source src="${v.src}"></video>` : ""}
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
      ${p.photo ? `<img class="outfit-image" src="${p.photo}" alt="${p.name}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">` : ""}
      <strong>${p.name}</strong><br>${p.role || ""}<br>${p.bio || ""}
      <div class="outfit-actions top-space">
        <button class="delete-outfit delete-team-item" type="button" data-id="${p.id}">Remove</button>
      </div>
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
      <div class="outfit-actions top-space">
        <button class="delete-outfit delete-social-item" type="button" data-id="${s.id}">Remove</button>
      </div>
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
        row.innerHTML = `<strong>${d.title}</strong><br>${d.text}<div class="outfit-actions top-space"><button class="delete-outfit delete-description-item" data-id="${d.id}">Remove</button></div>`;
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
        row.innerHTML = `<strong>${p.name}</strong><br>${p.description || ""}<br>${p.email || ""}<div class="outfit-actions top-space"><button class="delete-outfit delete-partner-item" data-id="${p.id}">Remove</button></div>`;
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
        row.innerHTML = `<strong>${r.name}</strong> (${r.rating}/5)<br>${r.text}<div class="outfit-actions top-space"><button class="delete-outfit delete-review-item" data-id="${r.id}">Remove</button></div>`;
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
    const response = await fetch("/api/content");
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    state.content = { ...structuredClone(defaultContent), ...data };
    if (!Array.isArray(state.content.outfits) || !state.content.outfits.length) {
      const local = localStorage.getItem(OUTFIT_KEY);
      if (local) state.content.outfits = JSON.parse(local);
    }
  } catch {
    state.content = structuredClone(defaultContent);
    try {
      const local = localStorage.getItem(OUTFIT_KEY);
      if (local) state.content.outfits = JSON.parse(local);
    } catch {}
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
    notify(`${scope} saved to backend successfully.`);
  } catch {
    notify("Failed to save to backend. Check admin key and server status.");
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
