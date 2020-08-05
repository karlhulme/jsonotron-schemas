const check = require('check-types')
const { createJsonSchemaDefinition } = require('../fieldType')
const { consts } = require('../utils')
const getFieldOrEnumTypeFromArrays = require('./getFieldOrEnumTypeFromArrays')

/**
 * Build the properties object.
 * @param {Object} fieldBlock A block of field declarations.
 * @param {Array} fieldTypes An array of field types.
 * @param {Array} enumTypes An array of enum types.
 */
function buildPropertiesObject (fieldBlock, fieldTypes, enumTypes) {
  const properties = {}

  for (const fieldName in fieldBlock) {
    const field = fieldBlock[fieldName]

    properties[fieldName] = field.isArray
      ? { type: 'array', items: { $ref: consts.JSON_SCHEMA_DEFINITIONS_PATH + field.type } }
      : { $ref: consts.JSON_SCHEMA_DEFINITIONS_PATH + field.type }
  }

  return properties
}

/**
 * Build the array of required field names.
 * @param {Object} fieldBlock A block of field declarations.
 */
function buildRequiredArray (fieldBlock) {
  const required = []

  for (const fieldName in fieldBlock) {
    const field = fieldBlock[fieldName]

    if (field.isRequired) {
      required.push(fieldName)
    }
  }

  return required
}

/**
 * Build the definitions object.
 * @param {Object} fieldBlock A block of field declarations.
 * @param {Array} fieldTypes An array of field types.
 * @param {Array} enumTypes An array of enum types.
 */
function buildDefinitionsBlock (fieldBlock, fieldTypes, enumTypes) {
  const refFieldTypes = []
  const refEnumTypes = []

  for (const fieldName in fieldBlock) {
    const field = fieldBlock[fieldName]

    const fieldType = getFieldOrEnumTypeFromArrays(field.type, fieldTypes, enumTypes)

    if (fieldType.type === 'field' && !refFieldTypes.includes(field.type)) {
      refFieldTypes.push(field.type)
    }

    if (fieldType.type === 'enum' && !refEnumTypes.includes(field.type)) {
      refEnumTypes.push(field.type)
    }
  }

  return createJsonSchemaDefinition(refFieldTypes, refEnumTypes, fieldTypes, enumTypes)
}

/**
 * Creates a JSON Schema for the given block of field declarations.
 * @param {String} title The title to be applied to the returned schema.
 * @param {Object} fieldBlock A block of field declaratinons.
 * @param {Array} fieldTypes An array of field types.
 * @param {Array} enumTypes An array of enum types.
 */
function createJsonSchemaForFieldBlock (title, fieldBlock, fieldTypes, enumTypes) {
  check.assert.string(title)
  check.assert.object(fieldBlock)
  check.assert.array.of.object(fieldTypes)
  check.assert.array.of.object(enumTypes)

  return {
    $schema: consts.JSON_SCHEMA_DECLARATION,
    title,
    type: 'object',
    properties: buildPropertiesObject(fieldBlock, fieldTypes, enumTypes),
    required: buildRequiredArray(fieldBlock),
    definitions: buildDefinitionsBlock(fieldBlock, fieldTypes, enumTypes)
  }
}

module.exports = createJsonSchemaForFieldBlock
