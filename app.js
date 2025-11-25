const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session'); // solo una vez

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




db.getConnection((err, connection) => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err);
  } else {
    console.log(" Conectado a la base de datos");
    connection.release(); // devolvemos la conexión al pool
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
  // .then(() => console.log('✅ Tabla `libros` verificada/creada'))
  // .catch(err => console.error('Error creando/verificando tabla libros:', err));

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
  // .then(() => console.log('✅ Tabla `usuario` verificada/creada'))
  .catch(err => console.error('Error creando/verificando tabla usuario:', err));

// Si la tabla ya existía con la columna `image` corta, intentar modificarla a MEDIUMTEXT.
// Esto permite almacenar data URLs/base64 largos sin fallar con ER_DATA_TOO_LONG.
db.promise().query("ALTER TABLE libros MODIFY COLUMN image MEDIUMTEXT")
  // .then(() => console.log('✅ Columna `image` en `libros` asegurada como MEDIUMTEXT'))
  .catch(err => {
    // Ignorar errores comunes (por ejemplo si la tabla no existe aún o la columna ya tiene el tipo correcto)
    if (err && err.code !== 'ER_NO_SUCH_TABLE' && err.errno !== 1146) {
      console.error('Error al alterar la columna image en libros:', err);
    }
  });

// Asegurar columna `genre` existe en la tabla `libros`
db.promise().query("ALTER TABLE libros ADD COLUMN genre VARCHAR(255) NULL")
  .then(() => console.log('✅ Columna `genre` añadida a `libros`'))
  .catch(err => {
    // Ignorar error si ya existe u otros errores no críticos
    if (err && err.code !== 'ER_DUP_FIELDNAME' && err.errno !== 1060) {
      // ER_DUP_FIELDNAME / errno 1060 means column exists in some MySQL versions
      // Ignore otherwise log
      // console.warn('No se pudo crear la columna genre (posible que ya exista):', err.message || err);
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

        res.json({ 
              success: true,
              message: 'Inicio de sesión exitoso',
              nombre: usuario.nombre,
              correo: usuario.correo,
              rol: usuario.rol,
              celular: usuario.celular || null,
              direccion: usuario.direccion || null,
              avatar: usuario.avatar || null
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
// Verificar si la columna `avatar` existe en la tabla `usuario`. Si no existe, crearla como MEDIUMTEXT.
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

// Asegurar columna `stock` existe en la tabla `libros` para llevar inventario
db.promise().query("ALTER TABLE libros ADD COLUMN stock INT DEFAULT 0")
  .then(() => console.log('✅ Columna `stock` añadida a `libros` (si no existía)'))
  .catch(err => {
    // Ignorar si ya existe u otros errores no críticos
    if (err && err.code !== 'ER_DUP_FIELDNAME' && err.errno !== 1060) {
      // console.warn('No se pudo crear la columna stock (posible que ya exista):', err.message || err);
    }
  });


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
    // Traer pedidos junto al nombre del usuario (cliente) para la vista de admin
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


// ==== RUTAS PARA LIBROS DESTACADOS ====
// Tabla sugerida en MySQL:
// CREATE TABLE featured_books (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   title VARCHAR(255) NOT NULL,
//   author VARCHAR(255),
//   price DECIMAL(10,2) DEFAULT 0,
//   image VARCHAR(512),
//   description TEXT,
//   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
// );

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
    const [result] = await db.promise().query('DELETE FROM libros WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Libro no encontrado' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error al eliminar libro destacado:', err);
    res.status(500).json({ success: false, message: 'Error al eliminar libro destacado' });
  }
});

// Actualizar libro destacado
app.put('/libros/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { title, author, genre, price, image, description, stock } = req.body;

    const [result] = await db.promise().query(
      'UPDATE libros SET title = ?, author = ?, genre = ?, price = ?, image = ?, description = ?, stock = ? WHERE id = ?',
      [title, author, genre || null, price || 0, image || null, description || null, (typeof stock === 'number' ? stock : (stock ? Number(stock) : null)), id]
    );

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
                u.fecha_creacion, COUNT(p.id_pedido) AS pedidos_count
         FROM usuario u
         LEFT JOIN pedidos p ON p.id_usuario = u.id_usuario
         WHERE u.rol = 'cliente'
         GROUP BY u.id_usuario, u.nombre, u.correo, u.direccion, u.celular, u.rol, u.fecha_creacion`
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
app.use((err, req, res, next) => {
  if (err) {
    if (err.type === 'entity.too.large' || err.status === 413) {
      console.warn('PayloadTooLarge error al procesar la petición:', err.message || err);
      return res.status(413).json({ success: false, error: 'PayloadTooLarge', message: 'El cuerpo de la petición es demasiado grande. Reduce el tamaño de la imagen antes de enviarla.' });
    }
  }
  next(err);
});
