# Lazarus

> **Machine Execution & Reverse Engineering for Hackers**  
> An interactive, free, and open-source low-level security education platform built with Google's Material 3 Expressive UI/UX principles.

---

## 🚀 Features

- **Pwnctual-Grade UI/UX**: Ultra-clean Material 3 typography (`Google Sans Flex`, `Google Sans Code`, `Material Symbols Rounded`), cards, chips, and responsive layout.
- **Dark & Light Mode**: Instant zero-flash theme switching that adheres to system preferences and remembers user choices in `localStorage`.
- **Interactive CPU & Memory Widgets**:
  - **x86_64 Register Slicer**: Real-time visualization of `RAX`, `EAX`, `AX`, and `AL` with live demonstration of 32-bit zero extension.
  - **Instruction Pipeline Stepper**: Cycle-by-cycle Fetch-Decode-Execute stepper tracking `RIP`, opcodes, and micro-ops.
  - **Live Stack Frame Visualizer**: Stack geometry simulator with dynamic `RSP` / `RBP` markers and return address tracking.
  - **Buffer Overflow Smasher**: Visual memory corruption simulator showing how buffer overflows spill into Saved RBP and overwrite `RIP`.
- **Progress Tracking & Practice Challenges**:
  - Multi-question challenge engine with input normalization and instant verification.
  - Streak indicators and shake animation on wrong answers.
  - Progress saved locally in browser `localStorage`.
- **100% GitHub Pages Ready**:
  - Pre-rendered static pages in `learn/` for instant loading without a Node.js backend.
  - Seamless support for repository subpaths (`https://<username>.github.io/<repo>/`) and custom domains.
  - Built-in `404.html` SPA routing fallback.

---

## 📚 Curriculum Overview

### Chapter 1: Machine Execution & Hardware Architecture
- **1.1 CPU Execution Engine & The Instruction Pipeline**: Von Neumann model, Fetch-Decode-Execute cycle, and instruction pointer hijacking.
- **1.2 Registers, Privilege Rings & State Transitions**: x86_64 general purpose registers, the 32-bit zero-extension trap, Ring 0 vs Ring 3, and system call boundaries.
- **1.3 Virtual Memory, Paging & Address Translation**: Address spaces, multi-level page tables, page faults, and the hardware NX/XD bit.
- **1.4 The Call Stack, Frames & ABI Conventions**: Downward stack growth, `RSP`/`RBP` frame contracts, `CALL`/`RET` mechanics, and Linux System V vs Windows x64 ABIs.

### Chapter 2: Binary Anatomy, Machine Code & Disassembly
- **2.1 ELF & PE Binary Formats Under the Microscope**: Magic headers, segments vs sections (`.text`, `.rodata`, `.data`, `.bss`), and PLT/GOT dynamic resolution.
- **2.2 Opcodes, Encoding & Disassembly Mechanics**: Instruction formatting, ModR/M and SIB bytes, and Linear Sweep vs Recursive Traversal.
- **2.3 Control Flow Graphs & Decompilation Logic**: Basic blocks, edge traversal, and reconstructing C conditionals, loops, and switch jump tables from assembly.

### Chapter 3: Reverse Engineering Methodologies & Tooling
- **3.1 Static Analysis: Triage, Strings & Cross-References**: Triage workflow, Shannon entropy calculation, string forensics, and spotting cryptographic primitives.
- **3.2 Dynamic Analysis & Debugger Internals**: The inner workings of software breakpoints (`0xCC` / `INT 3`), hardware debug registers (`DR0`-`DR7`), and the Trap Flag (`TF`).
- **3.3 Anti-Reverse Engineering & Defense Evasion**: `PEB.BeingDebugged`, `TracerPid`, `RDTSC` timing checks, and code obfuscation patterns.

### Chapter 4: Low-Level Vulnerabilities & Exploit Primitives
- **4.1 Memory Corruption: Stack Buffer Overflows**: Unsafe memory copies, stack smash geometry, cyclic pattern offset calculation, and controlling `RIP`.
- **4.2 Modern Exploit Mitigations & Defenses**: Stack canaries (`__stack_chk_guard`), NX/DEP, ASLR/PIE, and Full vs Partial RELRO.
- **4.3 Return-Oriented Programming (ROP) Foundations**: Defeating W^X/DEP by chaining gadgets, stack pivoting, and forging an `execve("/bin/sh")` chain.

---

## 💻 Local Development

You can run and test **lazarus** with Python's built-in HTTP server:

```bash
# Start a local test server
python -m http.server 8000
```

Open your browser to:
```
http://localhost:8000
```

---

## 🌐 Deploying to GitHub Pages

Deploying **lazarus** to your user site (`https://lazarus-one.github.io/`) takes under 2 minutes:

1. **Initialize Git & Commit**:
   ```bash
   git init
   git add .
   git commit -m "Initialize lazarus platform"
   ```

2. **Push to your GitHub repository**:
   ```bash
   # If pushing directly to your user GitHub Pages repository:
   git remote add origin https://github.com/lazarus-one/lazarus-one.github.io.git
   git branch -M main
   git push -u origin main
   ```

3. **Enable GitHub Pages (if not already enabled)**:
   - Go to your repository on GitHub (`lazarus-one/lazarus-one.github.io`).
   - Click **Settings** &rarr; **Pages** (under the "Code and automation" sidebar).
   - Under **Build and deployment**:
     - **Source**: `Deploy from a branch`
     - **Branch**: `main` / `(root)`
   - Click **Save**.

Your website will be live at:
**`https://lazarus-one.github.io/`**

---

## 🛠 Rebuilding Static Pages (Optional)

Whenever you add new topics or modify lesson content in `lessons/`:

```bash
python build.py
```

This updates:
- Pre-rendered static pages in `learn/`
- `sitemap.xml`
- `robots.txt`
- `llms.txt`

---

## 📜 License

Free and open-source under the MIT License.

