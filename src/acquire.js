module.exports = function acquire(id) {
  return new Promise((resolve, reject) => {
    try {
      // see if we have this locally installed already
      const package = require(id)
      resolve(package)
    } catch (error) {
      reject(error)
    }
  })
}