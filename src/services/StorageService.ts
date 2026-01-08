import { MAX_FILES_COUNT, UPLOAD_DIR } from '@config/storage';
import { AppError } from '@utils/AppError';
import fs from 'fs';
import path from 'path';
import { FileType } from 'types/FileType';

export interface ProcessedAttachment {
  url: string;
  name: string;
  fileType: FileType;
  size: number;
}

class StorageService {
  processUploadedFiles(files: Express.Multer.File[]): ProcessedAttachment[] {
    if (!files || files.length === 0) return [];

    return files.map((file) => ({
      url: `/${UPLOAD_DIR}/${file.filename}`,
      name: file.originalname,
      fileType: file.mimetype.startsWith('image')
        ? FileType.IMAGE
        : FileType.DOCUMENT,
      size: file.size,
    }));
  }

  validateFileLimit(currentCount: number, newCount: number): void {
    if (currentCount + newCount > MAX_FILES_COUNT) {
      throw new AppError(
        `Total file limit exceeded. Each event is allowed a maximum of ${MAX_FILES_COUNT} files.`,
        400,
      );
    }
  }

  sortAttachments(attachments: any[]): void {
    attachments.sort((a, b) => {
      if (a.fileType === FileType.IMAGE && b.fileType !== FileType.IMAGE)
        return -1;
      if (a.fileType !== FileType.IMAGE && b.fileType === FileType.IMAGE)
        return 1;
      return 0;
    });
  }

  async deleteFiles(fileIdentifiers: string[]): Promise<void> {
    const deletionPromises = fileIdentifiers.map((identifier) => {
      const fileName = path.basename(identifier);
      const absolutePath = path.join(process.cwd(), UPLOAD_DIR, fileName);

      return this.deleteFileByPath(absolutePath);
    });

    await Promise.all(deletionPromises);
  }

  private async deleteFileByPath(fullPath: string): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!fs.existsSync(fullPath)) return resolve();

      fs.unlink(fullPath, (err) => {
        if (err)
          console.error(`[Storage Cleanup] Error deleting: ${fullPath}`, err);
        resolve();
      });
    });
  }
}

export default new StorageService();
