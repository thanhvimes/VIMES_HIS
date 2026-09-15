import crypto from 'node:crypto';
export type PackageManifest = { format: string; templateCode: string; version: number; contractCode?: string; files: Record<string, string>; signature?: string };
export function canonicalManifest(manifest: PackageManifest): string { const { signature, ...unsigned } = manifest; return JSON.stringify(unsigned, Object.keys(unsigned).sort()); }
export function verifyPackageSignature(manifest: PackageManifest, publicKey: string): boolean { if (!manifest.signature) return false; try { const verify = crypto.createVerify('RSA-SHA256'); verify.update(canonicalManifest(manifest)); verify.end(); return verify.verify(publicKey, manifest.signature, 'base64'); } catch { return false; } }
export function validatePackageManifest(manifest: unknown, artifacts: Record<string, Buffer>): { valid: boolean; errors: string[] } {
  const errors: string[] = []; const value = manifest as Partial<PackageManifest>;
  if (!value || value.format !== 'VIMES_TEMPLATE_PACKAGE_V1') errors.push('Unsupported package format');
  if (typeof value.templateCode !== 'string' || !/^[A-Z0-9_]+$/.test(value.templateCode)) errors.push('Invalid templateCode');
  if (!Number.isInteger(value.version) || (value.version as number) < 1) errors.push('Invalid version');
  if (!value.files || typeof value.files !== 'object') errors.push('files is required');
  for (const [name, expected] of Object.entries(value.files || {})) { if (name.includes('..') || name.startsWith('/') || !artifacts[name]) errors.push(`Invalid artifact ${name}`); else if (crypto.createHash('sha256').update(artifacts[name]).digest('hex') !== expected) errors.push(`Checksum mismatch ${name}`); }
  return { valid: errors.length === 0, errors };
}
