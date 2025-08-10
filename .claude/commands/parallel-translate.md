# Parallel Translate Command

Translates specified markdown files to English and Japanese in parallel using the markdown-translator agent.

## Usage

```
/parallel-translate <markdown-file-path>
```

## Example

```
/parallel-translate source/_posts/my-blog-post.md
```

This will:
1. Translate the specified markdown file to English and save it in `source/_drafts/en/`
2. Translate the specified markdown file to Japanese and save it in `source/_drafts/ja/`
3. Both translations will run in parallel for efficiency

## Parameters

- `<markdown-file-path>`: Path to the markdown file to translate (required)

## Output

The command creates translated versions of the file in:
- English: `source/_drafts/en/[filename]`
- Japanese: `source/_drafts/ja/[filename]`

## Implementation

```python
import sys
import os
from pathlib import Path

def parallel_translate(file_path):
    """Translate markdown file to English and Japanese in parallel"""
    
    if not file_path:
        print("Error: Please provide a markdown file path")
        return
    
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} does not exist")
        return
    
    if not file_path.endswith('.md'):
        print("Error: File must be a markdown (.md) file")
        return
    
    # Create output directories
    os.makedirs('source/_drafts/en', exist_ok=True)
    os.makedirs('source/_drafts/ja', exist_ok=True)
    
    # Use Task tool with markdown-translator agent for parallel translation
    # English translation
    Task(
        subagent_type="markdown-translator",
        description="Translate to English",
        prompt=f"Translate the markdown file {file_path} from any language to English and save it in source/_drafts/en directory"
    )
    
    # Japanese translation  
    Task(
        subagent_type="markdown-translator",
        description="Translate to Japanese", 
        prompt=f"Translate the markdown file {file_path} from any language to Japanese and save it in source/_drafts/ja directory"
    )
    
    print(f"Started parallel translation of {file_path} to English and Japanese")
    print("English version will be saved to: source/_drafts/en/")
    print("Japanese version will be saved to: source/_drafts/ja/")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: /parallel-translate <markdown-file-path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    parallel_translate(file_path)
```
