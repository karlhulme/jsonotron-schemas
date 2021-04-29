import { commonProperties } from './commonProperties'
import { identifierRegex, typeReferenceRegex } from './commonRegex'
import { commonRequires } from './commonRequires'

/**
 * A JSON schema for the record type definition.
 */
export const recordTypeDefSchema = {
  $id: 'recordTypeDefSchema',
  title: 'Record Type Def Schema',
  type: 'object',
  additionalProperties: false,
  properties: {
    ...commonProperties,
    properties: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { 
            type: 'string',
            pattern: identifierRegex
          },
          summary: {
            type: 'string'
          },
          propertyType: {
            type: 'string',
            pattern: typeReferenceRegex
          },
          isArray: {
            type: 'boolean'
          },
          isRequired: {
            type: 'boolean'
          },
          deprecated: {
            type: 'string'
          }
        },
        required: ['name', 'summary', 'propertyType']
      }
    },
    variants: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: {
            type: 'string',
            pattern: identifierRegex
          },
          partial: {
            type: 'boolean'
          },
          includeProperties: {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          excludeProperties: {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          deprecated: {
            type: 'string'
          }
        },
        required: ['name', 'partial']
      }
    },
    validTestCases: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          value: {},
          summary: {
            type: 'string'
          }
        },
        required: [
          'value'
        ]
      }
    },
    invalidTestCases: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          value: {},
          summary: {
            type: 'string'
          }
        },
        required: [
          'value'
        ]
      }
    }
  },
  required: [
    ...commonRequires,
    'properties',
    'validTestCases'
  ]
}