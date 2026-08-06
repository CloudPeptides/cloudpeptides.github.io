import { stopPreviewServer } from '../../scripts/lib/preview-server.mjs';

export default function globalTeardown(): void {
  stopPreviewServer();
}
