function isHexId(s) {
  const v = String(s || '').trim()
  return /^(?:[0-9A-Fa-f]{34}|[0-9A-Fa-f]{53})$/.test(v)
}

/**
 * 支持：单个 hex / 逗号分隔 / 空白分隔 / 换行分隔
 * 返回去重后的数组
 */
function parseHexIds(input) {
  const raw = String(input || '').trim()
  if (!raw) return []
  const parts = raw
    .split(/[\s,，]+/)
    .map((x) => x.trim())
    .filter(Boolean)
  const ok = parts.filter(isHexId)
  // 去重（保持顺序）
  const seen = new Set()
  const out = []
  for (const x of ok) {
    const k = x.toLowerCase()
    if (!seen.has(k)) {
      seen.add(k)
      out.push(x)
    }
  }
  return out
}

module.exports = { isHexId, parseHexIds }
