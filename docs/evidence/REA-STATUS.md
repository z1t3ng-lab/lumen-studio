# REA connection evidence

A live call to `mcp__rea__binary_session({})` succeeded during this investigation on October 27, 2026. The complete returned tool result is saved in [rea-session.json](rea-session.json). This is the initial readiness and connection observation. Subsequent Lightroom web analysis is documented in [REA web findings](../REA-WEB-FINDINGS.md).

- Server: rea 6.7.0.
- Package: rea-agents 6.7.0.
- Client: codex-mcp-client 0.164.0-alpha.11.1.
- Protocol: 2025-06-18.
- Catalog: 207 MCP tools; 79 reported available and 128 unavailable in this target-free session.
- Open target: false; selected analysis provider: none.
- Catalog tool digest: `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639`.
- Package/registration alignment: unknown, because no expected identity comparison was requested.

## Native decompilation providers

| Provider | Actual reported status | Reason |
| --- | --- | --- |
| Ghidra | unavailable | Set GHIDRA_INSTALL_DIR to an extracted Ghidra 12.1.x release directory. |
| Hopper Disassembler | unavailable | Hopper launcher is missing or not executable: /Applications/Hopper Disassembler.app/Contents/MacOS/hopper |
| IDA MCP adapter | unavailable | Set REA_IDA_MCP_CONFIG to an upstream IDA MCP JSON registration; see docs/ida-provider.md. |
| Kuna | unavailable | Set REA_KUNA_COMMAND to the absolute path of a caller-supplied kuna executable (verified with 1.833). REA does not download, install or update Kuna. |

Basic macOS artifact inspection capabilities are advertised separately from these deep-analysis engines. Availability does not prove that an operation against Lightroom has been performed, or that a future operation will succeed.

The user confirmed that Lightroom desktop is not installed on this Mac. At this initial readiness checkpoint, no Adobe target had been opened, no Adobe code had been decompiled, and no Adobe runtime experiment had been performed. The later authorized web investigation did run a public sample-editor experiment and capture shipped JavaScript; native desktop decompilation remains unperformed. A local copy of the intended Lightroom build is required to begin target-specific inspection; a configured native analysis provider is additionally needed for decompilation. The independent editor and Adobe documentation research can proceed without claiming those missing results.

No REA configuration or provider installation was changed by this diagnostic. No unrelated application was substituted as the target.
