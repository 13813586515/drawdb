import JSZip from "jszip";
import { saveAs } from "file-saver";
import { generateHTML } from "./htmlGenerator";
import { generatePython } from "./pythonGenerator";
import { generateJSON } from "./jsonGenerator";

export async function generatePrototype({
  prototypeName,
  tables,
  onProgress,
}) {
  const zip = new JSZip();
  const prototypeFolder = zip.folder(prototypeName);

  const totalSteps = tables.length * 3;
  let currentStep = 0;

  for (const table of tables) {
    const tableFolder = prototypeFolder.folder(table.name);

    currentStep++;
    onProgress?.(Math.round((currentStep / totalSteps) * 100), `Generating HTML for ${table.name}...`);
    const htmlContent = generateHTML(table, tables);
    tableFolder.file(`${table.name}.html`, htmlContent);

    currentStep++;
    onProgress?.(Math.round((currentStep / totalSteps) * 100), `Generating Python API for ${table.name}...`);
    const pythonContent = generatePython(table, tables);
    tableFolder.file(`${table.name}.py`, pythonContent);

    currentStep++;
    onProgress?.(Math.round((currentStep / totalSteps) * 100), `Generating JSON data for ${table.name}...`);
    const jsonContent = generateJSON(table);
    tableFolder.file(`${table.name}.json`, jsonContent);
  }

  const readmeContent = generateReadme(prototypeName, tables);
  prototypeFolder.file("README.md", readmeContent);

  const requirementsContent = generateRequirements();
  prototypeFolder.file("requirements.txt", requirementsContent);

  onProgress?.(95, "Packaging files...");

  const content = await zip.generateAsync({ type: "blob" });
  
  onProgress?.(100, "Complete!");
  
  return {
    blob: content,
    filename: `${prototypeName}.zip`,
  };
}

export function downloadPrototype(blob, filename) {
  saveAs(blob, filename);
}

function generateReadme(prototypeName, tables) {
  return `# ${prototypeName} - Prototype

## Overview
This is an auto-generated prototype for your database design.

## Tables Included
${tables.map((t) => `- ${t.name} (${t.fields.length} fields)`).join("\n")}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

2. For each table, navigate to its folder and run:
   \`\`\`bash
   cd <table_name>
   python <table_name>.py
   \`\`\`

3. Open the HTML file in your browser to use the CRUD interface.

## Structure
\`\`\`
${prototypeName}/
├── README.md
├── requirements.txt
${tables.map((t) => `├── ${t.name}/
│   ├── ${t.name}.html
│   ├── ${t.name}.py
│   └── ${t.name}.json`).join("\n")}
\`\`\`

## Note
This is a prototype for verification purposes only. 
Each table runs as an independent service on a different port.
`;
}

function generateRequirements() {
  return `flask>=2.0.0
flask-cors>=3.0.0
`;
}
