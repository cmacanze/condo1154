import path from "path";
import fs from "fs/promises";

const MAX_SIZE_MB = 10;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

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
  file: File,
  folder: UploadFolder,
  fileName: string
): Promise<string> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const filePath = `${folder}/${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("comprovatives")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Erro Supabase: ${error.message}`);

  const { data } = supabase.storage.from("comprovatives").getPublicUrl(filePath);
  return data.publicUrl;
}

async function uploadToLocal(
  file: File,
  folder: UploadFolder,
  fileName: string
): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return `/uploads/${folder}/${fileName}`;
}

export async function uploadFile(
  file: File,
  folder: UploadFolder
): Promise<{ url: string } | { error: string }> {
  const validationError = validateFile(file);
  if (validationError) return { error: validationError };

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { error: "Extensão de ficheiro não permitida." };
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `${timestamp}_${safeName}`;

  try {
    const useSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    const url = useSupabase
      ? await uploadToSupabase(file, folder, fileName)
      : await uploadToLocal(file, folder, fileName);

    return { url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao guardar ficheiro.";
    return { error: msg };
  }
}
