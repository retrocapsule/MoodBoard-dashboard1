#!/usr/bin/env python3
"""
Script to sync local Sections folder to Supabase database.
Run this script whenever you add new folders or pages to the Sections directory.

Requirements:
    pip install supabase python-dotenv

Setup:
    1. Create supabase-config.env file with your Supabase credentials
    2. Run this script to sync your local data to Supabase
"""

import json
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('supabase-config.env')

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    url = os.getenv('SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not url or not service_key:
        raise ValueError(
            "Missing Supabase credentials. Please create supabase-config.env file with:\n"
            "SUPABASE_URL=your_project_url\n"
            "SUPABASE_SERVICE_KEY=your_service_role_key"
        )
    
    return create_client(url, service_key)

def get_section_order_and_category(name, folder_path):
    """Determine display order and category based on section name and workflow logic"""
    name_lower = name.lower()
    folder_lower = folder_path.lower()
    
    # Define workflow order and categories
    # Order: 1-10 = Entry/Onboarding, 11-30 = Browsing, 31-50 = Product Details, 51-70 = Purchase, 81-90 = Account/Admin, 91+ = Other
    
    if 'onboarding' in name_lower or 'onboarding' in folder_lower:
        return (1, 'entry')
    elif 'admin' in name_lower and 'dashboard' in name_lower:
        return (81, 'account')
    elif 'budtender' in name_lower and 'dashboard' in name_lower:
        return (82, 'account')
    elif 'home' in name_lower and ('dashboard' in name_lower or 'guest' in name_lower):
        return (2, 'entry')
    elif 'home' in name_lower or 'dashboard' in name_lower:
        return (3, 'entry')
    elif 'browse' in name_lower and 'merch' in name_lower:
        return (11, 'browsing')
    elif 'product' in name_lower and 'gallery' in name_lower:
        return (12, 'browsing')
    elif 'browse' in name_lower:
        return (13, 'browsing')
    elif 'product' in name_lower and ('detail' in name_lower or 'page' in name_lower):
        return (31, 'product')
    elif 'merch' in name_lower and ('item' in name_lower or 'page' in name_lower):
        return (32, 'product')
    elif 'where' in name_lower and 'buy' in name_lower:
        return (51, 'purchase')
    elif 'checkout' in name_lower or 'order' in name_lower:
        return (52, 'purchase')
    elif 'reward' in name_lower:
        return (53, 'purchase')
    elif 'account' in name_lower and ('setting' in name_lower or 'profile' in name_lower):
        return (83, 'account')
    elif 'education' in name_lower:
        return (91, 'other')
    elif 'event' in name_lower:
        return (92, 'other')
    else:
        return (999, 'other')

def scan_local_sections():
    """Scan local Sections folder and return structured data"""
    sections_dir = Path("Sections")
    
    if not sections_dir.exists():
        print("Sections directory not found!")
        return []
    
    sections_data = []
    
    for section_dir in sorted(sections_dir.iterdir()):
        if section_dir.is_dir():
            folder_path = str(section_dir.relative_to(Path(".")))
            name = section_dir.name.replace("_", " ").title()
            
            # Get display order and category
            display_order, category = get_section_order_and_category(name, folder_path)
            
            # Scan items in this section
            items = []
            for item_dir in sorted(section_dir.rglob("*")):
                if item_dir.is_dir():
                    html_file = item_dir / "code.html"
                    # Try different image extensions
                    img_file = None
                    for ext in [".png", ".jpg", ".jpeg", ".webp"]:
                        test_file = item_dir / f"screen{ext}"
                        if test_file.exists():
                            img_file = test_file
                            break
                    
                    if html_file.exists() and img_file:
                        rel_folder = str(item_dir.relative_to(Path(".")))
                        rel_html = str(html_file.relative_to(Path(".")))
                        rel_thumbnail = str(img_file.relative_to(Path(".")))
                        
                        items.append({
                            "folder_path": rel_folder,
                            "name": item_dir.name,
                            "html_path": rel_html,
                            "thumbnail_path": rel_thumbnail
                        })
            
            sections_data.append({
                "name": name,
                "folder_path": folder_path,
                "icon": "folder",  # Default, can be updated in Supabase
                "display_order": display_order,
                "category": category,
                "items": items
            })
    
    return sections_data

def sync_to_supabase(supabase: Client):
    """Sync local sections and items to Supabase"""
    local_data = scan_local_sections()
    
    print(f"Found {len(local_data)} sections locally\n")
    
    # Get all existing sections from Supabase
    existing_sections = supabase.table("sections").select("id, folder_path").execute()
    existing_folder_paths = {s["folder_path"]: s["id"] for s in existing_sections.data}
    local_folder_paths = {s["folder_path"] for s in local_data}
    
    # Delete sections that no longer exist locally
    sections_to_delete = [s_id for path, s_id in existing_folder_paths.items() if path not in local_folder_paths]
    if sections_to_delete:
        print(f"Removing {len(sections_to_delete)} deleted section(s)...")
        # Delete gallery items first (cascade should handle this, but being explicit)
        for section_id in sections_to_delete:
            supabase.table("gallery_items").delete().eq("section_id", section_id).execute()
        # Delete sections
        supabase.table("sections").delete().in_("id", sections_to_delete).execute()
        print(f"  ✓ Deleted {len(sections_to_delete)} section(s)\n")
    
    for section_data in local_data:
        folder_path = section_data["folder_path"]
        name = section_data["name"]
        icon = section_data.get("icon", "folder")
        display_order = section_data.get("display_order", 999)
        category = section_data.get("category", "other")
        items = section_data["items"]
        
        print(f"Syncing section: {name} ({folder_path}) [Order: {display_order}, Category: {category}]")
        
        # Check if section exists
        existing = supabase.table("sections").select("id").eq("folder_path", folder_path).execute()
        
        if existing.data:
            section_id = existing.data[0]["id"]
            # Update section
            supabase.table("sections").update({
                "name": name,
                "icon": icon,
                "display_order": display_order,
                "category": category,
                "updated_at": "now()"
            }).eq("id", section_id).execute()
            print(f"  ✓ Updated existing section")
        else:
            # Create new section
            result = supabase.table("sections").insert({
                "name": name,
                "folder_path": folder_path,
                "icon": icon,
                "display_order": display_order,
                "category": category
            }).execute()
            section_id = result.data[0]["id"]
            print(f"  ✓ Created new section")
        
        # Sync items
        print(f"  Syncing {len(items)} items...")
        
        # Get existing items for this section
        existing_items = supabase.table("gallery_items").select("id, folder_path").eq("section_id", section_id).execute()
        existing_paths = {item["folder_path"]: item["id"] for item in existing_items.data}
        
        items_to_insert = []
        items_to_update = []
        
        for idx, item in enumerate(items):
            item_data = {
                "section_id": section_id,
                "folder_path": item["folder_path"],
                "name": item["name"],
                "html_path": item["html_path"],
                "thumbnail_path": item["thumbnail_path"],
                "display_order": idx
            }
            
            if item["folder_path"] in existing_paths:
                # Update existing item
                item_data["id"] = existing_paths[item["folder_path"]]
                items_to_update.append(item_data)
            else:
                # New item
                items_to_insert.append(item_data)
        
        # Batch insert new items
        if items_to_insert:
            supabase.table("gallery_items").insert(items_to_insert).execute()
            print(f"    ✓ Inserted {len(items_to_insert)} new items")
        
        # Update existing items
        if items_to_update:
            for item in items_to_update:
                item_id = item.pop("id")
                supabase.table("gallery_items").update(item).eq("id", item_id).execute()
            print(f"    ✓ Updated {len(items_to_update)} existing items")
        
        # Delete items that no longer exist locally
        local_paths = {item["folder_path"] for item in items}
        items_to_delete = [item_id for path, item_id in existing_paths.items() if path not in local_paths]
        
        if items_to_delete:
            supabase.table("gallery_items").delete().in_("id", items_to_delete).execute()
            print(f"    ✓ Deleted {len(items_to_delete)} removed items")
        
        print()
    
    print("✓ Sync complete!")

if __name__ == "__main__":
    try:
        supabase = get_supabase_client()
        sync_to_supabase(supabase)
    except Exception as e:
        print(f"Error: {e}")
        print("\nMake sure you have:")
        print("1. Created supabase-config.env with your credentials")
        print("2. Installed dependencies: pip install supabase python-dotenv")
        print("3. Run the SQL schema in your Supabase project")

