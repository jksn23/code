import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadRoot = process.env.UPLOAD_DIR || 'uploads';
const publicUploadRoot = 'uploads';

const getUploadTarget = (subdir) => ({
  diskDir: path.join(uploadRoot, subdir),
  publicDir: path.posix.join(publicUploadRoot, subdir),
});

export const getUploadedFilePath = (file) => file?.publicPath || file?.path?.replace(/\\/g, '/') || null;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subdir = 'umum';
    
    if (file.fieldname === 'ktp_file' || file.fieldname === 'npwp_file') {
      subdir = 'penjual';
    } else if (file.fieldname === 'dokumen_aset') {
      subdir = 'aset';
    } else if (file.fieldname === 'bukti_bayar') {
      subdir = 'pembayaran';
    }

    const { diskDir, publicDir } = getUploadTarget(subdir);
    file.publicDir = publicDir;
    
    if (!fs.existsSync(diskDir)){
      fs.mkdirSync(diskDir, { recursive: true });
    }
    cb(null, diskDir);
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    file.publicPath = path.posix.join(file.publicDir || publicUploadRoot, filename);
    cb(null, filename);
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
