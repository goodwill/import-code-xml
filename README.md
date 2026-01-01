# Import Code XML

A CLI tool to import code files from an XML manifest with diff support, auto-skip identical files, and force-overwrite option. Perfect for importing generated code from AI assistants while preserving exact formatting.

## Features

- **Smart diff detection**: Automatically skips identical files
- **Visual diff display**: Shows differences before overwriting
- **Interactive prompts**: Choose to overwrite, skip, or view diff again
- **Force overwrite mode**: Bypass prompts for batch operations
- **Format preservation**: Maintains exact line breaks, tabs, and whitespace

## Installation

### Option 1: Install from local package

```bash
# Navigate to package directory
cd /path/to/import-code-xml

# Install globally
npm install -g .
```

### Option 2: Install from npm (if published)

```bash
npm install -g import-code-xml
```

After installation, the `import-code` command will be available globally.

## Usage

### Basic usage with prompts:

```bash
import-code -f import_code.xml
```

### Force overwrite all files:

```bash
import-code -f import_code.xml --force-overwrite
# or
import-code -f import_code.xml --fo
```

## XML File Format

The XML file should follow this structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item>
    <path>relative/or/absolute/path/to/file.extension</path>
    <content><![CDATA[
Your file content here
with exact formatting
including:
- Line breaks
- Tabs
- Indentation
- Special characters
]]></content>
  </item>
  
  <item>
    <path>another/file/path.js</path>
    <content><![CDATA[
function example() {
  return "Hello World";
}
]]></content>
  </item>
</root>
```

### Important Notes:
1. Use `<![CDATA[ ... ]]>` to preserve all formatting exactly
2. Each file is defined in an `<item>` block
3. `<path>` should be the destination file path
4. `<content>` contains the exact file content

## AI Assistant Prompt Template

When asking an AI chatbot (like Claude, ChatGPT, etc.) to generate code for import, use this prompt:

```
Please generate an XML file for code import with the following files. 
Use the exact format below with CDATA sections to preserve formatting:

<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item>
    <path>[FILE_PATH_1]</path>
    <content><![CDATA[
[EXACT_FILE_CONTENT_1]
]]></content>
  </item>
  
  <item>
    <path>[FILE_PATH_2]</path>
    <content><![CDATA[
[EXACT_FILE_CONTENT_2]
]]></content>
  </item>
</root>

Replace the bracketed placeholders with:
- [FILE_PATH_X]: The path where the file should be saved
- [EXACT_FILE_CONTENT_X]: The exact code with all formatting preserved

Files to include:
1. [Describe first file and its purpose]
2. [Describe second file and its purpose]
[Add more as needed]
```

### Example AI Prompt:

```
Please generate an XML file for code import with the following files. 
Use the exact format below with CDATA sections to preserve formatting:

<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item>
    <path>utils/helpers.js</path>
    <content><![CDATA[
[EXACT_FILE_CONTENT_1]
]]></content>
  </item>
  
  <item>
    <path>config/settings.json</path>
    <content><![CDATA[
[EXACT_FILE_CONTENT_2]
]]></content>
  </item>
</root>

Files to include:
1. utils/helpers.js: A JavaScript utility module with helper functions
2. config/settings.json: Configuration file with default settings
```

## Workflow Example

1. **Prepare XML**: Ask AI to generate code in the XML format
2. **Save XML**: Save the AI's response as `import_code.xml`
3. **Run import**: `import-code -f import_code.xml`
4. **Review diffs**: The tool will show differences and prompt for actions
5. **Manage conflicts**: Choose to overwrite (o), skip (s), or view diff again (d)

## Behavior

- **New files**: Automatically created
- **Identical files**: Automatically skipped with notification
- **Changed files**: Shows diff and prompts for action
- **Force overwrite**: All files overwritten without prompts
- **Missing directories**: Automatically created

## Dependencies

- `xml2js`: XML parsing library

## Troubleshooting

**Permission denied**: Ensure you have write permissions for target directories

**XML parsing errors**: Verify XML format and CDATA sections are properly closed

**diff command not found**: On Windows, install diffutils or use Git Bash/Cygwin

**Global command not found**: Try `npm link` in the package directory

## License

MIT