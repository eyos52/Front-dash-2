import { supabase } from '../supabase';

/**
 * Upload a file to Supabase Storage
 * @param bucket - The storage bucket name
 * @param file - The file to upload
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(bucket: string, file: File): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) throw error;

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param fileName - The name of the file to delete
 */
export async function deleteFile(bucket: string, fileName: string) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([fileName]);

  if (error) throw error;
}

/**
 * Get a public URL for a file in Supabase Storage
 * @param bucket - The storage bucket name
 * @param fileName - The name of the file
 * @returns Public URL
 */
export function getPublicUrl(bucket: string, fileName: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
}

