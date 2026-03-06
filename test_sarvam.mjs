import fetch from 'node-fetch';
import FormData from 'form-data';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.SARVAM_API_KEY;
console.log('Key from env:', key);
console.log('Key length:', key?.length);

// Also try with the key directly to rule out env issues
const directKey = 'sk_e7m6dxrd_CvVbrXUZrtqyp3HwAo7QESKK';
console.log('Direct key matches env:', key === directKey);

const fd = new FormData();
fd.append('model', 'saaras:v3');
fd.append('mode', 'translate');

// Use a tiny valid-ish audio buffer
const buf = Buffer.alloc(100);
fd.append('file', buf, { filename: 'test.wav', contentType: 'audio/wav' });

try {
    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
            'api-subscription-key': directKey,
            ...fd.getHeaders(),
        },
        body: fd,
    });
    console.log('Status:', response.status);
    const body = await response.text();
    console.log('Body:', body);
} catch (err) {
    console.error('Error:', err.message);
}
