/**
 * MCP Prompts - Guide ChatGPT on how to use each tool effectively
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load prompt content from markdown files
 */
function loadPromptContent(filename: string): string {
  const filePath = join(__dirname, filename);
  return readFileSync(filePath, 'utf-8');
}

/**
 * Available MCP prompts
 */
export const prompts = [
  {
    name: 'swimlanes_guide',
    description: 'Guide for creating process flow diagrams with swim lanes',
    arguments: [
      {
        name: 'processType',
        description: 'Optional: Type of process (sequential, parallel, decision-tree, cross-functional)',
        required: false,
      },
    ],
  },
  {
    name: 'needle_finder_guide',
    description: 'Guide for detecting anomalies and outliers in tabular data',
    arguments: [
      {
        name: 'dataType',
        description: 'Optional: Type of data (financial, logs, transactions, time-series)',
        required: false,
      },
    ],
  },
  {
    name: 'tickntie_guide',
    description: 'Guide for linking supporting documents to spreadsheet cells',
    arguments: [
      {
        name: 'auditType',
        description: 'Optional: Type of audit (financial-audit, compliance, inventory, general)',
        required: false,
      },
    ],
  },
  {
    name: 'scheduler_guide',
    description: 'Guide for creating team schedules with constraints',
    arguments: [
      {
        name: 'scheduleType',
        description: 'Optional: Type of schedule (shifts, meetings, rotations, project-timeline)',
        required: false,
      },
    ],
  },
  {
    name: 'auditverse_guide',
    description: 'Guide for 3D visualization of relationships and hierarchies',
    arguments: [
      {
        name: 'graphType',
        description: 'Optional: Type of graph (organizational, network, dependency, knowledge-graph)',
        required: false,
      },
    ],
  },
];

/**
 * Get prompt content by name
 */
export function getPromptContent(name: string, args?: Record<string, string>): string {
  const promptMap: Record<string, string> = {
    swimlanes_guide: 'swimlanes-guide.md',
    needle_finder_guide: 'needle-finder-guide.md',
    tickntie_guide: 'tickntie-guide.md',
    scheduler_guide: 'scheduler-guide.md',
    auditverse_guide: 'auditverse-guide.md',
  };

  const filename = promptMap[name];
  if (!filename) {
    throw new Error(`Unknown prompt: ${name}`);
  }

  let content = loadPromptContent(filename);

  // Customize content based on arguments if provided
  if (args?.processType) {
    content += `\n\n---\n**Requested Process Type:** ${args.processType}\n`;
  }
  if (args?.dataType) {
    content += `\n\n---\n**Requested Data Type:** ${args.dataType}\n`;
  }
  if (args?.auditType) {
    content += `\n\n---\n**Requested Audit Type:** ${args.auditType}\n`;
  }
  if (args?.scheduleType) {
    content += `\n\n---\n**Requested Schedule Type:** ${args.scheduleType}\n`;
  }
  if (args?.graphType) {
    content += `\n\n---\n**Requested Graph Type:** ${args.graphType}\n`;
  }

  return content;
}
