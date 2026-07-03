# utools-automation-lib

面向 uTools 自动化脚本的 CommonJS 工具库。仓库按功能域拆到 `src/*` 目录，根入口 `index.js` 继续统一导出，保持 `require('automation-lib')` 这类用法稳定。

## 用法

### 1) 作为脚本库使用（require）

```js
const path = require('path')
const lib = require(path.join(utools.getPath('userData'), 'automation-lib'))

lib.notify('hello')
lib.openUrl('https://example.com', { newWindow: true })
```

### 2) 安装/更新脚本库（推荐：Git 托管）

> 前提：本机已安装 Git，且能访问仓库。

将下面脚本粘贴到 uTools 自动化脚本中执行（首次安装或更新都可用）。默认仓库地址是 `https://github.com/nil-err/utools-automation-lib.git`；也可通过 `AUTOMATION_LIB_REPO` 或 `ENTER.payload` 覆盖。更新时会优先沿用已存在的 `origin`：

```js
const fs = require('fs')
const path = require('path')
const cp = require('child_process')

const DEFAULT_REPO_URL = 'https://github.com/nil-err/utools-automation-lib.git'
const libDir = path.join(utools.getPath('userData'), 'automation-lib')

function notify(msg) {
  try { utools.showNotification(String(msg)) } catch (_) {}
}

function execGit(args, cwd) {
  return cp.execFileSync('git', args, { cwd, stdio: 'pipe', encoding: 'utf8' })
}

function readRepoUrlFromEnterPayload() {
  try {
    if (typeof ENTER === 'undefined' || !ENTER || !ENTER.payload) return ''
    if (typeof ENTER.payload === 'string') return ENTER.payload.trim()
    if (ENTER.payload.repoUrl && typeof ENTER.payload.repoUrl === 'string') {
      return ENTER.payload.repoUrl.trim()
    }
    return ''
  } catch (_) {
    return ''
  }
}

function readRepoUrlFromGitConfig(dir) {
  const configPath = path.join(dir, '.git', 'config')
  if (!fs.existsSync(configPath)) return ''
  try {
    const content = fs.readFileSync(configPath, 'utf8')
    const remoteBlock = content.split(/\n\[remote "origin"\]\n/)[1]
    if (!remoteBlock) return ''
    const urlLine = remoteBlock
      .split('\n')
      .find((line) => line.trim().startsWith('url ='))
    if (!urlLine) return ''
    return urlLine.split('url =')[1].trim()
  } catch (_) {
    return ''
  }
}

function resolveRepoUrl(dir) {
  return (
    process.env.AUTOMATION_LIB_REPO ||
    readRepoUrlFromEnterPayload() ||
    readRepoUrlFromGitConfig(dir) ||
    DEFAULT_REPO_URL
  )
}

function isGitRepo(dir) {
  try {
    if (!fs.existsSync(path.join(dir, '.git'))) return false
    execGit(['-C', dir, 'rev-parse', '--is-inside-work-tree'])
    return true
  } catch (_) {
    return false
  }
}

function moveToBackup(dir) {
  const parentDir = path.dirname(dir)
  const baseName = path.basename(dir)
  const backupDir = path.join(parentDir, `${baseName}.bak-${Date.now()}`)
  fs.renameSync(dir, backupDir)
  return backupDir
}

try {
  execGit(['--version'])
  const repoUrl = resolveRepoUrl(libDir)
  if (!fs.existsSync(libDir)) {
    notify('automation-lib：开始克隆...')
    execGit(['clone', repoUrl, libDir])
    notify('automation-lib：克隆完成')
  } else {
    if (!isGitRepo(libDir)) {
      const backupDir = moveToBackup(libDir)
      notify(`automation-lib：检测到非 Git 目录，已备份到 ${backupDir}`)
      notify('automation-lib：开始克隆...')
      execGit(['clone', repoUrl, libDir])
      notify('automation-lib：克隆完成')
      return
    }
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

> 若希望使用仓库内置脚本，也可在 clone 后执行 `scripts/utools-install.js`。内置脚本与上面的逻辑保持一致。

## 导出能力

- Chrome / 浏览器：`getChromePath`、`buildChromeArgs`、`openUrl`
- Aicolate：`buildAicolateTraceUrl`
- 校验器：`isHexId`、`parseHexIds`
- uTools 工具：`notify`、`copyText`、`debugCopy`
- 元信息：`version`

## 目录结构

```
.
├── index.js
├── package.json
├── README.md
├── scripts
│   └── utools-install.js
└── src
    ├── aicolate
    │   └── index.js
    ├── chrome
    │   └── index.js
    ├── utools
    │   └── index.js
    └── validators
        └── index.js
```

## 开发与发布

- `index.js` 为入口，导出所有能力。
- `src/*/index.js` 按功能域组织内部模块。
- `scripts/utools-install.js` 用于在 uTools 中 clone/pull 自动安装或更新。
