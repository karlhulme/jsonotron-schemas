/**
 * Represents an item within an enumeration definition.
 */
export interface EnumTypeDefItem {
  /**
   * The underlying value of the item.
   */
  value: string

  /**
   * The display text of the value in English.
   */
  text: string
 
  /**
   * If populated, this value explains why the value was deprecated
   * and/or which item to use instead.
   */
  deprecated?: string

  /**
   * A symbol associated with the item.
   */
  symbol?: string
 
  /**
   * Additional data associated with the item.
   */
  data?: unknown
 
  /**
   * The documentation associated with this item.
   */
  summary?: string
}
