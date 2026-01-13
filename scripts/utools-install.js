const fs = require('fs')
const path = require('path')
const cp = require('child_process')

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

function resolveRepoUrl(libDir) {
  const repoUrl = process.env.AUTOMATION_LIB_REPO || readRepoUrlFromGitConfig(libDir)
  if (!repoUrl) {
    throw new Error('未配置仓库地址：请设置 AUTOMATION_LIB_REPO')
  }
  return repoUrl
}

function ensureGitAvailable() {
  try {
    execGit(['--version'])
  } catch (error) {
    throw new Error(`未检测到 Git，请先安装 Git。${error.message || error}`)
  }
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
