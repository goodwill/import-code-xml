#!/usr/bin/env node

// import-code-xml - Global CLI tool
// Preserves exact formatting, line breaks, tabs
// Auto-diff + auto-skip identical + prompt on changes
// --force-overwrite to overwrite all without prompts

const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const { Parser } = require('xml2js');

const parser = new Parser({
  explicitArray: false,
  trim: false,
  normalize: false,
  normalizeTags: false,
  cdataProp: 'content'
});

function parseArgs(args) {
  const options = {};
  let i = 2;
  while (i < args.length) {
    if (args[i].startsWith('-')) {
      let key = args[i].replace(/^--?/, '');
      i++;
      if (i < args.length && !args[i].startsWith('-')) {
        options[key] = args[i];
        i++;
      } else {
        options[key] = true;
      }
    } else {
      i++;
    }
  }
  return options;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

function contentsIdentical(existingPath, newContent) {
  try {
    const existing = fs.readFileSync(existingPath, 'utf8');
    return existing === newContent;
  } catch (err) {
    return false;
  }
}

function showDiff(existingPath, newContent) {
  try {
    const tempFile = path.join(os.tmpdir(), `import_diff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    fs.writeFileSync(tempFile, newContent);

    const diffOutput = execSync(`diff -u "${existingPath}" "${tempFile}"`, { encoding: 'utf8' });

    console.log('\n--- DIFFERENCES FOUND ---\n');
    console.log(diffOutput || 'No visible differences.');
    console.log('--- END DIFF ---\n');

    fs.unlinkSync(tempFile);
  } catch (err) {
    console.log('\n--- DIFF UNAVAILABLE (preview) ---\n');
    const existing = fs.readFileSync(existingPath, 'utf8');
    console.log('Existing file content:\n', existing);
    console.log('\n--- vs ---\n');
    console.log('Proposed content:\n', newContent);
    console.log('\n--- END PREVIEW ---\n');
  }
}

async function handleExistingFile(path, content, forceOverwrite) {
  if (forceOverwrite) {
    return 'overwrite';
  }

  if (contentsIdentical(path, content)) {
    console.log(`No differences found for ${path}, skipping\n`);
    return 'skip';
  }

  showDiff(path, content);

  while (true) {
    const answer = await prompt(`Changes detected in "${path}". (o)verwrite, (s)kip, (d)iff again? `);
    const choice = answer.toLowerCase();

    if (choice === 'o' || choice === 'overwrite') {
      return 'overwrite';
    } else if (choice === 's' || choice === 'skip') {
      return 'skip';
    } else if (choice === 'd' || choice === 'diff') {
      showDiff(path, content);
    } else {
      console.log('Invalid choice. Please enter o, s, or d.');
    }
  }
}

async function main() {
  const options = parseArgs(process.argv);

  if (!options.f) {
    console.error('Usage: import-code -f <import_code.xml> [--force-overwrite]');
    console.error('Example: import-code -f import_code.xml --force-overwrite');
    process.exit(1);
  }

  const forceOverwrite = !!options['force-overwrite'] || !!options.fo;

  if (forceOverwrite) {
    console.log('Force overwrite enabled - all files will be overwritten without prompting.\n');
  }

  const xmlFile = options.f.trim();

  if (!fs.existsSync(xmlFile)) {
    console.error(`XML file not found: ${xmlFile}`);
    process.exit(1);
  }

  console.log(`Loading XML file: ${xmlFile}\n`);

  const xml = fs.readFileSync(xmlFile, 'utf8');

  parser.parseString(xml, async (err, result) => {
    if (err) {
      console.error('Failed to parse XML:', err.message);
      process.exit(1);
    }

    if (!result.root || !result.root.item) {
      console.error('Invalid XML structure: missing <root><item>...</item></root>');
      process.exit(1);
    }

    let items = result.root.item;
    if (!Array.isArray(items)) {
      items = [items];
    }

    console.log(`Found ${items.length} file(s) to process.\n`);

    let processed = 0;
    let created = 0;
    let overwritten = 0;
    let skipped = 0;

    for (const item of items) {
      const filePath = (item.path || '').toString().trim();
      const rawContent = item.content || '';

      if (!filePath) {
        console.warn('Skipping item with empty path');
        continue;
      }

      const content = typeof rawContent === 'string' ? rawContent : '';

      let action = 'create';
      if (fs.existsSync(filePath)) {
        action = await handleExistingFile(filePath, content, forceOverwrite);
      }

      if (action === 'create' || action === 'overwrite') {
        const dir = filePath.includes('/') ? path.dirname(filePath) : '.';
        fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(filePath, content, { encoding: 'utf8' });

        if (action === 'create') {
          console.log(`✓ Created: ${filePath}\n`);
          created++;
        } else {
          console.log(`✓ Overwritten: ${filePath}\n`);
          overwritten++;
        }
      } else if (action === 'skip') {
        skipped++;
      }

      processed++;
    }

    console.log('=====================================');
    console.log(`Import complete!`);
    console.log(`Processed: ${processed}`);
    console.log(`Created: ${created}, Overwritten: ${overwritten}, Skipped: ${skipped}`);
    console.log('=====================================');

    rl.close();
  });
}

main().catch(err => {
  console.error('Unexpected error:', err.message || err);
  process.exit(1);
});