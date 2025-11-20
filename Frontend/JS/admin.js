console.log('admin.js loaded');
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

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    const color = (type === 'success') ? '#2ecc71' : (type === 'error') ? '#e74c3c' : (type === 'warning') ? '#f39c12' : '#3498db';
    Object.assign(toast.style, {
      background: '#fff',
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
    try { alert(message); } catch (e) { /* ignore */ }
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
      try { showToast(msg, 'info') } catch (e) { alert(msg) }
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
      try { showToast(msg, 'info') } catch (e) { alert(msg) }
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

  items.forEach(it => {
    it.addEventListener('click', () => {
      // set active nav
      items.forEach(i => i.classList.remove('active'));
      it.classList.add('active');

      // show section
      const sectionId = it.dataset.section;
      sections.forEach(s => s.classList.remove('active'));
      const target = document.getElementById(sectionId);
      if (target) target.classList.add('active');
      // cargar datos específicos por sección
      if (sectionId === 'orders') loadOrders();
      if (sectionId === 'users') loadUsers();
      if (sectionId === 'dashboard') loadRecentActivity();
    });
  });
}

async function loadOrders() {
  try {
    const res = await fetch('/pedidos', { method: 'GET' });
    const data = await res.json();

    if (!data || !data.success) {
      console.error('Error cargando pedidos', data);
      document.getElementById('ordersTable').innerHTML = '<tr><td colspan="5">No se pudieron cargar los pedidos</td></tr>';
      return;
    }

    renderOrders(data.pedidos || []);
    // actualizar contadores simples
    document.getElementById('totalOrders').textContent = (data.pedidos || []).length;
    const revenue = (data.pedidos || []).reduce((sum, p) => sum + Number(p.total || 0), 0);
    document.getElementById('totalRevenue').textContent = `$${revenue.toFixed(2)}`;
  } catch (err) {
    console.error('Error en loadOrders:', err);
    document.getElementById('ordersTable').innerHTML = '<tr><td colspan="5">Error al cargar pedidos</td></tr>';
  }
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
      try { showToast('La fecha de inicio no puede ser posterior a la fecha final.', 'warning') } catch (e) { alert('La fecha de inicio no puede ser posterior a la fecha final.') }
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
});

window.searchUsers = searchUsers;

function renderUsers(users) {
  const tbody = document.getElementById('usersTable');
  tbody.innerHTML = '';

  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">No hay usuarios</td></tr>';
    return;
  }

  users.forEach(u => {
    const tr = document.createElement('tr');

    // Usamos los campos devueltos por el backend: `fecha_creacion` y `pedidos_count`.
    const fechaRegistro = u.fecha_creacion ? new Date(u.fecha_creacion).toLocaleString() : '-';
    const pedidosCount = typeof u.pedidos_count !== 'undefined' ? u.pedidos_count : '-';
    const estado = u.rol === 'cliente' ? 'cliente' : u.rol;

    tr.innerHTML = `
      <td>${u.id_usuario}</td>
      <td>${escapeHtml(u.nombre || '')}</td>
      <td>${escapeHtml(u.correo || '')}</td>
      <td>${fechaRegistro}</td>
      <td>${pedidosCount}</td>
      <td>${escapeHtml(estado)}</td>
      <td>
        <button class="btn-secondary" data-action="delete" data-id="${u.id_usuario}">Eliminar</button>
      </td>
    `;

    tr.querySelector('[data-action="delete"]').addEventListener('click', () => {
      confirmWithToast(`Eliminar usuario ${u.nombre} (ID ${u.id_usuario})?`, () => deleteUser(u.id_usuario));
    });

    tbody.appendChild(tr);
  });
}

async function deleteUser(id) {
  try {
    const res = await fetch(`/usuario/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!data || !data.success) {
      const msg = (data && data.message) ? data.message : 'No se pudo eliminar el usuario';
      try { showToast(msg, 'error') } catch (e) { alert(msg) }
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
    try { showToast('Error eliminando usuario', 'error') } catch (e) { alert('Error eliminando usuario') }
  }
}


function renderOrders(orders) {
  const tbody = document.getElementById('ordersTable');
  tbody.innerHTML = '';

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
    <p><strong>Estado:</strong> ${escapeHtml(order.estado || order.status || '')}</p>
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
    const price = parsePriceString(document.getElementById('bookPrice').value);
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
          body: JSON.stringify({ title, author, price, image, description })
        });

        const data = await res.json();
        if (res.ok && data && data.success) {
          try { showToast('Libro actualizado correctamente', 'success') } catch (e) { alert('Libro actualizado correctamente') }
          closeAddBookModal();
          await loadFeaturedBooks();
          return;
        } else {
          console.error('Error al actualizar libro:', data);
          try { showToast('No se pudo actualizar el libro en el servidor', 'warning') } catch (e) { alert('No se pudo actualizar el libro en el servidor') }
          return;
        }
      }

      // Crear nuevo libro
      const res = await fetch('/libros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, price, image, description })
      });

      const data = await res.json();
      if (res.ok && data && data.success) {
        try { showToast('Libro agregado correctamente', 'success') } catch (e) { alert('Libro agregado correctamente') }
        closeAddBookModal();
        await loadFeaturedBooks();
      } else {
        console.error('Error al agregar libro:', data);
        try { showToast('No se pudo agregar el libro en el servidor', 'warning') } catch (e) { alert('No se pudo agregar el libro en el servidor') }
      }
    } catch (err) {
      console.error('Error enviando libro al servidor:', err);
      try { showToast('Error de red al agregar/actualizar libro', 'error') } catch (e) { alert('Error de red al agregar/actualizar libro') }
    }
  });
});

// Cargar y renderizar libros destacados en la sección 'books'
async function loadFeaturedBooks() {
  const container = document.getElementById('featuredBooks');
  if (!container) return;
  try {
    const res = await fetch('/libros');
    const data = await res.json();
    const books = (data && data.success && Array.isArray(data.books)) ? data.books : [];

    container.innerHTML = books.map(b => `
      <div class="book-card">
        <img src="${b.image || '/abstract-book-cover.png'}" alt="${escapeHtml(b.title || '')}" class="book-image">
        <div class="book-info">
          <h4>${escapeHtml(b.title || '')}</h4>
          <p><strong>Autor:</strong> ${escapeHtml(b.author || '')}</p>
          <p>${escapeHtml((b.description || '').substring(0,200))}</p>
          <div class="book-price">$${Number(b.price || 0).toLocaleString()}</div>
          <div class="book-actions">
            <button class="btn-secondary" onclick="openEditBookModal(${b.id})">Editar</button>
            <button class="btn-danger" onclick="deleteFeaturedBook(${b.id})">Eliminar</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error cargando libros destacados:', err);
    container.innerHTML = '<p>No se pudieron cargar libros destacados.</p>';
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
      try { showToast('No se pudo cargar la información del libro', 'error') } catch (e) { alert('No se pudo cargar la información del libro') }
      return;
    }

    const data = await res.json();
    if (!data || !data.success) {
      console.error('Respuesta inválida al obtener libro:', data);
      try { showToast('No se pudo cargar la información del libro', 'error') } catch (e) { alert('No se pudo cargar la información del libro') }
      return;
    }

    const book = data.book;
    document.getElementById('bookId').value = book.id;
    document.getElementById('bookTitle').value = book.title || '';
    document.getElementById('bookAuthor').value = book.author || '';
    document.getElementById('bookPrice').value = book.price || 0;
    document.getElementById('bookImage').value = book.image || '';
    document.getElementById('bookDescription').value = book.description || '';

    const modal = document.getElementById('addBookModal');
    if (modal) modal.classList.add('active');
  } catch (err) {
    console.error('Error en openEditBookModal:', err);
    try { showToast('Error cargando datos del libro', 'error') } catch (e) { alert('Error cargando datos del libro') }
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
        try { showToast('Libro eliminado', 'success') } catch (e) { alert('Libro eliminado') }
        await loadFeaturedBooks();
      } else {
        console.error('Error eliminando libro:', data);
        try { showToast('No se pudo eliminar el libro', 'error') } catch (e) { alert('No se pudo eliminar el libro') }
      }
    } catch (err) {
      console.error('Error en deleteFeaturedBook:', err);
      try { showToast('Error de red', 'error') } catch (e) { alert('Error de red') }
    }
  }, () => {
    try { showToast('Eliminación cancelada', 'info') } catch (e) { /* ignore */ }
  });
}

// (Favoritos en admin eliminados: la funcionalidad de favoritos queda sólo en la vista cliente)
