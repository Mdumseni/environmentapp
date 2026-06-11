const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// MYSQL
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
});
db.connect((err) => {

  if (err) {
    console.log(err);
  } else {
    console.log('Connected to MySQL');
  }
});

// STORAGE
const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },

  filename: (req, file, cb) => {

    cb(
      null,
      Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

// CREATE REPORT
app.post(
  '/reports',
  upload.single('image'),
  (req, res) => {

    const {
      full_name,
      region,
      waste_type,
      location,
    } = req.body;

    const image = req.file ? req.file.filename : null;

    const sql = `
      INSERT INTO reports
      (
        full_name,
        region,
        waste_type,
        location,
        image
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        full_name,
        region,
        waste_type,
        location,
        image,
      ],
      (err, result) => {

        if (err) {
          console.log(err);

          return res.status(500).json({
            message: 'Database error',
          });
        }

        res.json({
          message: 'Report submitted successfully',
        });
      }
    );
  }
);

// GET REPORTS
app.get('/reports', (req, res) => {

  const sql = `
    SELECT *
    FROM reports
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {

    if (err) {
      console.log(err);

      return res.status(500).json({
        message: 'Database error',
      });
    }

    res.json(results);
  });
});

// UPDATE STATUS
app.put('/reports/:id', (req, res) => {

  const { id } = req.params;
  const { status } = req.body;

  const sql = `
    UPDATE reports
    SET status = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [status, id],
    (err, result) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          message: 'Database error',
        });
      }

      res.json({
        message: 'Status updated',
      });
    }
  );
});
//delete report
app.delete('/reports/:id', (req, res) => {

  const { id } = req.params;

  const sql = `
    DELETE FROM reports
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {

    if (err) {

      console.log(err);

      return res.status(500).json({
        message: 'Database error',
      });
    }

    res.json({
      message: 'Report deleted',
    });
  });
});
app.get('/', (req, res) => {
  res.send('API is running');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
