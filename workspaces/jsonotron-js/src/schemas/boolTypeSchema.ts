import { commonProperties } from './commonProperties'
import { commonRequires } from './commonRequires'

/**
 * Describes the bool scalar type.
 */
export const boolTypeSchema = {
  $id: 'boolScalarTypeSchema',
  title: 'Boolean Scalar Type Schema',
  type: 'object',
  additionalProperties: false,
  properties: {
    ...commonProperties
  },
  required: [
    ...commonRequires
  ]
}