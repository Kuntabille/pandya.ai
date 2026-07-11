## 2024-07-11 - CLI Boot Time Optimization
**Learning:** Eagerly importing command handlers (which in turn import heavy modules like `express`, `adm-zip`, and `axios`) at the top of a CLI entry point significantly degrades boot time for all commands, including simple ones like `--help`.
**Action:** Use dynamic imports (`await import(...)`) inside command `.action()` callbacks to lazily load dependencies only when a specific command is executed.
