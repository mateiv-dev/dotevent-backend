import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const uploadDir = 'uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: any, file, cb) => {
    if (!req._uploadState) {
      req._uploadState = {
        batchId: uuidv4(),
        imgCounter: 0,
        docCounter: 0
      };
    }

    const isImage = file.mimetype.startsWith('image');
    let index = 0;
    let typeLabel = '';

    if (isImage) {
      req._uploadState.imgCounter++;
      index = req._uploadState.imgCounter;
      typeLabel = 'image';
    } else {
      req._uploadState.docCounter++;
      index = req._uploadState.docCounter;
      typeLabel = 'doc';
    }

    const ext = path.extname(file.originalname).toLowerCase();

    cb(null, `${typeLabel}-${req._uploadState.batchId}-${index}${ext}`);
  }
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  else {
    cb(new Error('Only images and documents are allowed!'));
  }
};

export const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 }
});
