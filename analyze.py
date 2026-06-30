import re

# Read the file
file_path = r"c:\Users\Chinmay\Desktop\mca proj\newfileprojreporevis1.txt"
with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

# Search for typical placeholders or issues
placeholders = [
    r"TODO",
    r"FIXME",
    r"lorem ipsum",
    r"\[.*\]",  # Bracketed placeholders
    r"INSERT HERE",
    r"PASTE HERE",
    r"REPLACE WITH",
    r"ENTER HERE",
    r"YOUR NAME",
    r"YOUR ROLL",
    r"YOUR EMAIL",
]

print(f"Total lines: {len(lines)}")
print("--- Finding potential placeholders/bracketed text ---")
for i, line in enumerate(lines, 1):
    # Find matching regex
    for p in placeholders:
        if re.search(p, line, re.IGNORECASE):
            print(f"Line {i} ({p}): {line.strip()}")
            break

print("--- Scanning for specific strings in upper case like placeholders ---")
for i, line in enumerate(lines, 1):
    if "PLEASE PASTE" in line or "PASTE HERE" in line or "INSERT HERE" in line:
        print(f"Line {i}: {line.strip()}")

print("Done scanning.")
