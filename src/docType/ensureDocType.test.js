/* eslint-env jest */
const { JsonotronDocTypeValidationError } = require('jsonotron-errors')
const { createCustomisedAjv } = require('../validator')
const ensureDocType = require('./ensureDocType')

const testEnumTypes = [
  {
    name: 'boolean',
    items: [
      { value: true },
      { value: false }
    ]
  }
]

const testFieldTypes = [
  {
    name: 'integer',
    jsonSchema: {
      type: 'integer'
    }
  }, {
    name: 'float',
    jsonSchema: {
      type: 'number'
    }
  }, {
    name: 'string',
    jsonSchema: {
      type: 'string'
    }
  }
]

const createSimpleValidDocType = () => ({
  name: 'simpleDoc',
  fields: {
    propA: { type: 'integer', isRequired: true, canUpdate: true },
    propB: { type: 'float', default: 1.2 },
    propQ: { type: 'string', isArray: true }
  }
})

const createComplexValidDocType = () => ({
  name: 'candidateDoc',
  pluralName: 'candidateDocs',
  title: 'Candidate',
  pluralTitle: 'Candidates',
  paragraphs: ['This is an introduction.'],
  fields: {
    propA: { type: 'string', isRequired: true, canUpdate: true, paragraphs: ['this is my description'] },
    propB: { type: 'string', isDeprecated: true }
  },
  examples: [
    { value: { propA: 'a', propB: 'b' } },
    { value: { propA: 'a', propB: 'b' }, paragraphs: ['some notes'] }
  ],
  preSave: (doc) => {},
  validate: (doc) => {},
  calculatedFields: {
    propAandB: {
      inputFields: ['propA', 'propB'],
      type: 'string',
      value: doc => `${doc.propA || ''}${doc.propB || ''}`
    },
    propAwithB: {
      inputFields: ['propA', 'propB'],
      type: 'string',
      isArray: true,
      paragraphs: ['described', 'fully', 'here'],
      value: doc => [doc.propA, doc.propB]
    }
  },
  filters: {
    byDateOfBirth: {
      title: 'by Date of Birth',
      paragraphs: ['how this filter works'],
      parameters: {
        x: { type: 'string', isRequired: true, paragraphs: ['parameter info'] },
        y: { type: 'string', isArray: true }
      },
      implementation: input => `some_col = "${input.x}"`,
      examples: [
        { value: { x: 'xx', y: 'yy' } },
        { value: { x: 'xx', y: 'yy' }, paragraphs: ['filter information'] }
      ]
    },
    byFixedValue: {
      implementation: input => 'some_col = "fixed"'
    }
  },
  ctor: {
    parameters: {
      c: { type: 'boolean' },
      d: { type: 'boolean', isArray: true, isRequired: true, paragraphs: ['a required parameter'] }
    },
    paragraphs: ['what the constructor', 'does'],
    implementation: input => {
      return {
        a: input.a,
        b: input.c ? 'hello' : 'world'
      }
    },
    examples: [
      { value: { c: true, d: [false, false] } },
      { value: { c: false, d: [true, true] }, paragraphs: ['ctor information'] }
    ]
  },
  operations: {
    changePropB: {
      title: 'Change Property B',
      paragraphs: ['this is what the operation does.'],
      parameters: {
        c: { type: 'string', isRequired: true },
        propQ: { type: 'string', isArray: true, paragraphs: ['an array operation parameter.'] }
      },
      implementation: (doc, input) => {
        return {
          b: input.c && doc.b ? 'hello' : 'world'
        }
      },
      examples: [
        { value: { c: 'opValue', propQ: ['great', 'run'] } },
        { value: { c: 'opText', propQ: ['marathon'] }, paragraphs: ['operation information'] }
      ]
    },
    doNothing: {}
  },
  policy: {
    canDeleteDocuments: false,
    canFetchWholeCollection: false,
    canReplaceDocuments: false,
    maxOpsSize: 10
  },
  docStoreOptions: {
    someValueA: 'a',
    someValueB: 123
  }
})

test('A simple doc type can be verified.', () => {
  const ajv = createCustomisedAjv()
  expect(() => ensureDocType(ajv, createSimpleValidDocType(), testFieldTypes, testEnumTypes)).not.toThrow()
})

test('The functions added to a doc type by default can be executed.', () => {
  const ajv = createCustomisedAjv()
  const simpleDocType = createSimpleValidDocType()
  ensureDocType(ajv, simpleDocType, testFieldTypes, testEnumTypes)
  expect(() => simpleDocType.preSave()).not.toThrow()
  expect(() => simpleDocType.validate()).not.toThrow()
  expect(simpleDocType.ctor.implementation()).toEqual({})

  const complexDocType = createComplexValidDocType()
  ensureDocType(ajv, complexDocType, testFieldTypes, testEnumTypes)
  expect(complexDocType.operations.doNothing.implementation()).toEqual({})
})

test('A doc type without any fields can be verified.', () => {
  const ajv = createCustomisedAjv()
  const docType = createSimpleValidDocType()
  delete docType.fields
  expect(() => ensureDocType(ajv, docType, testFieldTypes, testEnumTypes)).not.toThrow()
})

test('A complex doc type can be verified.', () => {
  const ajv = createCustomisedAjv()
  expect(() => ensureDocType(ajv, createComplexValidDocType(), testFieldTypes, testEnumTypes)).not.toThrow()
})

test('An invalid doc type cannot be verified.', () => {
  const ajv = createCustomisedAjv()
  const docType = createSimpleValidDocType()
  delete docType.name
  expect(() => ensureDocType(ajv, docType, testFieldTypes, testEnumTypes)).toThrow(JsonotronDocTypeValidationError)
})

// test('Doc type with unrecognised constructor parameter field type fails validation.', () => {
//   const ajv = createCustomisedAjv()
//   const candidate = createComplexValidDocType()
//   candidate.ctor.parameters.propD = { type: 'invalid' }
//   expect(() => ensureDocType(ajv, candidate, testFieldTypes, testEnumTypes)).toThrow(/Constructor parameter 'propD' declares an unrecognised type of 'invalid'./)
// })

test('Doc type with invalid default fails validation.', () => {
  const ajv = createCustomisedAjv()
  const candidate = createComplexValidDocType()
  candidate.fields.propB.default = 999
  expect(() => ensureDocType(ajv, candidate, testFieldTypes, testEnumTypes)).toThrow(/Field name 'propB' declares a default value '999'/)
})

test('Doc type with calculated field input that refers to unrecognised field fails validation.', () => {
  const ajv = createCustomisedAjv()
  const candidate = createComplexValidDocType()
  candidate.calculatedFields.propAandB.inputFields = ['a', 'madeup', 'b']
  expect(() => ensureDocType(ajv, candidate, testFieldTypes, testEnumTypes)).toThrow(/Calculated field 'propAandB' requires unrecognised input field/)
})

test('Doc type with a field name that clashes with a system property name fails validation.', () => {
  const ajv = createCustomisedAjv()
  const candidate = createComplexValidDocType()
  candidate.fields.id = { type: 'string' }
  expect(() => ensureDocType(ajv, candidate, testFieldTypes, testEnumTypes)).toThrow(/Field name 'id' clashes with a reserved system field name/)
})

test('Doc type with a calculated field name that clashes with a system property name fails validation.', () => {
  const ajv = createCustomisedAjv()
  const candidate = createComplexValidDocType()
  candidate.calculatedFields.id = { inputFields: [], type: 'string', value: () => 'hi' }
  expect(() => ensureDocType(ajv, candidate, testFieldTypes, testEnumTypes)).toThrow(/Calculated field name 'id' clashes with a reserved system field name/)
})

test('Doc type with a calculated field name that clashes with a declared field name fails validation.', () => {
  const ajv = createCustomisedAjv()
  const candidate = createComplexValidDocType()
  candidate.calculatedFields.propA = { inputFields: [], type: 'string', value: () => 'hi' }
  expect(() => ensureDocType(ajv, candidate, testFieldTypes, testEnumTypes)).toThrow(/Calculated field name 'propA' clashes with a declared field name/)
})
