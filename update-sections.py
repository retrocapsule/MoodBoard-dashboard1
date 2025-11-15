#!/usr/bin/env python3
"""
Script to update sections.json and embed sections data in index.html.
Run this script whenever you add a new section folder.
"""

import json
import re
from pathlib import Path

def update_sections_json():
    sections_dir = Path("Sections")
    sections_json = Path("sections.json")
    
    if not sections_dir.exists():
        print("Sections directory not found!")
        return
    
    # Load existing sections.json if it exists
    existing_sections = []
    if sections_json.exists():
        with open(sections_json, 'r') as f:
            data = json.load(f)
            existing_sections = data.get("sections", [])
    
    # Create a map of existing sections by folder path
    existing_map = {s["folder"]: s for s in existing_sections}
    
    # Find all section folders
    new_sections = []
    for section_dir in sorted(sections_dir.iterdir()):
        if section_dir.is_dir():
            folder_path = str(section_dir.relative_to(Path(".")))
            
            # Use existing entry if available, otherwise create new one
            if folder_path in existing_map:
                new_sections.append(existing_map[folder_path])
            else:
                # Generate a nice name from folder name
                name = section_dir.name.replace("_", " ").title()
                # Default icon
                icon = "folder"
                
                new_sections.append({
                    "name": name,
                    "folder": folder_path,
                    "icon": icon
                })
                print(f"✓ Added new section: {name} ({folder_path})")
    
    # Save updated sections.json
    data = {"sections": new_sections}
    with open(sections_json, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"\n✓ Updated sections.json with {len(new_sections)} sections")
    
    # Also update index.html with embedded data
    update_index_html(data)
    
    return data

def update_index_html(sections_data):
    index_file = Path("index.html")
    if not index_file.exists():
        print("index.html not found!")
        return
    
    with open(index_file, 'r') as f:
        content = f.read()
    
    # Find and replace the sectionsData constant
    sections_json_str = json.dumps(sections_data, indent=12)
    # Escape for JavaScript
    sections_json_str = sections_json_str.replace('\\', '\\\\').replace('`', '\\`')
    
    # Pattern to match the sectionsData constant
    pattern = r'const sectionsData = \{[\s\S]*?\};'
    replacement = f'const sectionsData = {sections_json_str};'
    
    new_content = re.sub(pattern, replacement, content)
    
    with open(index_file, 'w') as f:
        f.write(new_content)
    
    print(f"✓ Updated index.html with embedded sections data")

if __name__ == "__main__":
    update_sections_json()
    print("\nDone! Both sections.json and index.html have been updated.")
