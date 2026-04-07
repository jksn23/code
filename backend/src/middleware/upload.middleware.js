import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = 'uploads/umum/';
    
    if (file.fieldname === 'ktp_file' || file.fieldname === 'npwp_file') {
      dir = 'uploads/penjual/';
    } else if (file.fieldname === 'dokumen_aset') {
      dir = 'uploads/aset/';
    } else if (file.fieldname === 'bukti_bayar') {
      dir = 'uploads/pembayaran/';
    }
    
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowed.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung! Hanya diperbolehkan: jpeg, jpg, png, pdf'));
  }
};

export const uploadFiles = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: fileFilter
});
