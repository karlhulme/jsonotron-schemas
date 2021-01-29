/**
 * Represents a reference from one type to another type.
 */
export interface GraphQLRefType {
  /**
   * The name of a type.
   */
  name: string

  /**
   * The name of another type.
   */
  refTypeName: string

  /**
   * True if the refTypeName refers to a GraphQL scalar.
   */
  isScalarRef: boolean

  /**
   * The number of array wrappers around the referenced type.
   */
  refTypeArrayCount: number
}
