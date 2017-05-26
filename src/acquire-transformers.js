module.exports = function (transformersObject) {
  const ts = require('typescript')

  const transformerIds = Object.keys(transformersObject)
  if (!transformerIds.length)
    return Promise.resolve([])

  const transformers = mapTransformersFromIds(transformerIds)
  const transformerModules = mapTransformersToModules(transformers)

  return Promise.all(transformerModules)
    .then(acquiredTransformers => {
      if (!acquiredTransformers.length)
        return []

      const stagedTransformers = []
      const before = acquiredTransformers.filter(t => t.runBefore)
      const after = acquiredTransformers.filter(t => t.runAfter)

      if (before.length)
        stagedTransformers.push(before)

      if (after.length)
        stagedTransformers.push(after)

      return stagedTransformers
    })

  function mapTransformersFromIds(transformerIds) {
    return transformerIds
      .map(id => {
        const transformer = transformersObject[id]

        // determine before and after
        let runBefore = false, runAfter = false
        if (transformer.when) {
          runBefore = transformer.when.indexOf('before') > -1
          runAfter = transformer.when.indexOf('after') > -1
        }

        // default before if no "when" entry found
        runBefore = !runBefore && !runAfter

        // determine require path
        let requirePath = transformer.require || `ts-transformer-${id}`
        if (ts.isRootedDiskPath(requirePath) === false)
          requirePath = ts.combinePaths(process.cwd(), requirePath)

        // get the config
        const config = transformer.config

        return {
          id,
          config,
          requirePath,
          runBefore,
          runAfter
        }
      })
  }

  function mapTransformersToModules(transformers) {
    const acquire = require('./acquire')
    return transformers
      .map(transformer => {
        return acquire(transformer.requirePath)
          .then(handler => {
            const isFunction = handler instanceof Function

            const {
              id,
              config,
              runBefore,
              runAfter
            } = transformer

            return {
              id,
              config,
              runBefore,
              runAfter,
              handler
            }
          })
      })
  }
}