## 2023-11-20 - CLI Dynamic Imports Optimization
**Learning:** Top-level imports of heavy modules (`express`, `adm-zip`, `axios`) in commander.js CLI entry files significantly increase cold start time (e.g., `pandya --help` taking 230ms).
**Action:** Use dynamic imports (`await import('...')`) inside the commander `.action()` callbacks to lazy-load heavy dependencies, reducing startup time by over 60%.
