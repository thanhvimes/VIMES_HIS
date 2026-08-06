import { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { requireEnv } from '../../config/env';

export class QmsUtilityController {
  // 1. ADMIN SECURITY
  static verifyPassword(req: Request, res: Response) {
    const { password } = req.body;
    const envPassword = requireEnv('ADMIN_PASSWORD');
    const supplied = Buffer.from(String(password || ''));
    const expected = Buffer.from(envPassword);
    if (supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected)) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Mật khẩu quản trị không đúng' });
    }
  }

  // 31. GOOGLE TTS PROXY WITH CACHE
  static async tts(req: Request, res: Response) {
    const text = req.query.text as string;
    if (!text) return res.status(400).send('Missing text');

    try {
      const TTS_CACHE_DIR = path.join(__dirname, '../../tts_cache');
      if (!fs.existsSync(TTS_CACHE_DIR)) {
        fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });
      }

      const hash = crypto.createHash('md5').update(text).digest('hex');
      const filePath = path.join(TTS_CACHE_DIR, `${hash}.mp3`);

      if (fs.existsSync(filePath)) {
        console.log(`[TTS Cache] Serving pre-saved file for: "${text}"`);
        res.setHeader('Content-Type', 'audio/mpeg');
        const stream = fs.createReadStream(filePath);
        return stream.pipe(res);
      }

      console.log(`[TTS Network] Loading from Google for: "${text}"`);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=${encodeURIComponent(text)}`;
      const response = await axios({
        url: url,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      fs.writeFileSync(filePath, response.data as any);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(response.data);
    } catch (error: any) {
      console.error('[TTS Error] Google TTS Connection Failed:', error.message);
      res.status(500).send('TTS failed');
    }
  }
}
