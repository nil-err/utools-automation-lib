# utools-automation-lib

面向 uTools 自动化脚本的工具库。

## 用法

### 1) 作为脚本库使用（require）

```js
const path = require('path')
const lib = require(path.join(utools.getPath('userData'), 'automation-lib'))

lib.notify('hello')
```

### 2) 安装/更新脚本库（推荐：Git 托管）

> 前提：本机已安装 Git，且能访问仓库。

将下面脚本粘贴到 uTools 自动化脚本中执行（首次安装或更新都可用）：

```js
const fs = require('fs')
const path = require('path')
const cp = require('child_process')

const repoUrl = process.env.AUTOMATION_LIB_REPO || 'https://github.com/your-org/utools-automation-lib.git'
const libDir = path.join(utools.getPath('userData'), 'automation-lib')

function notify(msg) {
  try { utools.showNotification(String(msg)) } catch (_) {}
}

function execGit(args, cwd) {
  return cp.execFileSync('git', args, { cwd, stdio: 'pipe', encoding: 'utf8' })
}

try {
  execGit(['--version'])
  if (!fs.existsSync(libDir)) {
    notify('automation-lib：开始克隆...')
    execGit(['clone', repoUrl, libDir])
    notify('automation-lib：克隆完成')
  } else {
    notify('automation-lib：开始更新...')
    execGit(['-C', libDir, 'fetch', '--all', '--prune'])
    execGit(['-C', libDir, 'pull', '--ff-only'])
    notify('automation-lib：更新完成')
  }
} catch (error) {
  notify(`automation-lib：失败：${error.message || error}`)
  throw error
}
```

> 若希望使用仓库内置脚本，也可在 clone 后执行 `scripts/utools-install.js`。

## 目录结构

```
.
├── aicolate.js
├── chrome.js
├── index.js
├── utils.js
├── validators.js
└── scripts
    └── utools-install.js
```

## 开发与发布

- `index.js` 为入口，导出所有能力。
- `scripts/utools-install.js` 用于在 uTools 中 clone/pull 自动安装或更新。
