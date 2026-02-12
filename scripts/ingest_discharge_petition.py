import pandas as pd
import json
import os

# Paths
EXCEL_PATH = 'public/data/eft_act/discharge_petition_sept_2_2025.xlsx'
SCORES_PATH = 'public/data/epstein_scores.json'

def ingest_discharge_petition():
    print("Loading data...")
    
    # Load Excel file
    try:
        df = pd.read_excel(EXCEL_PATH)
    except FileNotFoundError:
        print(f"Error: File not found at {EXCEL_PATH}")
        return

    # Load JSON scores
    try:
        with open(SCORES_PATH, 'r') as f:
            scores_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File not found at {SCORES_PATH}")
        return

    # Initialize counters
    updated_count = 0
    
    # Reset discharge_petition for all (optional, but good for idempotency if running fresh)
    # However, existing data might need preservation. Let's assume we want to update/overwrite specific fields.
    # To be safe, we can iterate all and set default if not present, but let's just update based on the file for now.
    
    # Iterate through the DataFrame
    # Columns: BioguideID, SignedDate
    
    print(f"Found {len(df)} signatures in the Excel file.")
    
    # Create a set of signed IDs for quick lookup
    signed_map = {}
    for index, row in df.iterrows():
        bioguide_id = row['BioguideID']
        date = row['SignedDate']
        
        if pd.isna(bioguide_id):
            print(f"Warning: Missing BioguideID at row {index}")
            continue
            
        signed_map[bioguide_id] = date

    # Update scores
    for bioguide_id, score_entry in scores_data.get('scores', {}).items():
        # Initialize the section if missing
        if 'epstein_transparency_act' not in score_entry:
            score_entry['epstein_transparency_act'] = {}
            
        # Check if this legislator signed
        if bioguide_id in signed_map:
            score_entry['epstein_transparency_act']['discharge_petition'] = {
                "signed": True,
                "date": str(signed_map[bioguide_id])
            }
            updated_count += 1
        else:
            # Explicitly set to false if not signed? Or just leave undefined/false?
            # User request said "signed" true/false.
            # Let's preserve existing data if we didn't wipe it, but for accuracy, we should set false if not in the list.
             score_entry['epstein_transparency_act']['discharge_petition'] = {
                "signed": False,
                "date": None
            }

    # Write back to JSON
    with open(SCORES_PATH, 'w') as f:
        json.dump(scores_data, f, indent=2)

    print(f"Updated {updated_count} legislators with discharge petition signatures.")

if __name__ == "__main__":
    ingest_discharge_petition()
