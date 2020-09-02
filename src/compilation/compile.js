import check from 'check-types'
import { patchEnumType, validateEnumType } from '../enumType'
import { patchFieldBlockType, validateFieldBlockType } from '../fieldBlockType'
import { patchSchemaType, validateSchemaType } from '../schemaType'
import { createJsonSchemaForFieldBlock, createJsonSchemaForSchemaType, createJsonSchemaForEnumType } from '../jsonSchemaGeneration'
import { createCustomisedAjv } from '../jsonSchemaValidation'
import { TypeSystem } from '../shared'

/**
 * @typedef {import('ajv').Ajv} Ajv
 */

/**
 * Validates the enum types, patching and adding those that are successfully validated to the given result.
 * @param {TypeSystem} result A type system.
 * @param {Ajv} ajv A json validator.
 * @param {Array} enumTypes An array of enum types.
 */
function validateAndPatchEnumTypes (result, ajv, enumTypes) {
  enumTypes.forEach(enumType => {
    const enumTypeValidationResult = validateEnumType(ajv, enumType)

    if (enumTypeValidationResult.isSuccessful()) {
      result.addPatchedEnumType(patchEnumType(enumType))
    }

    enumTypeValidationResult.getErrors().forEach(error => result.addErrorObject(error))
    enumTypeValidationResult.getWarnings().forEach(warning => result.addWarningObject(warning))
  })
}

/**
 * Validates the schema types, patching and adding those that are successfully validated to the given result.
 * @param {TypeSystem} result A type system.
 * @param {Ajv} ajv A json validator.
 * @param {Array} schemaTypes An array of schema types.
 */
function validateAndPatchSchemaTypes (result, ajv, schemaTypes) {
  schemaTypes.forEach(schemaType => {
    const schemaTypeValidationResult = validateSchemaType(ajv, schemaType)

    if (schemaTypeValidationResult.isSuccessful()) {
      result.addPatchedSchemaType(patchSchemaType(schemaType))
    }

    schemaTypeValidationResult.getErrors().forEach(error => result.addErrorObject(error))
    schemaTypeValidationResult.getWarnings().forEach(warning => result.addWarningObject(warning))
  })
}

/**
 * Validates the field block types, patching and adding those that are successfully validated to the given result.
 * @param {TypeSystem} result A type system.
 * @param {Ajv} ajv A json validator.
 * @param {Array} fieldBlockTypes An array of field block types.
 */
function validateAndPatchFieldBlockTypes (result, ajv, fieldBlockTypes) {
  fieldBlockTypes.forEach(fieldBlockType => {
    const fieldBlockTypeValidationResult = validateFieldBlockType(ajv, fieldBlockType)

    if (fieldBlockTypeValidationResult.isSuccessful()) {
      result.addPatchedFieldBlockType(patchFieldBlockType(fieldBlockType))
    }

    fieldBlockTypeValidationResult.getErrors().forEach(error => result.addErrorObject(error))
    fieldBlockTypeValidationResult.getWarnings().forEach(warning => result.addWarningObject(warning))
  })
}

/**
 * Generate a json schema for the given schemaType using the other arrays
 * if they are referenced.
 * If the schema generation fails then the error will be recorded in the result.
 * @param {TypeSystem} result A type system.
 * @param {Object} schemaType A schema type to generate a schema for.
 * @param {Array} schemaTypes An array of schema types.
 * @param {Array} enumTypes An array of enum types.
 */
function generateJsonSchemaForSchemaType (result, schemaType, schemaTypes, enumTypes) {
  try {
    return createJsonSchemaForSchemaType(schemaType, schemaTypes, enumTypes)
  } catch (err) {
    result.addError(schemaType.name, 'Schema Type JSON Schema generation failed.', { message: err.toString() })
  }
}

/**
 * Generate a json schema for the given fieldBlockType.
 * If the schema generation fails then the error will be recorded in the result.
 * @param {TypeSystem} result A type system.
 * @param {Object} fieldBlockType A field block type to generate a schema for.
 * @param {Array} schemaTypes An array of schema types.
 * @param {Array} enumTypes An array of enum types.
 */
function generateJsonSchemaForFieldBlockType (result, fieldBlockType, schemaTypes, enumTypes) {
  try {
    return createJsonSchemaForFieldBlock(fieldBlockType, schemaTypes, enumTypes)
  } catch (err) {
    result.addError(fieldBlockType.name, 'Field Block Type JSON Schema generation failed.', { message: err.toString() })
  }
}

/**
 * Returns a function (value) that returns true if the given value conforms to the given json schema.
 * If the compilation fails then the error will be recorded in the result.
 * @param {TypeSystem} result A type system.
 * @param {Ajv} ajv A json validator.
 * @param {String} typeName The name of the type used to generate the JSON schema.
 * @param {Object} jsonSchema A json schema.
 */
function compileJsonSchema (result, ajv, typeName, jsonSchema) {
  try {
    return ajv.compile(jsonSchema)
  } catch (err) {
    result.addError(typeName, 'Type compilation failed.  If type is a schemaType then review its jsonSchema.', { message: err.toString() })
    return null
  }
}

/**
 * Checks that the examples on the schema type conform to the json schema.
 * If not, errors are added to the type system.
 * @param {TypeSystem} result A type system.
 * @param {Function} validator A function that returns true if the sole parameter conforms to a pre-set json schema.
 * @param {Object} schemaType A schema type.
 */
function verifySchemaTypeExamples (result, validator, schemaType) {
  schemaType.examples.forEach((example, index) => {
    if (!validator(example.value)) {
      validator.errors.forEach(error => {
        // include the error message in the templated string so that each error has a unique message.
        result.addError(schemaType.name, `Verification failed for examples[${index}]: ${error.message}`, error)
      })
    }
  })
}

/**
 * Checks that the valid test cases on the schema type conform to the json schema.
 * If not, errors are added to the type system.
 * @param {TypeSystem} result A type system.
 * @param {Function} validator A function that returns true if the sole parameter conforms to a pre-set json schema.
 * @param {Object} schemaType A schema type.
 */
function verifySchemaTypeValidTestCases (result, validator, schemaType) {
  schemaType.validTestCases.forEach((validTestCase, index) => {
    if (!validator(validTestCase)) {
      validator.errors.forEach(error => {
        // include the error message in the templated string so that each error has a unique message.
        result.addError(schemaType.name, `Verification failed for validTestCases[${index}]: ${error.message}`, error)
      })
    }
  })
}

/**
 * Checks that the invalid test cases on the schema type do not conform to the json schema.
 * If they unexpectedly pass, then errors are added to the type system.
 * @param {TypeSystem} result A type system.
 * @param {Function} validator A function that returns true if the sole parameter conforms to a pre-set json schema.
 * @param {Object} schemaType A schema type.
 */
function verifySchemaTypeInvalidTestCases (result, validator, schemaType) {
  schemaType.invalidTestCases.forEach((invalidTestCase, index) => {
    if (validator(invalidTestCase)) {
      result.addError(schemaType.name, `Verification passed (but should have failed) for invalidTestCases[${index}].`, { message: 'Validation was expected to fail but passed.' })
    }
  })
}

/**
 * Checks that the examples on the field block type conform to the json schema.
 * If not, errors are added to the type system.
 * @param {TypeSystem} result A type system.
 * @param {Function} validator A function that returns true if the sole parameter conforms to a pre-set json schema.
 * @param {Object} fieldBlockType A field block type.
 */
function verifyFieldBlockTypeExamples (result, validator, fieldBlockType) {
  fieldBlockType.examples.forEach((example, index) => {
    if (!validator(example.value)) {
      validator.errors.forEach(error => {
        // include the error message in the templated string so that each error has a unique message.
        result.addError(fieldBlockType.name, `Verification failed for examples[${index}]': ${error.message}`, error)
      })
    }
  })
}

/**
 * Checks that the examples on the field block type conform to the json schema.
 * If not, errors are added to the type system.
 * @param {TypeSystem} result A type system.
 * @param {Object} fieldBlockType A field block type.
 */
function verifyFieldBlockTypeDefaultValues (result, fieldBlockType) {
  Object.keys(fieldBlockType.fields).forEach(fieldName => {
    const field = fieldBlockType.fields[fieldName]

    if (typeof field.default !== 'undefined') {
      const fieldTypeValidationResult = result.executeFieldTypeValidator(field.type, field.default)
      check.assert(fieldTypeValidationResult.found, 'Validator was not found for default value.')

      if (!fieldTypeValidationResult.validated) {
        fieldTypeValidationResult.errors.forEach(error => {
          // include the error message in the templated string so that each error has a unique message.
          result.addError(fieldBlockType.name, `Verification failed for default value of field '${fieldName}': ${error.message}`, error)
        })
      }
    }
  })
}

/**
 * Returns a TypeSystem that describes which parts of the type system
 * described by the given enum types, schema types and format validators is valid.
 * @param {Object} resources An object that contains resources to be used in the compilation.
 * @param {Array} [resources.enumTypes] An array of enum types.
 * @param {Array} [resources.schemaTypes] An array of schema types.
 * @param {Array} [resources.formatValidators] An array of format validators.
 * @param {Array} [resources.fieldBlocks] An array of field blocks.
 * @returns {TypeSystem}
 */
export function compile ({ enumTypes = [], schemaTypes = [], formatValidators = [], fieldBlockTypes = [] } = {}) {
  check.assert.array.of.object(enumTypes)
  check.assert.array.of.object(schemaTypes)
  check.assert.array.of.object(formatValidators)
  check.assert.array.of.object(fieldBlockTypes)

  const ajv = createCustomisedAjv(formatValidators)
  const result = new TypeSystem()

  validateAndPatchEnumTypes(result, ajv, enumTypes)
  validateAndPatchSchemaTypes(result, ajv, schemaTypes)
  validateAndPatchFieldBlockTypes(result, ajv, fieldBlockTypes)

  result.getPatchedEnumTypes().forEach(enumType => {
    const jsonSchema = createJsonSchemaForEnumType(enumType)
    const validator = compileJsonSchema(result, ajv, enumType.name, jsonSchema)
    result.addEnumTypeValidator(enumType.name, validator)
  })

  result.getPatchedSchemaTypes().forEach(schemaType => {
    const jsonSchema = generateJsonSchemaForSchemaType(result, schemaType, result.getPatchedSchemaTypes(), result.getPatchedEnumTypes())

    if (jsonSchema) {
      const validator = compileJsonSchema(result, ajv, schemaType.name, jsonSchema)

      if (validator) {
        verifySchemaTypeExamples(result, validator, schemaType)
        verifySchemaTypeValidTestCases(result, validator, schemaType)
        verifySchemaTypeInvalidTestCases(result, validator, schemaType)
        result.addSchemaTypeValidator(schemaType.name, validator)
      }
    }
  })

  result.getPatchedFieldBlockTypes().forEach(fieldBlockType => {
    const jsonSchema = generateJsonSchemaForFieldBlockType(result, fieldBlockType, result.getPatchedSchemaTypes(), result.getPatchedEnumTypes())

    if (jsonSchema) {
      const validator = compileJsonSchema(result, ajv, fieldBlockType.name, jsonSchema)

      if (validator) {
        verifyFieldBlockTypeExamples(result, validator, fieldBlockType)
        verifyFieldBlockTypeDefaultValues(result, fieldBlockType)
        result.addFieldBlockTypeValidator(fieldBlockType.name, validator)
      }
    }
  })

  return result
}