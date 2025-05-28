import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import path from "path";
import fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogsPath = path.join(__dirname, 'blogs.json');
const uploadsDir = 'uploads';

const app = express();
const port = process.env.PORT || 3000;

// Configuración inicial
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(blogsPath)) fs.writeFileSync(blogsPath, JSON.stringify([], null, 2));

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static(uploadsDir));

// Configuración de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Funciones auxiliares
function guardarBlog(titulo, descripcion, archivo) {
  let blogs = [];
  if (fs.existsSync(blogsPath)) {
    const data = fs.readFileSync(blogsPath, 'utf8');
    blogs = JSON.parse(data);
  }
  blogs.push({
    titulo,
    descripcion,
    archivo,
    fecha: new Date().toISOString()
  });
  fs.writeFileSync(blogsPath, JSON.stringify(blogs, null, 2));
}

// Rutas
app.get('/', (req, res) => {
  let blogs = [];
  if (fs.existsSync(blogsPath)) {
    const data = fs.readFileSync(blogsPath, 'utf8');
    blogs = JSON.parse(data);
  }
  res.render('index', { imagenes: blogs }); // Mantenemos el nombre 'imagenes' para compatibilidad con tu EJS
});

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ninguna imagen' });
  }
  res.json({
    message: 'Imagen subida con éxito',
    imageUrl: `/${req.file.filename}`,
    imageName: req.file.filename
  });
});

app.post('/submit', (req, res) => {
  const { title, description, imageName } = req.body;
  if (!title || !description || !imageName) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }
  guardarBlog(title, description, imageName);
  res.json({ message: 'Blog creado con éxito' });
});

app.get('/write', (req, res) => {
  res.render('write');
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});