import { startPreviewServer } from '../../scripts/lib/preview-server.mjs';

export default async function globalSetup(): Promise<void> {
  await startPreviewServer();
}
