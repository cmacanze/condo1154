import path from "path";
import fs from "fs/promises";

const MAX_SIZE_MB = 10;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export type UploadFolder = "payments" | "expenses" | "salaries";

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Tipo de ficheiro não permitido. Use: JPG, PNG ou PDF.`;
  }
  if (file.size > MAX_BYTES) {
    return `Ficheiro demasiado grande. Máximo ${MAX_SIZE_MB} MB.`;
  }
  return null;
}

async function uploadToSupabase(
  buffer: Buffer,
  contentType: string,
  folder: UploadFolder,
  fileName: string
): Promise<string> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const filePath = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from("comprovatives")
    .upload(filePath, buffer, { contentType, upsert: false });

  if (error) throw new Error(`Erro Supabase: ${error.message}`);

  const { data } = supabase.storage.from("comprovatives").getPublicUrl(filePath);
  return data.publicUrl;
}

async function uploadToLocal(
  buffer: Buffer,
  folder: UploadFolder,
  fileName: string
): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, fileName), buffer);
  return `/uploads/${folder}/${fileName}`;
}

export async function uploadFile(
  file: File,
  folder: UploadFolder
): Promise<{ url: string } | { error: string }> {
  const validationError = validateFile(file);
  if (validationError) return { error: validationError };

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `${timestamp}_${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const useSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    const url = useSupabase
      ? await uploadToSupabase(buffer, file.type, folder, fileName)
      : await uploadToLocal(buffer, folder, fileName);

    return { url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao guardar ficheiro.";
    return { error: msg };
  }
}
