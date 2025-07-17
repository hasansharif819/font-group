const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/fonts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.ttf') {
      return cb(new Error('Only .ttf files are allowed'));
    }
    cb(null, true);
  }
});

// In-memory database for font groups
let fontGroups = [];
let fonts = [];

// API Endpoints

// Upload font
app.post('/api/fonts', upload.single('font'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const font = {
    id: Date.now().toString(),
    name: req.file.originalname.replace('.ttf', ''),
    path: `/uploads/fonts/${req.file.filename}`,
    createdAt: new Date().toISOString()
  };

  fonts.push(font);
  res.status(201).json(font);
});

// Get all fonts
app.get('/api/fonts', (req, res) => {
  res.json(fonts);
});

// Create font group
app.post('/api/font-groups', (req, res) => {
  const { name, fonts: groupFonts } = req.body;
  
  if (!name || !groupFonts || groupFonts.length < 2) {
    return res.status(400).json({ error: 'Group name and at least 2 fonts are required' });
  }

  const fontGroup = {
    id: Date.now().toString(),
    name,
    fonts: groupFonts,
    createdAt: new Date().toISOString()
  };

  fontGroups.push(fontGroup);
  res.status(201).json(fontGroup);
});

// Get all font groups
app.get('/api/font-groups', (req, res) => {
  res.json(fontGroups);
});

// Update font group
app.put('/api/font-groups/:id', (req, res) => {
  const { id } = req.params;
  const { name, fonts: groupFonts } = req.body;
  
  if (!name || !groupFonts || groupFonts.length < 2) {
    return res.status(400).json({ error: 'Group name and at least 2 fonts are required' });
  }

  const index = fontGroups.findIndex(group => group.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Font group not found' });
  }

  fontGroups[index] = { ...fontGroups[index], name, fonts: groupFonts };
  res.json(fontGroups[index]);
});

// Delete font group
app.delete('/api/font-groups/:id', (req, res) => {
  const { id } = req.params;
  fontGroups = fontGroups.filter(group => group.id !== id);
  res.status(204).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});