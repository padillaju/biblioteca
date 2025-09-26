const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos desde Frontend
// app.use(express.static(path.join(__dirname, '../Frontend')));

// Conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',       
  password: 'root',   
  database: 'TiendaLibro'
});

db.connect(err => {
  if (err) {
    console.error(' Error al conectar con MySQL:', err);
    return;
  }
  console.log('✅ Conectado a MySQL');
});




// Iniciar servidor
app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
});

// Ruta principal → carga el formulario
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
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
      }

        if (result.length > 0) {
            const usuario = result[0];
            res.json({ 
                success: true, 
                message: 'Inicio de sesión exitoso',
                nombre: usuario.nombre,
                correo: usuario.correo
            });
        } else {
            res.json({ success: false, message: 'Correo o contraseña incorrectos' });
        }
            }
          );
        });

// Página de bienvenida
app.get('/bienvenido', (req, res) => {
  res.send("<h1>Bienvenido a la Biblioteca </h1>");
});


