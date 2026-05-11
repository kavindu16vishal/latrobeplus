import express from 'express';
import multer from 'multer';
import { authenticateToken, requireRole } from '../middleware/auth';
import { processExcel } from '../process_excel';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Setup Multer for Excel file uploads
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheetml') || file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are allowed!'));
    }
  }
});

// Admin Route to upload and process Excel file
router.post('/process-excel', authenticateToken, requireRole(['admin']), upload.single('dataset'), async (req, res): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded. Please upload a valid .xlsx file.' });
      return;
    }

    console.log(`Received file: ${req.file.path}`);
    
    // Call our parser service
    await processExcel(req.file.path);

    res.json({ 
      message: 'Dataset successfully imported, parsed, and processed!',
      filename: req.file.filename
    });
  } catch (error: any) {
    console.error('Upload processing error:', error);
    res.status(500).json({ message: 'Failed to process the dataset.', error: error.message });
  }
});

export default router;
