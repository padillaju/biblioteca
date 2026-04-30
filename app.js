const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session'); 
const PDFDocument = require('pdfkit');


const app = express();
const PORT = 3000;

// Middleware
// Aumentar límite para permitir dataURLs relativamente grandes (avatars en base64)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));



const cors = require('cors');

// Permitir CORS para desarrollo: reflejar el origen y permitir credenciales.
// En producción restringe esto a los orígenes confiables.
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true
}));




// Configurar sesiones
app.use(session({
  secret: 'miclave112233',  
  resave: false,
  saveUninitialized: false,   
  cookie: {
    maxAge: 1000 * 60 * 60,   
    httpOnly: true,
    sameSite: 'lax'          
  }
}));


// Conexión a MySQL
// const db = mysql.createConnection({
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',       
  password: 'root',   
  database: 'TiendaLibro'
});

let tokens = {};


db.getConnection((err, connection) => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err);
  } else {
    console.log(" Conectado a la base de datos");
    connection.release();
  }
});


// crear la nueva contraseña 

app.post("/recuperarPass", async (req, res) => {
  try {
    const { correo } = req.body;

    console.log("Correo recibido:", correo);
    const [rows] = await db.promise().query(
      "SELECT * FROM usuario WHERE correo = ?",
      [correo]
    );

    //  Si no existe
    if (rows.length === 0) {
      return res.json({ mensaje: "El correo no está registrado" });
    }
    const token = Math.random().toString(36).substring(2);
    tokens[token] = correo;
    const link = `http://localhost:3000/HTML/reset.html?token=${token}`;
    res.json({ link, mensaje: "Correo válido" });
  } catch (error) {
    console.error("🔥 ERROR REAL:", error);
    res.status(500).json({ mensaje: "Error en servidor" });
  }
});


app.post("/resetPassword", async (req, res) => {
  try {
    const { token, password } = req.body;

    console.log("TOKEN:", token);

    const correo = tokens[token];

    console.log("CORREO:", correo);

    if (!correo) {
      return res.json({ mensaje: "Token inválido o expirado" });
    }

    await db.promise().query(
      "UPDATE usuario SET contrasena = ? WHERE correo = ?",
      [password, correo]
    );

    delete tokens[token];

    res.json({ mensaje: "Contraseña actualizada correctamente" });

  } catch (error) {
    console.error("🔥 ERROR REAL:", error);
    res.status(500).json({ mensaje: "Error en servidor" });
  }
});


// Asegurar que la tabla `libros` exista (previene ER_NO_SUCH_TABLE)
const createLibrosTable = `
CREATE TABLE IF NOT EXISTS libros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  genre VARCHAR(255),
  price DECIMAL(10,2) DEFAULT 0,
  image MEDIUMTEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`;

// Crear la tabla si no existe
db.promise().query(createLibrosTable)

// Crear tabla `usuario` si no existe (útil en entornos de desarrollo)
const createUsuarioTable = `
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255),
  correo VARCHAR(255) UNIQUE,
  contrasena VARCHAR(255),
  celular VARCHAR(50),
  direccion TEXT,
  rol VARCHAR(50) DEFAULT 'cliente',
  avatar MEDIUMTEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
)
`;

db.promise().query(createUsuarioTable)
  .catch(err => console.error('Error creando/verificando tabla usuario:', err));

db.promise().query("ALTER TABLE libros MODIFY COLUMN image MEDIUMTEXT")
  .catch(err => {
    if (err && err.code !== 'ER_NO_SUCH_TABLE' && err.errno !== 1146) {
      console.error('Error al alterar la columna image en libros:', err);
    }
  });

// Asegurar columna `genre` existe en la tabla `libros`
db.promise().query("ALTER TABLE libros ADD COLUMN genre VARCHAR(255) NULL")
  .then(() => console.log('✅ Columna `genre` añadida a `libros`'))
  .catch(err => {
    if (err && err.code !== 'ER_DUP_FIELDNAME' && err.errno !== 1060) {
    }
  });


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Servir archivos estáticos (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, 'Frontend')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Frontend', 'HTML', 'registro.html'));
});

// Ruta para registrar usuario
app.post('/registro', (req, res) => {
  const { nombre, correo, contrasena, celular, direccion } = req.body;

  const sql = 'INSERT INTO usuario (nombre, correo, contrasena, celular, direccion) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [nombre, correo, contrasena, celular, direccion], (err, result) => {
    if (err) {
      console.error('Error al insertar:', err);
      return res.status(500).json({ 
        success: false,
        mensaje: "Este correo ya fue registrado, inicia sesión si ya tienes una cuenta" 
      });
    }

    res.json({
      success: true, 
      mensaje: "Usuario registrado con éxito",
      datos: { nombre, correo, celular, direccion }
    });
  });
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Frontend', 'HTML', 'login.html'));
});

// Listar proveedores
app.get('/proveedores', async (req, res) => {
  try {
    // Determine available columns to choose a safe ORDER BY
    let orderBy = '';
    try {
      const [cols] = await db.promise().query("SHOW COLUMNS FROM proveedores");
      const colNames = (cols || []).map(c => c.Field);
      if (colNames.includes('created_at')) orderBy = 'created_at';
      else if (colNames.includes('id')) orderBy = 'id';
      else if (colNames.includes('nombre')) orderBy = 'nombre';
    } catch (e) {
      // If SHOW COLUMNS fails, continue without orderBy
      console.warn('No se pudieron leer columnas de proveedores:', e && e.message);
    }

    const sql = `SELECT * FROM proveedores ${orderBy ? ('ORDER BY ' + orderBy + ' DESC') : ''}`;
    const [rows] = await db.promise().query(sql);

    // Normalize rows to expected keys for the frontend
    const normalized = (rows || []).map(r => ({
      id: r.id || r.id_proveedor || r.idProveedor || r.ID || null,
      nombre: r.nombre || r.name || r.nombre_proveedor || r.proveedor || '',
      empresa: r.empresa || r.company || r.empresa_proveedor || '',
      email: r.email || r.correo || r.mail || '',
      telefono: r.telefono || r.phone || r.celular || '',
      direccion: r.direccion || r.address || '',
      productos: r.productos || r.products || r.tipo_productos || '',
      created_at: r.created_at || r.createdAt || r.fecha_creacion || null,
      raw: r
    }));

    res.json(normalized);
  } catch (err) {
    console.error('Error obteniendo proveedores:', err);
    res.status(500).json({ success: false, message: 'Error al obtener proveedores' });
  }
});


// Crear proveedor
app.post('/proveedores', async (req, res) => {
  try {
    const { name, company, email, phone, address, products } = req.body;
    // Aceptar también claves en español/alternativas
    const nombre = name || req.body.nombre || '';
    const empresa = company || req.body.company || req.body.empresa || '';
    const correo = email || req.body.email || req.body.correo || '';
    const telefono = phone || req.body.phone || req.body.telefono || '';
    const direccion = address || req.body.address || '';
    const productos = products || req.body.products || '';

    const sql = 'INSERT INTO proveedores (nombre, empresa, email, telefono, direccion, productos) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await db.promise().query(sql, [nombre, empresa, correo, telefono, direccion, productos]);
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Error creando proveedor:', err);
    res.status(500).json({ success: false, message: 'Error al crear proveedor' });
  }
});


// Eliminar proveedor
app.delete('/proveedores/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'ID requerido' });
    // Detectar columna de ID real para evitar usar una columna inexistente 'id'
    let idCol = null;
    try {
      const [cols] = await db.promise().query('SHOW COLUMNS FROM proveedores');
      const colNames = (cols || []).map(c => String(c.Field || '').toLowerCase());
      const candidates = ['id', 'id_proveedor', 'idproveedor', 'id_prov', 'idProveedor', 'ID'];
      for (const cand of candidates) {
        if (colNames.indexOf(String(cand).toLowerCase()) !== -1) {
          idCol = cols[colNames.indexOf(String(cand).toLowerCase())].Field;
          break;
        }
      }
      if (!idCol && colNames.length > 0) idCol = cols[0].Field;
    } catch (e) {
      idCol = 'id';
    }

    const sql = `DELETE FROM proveedores WHERE ${idCol} = ?`;
    const [result] = await db.promise().query(sql, [id]);
    if (result && result.affectedRows && result.affectedRows > 0) {
      return res.json({ success: true });
    }
    return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
  } catch (err) {
    console.error('Error eliminando proveedor:', err);
    res.status(500).json({ success: false, message: 'Error eliminando proveedor' });
  }
});


// Actualizar proveedor
app.put('/proveedores/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'ID requerido' });
    const nombre = req.body.nombre || req.body.name || '';
    const empresa = req.body.empresa || req.body.company || '';
    const correo = req.body.email || req.body.correo || '';
    const telefono = req.body.telefono || req.body.phone || req.body.celular || '';
    const direccion = req.body.direccion || req.body.address || '';
    const productos = req.body.productos || req.body.products || '';

    // Detectar columna de ID real en la tabla `proveedores` para evitar errores si no existe `id`.
    let idCol = null;
    try {
      const [cols] = await db.promise().query('SHOW COLUMNS FROM proveedores');
      const colNames = (cols || []).map(c => String(c.Field || '').toLowerCase());
      const candidates = ['id', 'id_proveedor', 'idproveedor', 'id_prov', 'idProveedor', 'ID'];
      for (const cand of candidates) {
        if (colNames.indexOf(String(cand).toLowerCase()) !== -1) {
          idCol = cols[colNames.indexOf(String(cand).toLowerCase())].Field;
          break;
        }
      }
      // fallback a la primera columna si nada coincide
      if (!idCol && colNames.length > 0) idCol = cols[0].Field;
    } catch (e) {
      // si SHOW COLUMNS falla, usar 'id' por compatibilidad y dejar que la consulta devuelva 0 filas
      idCol = 'id';
    }

    // Construir consulta de actualización usando la columna detectada
    const sql = `UPDATE proveedores SET nombre = ?, empresa = ?, email = ?, telefono = ?, direccion = ?, productos = ? WHERE ${idCol} = ? LIMIT 1`;
    const params = [nombre, empresa, correo, telefono, direccion, productos, id];
    const [result] = await db.promise().query(sql, params);
    if (result && result.affectedRows && result.affectedRows > 0) {
      return res.json({ success: true });
    }
    return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
  } catch (err) {
    console.error('Error actualizando proveedor:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar proveedor', error: err && (err.sqlMessage || err.message) });
  }
});

// Crear orden de compra con items
app.post('/ordenes_compra', async (req, res) => {
  try {
    const { supplier_id, date, delivery_date, notes, products, total } = req.body;
    if (!supplier_id) return res.status(400).json({ success: false, message: 'Proveedor requerido' });
    const sql = 'INSERT INTO purchase_orders (supplier_id, date, delivery_date, total, notes) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.promise().query(sql, [supplier_id, date || null, delivery_date || null, Number(total || 0), notes || '']);
    const orderId = result.insertId;
    if (Array.isArray(products) && products.length > 0) {
      const values = products.map(p => [orderId, p.name || p.product_name || '', Number(p.qty || p.quantity || 0), Number(p.price || p.unit_price || 0)]);
      const placeholders = values.map(() => '(?, ?, ?, ?)').join(',');
      const flat = values.reduce((a, b) => a.concat(b), []);
      const insertItemsSql = `INSERT INTO purchase_order_items (order_id, product_name, quantity, unit_price) VALUES ${placeholders}`;
      await db.promise().query(insertItemsSql, flat);
      // For each product, upsert into `libros`: if exists (by title) increment stock and update price, otherwise insert new book record
      try {
        console.log(`Sincronizando ${products.length} items de la orden ${orderId} con tabla libros`);
        for (const p of products) {
          const name = (p.name || p.product_name || '').toString().trim();
          const qty = Number(p.qty || p.quantity || 0) || 0;
          const price = Number(p.price || p.unit_price || 0) || 0;
          // intentar obtener autor y género si vienen en el payload
          const author = (p.author || p.autor || p.authors || p.author_name || p.autores || '').toString().trim();
          const genre = (p.genre || p.genero || p.category || p.categoria || '').toString().trim() || null;
          if (!name) continue;
          console.log(' -> product:', { name, qty, price, author, genre });
          // Try to find existing libro by title (case-insensitive)
          const [found] = await db.promise().query('SELECT id, IFNULL(stock,0) AS stock FROM libros WHERE LOWER(title) = LOWER(?) LIMIT 1', [name]);
          if (found && found.length > 0) {
            const existing = found[0];
            const newStock = (Number(existing.stock || 0) + qty) || qty;
            const [upRes] = await db.promise().query('UPDATE libros SET stock = ?, price = ? WHERE id = ?', [newStock, price, existing.id]);
            console.log(`   actualizado libro id=${existing.id} stock:${existing.stock} -> ${newStock} affectedRows=${upRes.affectedRows}`);
            } else {
            // Insert a libro record using author/genre from payload when available
            const [ins] = await db.promise().query(
              'INSERT INTO libros (title, author, genre, price, image, description, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [name, author || '', genre || null, price, null, null, qty]
            );
            console.log(`   insertado nuevo libro id=${ins.insertId} stock=${qty} author=${author || ''} genre=${genre || ''}`);
          }
        }
      } catch (syncErr) {
        console.warn('No se pudo sincronizar items de orden con la tabla libros:', syncErr && (syncErr.message || syncErr.sqlMessage || syncErr));
      }
    }
    res.json({ success: true, id: orderId });
  } catch (err) {
    console.error('Error creando orden de compra:', err);
    res.status(500).json({ success: false, message: 'Error al crear orden de compra', error: err && (err.sqlMessage || err.message) });
  }
});

// Listar órdenes de compra con sus items y nombre de proveedor
app.get('/ordenes_compra', async (req, res) => {
  try {
    // Intentar detectar la columna PK real de la tabla `proveedores` para hacer el JOIN correctamente
    let pk = 'id';
    try {
      const [pkRows] = await db.promise().query("SHOW KEYS FROM proveedores WHERE Key_name = 'PRIMARY'");
      if (pkRows && pkRows.length > 0 && pkRows[0].Column_name) {
        pk = pkRows[0].Column_name;
      } else {
        // fallback: intentar leer columnas comunes
        const [cols] = await db.promise().query('SHOW COLUMNS FROM proveedores');
        const colNames = (cols || []).map(c => c.Field.toLowerCase());
        if (colNames.includes('id')) pk = 'id';
        else if (colNames.includes('id_proveedor')) pk = 'id_proveedor';
        else if (colNames.includes('idproveedor')) pk = 'idproveedor';
        else if (colNames.includes('id_prov')) pk = 'id_prov';
      }
    } catch (e) {
      // no crítico
    }

    // Construir consulta usando la columna detectada
    const joinCol = pk;
    let orders;
    try {
      const query = `SELECT po.id, po.supplier_id, po.date, po.delivery_date, po.total, po.notes, po.created_at, p.${joinCol} AS supplier_key, p.nombre AS supplier_nombre\n       FROM purchase_orders po\n       LEFT JOIN proveedores p ON po.supplier_id = p.${joinCol}\n       ORDER BY po.created_at DESC`;
      const [rows] = await db.promise().query(query);
      orders = rows || [];
    } catch (joinErr) {
      // Si falla el JOIN por cualquier motivo, caer a una consulta simple y resolver nombres de proveedor por separado
      console.warn('JOIN dinámico falló al obtener órdenes, intentando sin JOIN:', joinErr && joinErr.message);
      const [rows] = await db.promise().query('SELECT id, supplier_id, date, delivery_date, total, notes, created_at FROM purchase_orders ORDER BY created_at DESC');
      orders = rows || [];
    }

    const orderIds = (orders || []).map(o => o.id).filter(Boolean);
    let items = [];
    if (orderIds.length > 0) {
      const [rowsItems] = await db.promise().query(
        `SELECT id, order_id, product_name, quantity, unit_price FROM purchase_order_items WHERE order_id IN (${orderIds.map(() => '?').join(',')})`,
        orderIds
      );
      items = rowsItems || [];
    }

    // Agrupar items por order_id
    const itemsByOrder = {};
    items.forEach(it => {
      if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
      itemsByOrder[it.order_id].push({ id: it.id, product_name: it.product_name, quantity: it.quantity, unit_price: it.unit_price });
    });

    // Si la consulta original no devolvió supplier_nombre (por fallback), intentar mapear nombres consultando proveedores
    const needSupplierLookup = orders.some(o => !o.supplier_nombre);
    const supplierCache = {};
    if (needSupplierLookup) {
      for (const o of orders) {
        const sid = o.supplier_id;
        if (!sid) continue;
        if (supplierCache[sid]) continue;
        try {
          const [provRows] = await db.promise().query(
            'SELECT * FROM proveedores WHERE id = ? OR id_proveedor = ? OR idProveedor = ? OR ID = ? LIMIT 1',
            [sid, sid, sid, sid]
          );
          supplierCache[sid] = (provRows && provRows[0]) ? (provRows[0].nombre || provRows[0].name || null) : null;
        } catch (e) {
          supplierCache[sid] = null;
        }
      }
    }

    const normalized = (orders || []).map(o => ({
      id: o.id,
      supplier_id: o.supplier_id,
      supplier_nombre: o.supplier_nombre || supplierCache[o.supplier_id] || null,
      date: o.date,
      delivery_date: o.delivery_date,
      total: Number(o.total || 0),
      notes: o.notes || null,
      created_at: o.created_at,
      items: itemsByOrder[o.id] || []
    }));

    res.json({ success: true, orders: normalized });
  } catch (err) {
    console.error('Error obteniendo órdenes de compra:', err);
    res.status(500).json({ success: false, message: 'Error al obtener órdenes de compra', error: err && (err.sqlMessage || err.message) });
  }
});

// Obtener una orden de compra por id
app.get('/ordenes_compra/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'ID requerido' });
    const [rows] = await db.promise().query('SELECT * FROM purchase_orders WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    const order = rows[0];
    const [items] = await db.promise().query('SELECT id, order_id, product_name, quantity, unit_price FROM purchase_order_items WHERE order_id = ?', [id]);
    // try to fetch supplier name if exists
    let supplier_nombre = null;
    try {
      const [prov] = await db.promise().query('SELECT nombre FROM proveedores WHERE id = ? OR id_proveedor = ? LIMIT 1', [order.supplier_id, order.supplier_id]);
      if (prov && prov[0]) supplier_nombre = prov[0].nombre || null;
    } catch (e) { /* ignore */ }
    const normalized = {
      id: order.id,
      supplier_id: order.supplier_id,
      supplier_nombre,
      date: order.date,
      delivery_date: order.delivery_date,
      total: Number(order.total || 0),
      notes: order.notes || null,
      created_at: order.created_at,
      items: items || []
    };
    res.json({ success: true, order: normalized });
  } catch (err) {
    console.error('Error obteniendo orden:', err);
    res.status(500).json({ success: false, message: 'Error obteniendo orden', error: err && (err.sqlMessage || err.message) });
  }
});

// Actualizar una orden de compra (reemplaza items). También intenta ajustar stock en `libros` restando items previos y aplicando nuevos.
app.put('/ordenes_compra/:id', async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.status(400).json({ success: false, message: 'ID requerido' });
    const { supplier_id, date, delivery_date, notes, products, total } = req.body;
    // obtener items previos para revertir stock
    const [prevItems] = await db.promise().query('SELECT product_name, quantity FROM purchase_order_items WHERE order_id = ?', [id]);
    // revertir stock previo (reducir lo que se sumó al crear la orden)
    try {
      for (const it of (prevItems || [])) {
        const name = (it.product_name || '').toString().trim();
        const qty = Number(it.quantity || 0) || 0;
        if (!name || qty <= 0) continue;
        await db.promise().query('UPDATE libros SET stock = GREATEST(IFNULL(stock,0) - ?, 0) WHERE LOWER(title) = LOWER(?)', [qty, name]);
      }
    } catch (e) { console.warn('Warning: no se pudo revertir stock previo al actualizar orden', e && e.message); }

    // actualizar cabecera de la orden
    await db.promise().query('UPDATE purchase_orders SET supplier_id = ?, date = ?, delivery_date = ?, total = ?, notes = ? WHERE id = ?', [supplier_id || null, date || null, delivery_date || null, Number(total || 0), notes || null, id]);

    // eliminar items previos y volver a insertar los nuevos
    await db.promise().query('DELETE FROM purchase_order_items WHERE order_id = ?', [id]);
    if (Array.isArray(products) && products.length > 0) {
      const values = products.map(p => [id, p.name || p.product_name || '', Number(p.qty || p.quantity || 0), Number(p.price || p.unit_price || 0)]);
      const placeholders = values.map(() => '(?, ?, ?, ?)').join(',');
      const flat = values.reduce((a, b) => a.concat(b), []);
      const insertItemsSql = `INSERT INTO purchase_order_items (order_id, product_name, quantity, unit_price) VALUES ${placeholders}`;
      await db.promise().query(insertItemsSql, flat);
      // aplicar nuevo stock (sumar cantidades) similar a creación
      try {
        for (const p of products) {
          const name = (p.name || p.product_name || '').toString().trim();
          const qty = Number(p.qty || p.quantity || 0) || 0;
          const price = Number(p.price || p.unit_price || 0) || 0;
          if (!name || qty <= 0) continue;
          const [found] = await db.promise().query('SELECT id, IFNULL(stock,0) AS stock FROM libros WHERE LOWER(title) = LOWER(?) LIMIT 1', [name]);
          if (found && found.length > 0) {
            const existing = found[0];
            const newStock = (Number(existing.stock || 0) + qty) || qty;
            await db.promise().query('UPDATE libros SET stock = ?, price = ? WHERE id = ?', [newStock, price, existing.id]);
          } else {
            await db.promise().query('INSERT INTO libros (title, author, genre, price, image, description, stock) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, '', null, price, null, null, qty]);
          }
        }
      } catch (syncErr) {
        console.warn('No se pudo sincronizar items de orden con la tabla libros al actualizar:', syncErr && (syncErr.message || syncErr.sqlMessage || syncErr));
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error actualizando orden:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar orden', error: err && (err.sqlMessage || err.message) });
  }
});

// Eliminar una orden de compra y sus items (intenta revertir stocks aplicados al crear la orden)
app.delete('/ordenes_compra/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'ID requerido' });
    // obtener items para revertir stock
    const [items] = await db.promise().query('SELECT product_name, quantity FROM purchase_order_items WHERE order_id = ?', [id]);
    try {
      for (const it of (items || [])) {
        const name = (it.product_name || '').toString().trim();
        const qty = Number(it.quantity || 0) || 0;
        if (!name || qty <= 0) continue;
        await db.promise().query('UPDATE libros SET stock = GREATEST(IFNULL(stock,0) - ?, 0) WHERE LOWER(title) = LOWER(?)', [qty, name]);
      }
    } catch (e) { console.warn('Warning: no se pudo revertir stock al eliminar orden', e && e.message); }

    await db.promise().query('DELETE FROM purchase_order_items WHERE order_id = ?', [id]);
    const [del] = await db.promise().query('DELETE FROM purchase_orders WHERE id = ?', [id]);
    if (del && del.affectedRows && del.affectedRows > 0) return res.json({ success: true });
    return res.status(404).json({ success: false, message: 'Orden no encontrada' });
  } catch (err) {
    console.error('Error eliminando orden:', err);
    res.status(500).json({ success: false, message: 'Error al eliminar orden', error: err && (err.sqlMessage || err.message) });
  }
});

// Login
app.post('/login', (req, res) => {
  const { correo, contrasena } = req.body;

  db.query(
    'SELECT * FROM usuario WHERE correo = ? AND contrasena = ?',
    [correo, contrasena],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error en el servidor' });

      if (result.length > 0) {
        const usuario = result[0];

        // Guardar ID del usuario en sesión
        req.session.id_usuario = usuario.id_usuario;

        // Log breve para depuración: confirmar si el avatar viene en la fila
        try {
          const avatarInfo = usuario.avatar ? (`length=${String(usuario.avatar).length}`) : 'null';
          console.log(`Login: usuario=${usuario.id_usuario}, avatar=${avatarInfo}`);
        } catch (e) {
          console.log('Login: no se pudo leer avatar', e && e.message);
        }

        // Si la cuenta está marcada como inactiva, informar al cliente
        if (typeof usuario.activo !== 'undefined' && (usuario.activo === 0 || usuario.activo === false)) {
          return res.json({ success: false, message: 'Cuenta inactiva', activo: false });
        }

        res.json({ 
              success: true,
              message: 'Inicio de sesión exitoso',
              nombre: usuario.nombre,
              correo: usuario.correo,
              rol: usuario.rol,
              celular: usuario.celular || null,
              direccion: usuario.direccion || null,
              avatar: usuario.avatar || null,
              activo: typeof usuario.activo === 'undefined' ? true : !!usuario.activo
        });
      } else {
        res.json({ success: false, message: 'Correo o contraseña incorrectos' });
      }
    }
  );
  });

// Obtener perfil del usuario en sesión
app.get('/perfil', (req, res) => {
  const id_usuario = req.session.id_usuario;
  if (!id_usuario) return res.status(401).json({ success: false, message: 'Usuario no autenticado' });

  db.query('SELECT id_usuario, nombre, correo, direccion, celular, rol, avatar FROM usuario WHERE id_usuario = ?', [id_usuario], (err, result) => {
    if (err) {
      console.error('Error obteniendo perfil:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener perfil' });
    }
    if (result.length === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    const user = result[0];
    res.json({ success: true, user });
  });
});

// Asegurar columna avatar en tabla usuario (MEDIUMTEXT) para poder guardar dataURLs si fuese necesario
db.promise().query("SHOW COLUMNS FROM usuario LIKE 'avatar'")
  .then(([rows]) => {
    if (!rows || rows.length === 0) {
      return db.promise().query("ALTER TABLE usuario ADD COLUMN avatar MEDIUMTEXT")
        .then(() => console.log('✅ Columna `avatar` en `usuario` creada como MEDIUMTEXT'))
        .catch(err => console.error('Error al crear la columna avatar en usuario:', err));
    } else {
      // console.log('✅ Columna `avatar` ya existe en `usuario`');
      return null;
    }
  })
  .catch(err => {
    // Puede suceder si la tabla `usuario` no existe aún o hay permisos insuficientes
    console.warn('No se pudo verificar/crear la columna avatar en `usuario` (es posible que la tabla no exista aún):', err.message || err);
  });

// Asegurar columna `activo` en la tabla `usuario` para habilitar/deshabilitar cuentas
db.promise().query("SHOW COLUMNS FROM usuario LIKE 'activo'")
  .then(([rows]) => {
    if (!rows || rows.length === 0) {
      return db.promise().query("ALTER TABLE usuario ADD COLUMN activo TINYINT(1) DEFAULT 1")
        .then(() => console.log('✅ Columna `activo` añadida a `usuario` (valor por defecto = 1)'))
        .catch(err => console.error('Error al crear columna activo en usuario:', err));
    }
    return null;
  })
  .catch(err => {
    console.warn('No se pudo verificar/crear la columna activo en `usuario`:', err && err.message || err);
  });

// Actualizar perfil del usuario (actualizaciones parciales)
app.put('/perfil', async (req, res) => {
  const id_usuario = req.session.id_usuario;
  if (!id_usuario) return res.status(401).json({ success: false, message: 'Usuario no autenticado' });

  const { nombre, email, correo, telefono, celular, direccion, avatar, password } = req.body;

  const fields = [];
  const values = [];

  // Aceptar varias claves usadas por el frontend
  if (typeof nombre === 'string') { fields.push('nombre = ?'); values.push(nombre); }
  if (typeof email === 'string') { fields.push('correo = ?'); values.push(email); }
  if (typeof correo === 'string') { fields.push('correo = ?'); values.push(correo); }
  if (typeof telefono === 'string') { fields.push('celular = ?'); values.push(telefono); }
  if (typeof celular === 'string') { fields.push('celular = ?'); values.push(celular); }
  if (typeof direccion === 'string') { fields.push('direccion = ?'); values.push(direccion); }
  if (typeof avatar === 'string') { fields.push('avatar = ?'); values.push(avatar); }
  if (typeof password === 'string' && password.length > 0) { fields.push('contrasena = ?'); values.push(password); }

  if (fields.length === 0) return res.json({ success: false, message: 'No hay campos para actualizar' });

  try {
    const sql = `UPDATE usuario SET ${fields.join(', ')} WHERE id_usuario = ?`;
    values.push(id_usuario);
    await db.promise().query(sql, values);

    // Devolver perfil actualizado
    const [rows] = await db.promise().query('SELECT id_usuario, nombre, correo, direccion, celular, rol, avatar FROM usuario WHERE id_usuario = ?', [id_usuario]);
    const user = rows[0] || null;

    // Log para depuración sobre avatar actualizado
    try {
      const avatarInfo = user && user.avatar ? (`length=${String(user.avatar).length}`) : 'null';
      console.log(`Perfil actualizado: usuario=${id_usuario}, avatar=${avatarInfo}`);
    } catch (e) {
      console.log('Perfil actualizado: no se pudo leer avatar', e && e.message);
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('Error actualizando perfil:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar perfil', error: err.sqlMessage || err.message });
  }
});

// Endpoint para cambiar credenciales desde el área de administración/front-end
app.put('/admin/credenciales', async (req, res) => {
  try {
    const id_usuario = req.session.id_usuario;
    if (!id_usuario) return res.status(401).json({ success: false, message: 'Usuario no autenticado' });

    const { currentPassword, newPassword, newEmail } = req.body;
    // Require at least one change
    if (!newPassword && !newEmail) return res.status(400).json({ success: false, message: 'Falta nueva contraseña o nuevo email' });

    // Obtener usuario actual
    const [rows] = await db.promise().query('SELECT id_usuario, contrasena, correo FROM usuario WHERE id_usuario = ? LIMIT 1', [id_usuario]);
    if (!rows || rows.length === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    const user = rows[0];

    // Si se solicita cambiar la contraseña, verificar la contraseña actual
    if (newPassword) {
      // Verificar contraseña actual (en este proyecto las contraseñas se almacenan en texto plano)
      // Si usas hashing, reemplaza esta comparación por la verificación correspondiente.
      if (!currentPassword || String(user.contrasena || '') !== String(currentPassword)) {
        return res.status(400).json({ success: false, message: 'Contraseña actual incorrecta' });
      }
    }

    // Preparar actualizaciones
    const updates = [];
    const values = [];
    if (newPassword) {
      updates.push('contrasena = ?');
      values.push(newPassword);
    }
    if (newEmail) {
      // validar formato básico
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(String(newEmail || '').trim())) {
        return res.status(400).json({ success: false, message: 'Formato de email inválido' });
      }
      // comprobar unicidad
      const [exists] = await db.promise().query('SELECT id_usuario FROM usuario WHERE correo = ? AND id_usuario != ? LIMIT 1', [newEmail, id_usuario]);
      if (exists && exists.length > 0) return res.status(400).json({ success: false, message: 'El email ya está en uso' });
      updates.push('correo = ?');
      values.push(newEmail);
    }

    if (updates.length > 0) {
      values.push(id_usuario);
      const sql = `UPDATE usuario SET ${updates.join(', ')} WHERE id_usuario = ?`;
      await db.promise().query(sql, values);
    }

    return res.json({ success: true, updated: true, message: 'Credenciales actualizadas correctamente' });
  } catch (err) {
    console.error('Error en /admin/credenciales:', err && (err.sqlMessage || err.message || err));
    return res.status(500).json({ success: false, message: 'Error al actualizar credenciales' });
  }
});

// Asegurar columna `stock` existe en la tabla `libros` para llevar inventario
db.promise().query("ALTER TABLE libros ADD COLUMN stock INT DEFAULT 0")
  .then(() => console.log('✅ Columna `stock` añadida a `libros` (si no existía)'))
  .catch(err => {
    // Ignorar si ya existe u otros errores no críticos
    if (err && err.code !== 'ER_DUP_FIELDNAME' && err.errno !== 1060) {
      // console.warn('No se pudo crear la columna stock (posible que ya exista):', err.message || err);
    }
  });

// Asegurar que la tabla `proveedores` exista (para gestión de proveedores)
const createProveedoresTable = `
CREATE TABLE IF NOT EXISTS proveedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255),
  empresa VARCHAR(255),
  email VARCHAR(255),
  telefono VARCHAR(50),
  direccion TEXT,
  productos TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`;

db.promise().query(createProveedoresTable)
  // .then(() => console.log('✅ Tabla `proveedores` verificada/creada'))
  .catch(err => console.error('Error creando/verificando tabla proveedores:', err));

// Asegurar columnas esperadas en `proveedores` (si la tabla venía de otro esquema)
const alterProveedoresCols = [
  "ALTER TABLE proveedores ADD COLUMN nombre VARCHAR(255)",
  "ALTER TABLE proveedores ADD COLUMN empresa VARCHAR(255)",
  "ALTER TABLE proveedores ADD COLUMN email VARCHAR(255)",
  "ALTER TABLE proveedores ADD COLUMN telefono VARCHAR(50)",
  "ALTER TABLE proveedores ADD COLUMN direccion TEXT",
  "ALTER TABLE proveedores ADD COLUMN productos TEXT"
];

alterProveedoresCols.forEach(q => {
  db.promise().query(q)
    .then(() => {})
    .catch(err => {
      // Ignorar errores por columna ya existente o tabla ausente
      if (err && (err.code === 'ER_DUP_FIELDNAME' || err.errno === 1060 || err.code === 'ER_NO_SUCH_TABLE' || err.errno === 1146)) {
        return;
      }
      console.warn('Warning al asegurar columna proveedores:', err && (err.message || err.sqlMessage) || err);
    });
});

// Asegurar tablas para órdenes de compra
const createPurchaseOrdersTable = `
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT,
  date DATE,
  delivery_date DATE,
  total DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`;

const createPurchaseItemsTable = `
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  product_name VARCHAR(255),
  quantity INT DEFAULT 0,
  unit_price DECIMAL(12,2) DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
)
`;

db.promise().query(createPurchaseOrdersTable)
  // .then(() => console.log('✅ Tabla `purchase_orders` verificada/creada'))
  .catch(err => console.error('Error creando/verificando tabla purchase_orders:', err));

db.promise().query(createPurchaseItemsTable)
  // .then(() => console.log('✅ Tabla `purchase_order_items` verificada/creada'))
  .catch(err => console.error('Error creando/verificando tabla purchase_order_items:', err));


// agregar al carrito
app.post("/carrito/agregar", async (req, res) => {
  try {
    let { libro_id_api, titulo, cantidad, precio_unitario, imagen } = req.body;
    const id_usuario = req.session.id_usuario;

    if (!id_usuario) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

    // Buscar carrito activo
    let [rows] = await db.promise().query(
      "SELECT id_carrito FROM carrito WHERE id_usuario = ? AND estado = 'activo'",
      [id_usuario]
    );

    let id_carrito;
    if (rows.length > 0) {
      id_carrito = rows[0].id_carrito;
    } else {
      const result = await db.promise().query(
        "INSERT INTO carrito (id_usuario) VALUES (?)",
        [id_usuario]
      );
      id_carrito = result[0].insertId;
    }

    // Insertar item en carrito
    // Normalizar/validar payload para evitar errores SQL por tipos/longitudes
    try {
      cantidad = Number.parseInt(cantidad) || 1
    } catch (e) { cantidad = 1 }
    try { precio_unitario = Number.parseFloat(String(precio_unitario).replace(/[^0-9.-]+/g, '')) || 0 } catch (e) { precio_unitario = 0 }
    // Limitar longitud de título e imagen para evitar errores de columna demasiado larga
    if (typeof titulo === 'string') titulo = titulo.substring(0, 255)
    if (typeof libro_id_api !== 'string') libro_id_api = String(libro_id_api || '')
    if (typeof imagen === 'string') imagen = imagen.substring(0, 200000) // recortar si es dataURL excesivo

    // Log payload mínimo para depuración
    console.log('Agregar carrito payload:', { id_usuario, id_carrito, libro_id_api, titulo: titulo && titulo.slice(0,40), cantidad, precio_unitario })

    await db.promise().query(
      "INSERT INTO carrito_items (id_carrito, libro_id_api, titulo, cantidad, precio_unitario, imagen) VALUES (?, ?, ?, ?, ?, ?)",
      [id_carrito, libro_id_api, titulo, cantidad, precio_unitario, imagen]
    );

    res.json({ success: true, message: "Libro agregado al carrito ✅" });

  } catch (err) {
    console.error("Error al agregar al carrito:", err);
    res.status(500).json({ success: false, message: "Error agregando libro al carrito" });
  }
});



// Obtener carrito de un usuario
app.get('/carrito', (req, res) => {
   console.log('Session:', req.session);
    const id_usuario = req.session.id_usuario || 4;
    if (!id_usuario) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }
    const sql = `
    SELECT ci.id_item, ci.libro_id_api, ci.titulo, ci.cantidad, ci.precio_unitario, ci.imagen
    FROM carrito_items ci
    JOIN carrito c ON ci.id_carrito = c.id_carrito
    WHERE c.id_usuario = ? AND c.estado = 'activo'
`;


    db.query(sql, [id_usuario], (err, result) => {
    if(err) {
        console.error('Error al obtener carrito:', err); // <--- esto imprime el error real
        return res.status(500).json({ success: false, message: 'Error al obtener carrito' });
    }
    console.log('Items encontrados:', result); // <--- para depurar
    res.json({ success: true, items: result });
});

});


app.post('/carrito/actualizar', async (req, res) => {
    try {
        const { libro_id_api, delta } = req.body;
        const id_usuario = req.session.id_usuario;

        // Obtener el carrito activo
        const [carritoRows] = await db.promise().query(
            "SELECT id_carrito FROM carrito WHERE id_usuario = ? AND estado = 'activo'",
            [id_usuario]
        );
        if (carritoRows.length === 0) return res.json({ success: false, message: 'Carrito no encontrado' });

        const id_carrito = carritoRows[0].id_carrito;

        // Actualizar la cantidad
        const [itemRows] = await db.promise().query(
            "SELECT cantidad FROM carrito_items WHERE id_carrito = ? AND libro_id_api = ?",
            [id_carrito, libro_id_api]
        );

        if (itemRows.length === 0) return res.json({ success: false, message: 'Item no encontrado' });

        let nuevaCantidad = itemRows[0].cantidad + delta;

        if (nuevaCantidad <= 0) {
            // Eliminar si cantidad <= 0
            await db.promise().query(
                "DELETE FROM carrito_items WHERE id_carrito = ? AND libro_id_api = ?",
                [id_carrito, libro_id_api]
            );
        } else {
            // Actualizar cantidad
            await db.promise().query(
                "UPDATE carrito_items SET cantidad = ? WHERE id_carrito = ? AND libro_id_api = ?",
                [nuevaCantidad, id_carrito, libro_id_api]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error al actualizar cantidad:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar cantidad' });
    }
});


// elminar /Vaciar carrito completo
app.delete('/carrito/limpiar', async (req, res) => {
  try {
    const id_usuario = req.session.id_usuario;

    if (!id_usuario) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }

    const [carritoRows] = await db.promise().query(
      "SELECT id_carrito FROM carrito WHERE id_usuario = ? AND estado = 'activo'",
      [id_usuario]
    );

    if (carritoRows.length === 0) {
      return res.json({ success: true, message: 'Carrito ya estaba vacío' });
    }

    const id_carrito = carritoRows[0].id_carrito;

    await db.promise().query(
      "DELETE FROM carrito_items WHERE id_carrito = ?",
      [id_carrito]
    );

    res.json({ success: true, message: 'Carrito vaciado correctamente' });

  } catch (err) {
    console.error('Error al vaciar carrito:', err);
    res.status(500).json({ success: false, message: 'Error al vaciar carrito' });
  }
});



// borrar favoritos
app.delete('/favoritos/limpiar', async (req, res) => {
  try {
    const id_usuario = req.session.id_usuario;

    if (!id_usuario) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }

    await db.promise().query(
      "DELETE FROM favoritos WHERE id_usuario = ?",
      [id_usuario]
    );

    res.json({ success: true, message: 'Favoritos eliminados' });

  } catch (err) {
    console.error('Error al limpiar favoritos:', err);
    res.status(500).json({ success: false, message: 'Error al limpiar favoritos' });
  }
});


// eliminar libro del carrito
app.delete('/carrito/:libro_id_api', async (req, res) => {
  try {
    const { libro_id_api } = req.params;
    const id_usuario = req.session.id_usuario;

    // Obtener el carrito activo
    const [carritoRows] = await db.promise().query(
      "SELECT id_carrito FROM carrito WHERE id_usuario = ? AND estado = 'activo'",
      [id_usuario]
    );

    if (carritoRows.length === 0) {
      return res.json({ success: false, message: 'Carrito no encontrado' });
    }

    const id_carrito = carritoRows[0].id_carrito;

    // Eliminar el libro del carrito
    const [result] = await db.promise().query(
      "DELETE FROM carrito_items WHERE id_carrito = ? AND libro_id_api = ?",
      [id_carrito, libro_id_api]
    );

    if (result.affectedRows === 0) {
      return res.json({ success: false, message: 'Libro no encontrado en el carrito' });
    }

    res.json({ success: true, message: 'Libro eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar libro del carrito:', err);
    res.status(500).json({ success: false, message: 'Error al eliminar libro del carrito' });
  }
});


// POST /pedidos  -> crea un pedido a partir del carrito activo del usuario
app.post("/pedidos", async (req, res) => {
  console.log("Usuario en sesión:", req.session.id_usuario);

  const { items } = req.body;
  const id_usuario = req.session.id_usuario; // <-- usa directamente el número

  if (!id_usuario) {
    return res.status(401).json({ success: false, message: "Usuario no autenticado" });
  }

  if (!items || items.length === 0) {
    return res.json({ success: false, message: "No hay libros en el pedido" });
  }

  try {
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // Calcular total
    const total = items.reduce((sum, item) => sum + item.precio_unitario * item.cantidad, 0);

    // Insertar pedido
    const [pedidoResult] = await connection.query(
      "INSERT INTO pedidos (id_usuario, libros, total, estado) VALUES (?, ?, ?, 'pendiente')",
      [id_usuario, JSON.stringify(items), total]
    );

    const pedidoId = pedidoResult.insertId;

    // Insertar detalles del pedido
    for (const item of items) {
      await connection.query(
        "INSERT INTO detalle_pedido (id_pedido, id_libro, titulo, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)",
        [pedidoId, item.libro_id_api, item.titulo, item.cantidad, item.precio_unitario]
      );

      // Intentar decrementar stock en la tabla `libros` si el id corresponde a un libro local
      try {
        const libroIdNum = Number.parseInt(item.libro_id_api, 10);
        const reqQty = Number(item.cantidad) || 0;
        if (Number.isFinite(libroIdNum) && reqQty > 0) {
          // Primero, obtener el libro por id (lock row)
          const [mainRows] = await connection.query('SELECT id, title, author, IFNULL(stock,0) AS stock FROM libros WHERE id = ? FOR UPDATE', [libroIdNum]);
          let remaining = reqQty;

          // helper to decrement from a specific row
          const decrementFromRow = async (rowId, take) => {
            if (!take || take <= 0) return 0;
            await connection.query('UPDATE libros SET stock = GREATEST(IFNULL(stock,0) - ?, 0) WHERE id = ?', [take, rowId]);
            return take;
          };

          if (mainRows && mainRows.length > 0) {
            const main = mainRows[0];
            const used = Math.min(Number(main.stock || 0), remaining);
            if (used > 0) {
              await decrementFromRow(main.id, used);
              remaining -= used;
            }

            // If still remaining, find other rows with same title+author and consume from them
            if (remaining > 0) {
              const title = (main.title || '').toString().trim().toLowerCase();
              const author = (main.author || '').toString().trim().toLowerCase();
              const [matches] = await connection.query(
                'SELECT id, IFNULL(stock,0) AS stock FROM libros WHERE LOWER(title) = ? AND LOWER(IFNULL(author,\'\')) = ? AND id != ? FOR UPDATE',
                [title, author, main.id]
              );

              // compute total available
              const totalAvailable = (matches || []).reduce((s, r) => s + Number(r.stock || 0), 0);
              if (totalAvailable < remaining) {
                // not enough across duplicates — rollback and error
                await connection.rollback();
                connection.release();
                return res.status(400).json({ success: false, message: `Stock insuficiente para '${item.titulo || item.title || 'libro'}'` });
              }

              for (const r of matches) {
                if (remaining <= 0) break;
                const take = Math.min(Number(r.stock || 0), remaining);
                if (take > 0) {
                  await decrementFromRow(r.id, take);
                  remaining -= take;
                }
              }
            }
          } else {
            // If the main id was not found, try to find rows by title+author from the item payload
            const title = (item.titulo || item.title || '').toString().trim().toLowerCase();
            const author = (item.autor || item.author || '').toString().trim().toLowerCase();
            const [matches] = await connection.query(
              'SELECT id, IFNULL(stock,0) AS stock FROM libros WHERE LOWER(title) = ? AND LOWER(IFNULL(author,\'\')) = ? FOR UPDATE',
              [title, author]
            );

            const totalAvailable = (matches || []).reduce((s, r) => s + Number(r.stock || 0), 0);
            if (totalAvailable < remaining) {
              await connection.rollback();
              connection.release();
              return res.status(400).json({ success: false, message: `Stock insuficiente para '${item.titulo || item.title || 'libro'}'` });
            }

            for (const r of matches) {
              if (remaining <= 0) break;
              const take = Math.min(Number(r.stock || 0), remaining);
              if (take > 0) {
                await decrementFromRow(r.id, take);
                remaining -= take;
              }
            }
          }
        }
      } catch (e) {
        console.warn('No se pudo decrementar stock para item:', item, e && e.message);
        // on unexpected error, rollback and return
        try { await connection.rollback(); } catch (er) { /* ignore */ }
        try { connection.release(); } catch (er) { /* ignore */ }
        return res.status(500).json({ success: false, message: 'Error al actualizar stock', error: e && e.message });
      }
    }

    await connection.commit();
    connection.release();

    res.json({ success: true, pedidoId });
  } catch (error) {
    console.error("Error al guardar pedido:", error);
    res.status(500).json({
      success: false,
      message: "Error al guardar pedido",
      error: error.sqlMessage || error.message,
    });
  }
});



// Finalizar el carrito (marcarlo como completado)
app.put("/carrito/finalizar", async (req, res) => {
 const userId = req.body.userId;
 // 👈 usa el campo correcto

  if (!userId) {
    return res.status(401).json({ success: false, message: "Usuario no autenticado" });
  }

  try {
    await db.query(
      "UPDATE carrito SET estado = 'completado' WHERE id_usuario = ? AND estado = 'activo'",
      [userId]
    );

    // Opcional: crear nuevo carrito vacío
    await db.query("INSERT INTO carrito (id_usuario, estado) VALUES (?, 'activo')", [userId]);

    res.json({ success: true, message: "Carrito finalizado correctamente" });
  } catch (error) {
    console.error("Error al finalizar carrito:", error);
    res.status(500).json({ success: false, message: "Error al finalizar el carrito" });
  }
});



// Obtener todos los pedidos (ruta para administradores)
app.get('/pedidos', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT p.id_pedido, p.id_usuario, p.total, p.estado, p.fecha_creacion, p.libros, u.nombre AS nombre_cliente, u.correo AS correo_cliente
       FROM pedidos p
       LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
       ORDER BY p.fecha_creacion DESC`
    );

    // Asegurar que 'libros' sea objeto/array
    const pedidos = rows.map(p => ({
      ...p,
      libros: typeof p.libros === 'string' ? JSON.parse(p.libros) : p.libros,
      nombre_cliente: p.nombre_cliente || null,
      correo_cliente: p.correo_cliente || null
    }));

    res.json({ success: true, pedidos });
  } catch (err) {
    console.error('Error al obtener pedidos (admin):', err);
    res.status(500).json({ success: false, message: 'Error al obtener pedidos' });
  }
});



// GET pedido individual por ID
app.get('/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.promise().query(
      `SELECT p.id_pedido, p.id_usuario, p.total, p.estado, p.fecha_creacion, p.libros,
              u.nombre AS nombre_cliente, u.correo AS correo_cliente
       FROM pedidos p
       LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
       WHERE p.id_pedido = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    const pedido = {
      ...rows[0],
      libros: typeof rows[0].libros === 'string' ? JSON.parse(rows[0].libros) : rows[0].libros
    };

    res.json({ success: true, pedido });

  } catch (err) {
    console.error('Error al obtener pedido:', err);
    res.status(500).json({ success: false, message: 'Error al obtener pedido' });
  }
});


// Obtener libros destacados
app.get('/libros', async (req, res) => {
  try {
    const search = (req.query.search || '').toString().trim();
    const genre = (req.query.genre || '').toString().trim().toLowerCase();

    // Construir cláusulas WHERE dinámicas
    const where = [];
    const params = [];

    if (search) {
      where.push('(LOWER(title) LIKE ? OR LOWER(author) LIKE ?)');
      const like = `%${search.toLowerCase()}%`;
      params.push(like, like);
    }

    if (genre) {
      where.push('LOWER(genre) = ?');
      params.push(genre.toLowerCase());
    }

    const baseSelect = 'SELECT id, title, author, genre, price, image, description, stock FROM libros';
    const sql = where.length > 0 ? `${baseSelect} WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT 100` : `${baseSelect} ORDER BY created_at DESC`;
    const [rows] = await db.promise().query(sql, params);
    res.json({ success: true, books: rows });
  } catch (err) {
    console.error('Error al obtener libros destacados:', err);
    res.status(500).json({ success: false, message: 'Error al obtener libros destacados' });
  }
});

// Obtener libros con indicador si fueron comprados (purchased)
app.get('/libros/status', async (req, res) => {
  try {
    // Para cada libro comprobar si existe al menos un detalle_pedido asociado
    const sql = `
      SELECT l.id, l.title, l.author, l.genre, l.price, l.image, l.description, IFNULL(l.stock,0) AS stock,
             EXISTS(SELECT 1 FROM detalle_pedido dp WHERE dp.id_libro = l.id) AS purchased
      FROM libros l
      ORDER BY l.created_at DESC
    `;
    const [rows] = await db.promise().query(sql);
    // Convertir flag numérico a boolean en JS
    const books = (rows || []).map(r => ({ ...r, purchased: Boolean(r.purchased) }));
    res.json({ success: true, books });
  } catch (err) {
    console.error('Error al obtener libros con estado:', err);
    res.status(500).json({ success: false, message: 'Error al obtener libros con estado' });
  }
});

// Obtener un libro por id
app.get('/libros/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.promise().query('SELECT id, title, author, genre, price, image, description, stock FROM libros WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Libro no encontrado' });
    res.json({ success: true, book: rows[0] });
  } catch (err) {
    console.error('Error al obtener libro:', err);
    res.status(500).json({ success: false, message: 'Error al obtener libro' });
  }
});

// Agregar libro destacado
app.post('/libros', async (req, res) => {
  try {
    const { title, author, genre, price, image, description, stock } = req.body;
    const [result] = await db.promise().query(
      'INSERT INTO libros (title, author, genre, price, image, description, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, author, genre || null, price || 0, image || null, description || null, (typeof stock === 'number' ? stock : (stock ? Number(stock) : 0))]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Error al insertar libro destacado:', err);
    res.status(500).json({ success: false, message: 'Error al insertar libro destacado' });
  }
});

// Eliminar libro destacado
app.delete('/libros/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // Usar transacción para eliminar libro y limpiar referencias en órdenes de compra
    const conn = await db.promise().getConnection();
    try {
      await conn.beginTransaction();

      // obtener título del libro antes de borrar
      const [[bookRow]] = await conn.query('SELECT title FROM libros WHERE id = ?', [id]);
      if (!bookRow) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({ success: false, message: 'Libro no encontrado' });
      }
      const title = (bookRow.title || '').toString().trim();

      // eliminar items de órdenes de compra que coincidan por nombre (case-insensitive)
      const [deletedItemsResult] = await conn.query('DELETE poi FROM purchase_order_items poi WHERE LOWER(poi.product_name) = LOWER(?)', [title]);

      // encontrar órdenes que ya no tengan items y eliminarlas
      const [orderIdsRows] = await conn.query('SELECT po.id FROM purchase_orders po LEFT JOIN purchase_order_items poi ON poi.order_id = po.id WHERE poi.id IS NULL');
      let deletedOrders = 0;
      if (Array.isArray(orderIdsRows) && orderIdsRows.length > 0) {
        const ids = orderIdsRows.map(r => r.id).filter(Boolean);
        if (ids.length > 0) {
          const placeholders = ids.map(() => '?').join(',');
          const [delOrdersRes] = await conn.query(`DELETE FROM purchase_orders WHERE id IN (${placeholders})`, ids);
          deletedOrders = delOrdersRes.affectedRows || 0;
        }
      }

      // por último eliminar el libro
      const [delBookRes] = await conn.query('DELETE FROM libros WHERE id = ?', [id]);
      if (delBookRes.affectedRows === 0) {
        // si por alguna razón no se eliminó, rollback
        await conn.rollback();
        conn.release();
        return res.status(500).json({ success: false, message: 'No se pudo eliminar el libro' });
      }

      await conn.commit();
      conn.release();
      res.json({ success: true, deletedItems: (deletedItemsResult && deletedItemsResult.affectedRows) || 0, deletedOrders });
    } catch (txErr) {
      try { await conn.rollback(); } catch (_) { /* ignore */ }
      conn.release();
      console.error('Error en transacción al eliminar libro y limpiar órdenes:', txErr);
      return res.status(500).json({ success: false, message: 'Error al eliminar libro y limpiar referencias' });
    }
  } catch (err) {
    console.error('Error al eliminar libro destacado:', err);
    res.status(500).json({ success: false, message: 'Error al eliminar libro destacado' });
  }
});

// Actualizar libro destacado
app.put('/libros/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const allowed = ['title', 'author', 'genre', 'price', 'image', 'description', 'stock'];
    const fields = [];
    const values = [];

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        // Normalize stock and price types
        if (key === 'stock') {
          const raw = req.body.stock;
          const parsed = (typeof raw === 'number') ? raw : (raw ? Number(raw) : null);
          fields.push('stock = ?');
          values.push(parsed);
        } else if (key === 'price') {
          const raw = req.body.price;
          const parsed = (typeof raw === 'number') ? raw : (raw ? Number(raw) : 0);
          fields.push('price = ?');
          values.push(parsed);
        } else if (key === 'genre') {
          const raw = req.body.genre;
          fields.push('genre = ?');
          values.push(raw || null);
        } else if (key === 'image') {
          fields.push('image = ?');
          values.push(req.body.image || null);
        } else if (key === 'description') {
          fields.push('description = ?');
          values.push(req.body.description || null);
        } else {
          fields.push(`${key} = ?`);
          values.push(req.body[key]);
        }
      }
    }

    if (fields.length === 0) return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });

    const sql = `UPDATE libros SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    const [result] = await db.promise().query(sql, values);

    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Libro no encontrado' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error al actualizar libro destacado:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar libro destacado' });
  }
});



//  Obtener pedidos del usuario en sesión
app.get("/mis-pedidos", async (req, res) => {
  const id_usuario = req.session.id_usuario;

  if (!id_usuario) {
    return res.status(401).json({ success: false, message: "Usuario no autenticado" });
  }

  try {
    const connection = await db.promise().getConnection();

    const [pedidos] = await connection.query(
      "SELECT id_pedido, total, estado, fecha_creacion, libros FROM pedidos WHERE id_usuario = ? ORDER BY fecha_creacion DESC",
      [id_usuario]
    );

    connection.release();

   const pedidosConLibros = pedidos.map(p => ({
  ...p,
  libros: typeof p.libros === "string" ? JSON.parse(p.libros) : p.libros
}));


    res.json({ success: true, pedidos: pedidosConLibros });
  } catch (error) {
    console.error("Error al obtener pedidos:", error); // ya estaba
    console.error("Detalles del error SQL:", error.sqlMessage); // 👈 agrega esto
    res.status(500).json({ success: false, message: "Error al obtener pedidos" });
  }
});


// ====RUTAS DE ADMINISTRADOR====

// Obtener lista de géneros disponibles
app.get('/generos', async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT DISTINCT genre FROM libros WHERE genre IS NOT NULL AND genre != '' ORDER BY genre ASC");
    const genres = (rows || []).map(r => r.genre).filter(Boolean);
    res.json({ success: true, genres });
  } catch (err) {
    console.error('Error al obtener géneros:', err);
    res.status(500).json({ success: false, message: 'Error al obtener géneros' });
  }
});


// Obtener solo clientes
  app.get("/cliente", async (req, res) => {
    try {
      // Devolver fecha de registro (si existe) y la cantidad de pedidos por usuario.
      // Usa LEFT JOIN con pedidos y GROUP BY para calcular pedidos_count.
      const [rows] = await db.promise().query(
        `SELECT u.id_usuario, u.nombre, u.correo, u.direccion, u.celular, u.rol,
            u.fecha_creacion, u.activo, COUNT(p.id_pedido) AS pedidos_count
         FROM usuario u
         LEFT JOIN pedidos p ON p.id_usuario = u.id_usuario
         WHERE u.rol = 'cliente'
         GROUP BY u.id_usuario, u.nombre, u.correo, u.direccion, u.celular, u.rol, u.fecha_creacion, u.activo`
        );

      // Si la columna `fecha_creacion` no existe en la tabla `usuario`, su valor vendrá como null.
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al obtener clientes" });
    }
  });

  // Eliminar un usuario por ID
app.delete('/usuario/:id', async (req, res) => {
  const id = req.params.id;

  // Ejecutar en transacción: borrar items del carrito, carrito y luego usuario.
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    // Eliminar items vinculados al carrito del usuario (si existen)
    await connection.query(
      `DELETE ci FROM carrito_items ci
       JOIN carrito c ON ci.id_carrito = c.id_carrito
       WHERE c.id_usuario = ?`,
      [id]
    );

    // Eliminar carritos del usuario
    await connection.query(
      `DELETE FROM carrito WHERE id_usuario = ?`,
      [id]
    );

    // Finalmente eliminar el usuario
    const [result] = await connection.query(`DELETE FROM usuario WHERE id_usuario = ?`, [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    await connection.commit();
    connection.release();
    res.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (err) {
    try { await connection.rollback(); } catch (e) { /* ignore rollback error */ }
    connection.release();
    console.error('Error al eliminar usuario (transacción):', err);
    return res.status(500).json({ success: false, message: 'Error al eliminar usuario', error: err.sqlMessage || err.message });
  }
});

// Actualizar estado activo/inactivo de un usuario
app.patch('/usuario/:id', async (req, res) => {
  const id = req.params.id;
  const { activo, active, estado } = req.body || {};
  // Determinar nuevo valor de activo (1 o 0)
  let nuevo = null;
  if (typeof activo !== 'undefined') nuevo = activo ? 1 : 0;
  else if (typeof active !== 'undefined') nuevo = active ? 1 : 0;
  else if (typeof estado !== 'undefined') {
    const s = String(estado).toLowerCase();
    nuevo = s.indexOf('inactiv') !== -1 ? 0 : 1;
  }

  if (nuevo === null) return res.status(400).json({ success: false, message: 'Payload inválido. Enviar { activo: true|false }' });

  try {
    const [r] = await db.promise().query('UPDATE usuario SET activo = ? WHERE id_usuario = ?', [nuevo, id]);
    if (!r || r.affectedRows === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    return res.json({ success: true, message: 'Estado de usuario actualizado', activo: !!nuevo });
  } catch (err) {
    console.error('Error actualizando campo activo usuario:', err);
    return res.status(500).json({ success: false, message: 'Error actualizando estado del usuario' });
  }
});



// Página de bienvenida
app.get('/bienvenido', (req, res) => {
  res.send("<h1>Bienvenido a la Biblioteca </h1>");
});

// Logout explícito: destruir sesión
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.warn('Error al destruir sesión:', err);
      return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
    }
    // Además limpiar cookie de sesión en el cliente
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Sesión cerrada' });
  });
});

// Middleware de manejo de errores: capturar payloads demasiado grandes y devolver JSON
// --- Tablas para inventario y compras/proveedores ---
const createProveedores = `
CREATE TABLE IF NOT EXISTS proveedores (
  id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) UNIQUE,
  contacto VARCHAR(255),
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
)
`;

const createCompras = `
CREATE TABLE IF NOT EXISTS compras (
  id_compra INT AUTO_INCREMENT PRIMARY KEY,
  id_proveedor INT,
  total DECIMAL(12,2) DEFAULT 0,
  estado_pago VARCHAR(20) DEFAULT 'pendiente',
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) ON DELETE SET NULL
)
`;

const createDetalleCompra = `
CREATE TABLE IF NOT EXISTS detalle_compra (
  id_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_compra INT,
  id_libro INT NULL,
  titulo VARCHAR(255),
  cantidad INT DEFAULT 0,
  precio_unitario DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (id_compra) REFERENCES compras(id_compra) ON DELETE CASCADE
)
`;

db.promise().query(createProveedores).catch(err => console.error('Error creando proveedores:', err));
db.promise().query(createCompras).catch(err => console.error('Error creando compras:', err));
db.promise().query(createDetalleCompra).catch(err => console.error('Error creando detalle_compra:', err));

// Rutas de inventario / compras
app.get('/inventario/summary', async (req, res) => {
  try {
    const [[{ total_sales }]] = await db.promise().query('SELECT IFNULL(SUM(total),0) AS total_sales FROM pedidos');
    const [[{ total_purchases }]] = await db.promise().query('SELECT IFNULL(SUM(total),0) AS total_purchases FROM compras');
    const [[{ accounts_payable }]] = await db.promise().query("SELECT IFNULL(SUM(total),0) AS accounts_payable FROM compras WHERE estado_pago = 'pendiente'");

    const profit = Number(total_sales || 0) - Number(total_purchases || 0);
    res.json({ success: true, total_sales: Number(total_sales||0), total_purchases: Number(total_purchases||0), accounts_payable: Number(accounts_payable||0), profit });
  } catch (err) {
    console.error('Error en summary inventario:', err);
    res.status(500).json({ success: false, message: 'Error obteniendo resumen' });
  }
});

// Crear una compra
app.post('/compras', async (req, res) => {
  try {
    const { proveedor, items, estado_pago } = req.body;
    if (!proveedor || !Array.isArray(items) || items.length === 0) return res.status(400).json({ success: false, message: 'Payload inválido' });

    // Buscar o crear proveedor
    let [provRows] = await db.promise().query('SELECT id_proveedor FROM proveedores WHERE nombre = ?', [proveedor]);
    let id_proveedor;
    if (provRows.length > 0) {
      id_proveedor = provRows[0].id_proveedor;
    } else {
      const [provRes] = await db.promise().query('INSERT INTO proveedores (nombre) VALUES (?)', [proveedor]);
      id_proveedor = provRes.insertId;
    }

    // Calcular total
    const total = items.reduce((s, it) => s + (Number(it.precio_unitario||0) * Number(it.cantidad||0)), 0);

    const [compRes] = await db.promise().query('INSERT INTO compras (id_proveedor, total, estado_pago) VALUES (?, ?, ?)', [id_proveedor, total, estado_pago || 'pendiente']);
    const id_compra = compRes.insertId;

    // Insertar detalles y actualizar stock
    for (const it of items) {
      const titulo = (it.titulo || '').toString().substring(0,255);
      const cantidad = Number(it.cantidad) || 0;
      const precio_unitario = Number(it.precio_unitario) || 0;
      await db.promise().query('INSERT INTO detalle_compra (id_compra, id_libro, titulo, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)', [id_compra, it.id_libro || null, titulo, cantidad, precio_unitario]);

      // Intentar actualizar stock si id_libro es numérico
      try {
        const libroIdNum = Number.parseInt(it.id_libro, 10);
        if (Number.isFinite(libroIdNum) && cantidad > 0) {
          await db.promise().query('UPDATE libros SET stock = IFNULL(stock,0) + ? WHERE id = ?', [cantidad, libroIdNum]);
        }
      } catch (e) {
        console.warn('No se pudo actualizar stock para item compra', e && e.message);
      }
    }

    res.json({ success: true, id_compra });
  } catch (err) {
    console.error('Error creando compra:', err);
    res.status(500).json({ success: false, message: 'Error creando compra' });
  }
});

// Listar compras con items
app.get('/compras', async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT c.id_compra, c.id_proveedor, c.total, c.estado_pago, c.fecha, p.nombre AS proveedor FROM compras c LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor ORDER BY c.fecha DESC');
    const compras = [];
    for (const c of rows) {
      const [items] = await db.promise().query('SELECT id_detalle, id_compra, id_libro, titulo, cantidad, precio_unitario FROM detalle_compra WHERE id_compra = ?', [c.id_compra]);
      compras.push({ ...c, items, proveedor: c.proveedor });
    }
    res.json({ success: true, compras });
  } catch (err) {
    console.error('Error listando compras:', err);
    res.status(500).json({ success: false, message: 'Error listando compras' });
  }
});

// Marcar compra como pagada
app.post('/compras/:id/pagar', async (req, res) => {
  try {
    const id = req.params.id;
    const [r] = await db.promise().query("UPDATE compras SET estado_pago = 'pagado' WHERE id_compra = ?", [id]);
    if (r.affectedRows === 0) return res.status(404).json({ success: false, message: 'Compra no encontrada' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error al marcar pagada compra:', err);
    res.status(500).json({ success: false, message: 'Error actualizando compra' });
  }
});

// Listar ventas (pedidos) con detalle
app.get('/ventas', async (req, res) => {
  try {
    const [rows] = await db.promise().query(`SELECT p.id_pedido, p.id_usuario, p.total, p.estado, p.fecha_creacion, p.libros, u.nombre AS nombre_cliente FROM pedidos p LEFT JOIN usuario u ON p.id_usuario = u.id_usuario ORDER BY p.fecha_creacion DESC`);
    const ventas = rows.map(p => ({ ...p, libros: typeof p.libros === 'string' ? JSON.parse(p.libros) : p.libros }));
    res.json({ success: true, ventas });
  } catch (err) {
    console.error('Error listando ventas:', err);
    res.status(500).json({ success: false, message: 'Error listando ventas' });
  }
});

// Middleware de manejo de errores: capturar payloads demasiado grandes y devolver JSON
app.use((err, req, res, next) => {
  if (err) {
    if (err.type === 'entity.too.large' || err.status === 413) {
      console.warn('PayloadTooLarge error al procesar la petición:', err.message || err);
      return res.status(413).json({ success: false, error: 'PayloadTooLarge', message: 'El cuerpo de la petición es demasiado grande. Reduce el tamaño de la imagen antes de enviarla.' });
    }
  }
  next(err);
});



// ======Enpoind de cuenta bancaria====
app.post("/cuenta-bancaria", async (req, res) => {
  try {
    const { banco, titular, clabe, tipo } = req.body;

    // Obtener usuario desde sesión
const usuario_id = req.session.id_usuario;
    if (!usuario_id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
    }

    // Validaciones básicas
    if (!banco || !titular || !clabe || !tipo) {
      return res.json({
        success: false,
        message: "Faltan datos"
      });
    }

    if (clabe.length !== 18) {
      return res.json({
        success: false,
        message: "La CLABE debe tener 18 dígitos"
      });
    }

    // Insertar en BD
    await db.promise().query(
      `INSERT INTO cuentas_bancarias 
       (usuario_id, banco, titular, clabe, tipo) 
       VALUES (?, ?, ?, ?, ?)`,
      [usuario_id, banco, titular, clabe, tipo]
    );

    res.json({
      success: true,
      message: "Cuenta guardada correctamente"
    });

  } catch (error) {
    console.error("🔥 ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor"
    });
  }
});

// trae los datos bancarios 
app.get("/cuenta-bancaria", async (req, res) => {
  try {
    const usuario_id = req.session.userId || req.session.id_usuario;

    if (!usuario_id) {
      return res.status(401).json({ success: false, message: "No autenticado" });
    }

    const [rows] = await db.promise().query(
      "SELECT * FROM cuentas_bancarias WHERE usuario_id = ?",
      [usuario_id]
    );

    res.json({ success: true, cuenta: rows[0] || null });

  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
});


// ELIMINAR LA CEUNTA ABNCARIA
app.delete("/cuenta-bancaria", async (req, res) => {
  try {
    const usuario_id = req.session.id_usuario;

    if (!usuario_id) {
      return res.status(401).json({
        success: false,
        message: "No autenticado"
      });
    }

    await db.promise().query(
      "DELETE FROM cuentas_bancarias WHERE usuario_id = ?",
      [usuario_id]
    );

    res.json({
      success: true,
      message: "Cuenta eliminada"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error en servidor"
    });
  }
});



// PUT actualizar estado del pedidoñ
app.put("/pedidos/:id/estado", async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const estadosValidos = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ success: false, message: "Estado inválido" });
        }

        await db.promise().query(
            "UPDATE pedidos SET estado = ? WHERE id_pedido = ?",
            [estado, id]
        );

        res.json({ success: true, message: "Estado actualizado" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al actualizar estado" });
    }
});



// RUTA PARA DESCRGAR EN PDF LOS PEDIDOS
app.get('/mis-pedidos/:id/factura', async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.session.id_usuario;

    // Traer el pedido de la BD
    const [rows] = await db.promise().query(
      `SELECT p.id_pedido, p.total, p.estado, p.fecha_creacion, p.libros,
              u.nombre AS nombre_cliente, u.correo AS correo_cliente
       FROM pedidos p
       LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
       WHERE p.id_pedido = ? AND p.id_usuario = ?`,
      [id, usuario_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const pedido = rows[0];
    const libros = typeof pedido.libros === 'string'
      ? JSON.parse(pedido.libros)
      : pedido.libros;

    // Crear el PDF
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura-pedido-${id}.pdf`);
    doc.pipe(res);

    // ===== ENCABEZADO =====
    doc.fontSize(20).font('Helvetica-Bold').text('Tienda de Libros', { align: 'center' });
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#6B21A8').text('BookVerse', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#000000').text('Factura de compra', { align: 'center' });    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // ===== DATOS DEL PEDIDO =====
    doc.fontSize(12).font('Helvetica-Bold').text('Datos del pedido');
    doc.font('Helvetica');
    doc.text(`Pedido #:     ${pedido.id_pedido}`);
    doc.text(`Cliente:      ${pedido.nombre_cliente || 'N/A'}`);
    doc.text(`Correo:       ${pedido.correo_cliente || 'N/A'}`);
    doc.text(`Fecha:        ${new Date(pedido.fecha_creacion).toLocaleDateString()}`);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // ===== TABLA DE LIBROS =====
    doc.font('Helvetica-Bold');
    doc.text('Título',          50,  doc.y, { width: 250 });
    doc.text('Cantidad',        300, doc.y - doc.currentLineHeight(), { width: 80,  align: 'center' });
    doc.text('Precio unit.',    380, doc.y - doc.currentLineHeight(), { width: 80,  align: 'right' });
    doc.text('Subtotal',        460, doc.y - doc.currentLineHeight(), { width: 80,  align: 'right' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica');
    libros.forEach(libro => {
      const precio    = Number(libro.precio_unitario || 0);
      const cantidad  = Number(libro.cantidad || 1);
      const subtotal  = precio * cantidad;
      const y         = doc.y;

      doc.text(libro.titulo || 'Sin título', 50,  y, { width: 250 });
      doc.text(String(cantidad),             300, y, { width: 80,  align: 'center' });
      doc.text(`$${precio.toFixed(2)}`,      380, y, { width: 80,  align: 'right' });
      doc.text(`$${subtotal.toFixed(2)}`,    460, y, { width: 80,  align: 'right' });
      doc.moveDown();
    });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // ===== TOTAL =====
    doc.font('Helvetica-Bold').fontSize(13);
    doc.text(`Total:  $${Number(pedido.total).toFixed(2)}`, { align: 'right' });

    doc.end();

  } catch (err) {
    console.error('Error generando factura:', err);
    res.status(500).json({ message: 'Error generando factura' });
  }
});


// ruta de descarga pdf del
app.get('/admin/pedidos/:id/factura', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.promise().query(
      `SELECT p.id_pedido, p.total, p.estado, p.fecha_creacion, p.libros,
              u.nombre AS nombre_cliente, u.correo AS correo_cliente
       FROM pedidos p
       LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
       WHERE p.id_pedido = ?`,
      [id]  // 👈 sin restricción de id_usuario
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const pedido = rows[0];
    const libros = typeof pedido.libros === 'string'
      ? JSON.parse(pedido.libros)
      : pedido.libros;

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura-pedido-${id}.pdf`);
    doc.pipe(res);

    // ENCABEZADO
    doc.fontSize(20).font('Helvetica-Bold').text('Tienda de Libros', { align: 'center' });
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#6B21A8').text('BookVerse', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#000000').text('Factura de compra', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // DATOS DEL PEDIDO
    doc.fontSize(12).font('Helvetica-Bold').text('Datos del pedido');
    doc.font('Helvetica');
    doc.text(`Pedido #:     ${pedido.id_pedido}`);
    doc.text(`Cliente:      ${pedido.nombre_cliente || 'N/A'}`);
    doc.text(`Correo:       ${pedido.correo_cliente || 'N/A'}`);
    doc.text(`Fecha:        ${new Date(pedido.fecha_creacion).toLocaleDateString()}`);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // TABLA DE LIBROS
    doc.font('Helvetica-Bold');
    doc.text('Título',       50,  doc.y, { width: 250 });
    doc.text('Cantidad',     300, doc.y - doc.currentLineHeight(), { width: 80,  align: 'center' });
    doc.text('Precio unit.', 380, doc.y - doc.currentLineHeight(), { width: 80,  align: 'right' });
    doc.text('Subtotal',     460, doc.y - doc.currentLineHeight(), { width: 80,  align: 'right' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica');
    libros.forEach(libro => {
      const precio   = Number(libro.precio_unitario || 0);
      const cantidad = Number(libro.cantidad || 1);
      const subtotal = precio * cantidad;
      const y        = doc.y;

      doc.text(libro.titulo || 'Sin título', 50,  y, { width: 250 });
      doc.text(String(cantidad),             300, y, { width: 80,  align: 'center' });
      doc.text(`$${precio.toFixed(2)}`,      380, y, { width: 80,  align: 'right' });
      doc.text(`$${subtotal.toFixed(2)}`,    460, y, { width: 80,  align: 'right' });
      doc.moveDown();
    });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    doc.font('Helvetica-Bold').fontSize(13);
    doc.text(`Total:  $${Number(pedido.total).toFixed(2)}`, { align: 'right' });

    doc.end();

  } catch (err) {
    console.error('Error generando factura admin:', err);
    res.status(500).json({ message: 'Error generando factura' });
  }
});