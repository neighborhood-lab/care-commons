#!/bin/bash

# Backup current .zshrc
cp ~/.zshrc ~/.zshrc.backup.$(date +%Y%m%d_%H%M%S)

# Remove the hardcoded Node v14 PATH and uncomment nvm auto-switching
sed -i.tmp 's|^export PATH="${NVM_DIR}/versions/node/v14.14.0/bin:${PATH}"$|# Removed hardcoded Node v14.14.0 PATH - let nvm manage Node versions|' ~/.zshrc

# Uncomment the nvm auto-switching lines
sed -i.tmp 's|^# autoload -Uz add-zsh-hook$|autoload -Uz add-zsh-hook|' ~/.zshrc
sed -i.tmp 's|^# add-zsh-hook chpwd nvm_auto$|# Automatically switch Node versions based on .nvmrc\nload-nvmrc() {\n  local nvmrc_path="$(nvm_find_nvmrc)"\n  if [ -n "$nvmrc_path" ]; then\n    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")\n    if [ "$nvmrc_node_version" = "N/A" ]; then\n      nvm install\n    elif [ "$nvmrc_node_version" != "$(nvm version)" ]; then\n      nvm use\n    fi\n  elif [ -n "$(PWD=$OLDPWD nvm_find_nvmrc)" ] \&\& [ "$(nvm version)" != "$(nvm version default)" ]; then\n    echo "Reverting to nvm default version"\n    nvm use default\n  fi\n}\nadd-zsh-hook chpwd load-nvmrc\nload-nvmrc|' ~/.zshrc

rm ~/.zshrc.tmp

echo "✅ Fixed .zshrc - Node v14 hardcoded PATH removed and nvm auto-switching enabled"
echo "🔄 Please restart your terminal or run: source ~/.zshrc"
