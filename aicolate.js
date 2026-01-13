const { URL } = require('url')

/**
 * 生成 aicolate traces 查询 URL
 * - logids: string 或 string[]
 * - opts.rangeMs 默认 24h
 *
 * 关键：trace_filters 需要最终是“二重编码”。
 * 做法：先对 JSON 做一次 encodeURIComponent，再交给 URLSearchParams 再编码一次。
 */
function buildAicolateTraceUrl(logids, opts = {}) {
  const {
    baseUrl =
      'https://aicolate.tiktok-row.net/loop/console/enterprise/personal/space/7540597634176696321/observation/traces',
    platform = 'cozeloop',
    presetRange = 'unset',
    selectedSpanType = 'root_span',
    relation = 'and',
    rangeMs = 24 * 60 * 60 * 1000,
    nowAfter = 30 * 60 * 1000,
    now = Date.now(),
  } = opts

  const ids = Array.isArray(logids) ? logids.map(String) : [String(logids)]
  const end = now + nowAfter
  const start = end - rangeMs

  const filtersObj = {
    query_and_or: 'and',
    filter_fields: [
      {
        field_name: 'logid',
        logic_field_name_type: 'logid',
        query_type: 'in',
        values: ids,
      },
    ],
  }

  const traceFiltersParam = encodeURIComponent(JSON.stringify(filtersObj))

  const u = new URL(baseUrl)
  u.searchParams.set('relation', relation)
  u.searchParams.set('selected_span_type', selectedSpanType)
  u.searchParams.set('trace_platform', platform)
  u.searchParams.set('trace_preset_time_range', presetRange)
  u.searchParams.set('trace_start_time', String(start))
  u.searchParams.set('trace_end_time', String(end))
  u.searchParams.set('trace_filters', traceFiltersParam)

  return u.toString()
}

module.exports = { buildAicolateTraceUrl }
