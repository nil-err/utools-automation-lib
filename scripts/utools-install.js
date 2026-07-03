const fs = require('fs')
const path = require('path')
const cp = require('child_process')

const DEFAULT_REPO_URL = 'https://github.com/nil-err/utools-automation-lib.git'

function notify(msg) {
  try {
    utools.showNotification(String(msg))
  } catch (_) {
    // ignore
  }
}

function execGit(args, cwd) {
  return cp.execFileSync('git', args, {
    cwd,
    stdio: 'pipe',
    encoding: 'utf8',
  })
}

function readRepoUrlFromGitConfig(libDir) {
  const configPath = path.join(libDir, '.git', 'config')
  if (!fs.existsSync(configPath)) return ''
  try {
    const content = fs.readFileSync(configPath, 'utf8')
    const remoteBlock = content.split(/\n\[remote \"origin\"\]\n/)[1]
    if (!remoteBlock) return ''
    const urlLine = remoteBlock.split('\n').find((line) => line.trim().startsWith('url ='))
    if (!urlLine) return ''
    return urlLine.split('url =')[1].trim()
  } catch (_) {
    return ''
  }
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

function resolveRepoUrl(libDir) {
  return (
    process.env.AUTOMATION_LIB_REPO ||
    readRepoUrlFromEnterPayload() ||
    readRepoUrlFromGitConfig(libDir) ||
    DEFAULT_REPO_URL
  )
}

function ensureGitAvailable() {
  try {
    execGit(['--version'])
  } catch (error) {
    throw new Error(`未检测到 Git，请先安装 Git。${error.message || error}`)
  }
}

function isGitRepo(libDir) {
  try {
    if (!fs.existsSync(path.join(libDir, '.git'))) return false
    execGit(['-C', libDir, 'rev-parse', '--is-inside-work-tree'])
    return true
  } catch (_) {
    return false
  }
}

function moveToBackup(libDir) {
  const parentDir = path.dirname(libDir)
  const baseName = path.basename(libDir)
  const backupDir = path.join(parentDir, `${baseName}.bak-${Date.now()}`)
  fs.renameSync(libDir, backupDir)
  return backupDir
}

function installOrUpdate() {
  ensureGitAvailable()

  const libDir = path.join(utools.getPath('userData'), 'automation-lib')
  const repoUrl = resolveRepoUrl(libDir)

  if (!fs.existsSync(libDir)) {
    notify('automation-lib：开始克隆...')
    execGit(['clone', repoUrl, libDir])
    notify('automation-lib：克隆完成')
    return
  }

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

try {
  installOrUpdate()
} catch (error) {
  notify(`automation-lib：失败：${error.message || error}`)
  throw error
}
