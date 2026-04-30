import { auth } from "@/lib/auth";
import { uploadFile, UploadFolder } from "@/lib/storage";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_FOLDERS: UploadFolder[] = ["payments", "expenses", "salaries"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "resident") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = formData.get("folder") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Nenhum ficheiro enviado." }, { status: 400 });
  }

  if (!folder || !ALLOWED_FOLDERS.includes(folder as UploadFolder)) {
    return NextResponse.json({ error: "Pasta inválida." }, { status: 400 });
  }

  const result = await uploadFile(file, folder as UploadFolder);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ url: result.url });
}
