const fs = require('fs')
const path = require('path')
const cp = require('child_process')

let cachedChromePath = null

function getChromePath() {
  if (cachedChromePath) return cachedChromePath

  let chromePath

  if (utools.isMacOS()) {
    chromePath =
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    if (!fs.existsSync(chromePath)) throw new Error('未安装 Chrome')
    cachedChromePath = chromePath
    return chromePath
  }

  if (utools.isWindows()) {
    const suffix = `${path.sep}Google${path.sep}Chrome${path.sep}Application${path.sep}chrome.exe`
    const prefixes = [
      process.env.LOCALAPPDATA,
      process.env.PROGRAMFILES,
      process.env['PROGRAMFILES(X86)'],
    ].filter(Boolean)

    for (const prefix of prefixes) {
      const p = path.join(prefix, suffix)
      if (fs.existsSync(p)) {
        cachedChromePath = p
        return p
      }
    }
    throw new Error('未安装 Chrome')
  }

  throw new Error('暂不支持当前系统')
}

/**
 * 构造 Chrome 启动参数
 * options:
 *  - incognito: boolean
 *  - profileDir: string (如 'Profile 2' / 'Default')
 *  - newWindow: boolean
 *  - extraArgs: string[]
 */
function buildChromeArgs(url, options = {}) {
  const args = []
  if (options.newWindow) args.push('--new-window')
  if (options.incognito) args.push('--incognito')
  if (options.profileDir) args.push(`--profile-directory=${options.profileDir}`)
  if (Array.isArray(options.extraArgs)) args.push(...options.extraArgs)
  args.push(url)
  return args
}

/**
 * 优先用 Chrome 打开；找不到 Chrome 时自动降级为系统默认浏览器打开（shellOpenExternal）
 */
function openUrl(url, options = {}) {
  const target = String(url)
  try {
    const chromePath = getChromePath()
    const args = buildChromeArgs(target, options)
    cp.spawn(chromePath, args, { detached: true, stdio: 'ignore' }).unref()
    return { used: 'chrome', url: target }
  } catch (e) {
    // 自动化助手支持 shellOpenExternal（系统默认浏览器）
    try {
      utools.shellOpenExternal(target)
    } catch (_) {
      // ignore
    }
    return {
      used: 'default',
      url: target,
      error: String(e && e.message ? e.message : e),
    }
  }
}

module.exports = { getChromePath, openUrl, buildChromeArgs }
