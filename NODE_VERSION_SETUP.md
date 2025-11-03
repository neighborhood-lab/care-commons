# Node.js Version Setup Guide

This project **requires Node.js 22.x** for proper operation. The project uses ES Modules (ESM) and modern JavaScript features that are only supported in Node.js 22+.

## Quick Fix (If You're Having Issues)

If you're seeing errors like `SyntaxError: Unexpected token '??='`, run:

```bash
nvm use 22
```

If you don't have Node.js 22 installed:

```bash
nvm install 22
nvm use 22
nvm alias default 22
```

## Why Node.js 22?

1. **Vercel Deployment**: The production environment uses Node.js 22.x
2. **Modern JavaScript**: Features like `??=`, top-level await, etc.
3. **ESM Support**: Native ES Modules support with proper resolution
4. **Performance**: Better performance and security

## Automatic Version Management

The project includes several mechanisms to ensure the correct Node.js version:

### 1. `.nvmrc` File

The `.nvmrc` file at the project root specifies Node.js 22. When you `cd` into the project and have NVM auto-switching enabled, it will automatically use the correct version.

**Enable auto-switching** by adding to your `~/.zshrc`:

```bash
# Auto-switch Node version based on .nvmrc
autoload -U add-zsh-hook
load-nvmrc() {
  local node_version="$(nvm version)"
  local nvmrc_path="$(nvm_find_nvmrc)"

  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$node_version" ]; then
      nvm use
    fi
  elif [ "$node_version" != "$(nvm version default)" ]; then
    echo "Reverting to nvm default version"
    nvm use default
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

### 2. VS Code Integration

The `.vscode/tasks.json` and `.vscode/settings.json` files are configured to:
- Use a login shell (`/bin/zsh -l`) which loads your `.zshrc` and NVM
- Set the correct environment variables for NVM
- Ensure all tasks run with the correct Node.js version

### 3. Shell Scripts

All shell scripts (e.g., `scripts/check.sh`) now:
- Automatically load NVM
- Verify the Node.js version before running
- Exit with an error if the wrong version is detected

## Verification

Check your current Node.js version:

```bash
node --version
```

Should output: `v22.x.x` (where x can be any minor/patch version)

## Common Issues

### Issue: "npm" or "node" not found

**Solution**: Ensure NVM is properly loaded in your shell:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22
```

### Issue: VS Code tasks still use wrong version

**Solution**: 
1. Restart VS Code completely (quit and reopen)
2. Open a new integrated terminal
3. Verify with `node --version`
4. Try running the task again

### Issue: Tests fail with syntax errors

**Solution**: 
1. Close all terminals in VS Code
2. Run `nvm use 22` in your regular terminal
3. Restart VS Code
4. Run tests again

## Development Workflow

When starting development:

```bash
# 1. Switch to the correct Node version
nvm use 22

# 2. Install dependencies (if needed)
npm install

# 3. Run development server
npm run dev
```

## CI/CD

GitHub Actions and other CI/CD environments are configured to use Node.js 22.x automatically via the `engines` field in `package.json`.

## Package Manager

This project uses npm 11.6+ (which comes with Node.js 22). Do not use yarn or pnpm unless you update all configuration files.

## Questions?

If you continue to have Node.js version issues:
1. Check `node --version` and `npm --version`
2. Ensure NVM is loaded in your shell
3. Try the "Quick Fix" at the top of this document
4. Restart VS Code if using integrated terminal
