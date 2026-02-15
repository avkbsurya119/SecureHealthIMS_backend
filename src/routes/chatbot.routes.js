/**
 * Chatbot Routes
 * POST /api/chatbot/message - Text chat
 * POST /api/chatbot/voice   - Voice (audio upload) → STT → chat
 */

import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware.js';
import { chatMessage, chatVoice, confirmBooking } from '../controllers/chatbot.controller.js';

const router = express.Router();

// Multer config — store audio in memory buffer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (req, file, cb) => {
        // Accept common audio types
        const allowed = [
            'audio/wav', 'audio/webm', 'audio/mp3', 'audio/mpeg',
            'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/aac',
            'audio/webm;codecs=opus',
        ];
        // Be permissive - allow anything starting with audio/
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'), false);
        }
    },
});

// Text chat endpoint
router.post('/message', authenticate, chatMessage);
router.post('/confirm-booking', authenticate, confirmBooking);

// Voice chat endpoint
router.post('/voice', authenticate, upload.single('audio'), chatVoice);

export default router;
