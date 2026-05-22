export function bucketBatches(batches, intervalMinutes) {
  if (!batches.length) return []

  const intervalMs = intervalMinutes * 60 * 1000
  const bucket = ts => Math.floor(ts / intervalMs) * intervalMs
  const fmt = ts => {
    const d = new Date(ts)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const map = new Map()
  for (const b of batches) {
    const key = bucket(b.timestamp)
    const prev = map.get(key) ?? { adults: 0, children: 0 }
    map.set(key, { adults: prev.adults + b.adults, children: prev.children + b.children })
  }

  const keys = [...map.keys()].sort((a, b) => a - b)
  const first = keys[0]
  const last = keys[keys.length - 1]

  const result = []
  for (let ts = first; ts <= last; ts += intervalMs) {
    const { adults, children } = map.get(ts) ?? { adults: 0, children: 0 }
    result.push({ label: fmt(ts), adults, children })
  }
  return result
}
