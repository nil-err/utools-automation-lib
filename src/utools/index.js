function notify(msg) {
  try {
    utools.showNotification(String(msg))
  } catch (_) {
    // ignore
  }
}

function copyText(text) {
  try {
    utools.copyText(String(text))
  } catch (_) {
    // ignore
  }
}

/**
 * debug：复制文本 + 通知（默认复制 URL 非常好用）
 */
function debugCopy(text, title = '已复制') {
  copyText(text)
  notify(
    `${title}: ${String(text).slice(0, 120)}${
      String(text).length > 120 ? '…' : ''
    }`
  )
}

module.exports = { notify, copyText, debugCopy }
