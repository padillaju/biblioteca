console.log('admin.js loaded');
// Global helper: parse a number-like string into a float (handles commas, dots and currency symbols)
function parseNumberString(input) {
  if (input == null) return 0;
  let s = String(input).trim();
  if (!s) return 0;
  s = s.replace(/[^0-9,.-]/g, '');
  const hasDot = s.indexOf('.') !== -1;
  const hasComma = s.indexOf(',') !== -1;

  if (hasDot && hasComma) {
    if (s.lastIndexOf('.') > s.lastIndexOf(',')) {
      s = s.replace(/,/g, '');
      return parseFloat(s) || 0;
    } else {
      s = s.replace(/\./g, '').replace(',', '.');
      return parseFloat(s) || 0;
    }
  }

  if (hasComma) {
    const parts = s.split(',');
    if (parts[1] && parts[1].length === 3) {
      s = s.replace(/,/g, '');
      return parseFloat(s) || 0;
    }
    s = s.replace(',', '.');
    return parseFloat(s) || 0;
  }

  if (hasDot) {
    const parts = s.split('.');
    if (parts[1] && parts[1].length === 3) {
      s = s.replace(/\./g, '');
      return parseFloat(s) || 0;
    }
    return parseFloat(s) || 0;
  }

  return parseFloat(s) || 0;
}
// Lightweight toast implementation for admin pages
function showToast(message, type = 'success', duration = 3500) {
  try {
    let container = document.getElementById('global-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'global-toast-container';
      Object.assign(container.style, {
        position: 'fixed',
        right: '16px',
        bottom: '16px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'flex-end',
        maxWidth: '360px',
        pointerEvents: 'none'
      });
      document.body.appendChild(container);
    }

    // map semantic types to colors/backgrounds
    const _colors = { success: '#28a745', error: '#dc3545', warning: '#ffb020', info: '#17a2b8' };
    const _bg = { success: '#f6ffef', error: '#fff5f5', warning: '#fff9eb', info: '#f0f9ff' };
    const color = _colors[type] || '#6B00FF';
    const bg = _bg[type] || '#ffffff';

    const toast = document.createElement('div');
    Object.assign(toast.style, {
      background: bg,
      color: '#111',
      borderRadius: '8px',
      boxShadow: '0 8px 22px rgba(0,0,0,0.12)',
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: '220px',
      borderLeft: `6px solid ${color}`,
      opacity: '0',
      transform: 'translateY(8px)',
      transition: 'opacity 220ms ease, transform 220ms ease',
      pointerEvents: 'auto',
      fontSize: '14px'
    });

    toast.textContent = message;
    container.appendChild(toast);

    // trigger animation
    void toast.offsetWidth;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    let removed = false;
    const remove = () => {
      if (removed) return;
      removed = true;
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => { if (toast && toast.parentNode) toast.parentNode.removeChild(toast); }, 260);
    };

    const timer = setTimeout(remove, duration);
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
    toast.addEventListener('mouseleave', () => setTimeout(remove, 1500));

    return { remove };
  } catch (err) {
    // If something goes wrong constructing toasts, avoid native alert popups
    try { console.warn('showToast fallback:', message); } catch (e) { /* ignore */ }
  }
}
// Asegurar que `confirmWithToast` exista en el ámbito global para evitar ReferenceError
if (typeof confirmWithToast !== 'function') {
  window.confirmWithToast = function(message, onConfirm, onCancel) {
    const wrapper = document.createElement('div');
    wrapper.className = 'confirm-toast-wrapper';
    wrapper.style.position = 'fixed';
    wrapper.style.left = '50%';
    wrapper.style.bottom = '24px';
    wrapper.style.transform = 'translateX(-50%)';
    wrapper.style.zIndex = 9999;
    wrapper.style.background = '#fff';
    wrapper.style.border = '1px solid rgba(0,0,0,0.08)';
    wrapper.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
    wrapper.style.padding = '12px 14px';
    wrapper.style.borderRadius = '10px';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '12px';

    const msg = document.createElement('div');
    msg.textContent = message;
    msg.style.color = '#222';
    msg.style.fontSize = '14px';

    const btnConfirm = document.createElement('button');
    btnConfirm.textContent = 'Confirmar';
    btnConfirm.style.background = '#6B00FF';
    btnConfirm.style.color = '#fff';
    btnConfirm.style.border = 'none';
    btnConfirm.style.padding = '8px 10px';
    btnConfirm.style.borderRadius = '8px';
    btnConfirm.style.cursor = 'pointer';

    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Cancelar';
    btnCancel.style.background = '#eee';
    btnCancel.style.color = '#333';
    btnCancel.style.border = 'none';
    btnCancel.style.padding = '8px 10px';
    btnCancel.style.borderRadius = '8px';
    btnCancel.style.cursor = 'pointer';

    wrapper.appendChild(msg);
    wrapper.appendChild(btnConfirm);
    wrapper.appendChild(btnCancel);

    document.body.appendChild(wrapper);

    const cleanup = () => { if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper); };

    btnConfirm.addEventListener('click', () => {
      try { onConfirm && onConfirm(); } catch (e) { console.error('confirmWithToast onConfirm error', e); }
      cleanup();
    });

    btnCancel.addEventListener('click', () => {
      try { onCancel && onCancel(); } catch (e) { /* ignore */ }
      cleanup();
    });

    const timeout = setTimeout(() => { cleanup(); if (onCancel) onCancel(); }, 10000);
    [btnConfirm, btnCancel].forEach(b => b.addEventListener('click', () => clearTimeout(timeout)));
  };
}
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  attachModalHandlers();
  loadOrders();
  // cargar libros destacados para la sección 'books'
  loadFeaturedBooks();
  // cargar actividad reciente en el dashboard
  loadRecentActivity();
  // render sales chart for default period and attach control
  try {
    // prefer the report selector, but attach listeners to both selectors if present
    const selReport = document.getElementById('salesPeriod');
    const selDashboard = document.getElementById('salesPeriodDashboard');
    const selectors = [];
    if (selReport) selectors.push(selReport);
    if (selDashboard) selectors.push(selDashboard);
    const initial = (selectors[0] && selectors[0].value) || 'month';
    // initial render should not auto-open the summary modal
    renderSalesChart(initial, false);
    // changing the selector updates chart only (no modal)
    selectors.forEach(s => s.addEventListener('change', () => renderSalesChart(s.value, false)));
  } catch (e) {
    console.warn('No sales chart available or error initializing it', e);
  }

// Helper reusable: parse a number-like string into a float (handles commas, dots and currency symbols)
function parseNumberString(input) {
  if (input == null) return 0;
  let s = String(input).trim();
  if (!s) return 0;
  s = s.replace(/[^0-9,.-]/g, '');
  const hasDot = s.indexOf('.') !== -1;
  const hasComma = s.indexOf(',') !== -1;

  if (hasDot && hasComma) {
    if (s.lastIndexOf('.') > s.lastIndexOf(',')) {
      s = s.replace(/,/g, '');
      return parseFloat(s) || 0;
    } else {
      s = s.replace(/\./g, '').replace(',', '.');
      return parseFloat(s) || 0;
    }
  }

  if (hasComma) {
    const parts = s.split(',');
    if (parts[1] && parts[1].length === 3) {
      s = s.replace(/,/g, '');
      return parseFloat(s) || 0;
    }
    s = s.replace(',', '.');
    return parseFloat(s) || 0;
  }

  if (hasDot) {
    const parts = s.split('.');
    if (parts[1] && parts[1].length === 3) {
      s = s.replace(/\./g, '');
      return parseFloat(s) || 0;
    }
    return parseFloat(s) || 0;
  }

  return parseFloat(s) || 0;
}


// Confirmación no bloqueante local para admin (usa su propio DOM, independiente de showToast)
function confirmWithToast(message, onConfirm, onCancel) {
  const wrapper = document.createElement('div');
  wrapper.className = 'confirm-toast-wrapper';
  wrapper.style.position = 'fixed';
  wrapper.style.left = '50%';
  wrapper.style.bottom = '24px';
  wrapper.style.transform = 'translateX(-50%)';
  wrapper.style.zIndex = 9999;
  wrapper.style.background = '#fff';
  wrapper.style.border = '1px solid rgba(0,0,0,0.08)';
  wrapper.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
  wrapper.style.padding = '12px 14px';
  wrapper.style.borderRadius = '10px';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '12px';

  const msg = document.createElement('div');
  msg.textContent = message;
  msg.style.color = '#222';
  msg.style.fontSize = '14px';

  const btnConfirm = document.createElement('button');
  btnConfirm.textContent = 'Confirmar';
  btnConfirm.style.background = '#6B00FF';
  btnConfirm.style.color = '#fff';
  btnConfirm.style.border = 'none';
  btnConfirm.style.padding = '8px 10px';
  btnConfirm.style.borderRadius = '8px';
  btnConfirm.style.cursor = 'pointer';

  const btnCancel = document.createElement('button');
  btnCancel.textContent = 'Cancelar';
  btnCancel.style.background = '#eee';
  btnCancel.style.color = '#333';
  btnCancel.style.border = 'none';
  btnCancel.style.padding = '8px 10px';
  btnCancel.style.borderRadius = '8px';
  btnCancel.style.cursor = 'pointer';

  wrapper.appendChild(msg);
  wrapper.appendChild(btnConfirm);
  wrapper.appendChild(btnCancel);

  document.body.appendChild(wrapper);

  const cleanup = () => { if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper); };

  btnConfirm.addEventListener('click', () => {
    try { onConfirm && onConfirm(); } catch (e) { console.error('confirmWithToast onConfirm error', e); }
    cleanup();
  });

  btnCancel.addEventListener('click', () => {
    try { onCancel && onCancel(); } catch (e) { /* ignore */ }
    cleanup();
  });

  const timeout = setTimeout(() => { cleanup(); if (onCancel) onCancel(); }, 10000);
  [btnConfirm, btnCancel].forEach(b => b.addEventListener('click', () => clearTimeout(timeout)));
}

// -------- barra de gráfico (semana / mes / año) ----------------
async function renderSalesChart(period = 'month', openModal = false) {
  const chartContainer = document.getElementById('salesChart');
  if (!chartContainer) return;
  const barsContainer = chartContainer.querySelector('.chart-bars') || chartContainer;
  barsContainer.innerHTML = '<div class="loading">Cargando gráfico...</div>';

  let pedidos = [];
  try {
    const res = await fetch('/pedidos');
    const data = await res.json().catch(() => ({}));
    pedidos = (data && data.pedidos && Array.isArray(data.pedidos)) ? data.pedidos : (Array.isArray(data) ? data : []);
  } catch (e) {
    console.error('Error fetching pedidos for chart', e);
    barsContainer.innerHTML = '<div class="error">No se pudieron cargar datos de ventas.</div>';
    return;
  }

  const buckets = aggregateOrders(pedidos, period);
  // debug: mostrar buckets y totales en consola (amount focused)
  const totalAmount = buckets.reduce((s, b) => s + (Number(b.amount) || 0), 0);
  console.log('renderSalesChart', { period, buckets, totalAmount, pedidosCount: pedidos.length });

  if (!buckets || buckets.length === 0) {
    barsContainer.innerHTML = '<div class="error">No hay datos para este periodo.</div>';
    return;
  }

  // Use amount as primary value for bar height; fallback to items if amount is missing
  const values = buckets.map(b => Number(b.amount || b.items || 0));
  let max = values.reduce((m, v) => Math.max(m, v), 0);
  if (max === 0) max = 1;

  // Use a pixel-based scale to ensure visibility even with small numbers
  const maxPx = 120; // max bar height in px

  barsContainer.innerHTML = buckets.map(b => {
    const value = Number(b.amount || b.items || 0);
    let px = Math.round((value / max) * maxPx);
    // ensure bars are visible: tiny positive values get a minimal height
    if (value > 0 && px < 6) px = 6;
    // if everything is zero, give a subtle baseline so user sees bars exist
    if (values.every(v => v === 0)) px = 8;

    const title = `${b.label} — $${Number(b.amount || 0).toFixed(2)}`;
    return `
      <div class="bar-wrap" data-label="${escapeHtml(b.label)}" data-amount="${b.amount}">
        <div class="bar" style="height: ${px}px" title="${escapeHtml(title)}"></div>
        <div class="bar-label">${escapeHtml(b.label)}</div>
      </div>
    `;
  }).join('');

  // attach click handlers to bars to show totals (amount only)
  barsContainer.querySelectorAll('.bar-wrap').forEach(node => {
    node.addEventListener('click', () => {
      const lbl = node.dataset.label;
      const amount = Number(node.dataset.amount || 0);
      const msg = `${lbl} — $${amount.toFixed(2)}`;
      try { showToast(msg, 'info') } catch (e) { console.warn(msg) }
    });
  });

  // Render sales summary into modal only when explicitly requested (openModal===true)
  if (openModal) {
    try {
      const modal = document.getElementById('salesSummaryModal');
      const content = document.getElementById('salesSummaryContent');
      if (modal && content) {
        const total = values.reduce((s, v) => s + v, 0);
        const list = buckets.map(b => `<li style="margin:6px 0;">${escapeHtml(b.label)}: <strong>$${Number(b.amount || 0).toFixed(2)}</strong></li>`).join('');
        content.innerHTML = `
          <div style="font-weight:700;margin-bottom:8px;">Total periodo: $${Number(total).toFixed(2)}</div>
          <ul style="list-style:none;padding:0;margin:0 0 8px 0">${list}</ul>
          <div style="text-align:right;margin-top:8px;"><button type="button" class="btn-secondary" onclick="closeSalesSummaryModal()">Cerrar</button></div>
        `;
        modal.classList.add('active');
      }
    } catch (err) {
      console.warn('No se pudo abrir el modal de resumen de ventas', err);
    }
  }
}

// Helper para depuración: renderizar el gráfico usando un array de `pedidos` ya cargado
function renderSalesChartFromArray(pedidosArray, period = 'month') {
  const chartContainer = document.getElementById('salesChart');
  if (!chartContainer) return;
  const barsContainer = chartContainer.querySelector('.chart-bars') || chartContainer;
  const buckets = aggregateOrders(pedidosArray || [], period);
  if (!buckets || buckets.length === 0) {
    barsContainer.innerHTML = '<div class="error">No hay datos para este periodo.</div>';
    return;
  }
  // Use amount as primary value for scaling
  const values = buckets.map(b => Number(b.amount || b.items || 0));
  let max = values.reduce((m, v) => Math.max(m, v), 0);
  if (max === 0) max = 1;
  const maxPx = 120;
  barsContainer.innerHTML = buckets.map(b => {
    const value = Number(b.amount || b.items || 0);
    let px = Math.round((value / max) * maxPx);
    if (value > 0 && px < 6) px = 6;
    if (values.every(v => v === 0)) px = 8;
    return `
      <div class="bar-wrap" data-label="${escapeHtml(b.label)}" data-amount="${b.amount}">
        <div class="bar" style="height: ${px}px" title="${escapeHtml(b.label)} — $${Number(b.amount || 0).toFixed(2)}"></div>
        <div class="bar-label">${escapeHtml(b.label)}</div>
      </div>
    `;
  }).join('');
  barsContainer.querySelectorAll('.bar-wrap').forEach(node => {
    node.addEventListener('click', () => {
      const lbl = node.dataset.label;
      const amount = Number(node.dataset.amount || 0);
      const msg = `${lbl} — $${amount.toFixed(2)}`;
      try { showToast(msg, 'info') } catch (e) { console.warn(msg) }
    });
  });
}

// Exponer helper para probar desde la consola: window.debugRenderSalesChart(pedidosArray, 'week'|'month'|'year')
window.debugRenderSalesChart = renderSalesChartFromArray;

function aggregateOrders(pedidos, period) {
  const now = new Date();

  // helper to parse order date
  function parseOrderDate(o) {
    const s = o && (o.fecha_creacion || o.fecha || o.date || o.created_at || o.createdAt);
    const d = s ? new Date(s) : null;
    return d && !isNaN(d.getTime()) ? d : null;
  }

  function parseNumberString(s) {
    if (s == null) return 0;
    let str = String(s).trim();
    if (!str) return 0;
    // accept formats like 13.78 or 13,78 and strip currency symbols
    str = str.replace(/[^0-9,.-]/g, '');
    if (str.indexOf(',') !== -1 && str.indexOf('.') === -1) {
      // comma decimal
      str = str.replace(',', '.');
    } else if (str.indexOf(',') !== -1 && str.indexOf('.') !== -1) {
      // assume last separator is decimal
      if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
        str = str.replace(/\./g, '').replace(',', '.');
      } else {
        str = str.replace(/,/g, '');
      }
    }
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
  }

  function orderTotal(o) {
    return parseNumberString(o.total || o.total_pedido || o.amount || 0);
  }

  function orderItemCount(o) {
    // if order has libros array, sum cantidades
    const libros = o && (o.libros || o.items || o.line_items);
    if (Array.isArray(libros)) {
      return libros.reduce((s, it) => s + (Number(it.cantidad || it.quantity || 0) || 0), 0) || 0;
    }
    // fallback: count 1 item per order
    return 1;
  }

  if (period === 'week') {
    // Current calendar week: Monday -> Sunday (7 days)
    const days = [];
    const d0 = new Date(now);
    d0.setHours(0,0,0,0);
    const dayOfWeek = d0.getDay(); // 0 Sun .. 6 Sat
    const offsetToMonday = (dayOfWeek === 0) ? -6 : (1 - dayOfWeek);
    const weekStart = new Date(d0);
    weekStart.setDate(d0.getDate() + offsetToMonday);

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = d.toISOString().slice(0,10);
      days.push({ key, label: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }), items: 0, amount: 0, date: new Date(d) });
    }

    pedidos.forEach(p => {
      const d = parseOrderDate(p);
      if (!d) return;
      const key = d.toISOString().slice(0,10);
      const bucket = days.find(x => x.key === key);
      if (bucket) {
        bucket.amount += orderTotal(p);
        bucket.items += orderItemCount(p);
      }
    });

    return days.map(d => ({ label: d.label, items: d.items, amount: d.amount }));
  }

  if (period === 'month') {
    // Current month grouped into 4 fixed week-buckets:
    //  - Sem 1: días 1-7
    //  - Sem 2: días 8-14
    //  - Sem 3: días 15-21
    //  - Sem 4: días 22-fin
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const endDay = last.getDate();

    const buckets = [
      { start: new Date(year, month, 1,0,0,0,0), end: new Date(year, month, 7,23,59,59,999), label: 'Sem 1 (1-7)', items: 0, amount: 0 },
      { start: new Date(year, month, 8,0,0,0,0), end: new Date(year, month, 14,23,59,59,999), label: 'Sem 2 (8-14)', items: 0, amount: 0 },
      { start: new Date(year, month, 15,0,0,0,0), end: new Date(year, month, 21,23,59,59,999), label: 'Sem 3 (15-21)', items: 0, amount: 0 },
      { start: new Date(year, month, 22,0,0,0,0), end: new Date(year, month, endDay,23,59,59,999), label: `Sem 4 (22-${endDay})`, items: 0, amount: 0 }
    ];

    pedidos.forEach(p => {
      const d = parseOrderDate(p);
      if (!d) return;
      buckets.forEach(b => {
        if (d >= b.start && d <= b.end) {
          b.amount += orderTotal(p);
          b.items += orderItemCount(p);
        }
      });
    });

    return buckets.map(b => ({ label: b.label, items: b.items, amount: b.amount }));
  }

  // default: year => group by month
  const year = now.getFullYear();
  const months = Array.from({ length: 12 }).map((_, i) => ({ idx: i, label: new Date(year, i, 1).toLocaleString(undefined, { month: 'short' }), items: 0, amount: 0 }));

  pedidos.forEach(p => {
    const d = parseOrderDate(p);
    if (!d) return;
    if (d.getFullYear() !== year) return; // only current year
    const m = d.getMonth();
    months[m].amount += orderTotal(p);
    months[m].items += orderItemCount(p);
  });

  return months.map(m => ({ label: m.label, items: m.items, amount: m.amount }));
}

function generateSalesReport() {
  // Prefer the selector inside the currently visible admin section, fall back to global selectors
  const activeSection = document.querySelector('.admin-section.active');
  let sel = null;
  if (activeSection) sel = activeSection.querySelector('#salesPeriod, #salesPeriodDashboard');
  if (!sel) sel = document.getElementById('salesPeriod') || document.getElementById('salesPeriodDashboard');
  const period = sel ? sel.value : 'month';
  // When user explicitly requests a report, open the summary modal
  renderSalesChart(period, true);
}
  // Exponer para handlers inline en HTML (onclick="generateSalesReport()")
  window.generateSalesReport = generateSalesReport;
});

function initSidebar() {
  const items = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.admin-section');

  if (!items || items.length === 0) {
    console.debug('initSidebar: no nav items found');
    return;
  }

  items.forEach(it => {
    it.addEventListener('click', (e) => {
      // debug: registrar el click y el objetivo
      try {
        console.debug('initSidebar click:', { section: it.dataset.section, target: e.target && (e.target.tagName + ':' + (e.target.className || e.target.id || '')) });
      } catch (err) { /* ignore */ }

      // set active nav
      items.forEach(i => i.classList.remove('active'));
      it.classList.add('active');

      // show section
      const sectionId = (it.dataset && it.dataset.section) ? String(it.dataset.section).trim() : null;
      sections.forEach(s => s.classList.remove('active'));
      if (!sectionId) {
        console.warn('initSidebar: nav item has no data-section:', it);
        return;
      }
      const target = document.getElementById(sectionId);
      if (target) {
        target.classList.add('active');
      } else {
        console.warn('initSidebar: no section found for id', sectionId);
      }

      // cargar datos específicos por sección
      if (sectionId === 'orders') try { loadOrders(); } catch (e) { console.warn('loadOrders failed', e); }
      if (sectionId === 'users') try { loadUsers(); } catch (e) { console.warn('loadUsers failed', e); }
      if (sectionId === 'dashboard') try { loadRecentActivity(); } catch (e) { console.warn('loadRecentActivity failed', e); }
      if (sectionId === 'inventory') {
        try {
          // Ensure inventory tabs exist and load the currently active tab (or default to stock)
          try { initInventoryTabs(); } catch (e) { /* already initialized or not needed */ }
          const activeTab = document.querySelector('.inventory-tab.active') || document.querySelector('.inventory-tab[data-tab="stock"]');
          const name = activeTab && activeTab.dataset ? activeTab.dataset.tab : 'stock';
          if (name === 'stock') { try { loadInventoryReports(); } catch (e) { console.warn('loadInventoryReports failed', e); } }
          else if (name === 'suppliers') { try { loadSuppliers(); } catch (e) { console.warn('loadSuppliers failed', e); } }
          else if (name === 'purchase-orders') { try { loadPurchaseOrders(); } catch (e) { console.warn('loadPurchaseOrders failed', e); } }
        } catch (e) {
          console.warn('Error initializing inventory view', e);
        }
      }
    });
  });
}



async function loadOrders() {
  try {
    const res = await fetch('/pedidos', { method: 'GET' });
    const data = await res.json();

    const tbody = document.getElementById('ordersTable');
    if (!tbody) return;

    if (!data || !data.success) {
      console.error('Error cargando pedidos', data);
      tbody.innerHTML = '<tr><td colspan="6">No se pudieron cargar los pedidos</td></tr>';
      return;
    }

    const pedidos = data.pedidos || [];

    if (pedidos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#999;">No hay pedidos</td></tr>';
      return;
    }

    tbody.innerHTML = '';

    pedidos.forEach(p => {
      const estadoActual = p.estado || 'pendiente';
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${p.id_pedido}</td>
        <td>${escapeHtml(p.nombre_cliente || 'Cliente')}<br>
            <small style="color:#999">${escapeHtml(p.correo_cliente || '')}</small></td>
        <td>${new Date(p.fecha_creacion).toLocaleString()}</td>
        <td>$${Number(p.total || 0).toFixed(2)}</td>
        <td>
          <select class="order-status-select" data-order-id="${p.id_pedido}">
            <option value="pendiente"  ${estadoActual === 'pendiente'  ? 'selected' : ''}> Pendiente</option>
            <option value="procesando" ${estadoActual === 'procesando' ? 'selected' : ''}> Procesando</option>
            <option value="enviado"    ${estadoActual === 'enviado'    ? 'selected' : ''}> Enviado</option>
            <option value="entregado"  ${estadoActual === 'entregado'  ? 'selected' : ''}> Entregado</option>
          </select>
        </td>
        <td>
         <div class="action-buttons">
              <button class="btn-secondary btn-ver-pedido" onclick="showOrderDetails(${p.id_pedido})">Ver</button>
              <button class="btn-primary" onclick="descargarFacturaAdmin(${p.id_pedido})"> 📄 Factura</button>
         </div>
</td>

       
      `;

      tbody.appendChild(tr);
    });

    // actualizar contadores
    const totalEl = document.getElementById('totalOrders');
    const revenueEl = document.getElementById('totalRevenue');
    if (totalEl) totalEl.textContent = pedidos.length;
    if (revenueEl) {
      const revenue = pedidos.reduce((sum, p) => sum + Number(p.total || 0), 0);
      revenueEl.textContent = `$${revenue.toFixed(2)}`;
    }

  } catch (err) {
    console.error('Error en loadOrders:', err);
    const tbody = document.getElementById('ordersTable');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6">Error al cargar pedidos</td></tr>';
  }
}

// DESCARGA UN PDF DAOS DEL PEDIDO
function descargarFacturaAdmin(idPedido) {
  const a = document.createElement('a');
  a.href = `/admin/pedidos/${idPedido}/factura`;  // 👈 nueva ruta
  a.download = `factura-pedido-${idPedido}.pdf`;
  a.click();
}


// Filtrar pedidos por rango de fecha: 'today' | 'week' | 'custom' (start/end ISO dates)
async function applyOrderDateFilter() {
  const sel = document.getElementById('orderDateFilter');
  const startEl = document.getElementById('orderStartDate');
  const endEl = document.getElementById('orderEndDate');
  const tbody = document.getElementById('ordersTable');
  if (!sel || !tbody) return;

  const mode = sel.value || 'all';
  let start = null;
  let end = null;

  if (mode === 'custom') {
    if (startEl && startEl.value) start = new Date(startEl.value);
    if (endEl && endEl.value) end = new Date(endEl.value);
    if (start && end && start > end) {
      try { showToast('La fecha de inicio no puede ser posterior a la fecha final.', 'warning') } catch (e) { console.warn('La fecha de inicio no puede ser posterior a la fecha final.') }
      return;
    }
  } else if (mode === 'today') {
    const d = new Date();
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0);
    end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999);
  } else if (mode === 'week') {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 Sun .. 6 Sat
    // consider week starting Monday
    const offsetToMonday = (dayOfWeek === 0) ? -6 : (1 - dayOfWeek);
    const monday = new Date(now);
    monday.setDate(now.getDate() + offsetToMonday);
    monday.setHours(0,0,0,0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);
    start = monday; end = sunday;
  }

  try {
    const res = await fetch('/pedidos');
    const data = await res.json().catch(() => ({}));
    const orders = (data && data.pedidos && Array.isArray(data.pedidos)) ? data.pedidos : (Array.isArray(data) ? data : []);

    // if no filter (all) just render all
    let filtered = orders;
    if (mode !== 'all' && (start || end)) {
      filtered = (orders || []).filter(o => {
        const s = o && (o.fecha_creacion || o.fecha || o.date || o.created_at || o.createdAt);
        if (!s) return false;
        const d = new Date(s);
        if (isNaN(d.getTime())) return false;
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      });
    }

    if (!filtered || filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No hay pedidos en el rango seleccionado.</td></tr>';
      document.getElementById('totalOrders').textContent = '0';
      document.getElementById('totalRevenue').textContent = '$0';
      return;
    }

    renderOrders(filtered);
    // actualizar contadores
    document.getElementById('totalOrders').textContent = String(filtered.length);
    const revenue = filtered.reduce((sum, p) => sum + Number(p.total || 0), 0);
    document.getElementById('totalRevenue').textContent = `$${revenue.toFixed(2)}`;
  } catch (err) {
    console.error('Error filtrando pedidos:', err);
    tbody.innerHTML = '<tr><td colspan="6">Error al cargar pedidos filtrados.</td></tr>';
  }
}

// Conectar UI del filtro: mostrar inputs para 'custom' y enlazar el botón
document.addEventListener('DOMContentLoaded', () => {
  const sel = document.getElementById('orderDateFilter');
  const startEl = document.getElementById('orderStartDate');
  const endEl = document.getElementById('orderEndDate');
  const applyBtn = document.getElementById('applyOrderFilter');

  if (sel) {
    sel.addEventListener('change', () => {
      if (sel.value === 'custom') {
        if (startEl) startEl.style.display = 'inline-block';
        if (endEl) endEl.style.display = 'inline-block';
      } else {
        if (startEl) startEl.style.display = 'none';
        if (endEl) endEl.style.display = 'none';
      }
    });
  }
  if (applyBtn) applyBtn.addEventListener('click', (e) => { e.preventDefault(); applyOrderDateFilter(); });
});

// --------- Usuarios (Admin) ---------
async function loadUsers() {
  try {
    const res = await fetch('/cliente', { method: 'GET' });
    if (!res.ok) throw new Error('Error al obtener usuarios');
    const rows = await res.json();

    // `rows` es un array de objetos con: id_usuario, nombre, correo, direccion, celular, fecha_creacion, pedidos_count
    renderUsers(rows || []);

    // actualizar contador simple
    document.getElementById('totalUsers').textContent = (rows || []).length;
  } catch (err) {
    console.error('Error en loadUsers:', err);
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '<tr><td colspan="7">Error al cargar usuarios</td></tr>';
  }
}

// Buscar usuarios por nombre o correo desde el input de búsqueda
async function searchUsers() {
  const qEl = document.getElementById('userSearch');
  const tbody = document.getElementById('usersTable');
  if (!qEl || !tbody) return;
  const q = (qEl.value || '').trim().toLowerCase();
  // Si la query está vacía, recargar lista completa
  if (!q) {
    await loadUsers();
    return;
  }

  try {
    const res = await fetch('/cliente', { method: 'GET' });
    const data = await res.json().catch(() => []);
    const rows = Array.isArray(data) ? data : (data && Array.isArray(data.rows) ? data.rows : (data && Array.isArray(data.clientes) ? data.clientes : []));

    const filtered = (rows || []).filter(u => {
      const name = (u.nombre || '').toString().toLowerCase();
      const email = (u.correo || u.email || '').toString().toLowerCase();
      const id = (u.id_usuario || u.id || '').toString();
      return name.includes(q) || email.includes(q) || id === q || id.includes(q);
    });

    if (!filtered || filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">No se encontró ningún usuario con ese nombre o correo.</td></tr>';
      const totalUsersEl = document.getElementById('totalUsers'); if (totalUsersEl) totalUsersEl.textContent = '0';
      return;
    }

    renderUsers(filtered);
    const totalUsersEl = document.getElementById('totalUsers'); if (totalUsersEl) totalUsersEl.textContent = String(filtered.length);
  } catch (err) {
    console.error('Error buscando usuarios:', err);
    tbody.innerHTML = '<tr><td colspan="7">Error al buscar usuarios.</td></tr>';
  }
}

// Conectar Enter en el input de búsqueda y exponer la función globalmente
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('userSearch');
  if (searchInput) {
    // Ejecutar búsqueda con Enter
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchUsers();
      }
    });
  }
  // Toggle show inactive users control
  const showInactiveCb = document.getElementById('showInactiveUsers');
  if (showInactiveCb) {
    showInactiveCb.addEventListener('change', async () => {
      try { await loadUsers(); } catch (e) { console.warn('Error recargando usuarios al cambiar filtro inactivos', e); }
    });
  }
});

window.searchUsers = searchUsers;

function renderUsers(users) {
  const tbody = document.getElementById('usersTable');
  tbody.innerHTML = '';
  // Respect checkbox: show inactive users only if user enabled that option
  const showInactive = !!(document.getElementById('showInactiveUsers') && document.getElementById('showInactiveUsers').checked);

  const filtered = (users || []).filter(u => {
    const isActive = !((u.activo === false) || (u.active === false) || (String(u.estado || '').toLowerCase() === 'inactivo') || (String(u.estado || '').toLowerCase() === 'inactive'));
    return showInactive ? true : isActive;
  });

  if (!filtered || filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">No hay usuarios</td></tr>';
    return;
  }

  filtered.forEach(u => {
    const tr = document.createElement('tr');

    // Usamos los campos devueltos por el backend: `fecha_creacion` y `pedidos_count`.
    const fechaRegistro = u.fecha_creacion ? new Date(u.fecha_creacion).toLocaleString() : '-';
    const pedidosCount = typeof u.pedidos_count !== 'undefined' ? u.pedidos_count : '-';
    // Determinar si el usuario está activo basándonos en distintos campos posibles
    const isActive = !((u.activo === false) || (u.active === false) || (String(u.estado || '').toLowerCase() === 'inactivo') || (String(u.estado || '').toLowerCase() === 'inactive'));
    // Render a single toggle button in the 'Estado' column.
    const estadoText = isActive ? 'Activo' : 'Inactivo';
    const btnStateClass = isActive ? 'btn-status-active' : 'btn-status-inactive';
    const btnLabel = isActive ? 'Activo' : 'Inactivo';

    tr.innerHTML = `
      <td>${u.id_usuario}</td>
      <td>${escapeHtml(u.nombre || '')}</td>
      <td>${escapeHtml(u.correo || '')}</td>
      <td>${fechaRegistro}</td>
      <td>${pedidosCount}</td>
      <td>
        <button class="${btnStateClass} status-toggle-btn" data-id="${u.id_usuario}" aria-pressed="${isActive}">${escapeHtml(btnLabel)}</button>
      </td>
      <td></td>
    `;

    // Attach toggle handler to the status button (single button behavior)
    const statusBtn = tr.querySelector('.status-toggle-btn');
    if (statusBtn) {
      statusBtn.addEventListener('click', async () => {
        const currentlyActive = statusBtn.getAttribute('aria-pressed') === 'true' || statusBtn.getAttribute('aria-pressed') === 'true';
        const desired = !currentlyActive;
        // Call API to toggle
        const result = await toggleUserActive(u.id_usuario, desired);
        if (result && (result.success === true || typeof result.activo !== 'undefined')) {
          // update UI in-place according to server response
          const nowActive = (typeof result.activo !== 'undefined') ? !!result.activo : !!desired;
          statusBtn.setAttribute('aria-pressed', nowActive);
          if (nowActive) {
            statusBtn.classList.remove('btn-status-inactive');
            statusBtn.classList.add('btn-status-active');
            statusBtn.textContent = 'Activo';
          } else {
            statusBtn.classList.remove('btn-status-active');
            statusBtn.classList.add('btn-status-inactive');
            statusBtn.textContent = 'Inactivo';
          }
        } else {
          // error already shown by toggleUserActive; nothing else to do
        }
      });
    }

    tbody.appendChild(tr);
  });
}

async function deleteUser(id) {
  try {
    const res = await fetch(`/usuario/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!data || !data.success) {
      const msg = (data && data.message) ? data.message : 'No se pudo eliminar el usuario';
      try { showToast(msg, 'error') } catch (e) { console.warn(msg) }
      console.error('Respuesta eliminar usuario:', data);
      return;
    }
    // recargar lista
    await loadUsers();
    // actualizar contadores generales (opcional)
    const ordersCount = document.getElementById('totalOrders').textContent;
    // nada más por ahora
    } catch (err) {
    console.error('Error eliminando usuario:', err);
    try { showToast('Error eliminando usuario', 'error') } catch (e) { console.warn('Error eliminando usuario') }
  }
}

// Toggle user active/inactive state (frontend -> server). Tries to PATCH the user with { activo: <bool> }.
async function toggleUserActive(id, active) {
  try {
    if (!id) return;
    const payload = { activo: active };
    const res = await fetch(`/usuario/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data || (typeof data.success !== 'undefined' && !data.success)) {
      const msg = (data && data.message) ? data.message : 'No se pudo actualizar el estado del usuario';
      try { showToast(msg, 'error'); } catch (e) { console.warn(msg); }
      return data || { success: false };
    }
    try { showToast(active ? 'Usuario activado' : 'Usuario inactivado', 'success'); } catch (e) { /* ignore */ }
    // return parsed response so caller can update UI in-place
    return data;
  } catch (err) {
    console.error('Error actualizando estado de usuario:', err);
    try { showToast('Error actualizando estado de usuario', 'error'); } catch (e) { /* ignore */ }
    return { success: false };
  }
}


function renderOrders(orders) {
  const tbody = document.getElementById('ordersTable');
    tbody.innerHTML = '<tr><td colspan="5">No hay pedidos</td></tr>';

  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No hay pedidos</td></tr>';
    return;
  }

  orders.forEach(order => {
    const tr = document.createElement('tr');

    const cliente = order.nombre_cliente || (`ID ${order.id_usuario}`);
    const correo = order.correo_cliente ? `<br><small>${order.correo_cliente}</small>` : '';
    const fecha = order.fecha_creacion ? new Date(order.fecha_creacion).toLocaleString() : (order.fecha || '');

    tr.innerHTML = `
      <td>${order.id_pedido}</td>
      <td>${escapeHtml(cliente)}${correo}</td>
      <td>${fecha}</td>
      <td>$${Number(order.total || 0).toFixed(2)}</td>
      <td>
        <button type="button" class="btn-secondary" data-action="view" data-id="${order.id_pedido}">Ver</button>
      </td>
    `;

    // attach event for view button
    tr.querySelector('[data-action="view"]').addEventListener('click', () => showOrderDetails(order));

    tbody.appendChild(tr);
  });
}

async function showOrderDetails(orderOrId) {
  // Accept either an order object or an id; normalize server wrappers.
  console.log('showOrderDetails called', orderOrId);
  let order = orderOrId;
  try {
    if (order == null) return;
    // If passed an id (number or numeric string), fetch the order
    if (typeof order === 'number' || (typeof order === 'string' && /^\d+$/.test(order))) {
      const res = await fetch(`/pedidos/${order}`);
      order = await res.json().catch(() => null);
    }

    // Some APIs return { success: true, pedido: {...} } or { success: true, pedido: [...] }
    if (order && order.success && (order.pedido || order.pedidos || order.order)) {
      order = order.pedido || order.order || (Array.isArray(order.pedidos) ? order.pedidos[0] : null) || order;
    }

    // If the server wraps the object in a root key like { data: {...} }
    if (order && order.data && (order.data.id_pedido || order.data.id)) {
      order = order.data;
    }
  } catch (err) {
    console.error('Error obteniendo pedido para mostrar:', err);
    return;
  }

  if (!order || typeof order !== 'object') return;

  const modal = document.getElementById('orderDetailsModal');
  const content = document.getElementById('orderDetailsContent');
  if (!modal || !content) return;
  content.innerHTML = '';

  const header = document.createElement('div');
  header.innerHTML = `
    <p><strong>ID Pedido:</strong> ${order.id_pedido || order.id || ''}</p>
    <p><strong>Cliente:</strong> ${escapeHtml(order.nombre_cliente || order.cliente || 'ID ' + (order.id_usuario || ''))}</p>
    <p><strong>Email:</strong> ${escapeHtml(order.correo_cliente || order.email || '')}</p>
    <p><strong>Total:</strong> $${Number(order.total || order.total_pedido || order.amount || 0).toFixed(2)}</p>
    <hr>
  `;
  content.appendChild(header);

  // libros puede venir como string JSON o ya como array o bajo otras keys
  let libros = [];
  if (order.libros) libros = order.libros;
  else if (order.items) libros = order.items;
  else if (order.line_items) libros = order.line_items;

  if (typeof libros === 'string') libros = safeJsonParse(libros);
  if (!Array.isArray(libros)) libros = [];

  if (!libros || libros.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No hay libros en el pedido';
    content.appendChild(p);
  } else {
    const table = document.createElement('table');
    table.className = 'admin-table';
    table.style.width = '100%';
    table.innerHTML = `
      <thead><tr><th>Título</th><th>Cantidad</th><th>Precio Unit.</th><th>Subtotal</th></tr></thead>
      <tbody></tbody>
    `;

    const tb = table.querySelector('tbody');
    libros.forEach(item => {
      const tr = document.createElement('tr');
      const precio = parseNumberString(item.precio_unitario || item.precio || item.price || 0);
      const cantidad = Number(item.cantidad || item.quantity || 1);
      const subtotal = precio * cantidad;

      tr.innerHTML = `
        <td>${escapeHtml(item.titulo || item.title || item.name || '')}</td>
        <td>${cantidad}</td>
        <td>$${precio.toFixed(2)}</td>
        <td>$${subtotal.toFixed(2)}</td>
      `;

      tb.appendChild(tr);
    });

    content.appendChild(table);
  }

  // open modal using class to match CSS
  try {
    modal.classList.add('active');
  } catch (err) {
    console.error('Error al abrir modal:', err);
  }
}



function closeOrderDetailsModal() {
  const modal = document.getElementById('orderDetailsModal');
  if (!modal) return;
  modal.classList.remove('active');
  const content = document.getElementById('orderDetailsContent');
  if (content) content.innerHTML = '';
}

function closeSalesSummaryModal() {
  const modal = document.getElementById('salesSummaryModal');
  if (!modal) return;
  modal.classList.remove('active');
  const content = document.getElementById('salesSummaryContent');
  if (content) content.innerHTML = '';
}

function attachModalHandlers() {
  // Attach close handlers to all modals (.close spans) and a window click to close when clicking backdrop
  document.querySelectorAll('.modal .close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = btn.closest('.modal');
      if (!modal) return;
      modal.classList.remove('active');
      // clear known content areas
      if (modal.id === 'orderDetailsModal') {
        const c = document.getElementById('orderDetailsContent'); if (c) c.innerHTML = '';
      }
      if (modal.id === 'salesSummaryModal') {
        const c = document.getElementById('salesSummaryContent'); if (c) c.innerHTML = '';
      }
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('modal')) {
      const modal = e.target;
      modal.classList.remove('active');
      if (modal.id === 'orderDetailsModal') {
        const c = document.getElementById('orderDetailsContent'); if (c) c.innerHTML = '';
      }
      if (modal.id === 'salesSummaryModal') {
        const c = document.getElementById('salesSummaryContent'); if (c) c.innerHTML = '';
      }
    }
  });
}

function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Try to extract a single, sensible genre string from supplier metadata
function extractGenreString(raw) {
  if (!raw && raw !== 0) return '';
  let s = String(raw || '').trim().toLowerCase();
  if (!s) return '';
  // common genre keywords to look for
  const known = ['terror','ciencia ficción','ciencia ficcion','romance','fantasia','fantasía','misterio','aventura','drama','ficción','ficcion'];
  for (const k of known) {
    if (s.indexOf(k) !== -1) {
      // return capitalized form
      return k.charAt(0).toUpperCase() + k.slice(1);
    }
  }
  // fallback: take first token separated by comma/semicolon/pipe/slash
  const tok = s.split(/[,:;|\/\-]/)[0].trim();
  return tok ? (tok.charAt(0).toUpperCase() + tok.slice(1)) : '';
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch (e) {
    return [];
  }
}

function logout() {
  // Simple redirect to login. If you have a logout endpoint, call it first.
  window.location.href = '/login.html';
}

// expose some functions for dev/debug
window.loadOrders = loadOrders;
window.showOrderDetails = showOrderDetails;
window.logout = logout;
// Export modal and books functions for admin.html onclick handlers
window.openAddBookModal = openAddBookModal;
window.closeAddBookModal = closeAddBookModal;
window.closeOrderDetailsModal = closeOrderDetailsModal;
window.closeSalesSummaryModal = closeSalesSummaryModal;

// Proveedores y Órdenes de Compra: funciones para modales y formularios
window.openAddSupplierModal = openAddSupplierModal;
window.closeAddSupplierModal = closeAddSupplierModal;
window.openNewPurchaseOrderModal = openNewPurchaseOrderModal;
window.openEditSupplierModal = openEditSupplierModal;
window.deleteSupplier = deleteSupplier;
window.closeNewPurchaseOrderModal = closeNewPurchaseOrderModal;
window.addPurchaseProduct = addPurchaseProduct;
window.removePurchaseProduct = removePurchaseProduct;

// Cargar proveedores desde el backend y renderizar en la UI
async function loadSuppliers() {
  try {
    const res = await fetch('/proveedores');
    const data = await res.json().catch(() => ({}));
    const list = Array.isArray(data) ? data : (data.proveedores || []);
    const container = document.getElementById('suppliersContainer');
    const select = document.getElementById('purchaseSupplier');

    // build a lookup map for quick access elsewhere
    window.suppliersById = window.suppliersById || {};
    (list || []).forEach(p => { window.suppliersById[String(p.id)] = p; });

    if (container) {
      if (!list || list.length === 0) {
        container.innerHTML = '<p style="color:#999">No hay proveedores registrados</p>';
      } else {
        // render suppliers as a table for easier scanning
        const rows = list.map(p => `
          <tr>
            <td>${escapeHtml(String(p.id || ''))}</td>
            <td>${escapeHtml(p.nombre || p.name || '')}</td>
            <td>${escapeHtml(p.empresa || p.company || '')}</td>
            <td>${escapeHtml(p.email || '')}</td>
            <td>${escapeHtml(p.telefono || p.phone || '')}</td>
            <td style="max-width:220px; white-space:normal;">${escapeHtml(p.productos || p.products || '')}</td>
            <td>
              <button class="btn-secondary" onclick="openEditSupplierModal(${p.id})">Editar</button>
              <button class="btn-danger" onclick="deleteSupplier(${p.id})">Eliminar</button>
            </td>
          </tr>
        `).join('');

        container.innerHTML = `
          <div class="table-container">
            <table class="admin-table suppliers-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Empresa</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Tipo de Productos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `;
      }
    }

    if (select) {
      select.innerHTML = '<option value="">Seleccione un proveedor</option>' + (list || []).map(p => {
        const rawGenre = p.genero || p.genre || p.productos || p.products || p.tipo_productos || p.tipoProductos || '';
        return `
        <option value="${p.id}" data-genre="${escapeHtml(rawGenre)}">${escapeHtml(p.nombre || p.name || '')}${p.empresa ? ' - ' + escapeHtml(p.empresa) : ''}</option>
      `}).join('');

      // attach a single change listener (guard to avoid multiple attachments)
      if (!window._purchaseSupplierListenerAttached) {
        select.addEventListener('change', () => {
          const id = select.value;
          const supplier = (window.suppliersById || {})[id];
          let rawGenre = '';
          if (supplier) {
            rawGenre = supplier.genero || supplier.genre || supplier.productos || supplier.products || supplier.tipo_productos || supplier.tipoProductos || '';
          } else {
            const opt = select.options[select.selectedIndex];
            rawGenre = (opt && opt.getAttribute('data-genre')) || '';
          }
          const genre = extractGenreString(rawGenre);
          document.querySelectorAll('#purchaseProductsList .purchase-genre').forEach(el => el.value = genre || '');
        });
        window._purchaseSupplierListenerAttached = true;
      }
    }
  } catch (err) {
    console.error('Error cargando proveedores:', err);
  }
}

function openAddSupplierModal() {
  const modal = document.getElementById('addSupplierModal');
  // reset form to ensure creating new supplier by default
  const form = document.getElementById('addSupplierForm'); if (form) form.reset();
  const hid = document.getElementById('supplierEditId'); if (hid && hid.parentNode) hid.parentNode.removeChild(hid);
  if (modal) modal.classList.add('active');
}

function closeAddSupplierModal() {
  const modal = document.getElementById('addSupplierModal');
  if (modal) modal.classList.remove('active');
  const form = document.getElementById('addSupplierForm'); if (form) form.reset();
}

// Editar proveedor: abrir modal y precargar datos en el formulario
async function openEditSupplierModal(id) {
  try {
    // ensure suppliers are loaded
    if (!window.suppliersById || !window.suppliersById[String(id)]) {
      await loadSuppliers();
    }
    const supplier = (window.suppliersById || {})[String(id)];
    if (!supplier) {
      showToast('Proveedor no encontrado', 'warning');
      return;
    }
    openAddSupplierModal();
    // put values into the add supplier form (we'll reuse it for edit)
    document.getElementById('supplierName').value = supplier.nombre || supplier.name || '';
    document.getElementById('supplierCompany').value = supplier.empresa || supplier.company || '';
    document.getElementById('supplierEmail').value = supplier.email || '';
    document.getElementById('supplierPhone').value = supplier.telefono || supplier.phone || '';
    document.getElementById('supplierAddress').value = supplier.direccion || supplier.address || '';
    document.getElementById('supplierProducts').value = supplier.productos || supplier.products || '';
    // save id in a hidden field so form submit knows to PUT instead of POST
    let hid = document.getElementById('supplierEditId');
    if (!hid) {
      hid = document.createElement('input'); hid.type = 'hidden'; hid.id = 'supplierEditId';
      const form = document.getElementById('addSupplierForm'); if (form) form.appendChild(hid);
    }
    hid.value = String(id);
  } catch (e) {
    console.error('openEditSupplierModal error', e);
    showToast('No se pudo abrir el editor de proveedor', 'error');
  }
}

// Eliminar proveedor con confirmación
async function deleteSupplier(id) {
  confirmWithToast(`¿Eliminar proveedor #${id}?`, async () => {
    try {
      const res = await fetch(`/proveedores/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data && data.success) {
        showToast('Proveedor eliminado', 'success');
        await loadSuppliers();
      } else {
        console.error('deleteSupplier failed', data);
        showToast('No se pudo eliminar el proveedor', 'error');
      }
    } catch (err) {
      console.error('Error deleting supplier', err);
      showToast('Error de red al eliminar proveedor', 'error');
    }
  }, () => { /* cancel */ });
}

// Abrir modal de nueva orden: precargar proveedores y setear fecha
function openNewPurchaseOrderModal() {
  loadSuppliers();
  const modal = document.getElementById('newPurchaseOrderModal');
  if (!modal) return;
  // ensure creating a new order (clear any previous id)
  const formId = document.getElementById('purchaseOrderId'); if (formId) formId.value = '';
  const supplierSelect = document.getElementById('purchaseSupplier'); if (supplierSelect) supplierSelect.value = '';
  const notesEl = document.getElementById('purchaseNotes'); if (notesEl) notesEl.value = '';
  const dateInput = document.getElementById('purchaseDate');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }
  // ensure at least one product row
  const list = document.getElementById('purchaseProductsList');
  if (list && list.children.length === 0) addPurchaseProduct();
  updatePurchaseTotal();
  modal.classList.add('active');
}

function closeNewPurchaseOrderModal() {
  const modal = document.getElementById('newPurchaseOrderModal');
  if (!modal) return;
  modal.classList.remove('active');
  const form = document.getElementById('newPurchaseOrderForm'); if (form) form.reset();
  const list = document.getElementById('purchaseProductsList'); if (list) list.innerHTML = '';
  const total = document.getElementById('purchaseTotal'); if (total) total.textContent = '0.00';
}

function addPurchaseProduct() {
  const list = document.getElementById('purchaseProductsList');
  if (!list) return;
  const item = document.createElement('div');
  item.className = 'purchase-product-item';
  item.innerHTML = `
    <input type="text" class="purchase-product-name" placeholder="Nombre del producto / título" />
    <input type="text" class="purchase-author" placeholder="Autor" />
    <input type="text" class="purchase-genre" placeholder="Género" />
    <input type="number" class="purchase-quantity" placeholder="Cantidad" min="1" value="1" />
    <input type="number" class="purchase-unit-price" placeholder="Precio unitario" min="0" step="0.01" value="0" />
    <button type="button" class="btn-danger btn-sm" onclick="removePurchaseProduct(this)">
      <i class="fas fa-trash"></i>
    </button>
  `;
  list.appendChild(item);
  // initialize genre input from currently selected supplier (if any)
  try {
    const supplierSelect = document.getElementById('purchaseSupplier');
    let initialGenre = '';
    if (supplierSelect && supplierSelect.value && window.suppliersById && window.suppliersById[String(supplierSelect.value)]) {
      const sp = window.suppliersById[String(supplierSelect.value)];
      initialGenre = extractGenreString(sp.genero || sp.genre || sp.productos || sp.products || sp.tipo_productos || sp.tipoProductos || '');
    } else if (supplierSelect) {
      const opt = supplierSelect.options[supplierSelect.selectedIndex];
      initialGenre = (opt && opt.getAttribute('data-genre')) || '';
      initialGenre = extractGenreString(initialGenre);
    }
    const genreInput = item.querySelector('.purchase-genre');
    if (genreInput) genreInput.value = initialGenre || '';
  } catch (e) {
    // non-blocking
  }
  // attach listeners for quantity/price changes to update total
  const qty = item.querySelector('.purchase-quantity');
  const price = item.querySelector('.purchase-unit-price');
  [qty, price].forEach(el => {
    if (!el) return;
    ['input','change'].forEach(ev => el.addEventListener(ev, updatePurchaseTotal));
  });
  updatePurchaseTotal();
}

function removePurchaseProduct(btn) {
  const item = btn && btn.closest && btn.closest('.purchase-product-item');
  if (!item) return;
  const parent = item.parentNode; if (!parent) return;
  parent.removeChild(item);
  updatePurchaseTotal();
}

function updatePurchaseTotal() {
  const items = Array.from(document.querySelectorAll('#purchaseProductsList .purchase-product-item'));
  let total = 0;
  items.forEach(it => {
    const qEl = it.querySelector('.purchase-quantity');
    const pEl = it.querySelector('.purchase-unit-price');
    // Prefer valueAsNumber for <input type="number"> when available
    let q = 0;
    let p = 0;
    if (qEl && typeof qEl.valueAsNumber === 'number' && !isNaN(qEl.valueAsNumber)) {
      q = Math.max(0, Math.floor(qEl.valueAsNumber));
    } else if (qEl) {
      q = Math.max(0, Math.floor(Number(parseNumberString(qEl.value || qEl.textContent || 0) || 0)));
    }
    if (pEl && typeof pEl.valueAsNumber === 'number' && !isNaN(pEl.valueAsNumber)) {
      p = Number(pEl.valueAsNumber);
    } else if (pEl) {
      p = Number(parseNumberString(pEl.value || pEl.textContent || 0) || 0);
    }
    total += q * p;
  });
  const out = document.getElementById('purchaseTotal');
  if (out) out.textContent = Number(total || 0).toFixed(2);
  // debug: if total is zero but there are items, log their raw values (helps detect parsing issues)
  if (total === 0 && items.length > 0) {
    try {
      const debug = items.map(it => ({
        qty: (it.querySelector('.purchase-quantity') || {}).value,
        price: (it.querySelector('.purchase-unit-price') || {}).value
      }));
      console.debug('purchase total debug:', debug);
    } catch (e) { /* ignore */ }
  }
}

// Manejo de envío de formularios para crear proveedor y crear orden de compra
document.addEventListener('DOMContentLoaded', () => {
  // bind add supplier form
  const sf = document.getElementById('addSupplierForm');
  if (sf) {
    // helper validators
    const emailEl = document.getElementById('supplierEmail');
    const phoneEl = document.getElementById('supplierPhone');
    function validateEmail(v) {
      if (!v) return false;
      // simple but robust-ish email regex
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    }
    function validatePhone(v) {
      if (!v) return false;
      const digits = String(v).replace(/[^0-9]/g, '');
      return digits.length === 10;
    }
    function showInputError(elId, msg) {
      const node = document.getElementById(elId + 'Error');
      if (node) node.textContent = msg || '';
    }
    function clearInputError(elId) {
      const node = document.getElementById(elId + 'Error');
      if (node) node.textContent = '';
    }

    // clear errors while typing
    if (emailEl) {
      emailEl.addEventListener('input', () => {
        if (validateEmail(emailEl.value)) clearInputError('supplierEmail');
      });
    }
    if (phoneEl) {
      phoneEl.addEventListener('input', () => {
        if (validatePhone(phoneEl.value)) clearInputError('supplierPhone');
      });
    }

    sf.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailVal = (document.getElementById('supplierEmail') || {}).value || '';
      const phoneVal = (document.getElementById('supplierPhone') || {}).value || '';
      let hasError = false;
      if (!validateEmail(emailVal)) {
        showInputError('supplierEmail', 'Ingrese un correo válido (ej: usuario@dominio.com)');
        hasError = true;
      } else {
        clearInputError('supplierEmail');
      }
      if (!validatePhone(phoneVal)) {
        showInputError('supplierPhone', 'El teléfono debe tener 10 dígitos numéricos');
        hasError = true;
      } else {
        clearInputError('supplierPhone');
      }
      if (hasError) {
        // focus first invalid field
        if (!validateEmail(emailVal) && emailEl) emailEl.focus();
        else if (!validatePhone(phoneVal) && phoneEl) phoneEl.focus();
        return;
      }

      const payload = {
        nombre: (document.getElementById('supplierName') || {}).value || '',
        empresa: (document.getElementById('supplierCompany') || {}).value || '',
        email: emailVal,
        telefono: phoneVal,
        direccion: (document.getElementById('supplierAddress') || {}).value || '',
        productos: (document.getElementById('supplierProducts') || {}).value || ''
      };
      try {
        const editIdEl = document.getElementById('supplierEditId');
        const editId = (editIdEl && editIdEl.value) ? String(editIdEl.value) : '';
        const url = editId ? `/proveedores/${encodeURIComponent(editId)}` : '/proveedores';
        const method = editId ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data && data.success) {
          showToast(editId ? 'Proveedor actualizado' : 'Proveedor creado', 'success');
          closeAddSupplierModal();
          // remove edit id if present
          if (editIdEl && editIdEl.parentNode) editIdEl.parentNode.removeChild(editIdEl);
          await loadSuppliers();
        } else {
          console.error('Error guardando proveedor', data);
          showToast('No se pudo guardar el proveedor', 'error');
        }
      } catch (err) {
        console.error('Error al guardar proveedor', err);
        showToast('Error de red al guardar proveedor', 'error');
      }
    });
  }

  // bind new purchase order form
  const pf = document.getElementById('newPurchaseOrderForm');
  if (pf) {
    pf.addEventListener('submit', async (e) => {
      e.preventDefault();
      const supplierId = (document.getElementById('purchaseSupplier') || {}).value;
      const date = (document.getElementById('purchaseDate') || {}).value;
      const notes = (document.getElementById('purchaseNotes') || {}).value || '';
      const items = Array.from(document.querySelectorAll('#purchaseProductsList .purchase-product-item')).map(it => ({
        // server expects product_name / name and qty / quantity and unit_price
        product_name: (it.querySelector('.purchase-product-name') || {}).value || '',
        name: (it.querySelector('.purchase-product-name') || {}).value || '',
        author: (it.querySelector('.purchase-author') || {}).value || '',
        genre: (it.querySelector('.purchase-genre') || {}).value || '',
        quantity: parseInt((it.querySelector('.purchase-quantity') || {value:0}).value, 10) || 0,
        qty: parseInt((it.querySelector('.purchase-quantity') || {value:0}).value, 10) || 0,
        unit_price: parseFloat((it.querySelector('.purchase-unit-price') || {value:0}).value) || 0,
        price: parseFloat((it.querySelector('.purchase-unit-price') || {value:0}).value) || 0
      })).filter(i => i.product_name || i.quantity > 0);
      const total = parseFloat((document.getElementById('purchaseTotal') || {textContent:'0'}).textContent) || 0;

      if (!supplierId) { showToast('Seleccione un proveedor', 'warning'); return; }
      if (!items || items.length === 0) { showToast('Agregue al menos un producto', 'warning'); return; }

      try {
        const orderId = (document.getElementById('purchaseOrderId') || {}).value || '';
        const url = orderId ? `/ordenes_compra/${orderId}` : '/ordenes_compra';
        const method = orderId ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ supplier_id: supplierId, date, total, notes, products: items })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data && data.success) {
          showToast(orderId ? 'Orden actualizada' : 'Orden de compra creada', 'success');
          closeNewPurchaseOrderModal();
          try { loadPurchaseOrders(); } catch (e) { /* ignore */ }
          // refresh inventory and books views so newly created products appear without full page reload
          try { if (typeof loadInventoryReports === 'function') await loadInventoryReports(); } catch (e) { console.warn('loadInventoryReports after purchase save failed', e); }
          try { if (typeof loadFeaturedBooks === 'function') await loadFeaturedBooks(); } catch (e) { console.warn('loadFeaturedBooks after purchase save failed', e); }
        } else {
          console.error('Error guardando orden', data);
          showToast('No se pudo guardar la orden', 'error');
        }
      } catch (err) {
        console.error('Error al guardar orden', err);
        showToast('Error de red al guardar orden', 'error');
      }
    });
  }

  // cargar proveedores al iniciar la sección admin (útil para el tab suppliers)
  try { loadSuppliers(); } catch (e) { /* ignore */ }
  // attach listeners to any existing purchase product rows in the modal
  try { attachPurchaseItemListeners(); } catch (e) { /* ignore */ }
});

// Attach input/change listeners to existing purchase-product-item rows
function attachPurchaseItemListeners() {
  const items = Array.from(document.querySelectorAll('#purchaseProductsList .purchase-product-item'));
  if (!items || items.length === 0) return;
  items.forEach(it => {
    const qty = it.querySelector('.purchase-quantity');
    const price = it.querySelector('.purchase-unit-price');
    // ensure default values
    if (qty && (qty.value === '' || qty.value === null)) qty.value = 1;
    if (price && (price.value === '' || price.value === null)) price.value = 0;
    [qty, price].forEach(el => {
      if (!el) return;
      ['input','change'].forEach(ev => el.addEventListener(ev, updatePurchaseTotal));
    });
  });
  // initial calc
  try { updatePurchaseTotal(); } catch (e) { /* ignore */ }
}
function openAddBookModal() {
  const modal = document.getElementById('addBookModal');
  if (modal) modal.classList.add('active');
}

function closeAddBookModal() {
  const modal = document.getElementById('addBookModal');
  if (modal) modal.classList.remove('active');
  const form = document.getElementById('addBookForm');
  if (form) form.reset();
  const bookId = document.getElementById('bookId');
  if (bookId) bookId.value = '';
}

// Manejar el submit del formulario de agregar libro (envía a /libros)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('addBookForm');
  if (!form) return;

  // Parseo flexible de precios: acepta formatos como "23,000", "23.000", "23,000.50" o "23.000,50"
  function parsePriceString(input) {
    if (input == null) return 0;
    let s = String(input).trim();
    if (!s) return 0;
    // eliminar símbolos de moneda y espacios
    s = s.replace(/[^0-9.,-]/g, '');
    const hasDot = s.indexOf('.') !== -1;
    const hasComma = s.indexOf(',') !== -1;

    if (hasDot && hasComma) {
      // el separador decimal es el último que aparece
      if (s.lastIndexOf('.') > s.lastIndexOf(',')) {
        // punto como decimal, eliminar comas de miles
        s = s.replace(/,/g, '');
        return parseFloat(s) || 0;
      } else {
        // coma como decimal, eliminar puntos de miles
        s = s.replace(/\./g, '').replace(',', '.');
        return parseFloat(s) || 0;
      }
    }

    if (hasComma) {
      const parts = s.split(',');
      // si la parte después de la coma tiene 3 dígitos, probablemente es separador de miles
      if (parts[1] && parts[1].length === 3) {
        s = s.replace(/,/g, '');
        return parseFloat(s) || 0;
      }
      // sino, asumir coma decimal
      s = s.replace(',', '.');
      return parseFloat(s) || 0;
    }

    if (hasDot) {
      const parts = s.split('.');
      if (parts[1] && parts[1].length === 3) {
        // punto como separador de miles
        s = s.replace(/\./g, '');
        return parseFloat(s) || 0;
      }
      return parseFloat(s) || 0;
    }

    return parseFloat(s) || 0;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const genre = (document.getElementById('bookGenre') && document.getElementById('bookGenre').value.trim()) || null;
    const price = parsePriceString(document.getElementById('bookPrice').value);
    const stockEl = document.getElementById('bookStock');
    const stock = stockEl ? (parseInt(stockEl.value, 10) || 0) : undefined;
    const isbn = null;
    const image = document.getElementById('bookImage').value.trim() || null;
    const description = document.getElementById('bookDescription').value.trim() || null;
    const bookIdField = document.getElementById('bookId');
    const bookId = bookIdField ? bookIdField.value : '';

    try {
      if (bookId) {
        // Editar libro existente
        const res = await fetch(`/libros/${bookId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, author, isbn, genre, price, image, description, stock })
        });

        const data = await res.json();
        if (res.ok && data && data.success) {
          showToast('Libro actualizado correctamente', 'success');
          closeAddBookModal();
          await loadFeaturedBooks();
          return;
        } else {
          console.error('Error al actualizar libro:', data);
          showToast('No se pudo actualizar el libro en el servidor', 'warning');
          return;
        }
      }

      // Crear nuevo libro
      const res = await fetch('/libros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, isbn, genre, price, image, description, stock })
      });

      const data = await res.json();
      if (res.ok && data && data.success) {
        showToast('Libro agregado correctamente', 'success');
        closeAddBookModal();
        await loadFeaturedBooks();
      } else {
        console.error('Error al agregar libro:', data);
        showToast('No se pudo agregar el libro en el servidor', 'warning');
      }
    } catch (err) {
      console.error('Error enviando libro al servidor:', err);
      try { showToast('Error de red al agregar/actualizar libro', 'error') } catch (e) { console.warn('Error de red al agregar/actualizar libro') }
    }
  });
});

// Cargar y renderizar la vista 'Libros' usando los datos del inventario
async function loadFeaturedBooks() {
  const container = document.getElementById('featuredBooks');
  if (!container) return;
  try {
    // Reuse the inventory endpoint so books added via órdenes de compra aparecen aquí
    const res = await fetch('/libros');
    const data = await res.json().catch(() => ([]));
    const books = Array.isArray(data) ? data : (data.libros || data.books || []);

    // Actualizar contador de libros totales
    try {
      const totalEl = document.getElementById('totalBooks');
      if (totalEl) totalEl.textContent = String(books.length);
      const booksCountEl = document.getElementById('booksCount');
      if (booksCountEl) booksCountEl.textContent = `(${books.length})`;
    } catch (e) { /* ignore */ }
    // Cachear libros para permitir filtrado en cliente y renderizar mediante helper
    window._adminBooksCache = books || [];
    renderFeaturedBooksTable(window._adminBooksCache);
    return;
  } catch (err) {
    console.error('Error cargando libros (inventario):', err);
    container.innerHTML = '<p>No se pudieron cargar los libros.</p>';
  }
}

// Render helper para la tabla de libros (puede usarse con subconjuntos filtrados)
function renderFeaturedBooksTable(books) {
  const container = document.getElementById('featuredBooks');
  if (!container) return;
  const rowsHtml = (books || []).map(b => {
    const imgSrc = b.image || b.imagen || '/abstract-book-cover.png';
    const priceText = `$${Number(b.price || b.precio || 0).toFixed(2)}`;
    const qty = Number(b.stock || b.cantidad || b.qty || 0) || 0;
    return `
      <tr>
        <td>${escapeHtml(String(b.id || b.ID || ''))}</td>
        <td><img src="${imgSrc}" alt="${escapeHtml(b.title||b.nombre||'portada')}" class="book-thumb"> ${escapeHtml(b.title || b.nombre || b.titulo || '')}</td>
        <td>${escapeHtml(b.author || b.autor || '')}</td>
        <td>${priceText}</td>
        <td>${escapeHtml(String(qty))}</td>
        <td style="display:flex; gap:8px; align-items:center;">
          <img src="${imgSrc}" alt="thumb" style="width:40px;height:40px;object-fit:cover;border-radius:4px;border:1px solid #eee;" />
          <button class="btn-secondary" onclick="setBookImageUrl(${b.id || b.ID || ''})">Establecer URL</button>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="table-container">
      <table class="admin-table admin-books-table" style="width:100%;">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Autor</th>
            <th>Precio Unitario</th>
            <th>Cantidad</th>
            <th>Imagen</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

// Normalizar cadenas (quita acentos y pasa a minúsculas)
function normalizeAdminString(s) {
  if (!s && s !== 0) return '';
  try {
    return String(s).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  } catch (e) {
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
}

// Aplicar filtro en cliente usando cache local
function applyAdminBookFilter() {
  const q = (document.getElementById('admin-book-search') || {}).value || '';
  const field = (document.getElementById('admin-search-field') || {}).value || 'all';
  const raw = window._adminBooksCache || [];
  const term = normalizeAdminString(q.trim());
  if (!term) {
    renderFeaturedBooksTable(raw);
    return;
  }
  const filtered = raw.filter(b => {
    if (field === 'author') {
      return normalizeAdminString(b.author || b.autor || '').indexOf(term) !== -1;
    } else if (field === 'title') {
      return normalizeAdminString(b.title || b.titulo || b.nombre || '').indexOf(term) !== -1;
    } else {
      // search both
      const a = normalizeAdminString(b.author || b.autor || '');
      const t = normalizeAdminString(b.title || b.titulo || b.nombre || '');
      return a.indexOf(term) !== -1 || t.indexOf(term) !== -1;
    }
  });
  renderFeaturedBooksTable(filtered);
}

// Adjuntar listeners al DOM para búsqueda admin
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('admin-book-search');
  const sel = document.getElementById('admin-search-field');
  const clearBtn = document.getElementById('admin-search-clear');
  if (input) input.addEventListener('input', applyAdminBookFilter);
  if (sel) sel.addEventListener('change', applyAdminBookFilter);
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (input) input.value = '';
    if (sel) sel.value = 'all';
    applyAdminBookFilter();
  });
  // Credentials form handling: validar y enviar cambio de contraseña
  const credForm = document.getElementById('credentialsForm');
  if (credForm) {
    credForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const curPwdEl = document.getElementById('currentPassword');
      const newPwdEl = document.getElementById('newPassword');
      const confPwdEl = document.getElementById('confirmNewPassword');
      const notifyEl = document.getElementById('notifyByEmail');
      // identifier removed: password change allowed without email/usuario
      const currentPassword = curPwdEl ? String(curPwdEl.value || '') : '';
      const newPassword = newPwdEl ? String(newPwdEl.value || '') : '';
      const confirmPassword = confPwdEl ? String(confPwdEl.value || '') : '';
      const newEmailEl = document.getElementById('newEmail');
      const confEmailEl = document.getElementById('confirmNewEmail');
      const newEmail = newEmailEl ? String(newEmailEl.value || '').trim() : '';
      const confirmEmail = confEmailEl ? String(confEmailEl.value || '').trim() : '';
      const notify = notifyEl ? String(notifyEl.value || 'yes') === 'yes' : true;
      // Validaciones básicas
      // Debe haber al menos un cambio: nueva contraseña o nuevo email
      if (!newPassword && !newEmail) { showToast('Ingrese nueva contraseña o nuevo email para actualizar', 'error'); return; }
      // Si se solicita cambiar la contraseña, la contraseña actual es obligatoria
      if (newPassword) {
        if (!currentPassword) { showToast('Ingrese su contraseña actual para cambiar la contraseña', 'error'); if (curPwdEl) curPwdEl.focus(); return; }
        if (newPassword.length < 8) { showToast('La nueva contraseña debe tener al menos 8 caracteres', 'error'); if (newPwdEl) newPwdEl.focus(); return; }
        if (newPassword !== confirmPassword) { showToast('Las contraseñas no coinciden', 'error'); if (confPwdEl) confPwdEl.focus(); return; }
      }
      if (newEmail) {
        // simple email regex
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(newEmail)) { showToast('Ingrese un email válido', 'error'); if (newEmailEl) newEmailEl.focus(); return; }
        if (newEmail !== confirmEmail) { showToast('Los emails no coinciden', 'error'); if (confEmailEl) confEmailEl.focus(); return; }
      }

      // Deshabilitar botón de submit mientras se procesa
      const submitBtn = credForm.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Procesando...'; }

      try {
        const payload = { currentPassword, notify };
        if (newPassword) payload.newPassword = newPassword;
        if (newEmail) payload.newEmail = newEmail;
        const res = await fetch('/admin/credenciales', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data && (data.success || data.updated))) {
          showToast('Credenciales actualizadas correctamente', 'success');
          // limpiar campos
          if (curPwdEl) curPwdEl.value = '';
          if (newPwdEl) newPwdEl.value = '';
          if (confPwdEl) confPwdEl.value = '';
        } else {
          const msg = (data && data.message) ? data.message : 'No se pudieron actualizar las credenciales';
          showToast(msg, 'error');
        }
      } catch (err) {
        console.error('Error actualizando credenciales:', err);
        showToast('Error de red al actualizar credenciales', 'error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Actualizar credenciales'; }
      }
    });
  }

  // General settings form: permitir cambiar sólo el email desde este formulario
  const genForm = document.getElementById('generalSettings');
  if (genForm) {
    genForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const newEmailEl = document.getElementById('newEmail');
      const confEmailEl = document.getElementById('confirmNewEmail');
      const newEmail = newEmailEl ? String(newEmailEl.value || '').trim() : '';
      const confEmail = confEmailEl ? String(confEmailEl.value || '').trim() : '';

      if (!newEmail) {
        // If no email provided, allow form to proceed as normal (no-op here)
        showToast('Completa el campo de nuevo email para actualizar', 'error');
        return;
      }

      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(newEmail)) { showToast('Ingrese un email válido', 'error'); if (newEmailEl) newEmailEl.focus(); return; }
      if (newEmail !== confEmail) { showToast('Los emails no coinciden', 'error'); if (confEmailEl) confEmailEl.focus(); return; }

      const submitBtn = genForm.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Procesando...'; }

      try {
        const res = await fetch('/admin/credenciales', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ newEmail })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data && data.success) {
          showToast('Email actualizado correctamente', 'success');
          if (newEmailEl) newEmailEl.value = '';
          if (confEmailEl) confEmailEl.value = '';
        } else {
          const msg = (data && data.message) ? data.message : 'No se pudo actualizar el email';
          showToast(msg, 'error');
        }
      } catch (err) {
        console.error('Error actualizando email:', err);
        showToast('Error de red al actualizar email', 'error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Guardar Cambios'; }
      }
    });
  }
});

// Abrir prompt para establecer una URL de imagen y guardar en el servidor
async function setBookImageUrl(id) {
  if (!id) return;
  const url = prompt('Ingrese la URL de la imagen para este libro (vaciar para quitar):');
  if (url === null) return; // cancel
  const trimmed = (String(url || '').trim()) || null;
  try {
    const res = await fetch(`/libros/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: trimmed })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data && data.success) {
      showToast('Imagen actualizada', 'success');
      await loadFeaturedBooks();
      try { loadInventoryReports(); } catch (e) { /* ignore */ }
    } else {
      console.error('Error actualizando imagen:', data);
      showToast('No se pudo actualizar la imagen', 'error');
    }
  } catch (err) {
    console.error('Error guardando imagen en servidor', err);
    showToast('Error de red al actualizar imagen', 'error');
  }
}

// Cargar actividad reciente (pedidos, usuarios y libros recientes)
async function loadRecentActivity() {
  const container = document.getElementById('recentActivity');
  if (!container) return;
  container.innerHTML = '<p>Cargando...</p>';

  try {
    const [pedidosRes, clientesRes] = await Promise.all([
      fetch('/pedidos'),
      fetch('/cliente')
    ]);

    const pedidosData = await pedidosRes.json().catch(() => ({}));
    const clientesData = await clientesRes.json().catch(() => ([]));

    const pedidos = (pedidosData && pedidosData.pedidos && Array.isArray(pedidosData.pedidos)) ? pedidosData.pedidos : (Array.isArray(pedidosData) ? pedidosData : []);
    const clientes = Array.isArray(clientesData) ? clientesData : (clientesData && Array.isArray(clientesData.rows) ? clientesData.rows : (clientesData && Array.isArray(clientesData.clientes) ? clientesData.clientes : []));

    // Actualizar contador de usuarios en el dashboard (mostrar desde el inicio)
    try {
      const totalUsersEl = document.getElementById('totalUsers');
      if (totalUsersEl) totalUsersEl.textContent = String((clientes || []).length);
    } catch (e) { /* ignore */ }

    // intentamos también traer libros para actividad
    let libros = [];
    try {
      const libRes = await fetch('/libros');
      const libData = await libRes.json().catch(() => null);
      libros = (libData && libData.books && Array.isArray(libData.books)) ? libData.books : [];
    } catch (e) {
      libros = [];
    }

    const items = [];

    pedidos.forEach(p => {
      const time = p.fecha_creacion || p.fecha || null;
      items.push({ type: 'order', id: p.id_pedido, title: `Pedido #${p.id_pedido}`, meta: p.nombre_cliente || p.correo_cliente || ('ID ' + p.id_usuario), time, raw: p });
    });

    clientes.forEach(u => {
      const time = u.fecha_creacion || u.fecha || null;
      items.push({ type: 'user', id: u.id_usuario, title: u.nombre || u.correo || (`Usuario ${u.id_usuario}`), meta: u.correo || '', time, raw: u });
    });

    libros.forEach(b => {
      const time = b.fecha_creacion || b.created_at || b.createdAt || null;
      items.push({ type: 'book', id: b.id || b.id_libro, title: b.title || b.titulo || 'Libro', meta: b.author || b.autor || '', time, raw: b });
    });

    // normalizar fechas
    items.forEach(it => {
      it.dateObj = it.time ? new Date(it.time) : null;
    });

    items.sort((a, b) => {
      const ta = a.dateObj ? a.dateObj.getTime() : 0;
      const tb = b.dateObj ? b.dateObj.getTime() : 0;
      return tb - ta;
    });

    const shown = items.slice(0, 8);
    if (!shown || shown.length === 0) {
      container.innerHTML = '<p>No hay actividad reciente.</p>';
      return;
    }

    container.innerHTML = shown.map(it => {
      const timeLabel = it.dateObj ? it.dateObj.toLocaleString() : '';
      let icon = '';
      let actionBtn = '';
      if (it.type === 'order') {
        icon = '<i class="fas fa-shopping-cart"></i>';
        actionBtn = `<button type="button" class="btn-link" data-action="view-order" data-id="${it.id}">Ver</button>`;
      } else if (it.type === 'user') {
        icon = '<i class="fas fa-user"></i>';
        actionBtn = `<button type="button" class="btn-link" data-action="view-user" data-id="${it.id}">Ver</button>`;
      } else {
        icon = '<i class="fas fa-book"></i>';
        actionBtn = `<button type="button" class="btn-link" data-action="edit-book" data-id="${it.id}">Editar</button>`;
      }

      return `
        <div class="activity-item">
          <div class="activity-icon">${icon}</div>
          <div class="activity-body">
            <div class="activity-title">${escapeHtml(it.title)}</div>
            <div class="activity-meta">${escapeHtml(it.meta || '')}</div>
            <div class="activity-time">${escapeHtml(timeLabel)}</div>
          </div>
          <div class="activity-action">${actionBtn}</div>
        </div>
      `;
    }).join('');

    // attach handlers
    container.querySelectorAll('[data-action="view-order"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        let order = items.find(x => x.type === 'order' && String(x.id) === String(id))?.raw;
        if (!order) {
          try {
            const r = await fetch(`/pedidos/${id}`);
            order = await r.json();
          } catch (e) { order = null; }
        }
        if (order) showOrderDetails(order);
      });
    });

    container.querySelectorAll('[data-action="view-user"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        // navegar a sección usuarios y cargar
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const usersNav = Array.from(document.querySelectorAll('.nav-item')).find(i => i.dataset.section === 'users');
        if (usersNav) usersNav.classList.add('active');
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById('users');
        if (target) target.classList.add('active');
        loadUsers().then(() => {
          const rows = document.querySelectorAll('#usersTable tr');
          rows.forEach(r => {
            const cell = r.querySelector('td');
            if (cell && cell.textContent.trim() === String(id)) {
              r.scrollIntoView({ behavior: 'smooth', block: 'center' });
              r.style.background = '#ffffe0';
              setTimeout(() => r.style.background = '', 3000);
            }
          });
        });
      });
    });

    container.querySelectorAll('[data-action="edit-book"]').forEach(btn => {
      btn.addEventListener('click', () => openEditBookModal(btn.dataset.id));
    });

  } catch (err) {
    console.error('Error cargando actividad reciente:', err);
    container.innerHTML = '<p>Error cargando actividad.</p>';
  }
}

// Abrir modal para editar un libro: carga datos y rellena el formulario
async function openEditBookModal(id) {
  try {
    const res = await fetch(`/libros/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(()=>null);
      console.error('Error obteniendo libro para editar:', err || res.status);
      try { showToast('No se pudo cargar la información del libro', 'error') } catch (e) { console.warn('No se pudo cargar la información del libro') }
      return;
    }

    const data = await res.json();
    if (!data || !data.success) {
      console.error('Respuesta inválida al obtener libro:', data);
      try { showToast('No se pudo cargar la información del libro', 'error') } catch (e) { console.warn('No se pudo cargar la información del libro') }
      return;
    }

    const book = data.book;
    document.getElementById('bookId').value = book.id;
    document.getElementById('bookTitle').value = book.title || '';
    document.getElementById('bookAuthor').value = book.author || '';
    document.getElementById('bookPrice').value = book.price || 0;
    document.getElementById('bookImage').value = book.image || '';
    document.getElementById('bookDescription').value = book.description || '';
    const stockEl = document.getElementById('bookStock'); if (stockEl) stockEl.value = (book.stock || book.cantidad || 0);
    const gEl = document.getElementById('bookGenre'); if (gEl) gEl.value = book.genre || '';

    const modal = document.getElementById('addBookModal');
    if (modal) modal.classList.add('active');
    } catch (err) {
    console.error('Error en openEditBookModal:', err);
    try { showToast('Error cargando datos del libro', 'error') } catch (e) { console.warn('Error cargando datos del libro') }
  }
}

// Exponer la función después de su definición para que `onclick` inline la encuentre
window.openEditBookModal = openEditBookModal;

async function deleteFeaturedBook(id) {
  // use non-blocking confirm toast
  confirmWithToast('¿Eliminar este libro destacado?', async () => {
    try {
      const res = await fetch(`/libros/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data && data.success) {
          showToast('Libro eliminado', 'success');
        await loadFeaturedBooks();
      } else {
        console.error('Error eliminando libro:', data);
          showToast('No se pudo eliminar el libro', 'error');
      }
    } catch (err) {
      console.error('Error en deleteFeaturedBook:', err);
        showToast('Error de red', 'error');
    }
  }, () => {
    try { showToast('Eliminación cancelada', 'info') } catch (e) { /* ignore */ }
  });
}

// (Favoritos en admin eliminados: la funcionalidad de favoritos queda sólo en la vista cliente)

// --- Inventory tabs and purchase orders loader ---
function initInventoryTabs() {
  const tabs = Array.from(document.querySelectorAll('.inventory-tab'));
  if (!tabs || tabs.length === 0) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const name = tab.dataset.tab;
      // toggle active on tabs
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // show/hide contents
      const contents = Array.from(document.querySelectorAll('.inventory-tab-content'));
      contents.forEach(c => c.classList.remove('active'));
      const target = document.getElementById(`${name}-tab`);
      if (target) target.classList.add('active');

      // load data per tab
      if (name === 'suppliers') {
        try { loadSuppliers(); } catch (e) { console.warn('loadSuppliers failed', e); }
      }
      if (name === 'purchase-orders') {
        try { loadPurchaseOrders(); } catch (e) { console.warn('loadPurchaseOrders failed', e); }
      }
      if (name === 'stock') {
        try { loadInventoryReports(); } catch (e) { console.warn('loadInventoryReports failed', e); }
      }
    });
  });
}

async function loadPurchaseOrders(filter) {
  const tbody = document.getElementById('purchaseOrdersTable');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6">Cargando órdenes...</td></tr>';
  try {
    const res = await fetch('/ordenes_compra');
    const data = await res.json().catch(() => ({}));
    const list = Array.isArray(data) ? data : (data.orders || data.ordenes || data.purchase_orders || []);
    if (!list || list.length === 0) {
      tbody.innerHTML = '<tr class="empty-state"><td colspan="6" style="text-align:center; padding:2rem; color:#999;">No hay órdenes de compra registradas</td></tr>';
      return;
    }

    // apply client-side filters if provided
    let filtered = list;
    try {
      const provider = filter && filter.provider ? String(filter.provider).trim().toLowerCase() : '';
      const from = filter && filter.from ? String(filter.from) : '';
      const to = filter && filter.to ? String(filter.to) : '';
      if (provider) {
        filtered = filtered.filter(po => (String(po.supplier_nombre || po.supplier || '').toLowerCase().includes(provider)));
      }
      if (from) {
        const fromTs = new Date(from).setHours(0,0,0,0);
        filtered = filtered.filter(po => { const d = po.date ? new Date(po.date).setHours(0,0,0,0) : null; return d !== null ? d >= fromTs : true; });
      }
      if (to) {
        const toTs = new Date(to).setHours(23,59,59,999);
        filtered = filtered.filter(po => { const d = po.date ? new Date(po.date).getTime() : null; return d !== null ? d <= toTs : true; });
      }
    } catch (e) {
      console.warn('Error applying purchase filters', e);
    }

    tbody.innerHTML = filtered.map(po => {
      const supplier = (po.supplier_nombre || po.supplier || po.proveedor || '—');
      const items = (po.items && Array.isArray(po.items)) ? po.items : [];
      const date = po.date ? escapeHtml(String(po.date)) : '';
      const total = (typeof po.total !== 'undefined') ? Number(po.total).toFixed(2) : (po.total_amount ? Number(po.total_amount).toFixed(2) : '0.00');
      const productsHtml = (Array.isArray(items) && items.length > 0)
        ? items.map(it => `${escapeHtml(it.product_name || it.title || it.name || '')} x${escapeHtml(String(it.quantity || it.qty || 0))}`).join('<br/>')
        : '—';

      return `
        <tr>
          <td>${escapeHtml(String(po.id || ''))}</td>
          <td>${escapeHtml(supplier)}</td>
          <td>${date}</td>
          <td style="max-width:280px; white-space:normal;">${productsHtml}</td>
          <td>$${escapeHtml(String(total))}</td>
          <td>
            <button class="btn-secondary" onclick="editPurchaseOrder(${po.id})">Editar</button>
            <button class="btn-danger" onclick="deletePurchaseOrder(${po.id})">Eliminar</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error cargando órdenes de compra', err);
    tbody.innerHTML = '<tr><td colspan="6" style="color:#b00;">Error cargando órdenes</td></tr>';
  }
}

// Abrir orden en modal para editar
async function editPurchaseOrder(id) {
  if (!id) return;
  try {
    const res = await fetch(`/ordenes_compra/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!data || (!data.success && !data.id && !data.order && !data.purchase_order)) {
      showToast('No se pudo cargar la orden para editar', 'error');
      return;
    }
    const po = data.order || data.purchase_order || data || {};
    // populate modal fields
    const formId = document.getElementById('purchaseOrderId');
    if (formId) formId.value = po.id || po.ID || po.id_orden || '';
    const supplierSelect = document.getElementById('purchaseSupplier');
    if (supplierSelect) supplierSelect.value = po.supplier_id || po.supplierId || po.supplier_id || '';
    const dateInput = document.getElementById('purchaseDate'); if (dateInput) dateInput.value = po.date ? String(po.date).split('T')[0] : '';
    const notes = document.getElementById('purchaseNotes'); if (notes) notes.value = po.notes || '';

    // fill products
    const list = document.getElementById('purchaseProductsList'); if (!list) return;
    list.innerHTML = '';
    const items = po.items || po.products || [];
    if (Array.isArray(items) && items.length > 0) {
      items.forEach(it => {
        const item = document.createElement('div');
        item.className = 'purchase-product-item';
        item.innerHTML = `
          <input type="text" class="purchase-product-name" placeholder="Nombre del producto / título" value="${escapeHtml(it.title || it.name || it.product || '')}" />
          <input type="text" class="purchase-author" placeholder="Autor" value="${escapeHtml(it.author || '')}" />
          <input type="text" class="purchase-genre" placeholder="Género" value="${escapeHtml(it.genre || '')}" />
          <input type="number" class="purchase-quantity" placeholder="Cantidad" min="1" value="${escapeHtml(String(it.quantity || it.qty || it.cantidad || 1))}" />
          <input type="number" class="purchase-unit-price" placeholder="Precio unitario" min="0" step="0.01" value="${escapeHtml(String(it.unit_price || it.price || 0))}" />
          <button type="button" class="btn-danger btn-sm" onclick="removePurchaseProduct(this)">
            <i class="fas fa-trash"></i>
          </button>
        `;
        list.appendChild(item);
        const qty = item.querySelector('.purchase-quantity');
        const price = item.querySelector('.purchase-unit-price');
        [qty, price].forEach(el => {
          if (!el) return;
          ['input','change'].forEach(ev => el.addEventListener(ev, updatePurchaseTotal));
        });
      });
    } else {
      addPurchaseProduct();
    }
    updatePurchaseTotal();

    // open modal
    const modal = document.getElementById('newPurchaseOrderModal'); if (modal) modal.classList.add('active');
  } catch (err) {
    console.error('editPurchaseOrder error', err);
    showToast('Error cargando orden', 'error');
  }
}

async function deletePurchaseOrder(id) {
  if (!id) return;
  confirmWithToast('¿Eliminar esta orden de compra?', async () => {
    try {
      const res = await fetch(`/ordenes_compra/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data && data.success) {
        showToast('Orden eliminada', 'success');
        try { loadPurchaseOrders(); } catch (e) { /* ignore */ }
        try { loadInventoryReports(); } catch (e) { /* ignore */ }
      } else {
        console.error('Error eliminando orden', data);
        showToast('No se pudo eliminar la orden', 'error');
      }
    } catch (err) {
      console.error('deletePurchaseOrder error', err);
      showToast('Error de red al eliminar orden', 'error');
    }
  });
}

async function viewPurchaseOrder(id) {
  if (!id) return;
  try {
    const res = await fetch(`/ordenes_compra/${id}`);
    const data = await res.json();
    const modal = document.getElementById('orderDetailsModal');
    const content = document.getElementById('orderDetailsContent');
    if (!modal || !content) return;
    if (!data || !data.success) {
      content.innerHTML = `<div style="padding:12px;">No se pudo cargar la orden.</div>`;
    } else {
      const po = data.order || data.purchase_order || data.data || data;
      const items = po.items || po.products || [];
      const itemsHtml = (Array.isArray(items) && items.length > 0) ? items.map(it => `<li>${escapeHtml(it.title || it.name || it.product || '')} — ${escapeHtml(String(it.quantity || it.qty || it.cantidad || ''))} u — $${Number(it.unit_price || it.price || 0).toFixed(2)}</li>`).join('') : '<li>No hay items</li>';
      content.innerHTML = `
        <div style="padding:12px;">
          <h4>Orden #${escapeHtml(String(po.id || ''))}</h4>
          <p><strong>Proveedor:</strong> ${escapeHtml(po.supplier_nombre || po.proveedor || po.supplier || '')}</p>
          <p><strong>Fecha:</strong> ${escapeHtml(String(po.date || ''))}</p>
          <p><strong>Total:</strong> $${Number(po.total || 0).toFixed(2)}</p>
          <h5>Items</h5>
          <ul style="padding-left:1rem">${itemsHtml}</ul>
          <div style="text-align:right; margin-top:12px;\"><button class="btn-secondary" onclick="closeOrderDetailsModal()">Cerrar</button></div>
        </div>
      `;
    }
    modal.classList.add('active');
  } catch (err) {
    console.error('viewPurchaseOrder error', err);
  }
}

// export for HTML onclick handlers
window.initInventoryTabs = initInventoryTabs;
window.loadPurchaseOrders = loadPurchaseOrders;
window.viewPurchaseOrder = viewPurchaseOrder;
window.editPurchaseOrder = editPurchaseOrder;
window.deletePurchaseOrder = deletePurchaseOrder;
window.filterPurchaseOrders = filterPurchaseOrders;

function filterPurchaseOrders() {
  const q = (document.getElementById('purchaseSupplierSearch') || {}).value || '';
  const from = (document.getElementById('purchaseDateFrom') || {}).value || '';
  const to = (document.getElementById('purchaseDateTo') || {}).value || '';
  loadPurchaseOrders({ provider: q, from, to });
}

// --- Inventory loader: carga libros y llena la tabla de stock ---
async function loadInventoryReports() {
  const tbody = document.getElementById('inventoryReport');
  const stats = document.getElementById('inventoryStats');
  if (stats) stats.innerHTML = '';
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8">Cargando inventario...</td></tr>';
  try {
    const res = await fetch('/libros');
    const data = await res.json().catch(() => ([]));
    const list = Array.isArray(data) ? data : (data.libros || data.books || []);
    if (!list || list.length === 0) {
      tbody.innerHTML = '<tr class="empty-state"><td colspan="8" style="text-align:center; padding:2rem; color:#999;">No hay productos en el inventario</td></tr>';
      return;
    }

    // render stats
    if (stats) {
      const totalItems = list.reduce((s, i) => s + (Number(i.stock || 0) || 0), 0);
      const totalProducts = list.length;
      stats.innerHTML = `\
        <div class="stat-card"><div class="stat-info"><h3>${totalProducts}</h3><p>Productos</p></div></div>\
        <div class="stat-card"><div class="stat-info"><h3>${totalItems}</h3><p>Unidades en stock</p></div></div>\
      `;
    }

    tbody.innerHTML = list.map(b => `
      <tr>
        <td>${escapeHtml(String(b.id || b.ID || ''))}</td>
        <td>${escapeHtml(b.title || b.nombre || b.titulo || '')}</td>
        <td>${escapeHtml(b.author || b.autor || '')}</td>
        <td>${escapeHtml(b.genre || b.genero || '')}</td>
        <td>$${Number(b.price || b.precio || 0).toFixed(2)}</td>
        <td>${escapeHtml(String(b.stock || b.cantidad || 0))}</td>
        <td>
          <button class="btn-primary" onclick="openEditBookModal(${b.id || b.ID || ''})">Editar</button>
          <button class="btn-danger" onclick="deleteInventoryBook(${b.id || b.ID || ''})" style="margin-left:8px;">Eliminar</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error cargando inventario', err);
    tbody.innerHTML = '<tr><td colspan="8" style="color:#b00;">Error cargando inventario</td></tr>';
  }
}

async function deleteInventoryBook(id) {
  confirmWithToast('¿Eliminar este producto del inventario?', async () => {
    try {
      const res = await fetch(`/libros/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (res.ok && data && (data.success || data.deleted)) {
        try { showToast('Producto eliminado del inventario', 'success'); } catch (e) { /* ignore */ }
        // refrescar las vistas relacionadas: inventario, libros y órdenes de compra
        try { await loadInventoryReports(); } catch (e) { console.warn('loadInventoryReports after delete failed', e); }
        try { if (typeof loadFeaturedBooks === 'function') await loadFeaturedBooks(); } catch (e) { console.warn('loadFeaturedBooks after delete failed', e); }
        try { if (typeof loadPurchaseOrders === 'function') await loadPurchaseOrders(); } catch (e) { console.warn('loadPurchaseOrders after delete failed', e); }
      } else {
        console.error('Error eliminando producto:', data || res.status);
        try { showToast('No se pudo eliminar el producto', 'error'); } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.error('Error en deleteInventoryBook:', err);
      try { showToast('Error de red', 'error'); } catch (e) { /* ignore */ }
    }
  }, () => {
    try { showToast('Eliminación cancelada', 'info') } catch (e) { /* ignore */ }
  });
}

window.deleteInventoryBook = deleteInventoryBook;

window.loadInventoryReports = loadInventoryReports;

// Expose toggle helper for debugging or inline usage
window.toggleUserActive = toggleUserActive;

// Ensure inventory tabs initialize after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  try { initInventoryTabs(); } catch (e) { /* ignore */ }
});



// CAMBIAR EL ESATDO DE UN PEDIDO 
document.addEventListener("change", async (e) => {
    if (e.target.classList.contains("order-status-select")) {
        const idPedido = e.target.dataset.orderId;
        const nuevoEstado = e.target.value;
        await actualizarEstadoPedido(idPedido, nuevoEstado);
    }
});

async function actualizarEstadoPedido(idPedido, nuevoEstado) {
    try {
        const res = await fetch(`/pedidos/${idPedido}/estado`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        const data = await res.json();

        if (res.ok) {
            showToast("Estado actualizado ✓", "success");
        } else {
            showToast("Error: " + data.message, "error");
        }
    } catch (err) {
        console.error("Error actualizando estado:", err);
        showToast("Error de conexión", "error");
    }
}
