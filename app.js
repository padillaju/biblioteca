const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session'); // solo una vez

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para prevenir caché en respuestas de autenticación
function setNoCacheHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Prevenir caché en navegadores y proxies
  res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
}



const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173', // 👈 pon el puerto donde corre tu frontend
  credentials: true                // 👈 permite enviar cookies de sesión
}));




// Configurar sesiones
app.use(session({
  secret: 'miclave112233',  
  resave: false,
  saveUninitialized: false,   // 👈 cambia aquí
  cookie: {
    maxAge: 1000 * 60 * 60,   // 1 hora
    httpOnly: true,
    sameSite: 'lax'           // 👈 ayuda a mantener la cookie en peticiones entre localhost:3000 y 5173
  }
}));


// Conexión a MySQL
// const db = mysql.createConnection({
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',       
  password: '1234',   
  database: 'TiendaLibro'
});

// db.connect(err => {
//   if (err) {
//     console.error(' Error al conectar con MySQL:', err);
//     return;
//   }
//   console.log('Conectado a MySQL');
// });



db.getConnection((err, connection) => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err);
  } else {
    console.log("✅ Conectado a la base de datos");
    connection.release(); // devolvemos la conexión al pool
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
  // Prevenir caché en la página de login
  setNoCacheHeaders(res);
  res.sendFile(path.join(__dirname, 'Frontend', 'HTML', 'login.html'));
});

// Login
app.post('/login', (req, res) => {
  // Prevenir caché en respuestas de login
  setNoCacheHeaders(res);
  
  const { correo, contrasena } = req.body;

  db.query(
    'SELECT * FROM usuario WHERE correo = ? AND contrasena = ?',
    [correo, contrasena],
    (err, result) => {
      if (err) {
        setNoCacheHeaders(res);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
      }

      if (result.length > 0) {
        const usuario = result[0];

        // Guardar ID del usuario en sesión
        req.session.id_usuario = usuario.id_usuario;

        // Asegurar headers anti-caché antes de enviar respuesta exitosa
        setNoCacheHeaders(res);

        res.json({ 
          success: true, 
          message: 'Inicio de sesión exitoso',
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol
        });
      } else {
        setNoCacheHeaders(res);
        res.json({ success: false, message: 'Correo o contraseña incorrectos' });
      }
    }
  );
  });

// Logout - Cerrar sesión de forma segura
app.post('/logout', (req, res) => {
  const sessionId = req.sessionID;
  const userId = req.session.id_usuario;
  const userIp = req.ip || req.connection.remoteAddress;
  
  // Log de seguridad
  console.log(`[LOGOUT] Intento de cierre de sesión - Usuario ID: ${userId}, Sesión ID: ${sessionId}, IP: ${userIp}, Timestamp: ${new Date().toISOString()}`);
  
  // Prevenir caché en todas las respuestas de logout
  setNoCacheHeaders(res);
  
  // Verificar que existe una sesión
  if (!req.session.id_usuario) {
    console.warn(`[LOGOUT] Intento de cerrar sesión sin sesión activa - IP: ${userIp}`);
    return res.status(401).json({ 
      success: false, 
      message: 'No hay sesión activa para cerrar' 
    });
  }
  
  // Destruir la sesión de forma segura
  req.session.destroy((err) => {
    if (err) {
      console.error(`[LOGOUT ERROR] Error al destruir sesión - Usuario ID: ${userId}, Error: ${err.message}`);
      setNoCacheHeaders(res);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al cerrar sesión' 
      });
    }
    
    // Limpiar todas las cookies relacionadas con la sesión
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Solo en producción con HTTPS
      sameSite: 'lax',
      maxAge: 0 // Expirar inmediatamente
    };
    
    // Limpiar cookie de sesión con diferentes nombres posibles
    res.clearCookie('connect.sid', cookieOptions);
    res.clearCookie('sessionId', cookieOptions);
    res.clearCookie('session', cookieOptions);
    
    // Limpiar cualquier cookie relacionada
    if (req.headers.cookie) {
      req.headers.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (name.includes('session') || name.includes('sid')) {
          res.clearCookie(name, cookieOptions);
        }
      });
    }
    
    // Log de éxito
    console.log(`[LOGOUT SUCCESS] Sesión cerrada correctamente - Usuario ID: ${userId}, Sesión ID: ${sessionId}, IP: ${userIp}`);
    
    // Headers de seguridad y anti-caché estrictos
    setNoCacheHeaders(res);
    // Header adicional para limpiar datos del sitio (solo en navegadores compatibles)
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage", "executionContexts"');
    
    res.json({ 
      success: true, 
      message: 'Sesión cerrada correctamente',
      timestamp: new Date().toISOString()
    });
  });
});

// Verificar sesión
app.get('/check-session', (req, res) => {
  // Prevenir caché en verificaciones de sesión
  setNoCacheHeaders(res);
  
  if (req.session.id_usuario) {
    res.json({ 
      success: true, 
      isAuthenticated: true, 
      id_usuario: req.session.id_usuario 
    });
  } else {
    res.json({ 
      success: false, 
      isAuthenticated: false 
    });
  }
  });


// agregar al carrito
app.post("/carrito/agregar", async (req, res) => {
  try {
    const { libro_id_api, titulo, cantidad, precio_unitario, imagen } = req.body;
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

// Obtener solo clientes
  app.get("/cliente", async (req, res) => {
    try {
      const [rows] = await db.promise().query(
        "SELECT id_usuario, nombre, correo, direccion, celular FROM usuario WHERE rol = 'cliente'"
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al obtener clientes" });
    }
  });

  // Eliminar un usuario por ID
app.delete('/usuario/:id', (req, res) => {
    const id = req.params.id;

    const sql = 'DELETE FROM usuario WHERE id_usuario = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar usuario:', err);
            return res.status(500).json({ success: false, message: 'Error al eliminar usuario' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        res.json({ success: true, message: 'Usuario eliminado correctamente' });
    });
});


  

// Página de bienvenida
app.get('/bienvenido', (req, res) => {
  res.send("<h1>Bienvenido a la Biblioteca </h1>");
});
