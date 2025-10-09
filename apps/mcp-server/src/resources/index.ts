/**
 * MCP Resources - Static documentation for ChatGPT reference
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load resource content from files
 */
function loadResourceContent(filename: string): string {
  const filePath = join(__dirname, filename);
  return readFileSync(filePath, 'utf-8');
}

/**
 * Available MCP resources
 */
export const resources = [
  {
    uri: 'audittoolbox://docs/tool-selection',
    name: 'Tool Selection Guide',
    description: 'Decision tree and comparison matrix for choosing the right tool',
    mimeType: 'text/markdown',
  },
];

/**
 * Get resource content by URI
 */
export function getResourceContent(uri: string): string {
  const resourceMap: Record<string, string> = {
    'audittoolbox://docs/tool-selection': 'tool-selection.md',
  };

  const filename = resourceMap[uri];
  if (!filename) {
    throw new Error(`Unknown resource: ${uri}`);
  }

  return loadResourceContent(filename);
}
