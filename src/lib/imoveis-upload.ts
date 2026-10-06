type Metadata = { name?: unknown; type?: unknown; size?: unknown };
type Result = { extension: string; error?: never } | { error: string; extension?: never };

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, readonly string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
};

export function parseImageMetadata(value: unknown): Result {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'Informe uma imagem válida.' };
  }

  const { name, type, size } = value as Metadata;
  if (typeof name !== 'string' || typeof type !== 'string') {
    return { error: 'Formato de imagem inválido.' };
  }
  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  if (!MIME_EXTENSIONS[type]?.includes(extension)) {
    return { error: 'Formato de imagem inválido. Use JPEG, PNG ou WebP.' };
  }
  if (typeof size !== 'number' || !Number.isInteger(size) || size < 1 || size > MAX_IMAGE_SIZE) {
    return { error: 'A imagem deve ter no máximo 5 MB.' };
  }

  return { extension };
}

export function imagePath(userId: string, extension: string, fileId: string): string {
  return `${userId}/${fileId}.${extension}`;
}

export function isPublicImovelImageUrl(value: string, projectUrl: string | undefined): boolean {
  if (!projectUrl) return false;
  try {
    const image = new URL(value);
    const project = new URL(projectUrl);
    const prefix = `${project.pathname.replace(/\/$/, '')}/storage/v1/object/public/imoveis_imagens/`;
    return image.protocol === 'https:'
      && image.origin === project.origin
      && image.pathname.startsWith(prefix)
      && image.pathname.length > prefix.length
      && !image.search
      && !image.hash;
  } catch {
    return false;
  }
}
