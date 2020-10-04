/* eslint-env jest */
import { validateEnumType } from './validateEnumType.js'
import { createCustomisedAjv } from '../jsonSchemaValidation/index.js'

function createFullEnumType () {
  return {
    name: 'candidateEnumType',
    title: 'Candidate Enum Type Here',
    paragraphs: ['A description of the enum', 'appears here.'],
    items: [
      { value: 'en', text: 'England', paragraphs: [], symbol: 'EN' },
      { value: 'us', text: 'United States', paragraphs: ['The United States of America'], isDeprecated: false },
      { value: 'fr', text: 'France' }
    ]
  }
}

function testBody (mutator, passWithoutDocs, passWithDocs) {
  const errorFunc = () => {}
  const ajv = createCustomisedAjv()
  const candidate = createFullEnumType()
  mutator(candidate)
  expect(validateEnumType(ajv, candidate, errorFunc, false)).toEqual(passWithoutDocs)
  expect(validateEnumType(ajv, candidate, errorFunc, true)).toEqual(passWithDocs)
}

test('An invalid enum type is not successfully validated.', () => {
  testBody(e => { delete e.name }, false, false)
  testBody(e => { e.name = 123 }, false, false)
  testBody(e => { e.name = '123' }, false, false)
  testBody(e => { e.name = '.abc' }, false, false)
  testBody(e => { e.name = 'abc.' }, false, false)
  testBody(e => { e.name = 'too.many.dots' }, false, false)

  testBody(e => { e.title = 123 }, false, false)

  testBody(e => { e.paragraphs = 123 }, false, false)
  testBody(e => { e.paragraphs = [123] }, false, false)

  testBody(e => { delete e.items }, false, false)
  testBody(e => { e.items = 123 }, false, false)
  testBody(e => { e.items = [] }, false, false)
  testBody(e => { e.items = [123] }, false, false)
  testBody(e => { delete e.items[0].value }, false, false)
  testBody(e => { e.items[0].value = 123 }, false, false)
  testBody(e => { e.items[1].value = 'en' }, false, false) // this creates 'en' as a duplicated value
  testBody(e => { delete e.items[0].text }, false, false)
  testBody(e => { e.items[0].text = 123 }, false, false)
  testBody(e => { e.items[0].symbol = 123 }, false, false)
  testBody(e => { e.items[0].isDeprecated = 123 }, false, false)
  testBody(e => { e.items[0].paragraphs = 123 }, false, false)
  testBody(e => { e.items[0].paragraphs = [123] }, false, false)
})

test('An undocumented enum type is successfully validated unless documentation is required.', () => {
  testBody(e => { delete e.title }, true, false)

  testBody(e => { delete e.paragraphs }, true, false)
  testBody(e => { e.paragraphs = [] }, true, false)
})

test('A fully documented enum type is successfully validated.', () => {
  testBody(e => e, true, true)
  testBody(e => { e.name = 'namespace.candidateEnumType' }, true, true)
})
