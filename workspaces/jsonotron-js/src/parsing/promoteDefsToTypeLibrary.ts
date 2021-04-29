import { EnumType, EnumTypeDef, JsonotronTypeDef, RecordType, RecordTypeDef, TypeLibrary, TypeLibraryDef } from 'jsonotron-interfaces'
import {
  createJsonSchemaForBoolTypeDef, createJsonSchemaForEnumTypeDef,
  createJsonSchemaForFloatTypeDef, createJsonSchemaForIntTypeDef,
  createJsonSchemaForObjectTypeDef, createJsonSchemaForRecordTypeDef,
  createJsonSchemaForStringTypeDef
} from '../typeDefValueSchemas'

/**
 * Promotes the given type library definition to a type library by
 * supplying additional properties and expanding out the record type variants.
 * @param domain A domain for JSON schemas.
 * @param typeLibraryDef A type library definition.
 */
export function promoteDefsToTypeLibrary (domain: string, typeLibraryDef: TypeLibraryDef): TypeLibrary {
  const typeLibrary: TypeLibrary = {
    jsonSchemaDomain: domain,
    boolTypes: typeLibraryDef.boolTypeDefs.map(t => ({ ...t, jsonSchema: createJsonSchemaForBoolTypeDef(domain, t) as Record<string, unknown> })),
    enumTypes: typeLibraryDef.enumTypeDefs.map(t => convertEnumTypeDefToEnumType(domain, t)), 
    floatTypes: typeLibraryDef.floatTypeDefs.map(t => ({ ...t, jsonSchema: createJsonSchemaForFloatTypeDef(domain, t) as Record<string, unknown> })),
    intTypes: typeLibraryDef.intTypeDefs.map(t => ({ ...t, jsonSchema: createJsonSchemaForIntTypeDef(domain, t) as Record<string, unknown> })),
    objectTypes: typeLibraryDef.objectTypeDefs.map(t => ({ ...t, jsonSchema: createJsonSchemaForObjectTypeDef(domain, t) as Record<string, unknown> })),
    recordTypes: convertRecordTypeDefsToRecordTypes(domain, typeLibraryDef.recordTypeDefs, typeLibraryDef),
    stringTypes: typeLibraryDef.stringTypeDefs.map(t => ({ ...t, jsonSchema: createJsonSchemaForStringTypeDef(domain, t) as Record<string, unknown> }))  
  }

  return typeLibrary
}

/**
 * Returns an EnumType based on the given EnumTypeDef.
 * @param domain A domain for JSON schemas.
 * @param enumTypeDef An enum type definition.
 */
function convertEnumTypeDefToEnumType (domain: string, enumTypeDef: EnumTypeDef): EnumType {
  return {
    kind: enumTypeDef.kind,
    system: enumTypeDef.system,
    name: enumTypeDef.name,
    summary: enumTypeDef.summary,
    deprecated: enumTypeDef.deprecated,
    dataType: enumTypeDef.dataType,
    jsonSchema: createJsonSchemaForEnumTypeDef(domain, enumTypeDef) as Record<string, unknown>,
    items: enumTypeDef.items.map((itemDef, index) => ({
      value: itemDef.value,
      text: itemDef.text,
      summary: itemDef.summary,
      symbol: itemDef.symbol,
      deprecated: itemDef.deprecated,
      data: itemDef.data,
      isFirst: index === 0,
      isLast: index === enumTypeDef.items.length - 1
    }))
  }
}

/**
 * Returns an equivalent array of record types.
 * @param domain A domain for JSON schemas.
 * @param recordTypeDefs An array of record type definitions.
 * @param typeLibraryDef A type library definition.
 */
function convertRecordTypeDefsToRecordTypes (domain: string, recordTypeDefs: RecordTypeDef[], typeLibraryDef: TypeLibraryDef): RecordType[] {
  const result: RecordType[] = []

  recordTypeDefs.forEach(recordTypeDef => {
    result.push(...convertRecordTypeDefToRecordTypes(domain, recordTypeDef, typeLibraryDef))
  })

  return result
}

/**
 * Returns an equivalent array of record types, one for the main definition
 * and one additional record type for each variant.
 * @param domain A domain for JSON schemas.
 * @param recordTypeDef A record type definition.
 * @param typeLibraryDef A type library definition.
 */
function convertRecordTypeDefToRecordTypes (domain: string, recordTypeDef: RecordTypeDef, typeLibraryDef: TypeLibraryDef): RecordType[] {
  const result: RecordType[] = []

  const doesArrayContainType = (array: JsonotronTypeDef[], system: string, name: string) => {
    return array.findIndex(type => type.system === system && type.name === name) > -1
  }

  const recordType: RecordType = {
    kind: recordTypeDef.kind,
    system: recordTypeDef.system,
    name: recordTypeDef.name,
    summary: recordTypeDef.summary,
    jsonSchema: createJsonSchemaForRecordTypeDef(domain, recordTypeDef) as Record<string, unknown>,
    deprecated: recordTypeDef.deprecated,
    properties: recordTypeDef.properties.map((property, index) => {
      const propertyTypeSystem = getSystemPartOfSystemQualifiedType(property.propertyType)
      const propertyTypeName = getNamePartOfSystemQualifiedType(property.propertyType)

      return {
        name: property.name,
        summary: property.summary,
        deprecated: property.deprecated,
        isRequired: property.isRequired,
        isOptional: !property.isRequired,
        isArray: property.isArray,
        propertyType: property.propertyType,
        propertyTypeSystem,
        propertyTypeName,
        isFirst: index === 0,
        isLast: index === recordTypeDef.properties.length - 1,
        isBool: doesArrayContainType(typeLibraryDef.boolTypeDefs, propertyTypeSystem, propertyTypeName),
        isEnum: doesArrayContainType(typeLibraryDef.enumTypeDefs, propertyTypeSystem, propertyTypeName),
        isFloat: doesArrayContainType(typeLibraryDef.floatTypeDefs, propertyTypeSystem, propertyTypeName),
        isInt: doesArrayContainType(typeLibraryDef.intTypeDefs, propertyTypeSystem, propertyTypeName),
        isObject: doesArrayContainType(typeLibraryDef.objectTypeDefs, propertyTypeSystem, propertyTypeName),
        isRecord: doesArrayContainType(typeLibraryDef.recordTypeDefs, propertyTypeSystem, propertyTypeName),
        isString: doesArrayContainType(typeLibraryDef.stringTypeDefs, propertyTypeSystem, propertyTypeName)    
      }
    })
  }

  result.push(recordType)

  // TODO: build the variants

  return result
}

/**
 * Returns the system part of the given system qualified type.
 * @param systemQualifiedType A system qualified type in the form sys/name.
 */
function getSystemPartOfSystemQualifiedType (systemQualifiedType: string) {
  return systemQualifiedType.substring(0, systemQualifiedType.indexOf('/'))
}

/**
 * Returns the name part of the given system qualified type.
 * @param systemQualifiedType A system qualified type in the form sys/name.
 */
function getNamePartOfSystemQualifiedType (systemQualifiedType: string) {
  return systemQualifiedType.substring(systemQualifiedType.indexOf('/') + 1)
}