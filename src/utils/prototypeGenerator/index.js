import JSZip from "jszip";
import { saveAs } from "file-saver";
import { generateHTML } from "./htmlGenerator";
import { generatePython } from "./pythonGenerator";
import { generateJSON } from "./jsonGenerator";
import { getReadmeTranslations } from "./translations";

export async function generatePrototype({
  prototypeName,
  tables,
  language = "zh",
  onProgress,
}) {
  const zip = new JSZip();
  const prototypeFolder = zip.folder(prototypeName);
  const t = getReadmeTranslations(language);

  const totalSteps = tables.length * 3;
  let currentStep = 0;

  for (const table of tables) {
    const tableFolder = prototypeFolder.folder(table.name);

    currentStep++;
    onProgress?.(Math.round((currentStep / totalSteps) * 100), `Generating HTML for ${table.name}...`);
    const htmlContent = generateHTML(table, tables, language);
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

  const readmeContent = generateReadme(prototypeName, tables, t);
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

function generateReadme(prototypeName, tables, t) {
  return `# ${prototypeName}${t.title}

## ${t.overview}
${t.overviewDesc}

## ${t.tablesIncluded}
${tables.map((t) => `- ${t.name} (${t.fields.length} fields)`).join("\n")}

## ${t.gettingStarted}

${t.step1}
\`\`\`bash
pip install -r requirements.txt
\`\`\`

${t.step2}
\`\`\`bash
cd <table_name>
python <table_name>.py
\`\`\`

${t.step3}

## ${t.structure}
\`\`\`
${prototypeName}/
├── README.md
├── requirements.txt
${tables.map((t) => `├── ${t.name}/
│   ├── ${t.name}.html
│   ├── ${t.name}.py
│   └── ${t.name}.json`).join("\n")}
\`\`\`

## ${t.note}
${t.noteDesc}
`;
}

function generateRequirements() {
  return `flask>=2.0.0
flask-cors>=3.0.0
`;
}
