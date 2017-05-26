module.exports = function acquire(id) {
  return new Promise((resolve, reject) => {
    try {
      const package = require(id)
      resolve(package)
    } catch (error) {
      reject(error)
    }
  })
}