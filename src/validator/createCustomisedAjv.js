const Ajv = require('ajv')
const customTypeOfGenerator = require('./customTypeOfGenerator')

/**
 * Creates an instance of AJV with full formatting, support for the customTypeOf keyword
 * and support for all the given formatValidators.
 * @param {Object} formatValidators An object where each key is a format validator function.
 */
const createCustomisedAjv = (formatValidators) => {
  const ajv = new Ajv({
    format: 'full', // 'full' mode supports format validators
    ownProperties: true // only iterate over objects found directly on the object
  })

  // add the format validators
  if (Array.isArray(formatValidators)) {
    for (const formatValidator of formatValidators) {
      ajv.addFormat(`custom-${formatValidator.name}`, { validate: formatValidator.validate })
    }
  }

  // add the customTypeOf keyword used by schemas that support functions
  ajv.addKeyword('customTypeOf', { compile: customTypeOfGenerator })

  return ajv
}

module.exports = createCustomisedAjv
