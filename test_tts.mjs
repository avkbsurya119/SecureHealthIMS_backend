import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ override: true });

async function testTTS() {
    const payload = {
        inputs: ["This is a test speech synthesis"],
        target_language_code: "en-IN",
        speaker: "tanya",
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: "bulbul:v3"
    };

    try {
        const res = await fetch('https://api.sarvam.ai/text-to-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-subscription-key': process.env.SARVAM_API_KEY
            },
            body: JSON.stringify(payload)
        });

        console.log('Status:', res.status);
        const text = await res.text();
        fs.writeFileSync('tts_result.txt', text.substring(0, 500));
        console.log('Status wrote prefix to tts_result.txt');
    } catch (e) {
        console.error('Error:', e);
    }
}

testTTS();
