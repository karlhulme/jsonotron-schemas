import { createCustomisedAjv } from '../validator'
import { ValidationResult } from '../utils'
import { createEnumTypeSchema } from './createEnumTypeSchema'

/**
 * @typedef {import('ajv').Ajv} Ajv
 */

/**
 * Validates the given enumType against an enumType schema,
 * using the given Ajv, and
 * adds any errors to the given ValidationResult.
 * @param {ValidationResult} result A validation result.
 * @param {Ajv} ajv A json schema validator.
 * @param {Object} enumType An enum type.
 */
function validateWithSchema (result, ajv, enumType) {
  const enumTypeSchema = createEnumTypeSchema()
  const validator = ajv.compile(enumTypeSchema)

  if (!validator(enumType)) {
    validator.errors.forEach(error => {
      result.addError(enumType.name, 'Failed to validate against enumType schema.', error)
    })
  }
}

/**
 * Validates the given enumType against an enumType schema
 * that includes the documentation,
 * using the given Ajv, and
 * adds any unseen errors to the given ValidationResult as warnings.
 * @param {ValidationResult} result A validation result.
 * @param {Ajv} ajv A json schema validator.
 * @param {Object} enumType An enum type.
 */
function validateWithDocsSchema (result, ajv, enumType) {
  const enumTypeDocsSchema = createEnumTypeSchema({ includeDocs: true })
  const docsValidator = ajv.compile(enumTypeDocsSchema)

  if (!docsValidator(enumType)) {
    docsValidator.errors.forEach(error => {
      if (!result.containsError(error)) {
        result.addWarning(enumType.name, 'Failed to validate against enumType schema with documentation.', error)
      }
    })
  }
}

/**
 * Adds an error to the result if any of the item values are not unique.
 * @param {ValidationResult} result A validation result.
 * @param {Object} enumType An enum type object to check.
 */
function validateItemValuesAreUnique (result, enumType) {
  const seen = []

  if (Array.isArray(enumType.items)) {
    enumType.items.forEach((item, index) => {
      if (typeof item === 'object') {
        if (seen.includes(item.value)) {
          result.addError(enumType.name, `The value '${item.value}' at index ${index} is not unique.`, { dataPath: `items[${index}].value` })
        } else {
          seen.push(item.value)
        }
      }
    })
  }
}

/**
 * Validates the given enum type and returns a ValidationResult.
 * @param {Object} enumType An enum type.
 */
export function validateEnumType (enumType) {
  const result = new ValidationResult()
  const ajv = createCustomisedAjv()

  validateWithSchema(result, ajv, enumType)
  validateWithDocsSchema(result, ajv, enumType)
  validateItemValuesAreUnique(result, enumType)

  return result
}