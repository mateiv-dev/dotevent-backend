import { MAX_FILES_SIZE_MB, UPLOAD_DIR } from '@config/storage';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req: any, file, cb) => {
    if (!req._uploadState) {
      req._uploadState = {
        batchId: uuidv4(),
        imgCounter: 0,
        docCounter: 0,
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

    cb(
      null,
      `${typeLabel}-${req._uploadState.batchId}-${index
        .toString()
        .padStart(2, '0')}${ext}`,
    );
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|pptx/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('UNSUPORTED_FILE_FORMAT'));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * MAX_FILES_SIZE_MB },
});
