import os

# Folders we want to ignore to keep the output readable
IGNORE_LIST = {
    '.git', 'node_modules', 'venv', '.venv', 'env', '__pycache__', 
    '.next', 'staticfiles', '.vercel', 'build', 'dist', 'db.sqlite3'
}

def print_tree(directory, prefix=""):
    try:
        items = sorted(os.listdir(directory))
    except PermissionError:
        return

    # Filter out ignored files/directories
    items = [item for item in items if item not in IGNORE_LIST]
    
    for i, item in enumerate(items):
        path = os.path.join(directory, item)
        is_last = (i == len(items) - 1)
        connector = "└── " if is_last else "├── "
        
        print(f"{prefix}{connector}{item}")
        
        if os.path.isdir(path):
            new_prefix = prefix + ("    " if is_last else "│   ")
            print_tree(path, new_prefix)

if __name__ == "__main__":
    print(".")
    print_tree(".")