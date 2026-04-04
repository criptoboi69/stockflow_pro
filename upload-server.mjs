import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const PORT = process.env.UPLOAD_SERVER_PORT || 4030;
const BUCKET_NAME = 'product-images';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

app.use(cors());
app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/upload-product-image', upload.single('image'), async (req, res) => {
  const startedAt = Date.now();
  const wantsHtml = String(req.headers.accept || '').includes('text/html') || req.query?.mode === 'form' || req.body?.mode === 'form';
  try {
    console.log('[upload-server] request received', {
      ip: req.ip,
      ua: req.headers['user-agent'],
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length']
    });

    if (!req.file) {
      console.log('[upload-server] no file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const productId = req.body?.productId || `temp_${Date.now()}`;
    console.log('[upload-server] file parsed', {
      productId,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    console.log('[upload-server] sharp start');
    const outputBuffer = await sharp(req.file.buffer, { failOn: 'none' })
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    console.log('[upload-server] sharp done', { outputSize: outputBuffer.length });

    const filePath = `products/${productId}_${Date.now()}.jpg`;
    console.log('[upload-server] supabase upload start', { filePath });
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, outputBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      });

    if (error) throw error;

    console.log('[upload-server] supabase upload done', { path: data?.path, ms: Date.now() - startedAt });
    const { data: publicData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    const publicUrl = publicData?.publicUrl;

    // If this is a real product UUID, append image directly on the product in DB.
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId)) {
      console.log('[upload-server] append image to product start', { productId });
      const { data: productRow, error: productFetchError } = await supabaseAdmin
        .from('products')
        .select('id,image_url,image_file_path,image_urls,image_file_paths')
        .eq('id', productId)
        .maybeSingle();

      if (productFetchError) throw productFetchError;
      if (!productRow) {
        throw new Error(`Product not found for upload persistence: ${productId}`);
      }

      const existingImageUrls = Array.isArray(productRow?.image_urls)
        ? productRow.image_urls
        : (productRow?.image_url ? [productRow.image_url] : []);
      const existingImageFilePaths = Array.isArray(productRow?.image_file_paths)
        ? productRow.image_file_paths
        : (productRow?.image_file_path ? [productRow.image_file_path] : []);

      const nextImageUrls = [...existingImageUrls, publicUrl]
        .filter(Boolean)
        .slice(0, 5);
      const nextImageFilePaths = [...existingImageFilePaths, filePath]
        .filter(Boolean)
        .slice(0, 5);

      const updatePayload = {
        image_url: nextImageUrls?.[0] || publicUrl,
        image_file_path: nextImageFilePaths?.[0] || filePath,
        image_urls: nextImageUrls,
        image_file_paths: nextImageFilePaths
      };

      console.log('[upload-server] append image to product payload', {
        productId,
        existingImageUrls: existingImageUrls.length,
        existingImageFilePaths: existingImageFilePaths.length,
        nextImageUrls: nextImageUrls.length,
        nextImageFilePaths: nextImageFilePaths.length
      });

      const { data: updatedProduct, error: updateError } = await supabaseAdmin
        .from('products')
        .update(updatePayload)
        .eq('id', productId)
        .select('id,image_url,image_file_path,image_urls,image_file_paths')
        .single();

      if (updateError) throw updateError;
      console.log('[upload-server] append image to product done', {
        productId,
        image_url: updatedProduct?.image_url,
        image_urls: Array.isArray(updatedProduct?.image_urls) ? updatedProduct.image_urls.length : 0
      });
    }

    if (wantsHtml) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(`<html><body><script>parent.postMessage({type:'stockflow-upload-result',ok:true,filePath:${JSON.stringify(data?.path || filePath)},publicUrl:${JSON.stringify(publicUrl)}}, '*');</script>OK</body></html>`);
      return;
    }

    res.json({ filePath: data?.path || filePath, publicUrl });
  } catch (error) {
    console.error('[upload-server] error', error);
    if (wantsHtml) {
      res.status(500).setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(`<html><body><script>parent.postMessage({type:'stockflow-upload-result',ok:false,error:${JSON.stringify(error?.message || 'Upload failed')}}, '*');</script>ERROR</body></html>`);
      return;
    }
    res.status(500).json({ error: error?.message || 'Upload failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[upload-server] listening on http://0.0.0.0:${PORT}`);
});
