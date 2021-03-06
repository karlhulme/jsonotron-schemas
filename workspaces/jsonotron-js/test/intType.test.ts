import { expect, test } from '@jest/globals'
import { parseTypeLibrary, ValueValidationError, ValueValidator } from '../src'
import { reindentYaml, TEST_DOMAIN, asError } from './shared.test'

const intType = reindentYaml(`
  ---
  kind: int
  system: test
  name: testInt
  summary: A test int.
  minimum: 3
  maximum: 6
`)

function setupValidator () {
  const typeLibrary = parseTypeLibrary({ resourceStrings: [intType], domain: TEST_DOMAIN })
  const validator = new ValueValidator(typeLibrary)
  return validator
}

test('A valid int type can be parsed.', async () => {
  expect(() => parseTypeLibrary({ resourceStrings: [intType] })).not.toThrow()
})

test('A valid int value passes validation.', async () => {
  const validator = setupValidator()
  expect(() => validator.validateValue('test/testInt', 3)).not.toThrow()
  expect(() => validator.validateValue('test/testInt', 4)).not.toThrow()
  expect(() => validator.validateValue('test/testInt', 5)).not.toThrow()
  expect(() => validator.validateValue('test/testInt', 6)).not.toThrow()
})

test('An int that is below the minimum is rejected.', async () => {
  const validator = setupValidator()
  expect(() => validator.validateValue('test/testInt', 2)).toThrow(asError(ValueValidationError))
})

test('An int that is above the maximum is rejected.', async () => {
  const validator = setupValidator()
  expect(() => validator.validateValue('test/testInt', 7)).toThrow(asError(ValueValidationError))
})
