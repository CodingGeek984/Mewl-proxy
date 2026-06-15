#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Meowl Build & Run Script
Manages building and running the Meowl proxy application across platforms.
Supports multiple output formats: exe (Windows), deb (Debian/Ubuntu), dmg (macOS), etc.
"""

import os
import sys
import subprocess
import argparse
import platform
import json
from pathlib import Path

# Force UTF-8 output on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


class MeowlBuilder:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.frontend_dir = self.project_root / "frontend"
        self.backend_dir = self.project_root / "backend"
        self.wails_config = self.project_root / "wails.json"
        self.os_type = platform.system()
        
    def run_command(self, cmd, cwd=None, shell=None):
        """Execute a shell command and handle errors."""
        if shell is None:
            shell = self.os_type == "Windows"
        
        cmd_str = ' '.join(cmd) if isinstance(cmd, list) else cmd
        print(f"▶ Running: {cmd_str}")
        try:
            result = subprocess.run(
                cmd_str if shell else cmd,
                cwd=cwd or self.project_root,
                shell=shell,
                check=True
            )
            return result.returncode == 0
        except subprocess.CalledProcessError as e:
            print(f"✗ Command failed with exit code {e.returncode}")
            return False
        except FileNotFoundError as e:
            print(f"✗ Command not found: {e}")
            return False

    def check_dependencies(self):
        """Check if required tools are installed."""
        print("🔍 Checking dependencies...")
        
        deps = {
            "go": "Go",
            "node": "Node.js",
            "npm": "npm",
            "python": "Python"
        }
        
        missing = []
        for cmd, name in deps.items():
            result = subprocess.run(
                ["which", cmd] if self.os_type != "Windows" else ["where", cmd],
                capture_output=True,
                shell=self.os_type == "Windows"
            )
            if result.returncode != 0:
                missing.append(name)
            else:
                print(f"  ✓ {name}")
        
        if missing:
            print(f"\n✗ Missing dependencies: {', '.join(missing)}")
            return False
        
        print("✓ All dependencies found\n")
        return True

    def install_frontend_deps(self):
        """Install frontend dependencies."""
        print("📦 Installing frontend dependencies...")
        if not self.run_command("npm install", cwd=self.frontend_dir, shell=True):
            return False
        print("✓ Frontend dependencies installed\n")
        return True

    def build_frontend(self):
        """Build the frontend with Vite."""
        print("🏗️  Building frontend...")
        if not self.run_command("npm run build", cwd=self.frontend_dir, shell=True):
            return False
        print("✓ Frontend built\n")
        return True

    def build_backend(self, output_format="exe"):
        """Build the backend with Wails."""
        print(f"🏗️  Building backend ({output_format})...")
        
        # Update wails.json with output format
        self._update_wails_config(output_format)
        
        # Build with Wails
        cmd = "wails build -clean"
        
        if self.os_type == "Windows":
            cmd += " -nsis"
        elif self.os_type == "Darwin":
            cmd += " -dmg"
        elif self.os_type == "Linux":
            # Wails v2 build for Linux (binary will be in build/bin)
            # Note: Wails v2 doesn't have a built-in -deb flag in the build command
            pass
        
        if not self.run_command(cmd, shell=True):
            return False
        
        print(f"✓ Backend built ({output_format})\n")
        return True

    def _update_wails_config(self, output_format):
        """Update wails.json with the appropriate output filename."""
        with open(self.wails_config, 'r') as f:
            config = json.load(f)
        
        # Set output filename based on format
        if output_format == "exe":
            config["outputfilename"] = "meowl.exe"
        elif output_format == "deb":
            config["outputfilename"] = "meowl"
        elif output_format == "rpm":
            config["outputfilename"] = "meowl"
        elif output_format == "dmg":
            config["outputfilename"] = "meowl.dmg"
        elif output_format == "appimage":
            config["outputfilename"] = "meowl.AppImage"
        
        with open(self.wails_config, 'w') as f:
            json.dump(config, f, indent=4)

    def run_dev(self):
        """Run the application in development mode."""
        print("🚀 Starting development mode...\n")
        
        # Start frontend dev server
        print("Starting frontend dev server...")
        frontend_proc = subprocess.Popen(
            "npm run dev",
            cwd=self.frontend_dir,
            shell=True
        )
        
        # Give frontend time to start
        import time
        time.sleep(3)
        
        # Run backend in dev mode
        print("Starting backend (Wails dev mode)...")
        self.run_command("wails dev", shell=True)
        
        # Cleanup
        frontend_proc.terminate()

    def run_built(self):
        """Run the built application."""
        print("🚀 Running built application...\n")
        
        if self.os_type == "Windows":
            exe_path = self.project_root / "build" / "bin" / "meowl.exe"
            if exe_path.exists():
                self.run_command(str(exe_path), shell=True)
            else:
                print(f"✗ Executable not found: {exe_path}")
                return False
        elif self.os_type == "Darwin":
            app_path = self.project_root / "build" / "bin" / "meowl.app"
            if app_path.exists():
                self.run_command(f"open '{app_path}'", shell=True)
            else:
                print(f"✗ App not found: {app_path}")
                return False
        elif self.os_type == "Linux":
            exe_path = self.project_root / "build" / "bin" / "meowl"
            if exe_path.exists():
                self.run_command(str(exe_path), shell=True)
            else:
                print(f"✗ Executable not found: {exe_path}")
                return False
        
        return True

    def clean(self):
        """Clean build artifacts."""
        print("🧹 Cleaning build artifacts...")
        build_dir = self.project_root / "build"
        if build_dir.exists():
            import shutil
            shutil.rmtree(build_dir)
            print("✓ Build directory cleaned\n")
        else:
            print("  (No build directory found)\n")

    def rebuild(self, output_format="exe"):
        """Full rebuild: clean, install deps, build frontend, build backend."""
        print("=" * 60)
        print(f"🔨 FULL REBUILD ({output_format})")
        print("=" * 60 + "\n")
        
        if not self.check_dependencies():
            return False
        
        self.clean()
        
        if not self.install_frontend_deps():
            return False
        
        if not self.build_frontend():
            return False
        
        if not self.build_backend(output_format):
            return False
        
        print("=" * 60)
        print("✓ BUILD COMPLETE")
        print("=" * 60 + "\n")
        return True


def main():
    parser = argparse.ArgumentParser(
        description="Meowl Build & Run Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python meowl.py                    # Run in dev mode
  python meowl.py --run              # Run built application
  python meowl.py --rebuild          # Full rebuild (exe on Windows, deb on Linux, dmg on macOS)
  python meowl.py --rebuild exe      # Rebuild as exe (Windows)
  python meowl.py --rebuild deb      # Rebuild as deb (Linux)
  python meowl.py --rebuild rpm      # Rebuild as rpm (Linux)
  python meowl.py --rebuild dmg      # Rebuild as dmg (macOS)
  python meowl.py --rebuild appimage # Rebuild as AppImage (Linux)
  python meowl.py --clean            # Clean build artifacts
        """
    )
    
    parser.add_argument(
        "--rebuild",
        nargs="?",
        const="default",
        help="Perform full rebuild with optional format (exe, deb, rpm, dmg, appimage)"
    )
    parser.add_argument(
        "--run",
        action="store_true",
        help="Run the built application"
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Clean build artifacts"
    )
    parser.add_argument(
        "--frontend-only",
        action="store_true",
        help="Build frontend only"
    )
    parser.add_argument(
        "--backend-only",
        action="store_true",
        help="Build backend only"
    )
    
    args = parser.parse_args()
    
    builder = MeowlBuilder()
    
    # Determine output format
    output_format = "exe"
    if args.rebuild and args.rebuild != "default":
        output_format = args.rebuild
    elif args.rebuild == "default":
        # Use platform-specific default
        if builder.os_type == "Windows":
            output_format = "exe"
        elif builder.os_type == "Darwin":
            output_format = "dmg"
        elif builder.os_type == "Linux":
            output_format = "deb"
    
    # Execute requested action
    if args.clean:
        builder.clean()
    elif args.rebuild is not None:
        success = builder.rebuild(output_format)
        sys.exit(0 if success else 1)
    elif args.run:
        success = builder.run_built()
        sys.exit(0 if success else 1)
    elif args.frontend_only:
        if not builder.check_dependencies():
            sys.exit(1)
        if not builder.install_frontend_deps():
            sys.exit(1)
        if not builder.build_frontend():
            sys.exit(1)
    elif args.backend_only:
        if not builder.check_dependencies():
            sys.exit(1)
        if not builder.build_backend(output_format):
            sys.exit(1)
    else:
        # Default: run built application
        success = builder.run_built()
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
