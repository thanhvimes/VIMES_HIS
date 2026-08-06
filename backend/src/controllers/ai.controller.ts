import { Request, Response } from 'express';

// Ensure Web Streams API (ReadableStream) exists on globalThis for Node.js < 18 compatibility with @google/genai
if (typeof (globalThis as any).ReadableStream === 'undefined') {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const streamWeb = require('node:stream/web');
        if (streamWeb) {
            if (streamWeb.ReadableStream) (globalThis as any).ReadableStream = streamWeb.ReadableStream;
            if (streamWeb.WritableStream) (globalThis as any).WritableStream = streamWeb.WritableStream;
            if (streamWeb.TransformStream) (globalThis as any).TransformStream = streamWeb.TransformStream;
        }
    } catch {
        // Ignore if node:stream/web is not available
    }
}

import { GoogleGenAI, Type } from '@google/genai';
import { requireEnv } from '../config/env';

export async function getClinicalSuggestions(req: Request, res: Response) {
    const { symptoms, notes, patient } = req.body || {};
    if (!patient || !Number.isFinite(Number(patient.age)) || typeof patient.gender !== 'string') {
        return res.status(400).json({ message: 'Patient age and gender are required' });
    }
    if (typeof symptoms !== 'string' || typeof notes !== 'string' || symptoms.length > 10_000 || notes.length > 20_000) {
        return res.status(400).json({ message: 'Clinical text is invalid or too long' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: requireEnv('GEMINI_API_KEY') });
        const prompt = `You are a clinical decision-support assistant for qualified clinicians. Do not provide a definitive diagnosis. Summarize this de-identified case and suggest differential diagnoses and next steps.\nAge: ${Number(patient.age)}\nGender: ${patient.gender}\nSymptoms: ${symptoms || 'Not provided'}\nClinical notes: ${notes || 'Not provided'}`;
        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        potentialDiagnoses: { type: Type.ARRAY, items: { type: Type.STRING } },
                        nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['summary', 'potentialDiagnoses', 'nextSteps']
                }
            }
        });
        return res.json(JSON.parse(response.text || '{}'));
    } catch (error) {
        console.error('AI suggestion request failed');
        return res.status(502).json({ message: 'AI suggestion service is unavailable' });
    }
}

export async function explainMedicalRecord(req: Request, res: Response) {
    const record = req.body?.record;
    if (!record || JSON.stringify(record).length > 30_000) return res.status(400).json({ message: 'Invalid medical record' });
    try {
        const ai = new GoogleGenAI({ apiKey: requireEnv('GEMINI_API_KEY') });
        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
            contents: `Explain this de-identified medical record in plain Vietnamese for the patient. Do not prescribe medication. Keep it under 150 words: ${JSON.stringify(record)}`
        });
        return res.json({ text: response.text || '' });
    } catch { return res.status(502).json({ message: 'AI service is unavailable' }); }
}

export async function generateFeedbackResponse(req: Request, res: Response) {
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || '').slice(0, 2_000);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: 'Invalid rating' });
    try {
        const ai = new GoogleGenAI({ apiKey: requireEnv('GEMINI_API_KEY') });
        const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || 'gemini-2.5-pro', contents: `Write a courteous Vietnamese hospital response under 50 words. Rating: ${rating}/5. Comment: ${comment}` });
        return res.json({ text: response.text || '' });
    } catch { return res.status(502).json({ message: 'AI service is unavailable' }); }
}

export async function generateHospitalVideo(req: Request, res: Response) {
    const prompt = String(req.body?.prompt || 'Professional modern hospital introduction video').slice(0, 2_000);
    try {
        const ai = new GoogleGenAI({ apiKey: requireEnv('GEMINI_API_KEY') });
        let operation = await ai.models.generateVideos({ model: process.env.GEMINI_VIDEO_MODEL || 'veo-3.1-fast-generate-preview', prompt, config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' } });
        while (!operation.done) { await new Promise(resolve => setTimeout(resolve, 10_000)); operation = await ai.operations.getVideosOperation({ operation }); }
        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!uri) return res.status(502).json({ message: 'Video provider returned no file' });
        const download = await fetch(`${uri}&key=${encodeURIComponent(requireEnv('GEMINI_API_KEY'))}`);
        if (!download.ok) return res.status(502).json({ message: 'Video download failed' });
        res.type('video/mp4');
        return res.send(Buffer.from(await download.arrayBuffer()));
    } catch { return res.status(502).json({ message: 'Video service is unavailable' }); }
}
