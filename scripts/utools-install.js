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

function resolveRepoUrl() {
  const pkgPath = path.join(__dirname, '..', 'package.json')
  let repoUrl = process.env.AUTOMATION_LIB_REPO || ''
  if (!repoUrl && fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      repoUrl = pkg.repository && pkg.repository.url
    } catch (_) {
      // ignore
    }
  }
  if (!repoUrl) {
    throw new Error('未配置仓库地址：请设置 AUTOMATION_LIB_REPO 或 package.json#repository.url')
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

  const repoUrl = resolveRepoUrl()
  const libDir = path.join(utools.getPath('userData'), 'automation-lib')

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
