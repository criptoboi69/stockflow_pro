import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import multer from "multer";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "product-images";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }
  });

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAdmin = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

  return {
    build: {
      outDir: "build",
      chunkSizeWarningLimit: 2000,
    },
    plugins: [
      tsconfigPaths(),
      react(),
      {
        name: "product-image-upload-api",
        configureServer(server) {
          const createImageUploadMiddleware = ({ route, folder, idField, table }) => {
            server.middlewares.use(route, (req, res, next) => {
              if (req.method !== "POST") return next();
              upload.single("image")(req, res, async (err) => {
                try {
                  if (err) {
                    res.statusCode = 400;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({ error: err.message }));
                    return;
                  }

                  if (!supabaseAdmin) {
                    res.statusCode = 500;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({ error: "SUPABASE_SERVICE_ROLE_KEY missing" }));
                    return;
                  }

                  const file = req.file;
                  const recordId = req.body?.[idField] || `temp_${Date.now()}`;
                  if (!file) {
                    res.statusCode = 400;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({ error: "No file uploaded" }));
                    return;
                  }

                  const outputBuffer = await sharp(file.buffer, { failOn: 'none' })
                    .rotate()
                    .resize({ width: 1600, withoutEnlargement: true })
                    .jpeg({ quality: 82, mozjpeg: true })
                    .toBuffer();

                  const filePath = `${folder}/${recordId}_${Date.now()}.jpg`;
                  const { data, error } = await supabaseAdmin.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, outputBuffer, {
                      cacheControl: "3600",
                      upsert: false,
                      contentType: "image/jpeg"
                    });

                  if (error) throw error;

                  const { data: publicData } = supabaseAdmin.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(filePath);

                  const publicUrl = publicData?.publicUrl;

                  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(recordId)) {
                    const { data: row, error: fetchError } = await supabaseAdmin
                      .from(table)
                      .select('id,image_url,image_file_path,image_urls,image_file_paths')
                      .eq('id', recordId)
                      .maybeSingle();

                    if (fetchError) throw fetchError;
                    if (!row) throw new Error(`${table} record not found for upload persistence: ${recordId}`);

                    const existingImageUrls = Array.isArray(row?.image_urls)
                      ? row.image_urls
                      : (row?.image_url ? [row.image_url] : []);
                    const existingImageFilePaths = Array.isArray(row?.image_file_paths)
                      ? row.image_file_paths
                      : (row?.image_file_path ? [row.image_file_path] : []);

                    const nextImageUrls = [...existingImageUrls, publicUrl].filter(Boolean).slice(0, 5);
                    const nextImageFilePaths = [...existingImageFilePaths, filePath].filter(Boolean).slice(0, 5);

                    const { error: updateError } = await supabaseAdmin
                      .from(table)
                      .update({
                        image_url: nextImageUrls?.[0] || publicUrl,
                        image_file_path: nextImageFilePaths?.[0] || filePath,
                        image_urls: nextImageUrls,
                        image_file_paths: nextImageFilePaths
                      })
                      .eq('id', recordId);

                    if (updateError) throw updateError;
                  }

                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ filePath: data?.path || filePath, publicUrl }));
                } catch (error) {
                  res.statusCode = 500;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: error?.message || "Upload failed" }));
                }
              });
            });
          };

          createImageUploadMiddleware({ route: "/api/upload-product-image", folder: "products", idField: "productId", table: "products" });
          createImageUploadMiddleware({ route: "/api/upload-location-image", folder: "locations", idField: "locationId", table: "locations" });
        }
      }
    ],
    server: {
      port: "4028",
      host: "0.0.0.0",
      strictPort: true,
      allowedHosts: ['.amazonaws.com', '.builtwithrocket.new'],
      proxy: {
        '/api/upload-product-image': {
          target: 'http://127.0.0.1:4030',
          changeOrigin: false,
          secure: false
        },
        '/api/upload-location-image': {
          target: 'http://127.0.0.1:4030',
          changeOrigin: false,
          secure: false
        }
      }
    }
  };
});
