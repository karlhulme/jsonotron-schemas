import { expect, test } from '@jest/globals'
import fs from 'fs'
import { Jsonotron } from '../src'

test('Unknown enum/schema type is not resolved using fully qualified name.', () => {
  const jsonotron = new Jsonotron({})
  expect(jsonotron.validateValue('https://jsonotron.org/test/madeup', 'madeup')).toEqual({ resolved: false, validated: false, message: expect.stringContaining('Unrecognised type.') })
})

test('Valid enum value can be validated.', () => {
  const colorType = fs.readFileSync('./test/testTypes/color.yaml', 'utf-8')
  const jsonotron = new Jsonotron({ resources: [colorType] })
  expect(jsonotron.validateValue('https://jsonotron.org/test/color', 'RED')).toEqual({ resolved: true, validated: true })
})

test('Valid enum value array can be validated.', () => {
  const colorType = fs.readFileSync('./test/testTypes/color.yaml', 'utf-8')
  const jsonotron = new Jsonotron({ resources: [colorType] })
  expect(jsonotron.validateValueArray('https://jsonotron.org/test/color', [])).toEqual({ resolved: true, validated: true })
  expect(jsonotron.validateValueArray('https://jsonotron.org/test/color', ['RED'])).toEqual({ resolved: true, validated: true })
  expect(jsonotron.validateValueArray('https://jsonotron.org/test/color', ['BLUE', 'YELLOW'])).toEqual({ resolved: true, validated: true })
})

test('Invalid enum value cannot be validated.', () => {
  const colorType = fs.readFileSync('./test/testTypes/color.yaml', 'utf-8')
  const jsonotron = new Jsonotron({ resources: [colorType] })
  expect(jsonotron.validateValue('https://jsonotron.org/test/color', 'PUSE')).toEqual({ resolved: true, validated: false, message: expect.any(String) })
})

test('Valid schema value can be validated using short or qualified name.', () => {
  const positiveIntegerType = fs.readFileSync('./test/testTypes/positiveInteger.yaml', 'utf-8')
  const jsonotron = new Jsonotron({ resources: [positiveIntegerType] })
  expect(jsonotron.validateValue('https://jsonotron.org/test/positiveInteger', 25)).toEqual({ resolved: true, validated: true })
})

test('Valid schema value that references other schemas can be validated.', () => {
  const colorType = fs.readFileSync('./test/testTypes/color.yaml', 'utf-8')
  const householdType = fs.readFileSync('./test/testTypes/household.yaml', 'utf-8')
  const positiveIntegerType = fs.readFileSync('./test/testTypes/positiveInteger.yaml', 'utf-8')
  const stringType = fs.readFileSync('./test/testTypes/string.yaml', 'utf-8')
  const jsonotron = new Jsonotron({ resources: [colorType, householdType, positiveIntegerType, stringType] })
  expect(jsonotron.validateValue('https://jsonotron.org/test/household', { location: 'here', familyMemberCount: 2, doorColor: 'GREEN' })).toEqual({ resolved: true, validated: true })
})

test('Valid schema value array can be validated.', () => {
  const positiveIntegerType = fs.readFileSync('./test/testTypes/positiveInteger.yaml', 'utf-8')
  const jsonotron = new Jsonotron({ resources: [positiveIntegerType] })
  expect(jsonotron.validateValueArray('https://jsonotron.org/test/positiveInteger', [])).toEqual({ resolved: true, validated: true })
  expect(jsonotron.validateValueArray('https://jsonotron.org/test/positiveInteger', [1])).toEqual({ resolved: true, validated: true })
  expect(jsonotron.validateValueArray('https://jsonotron.org/test/positiveInteger', [1, 2, 3, 4])).toEqual({ resolved: true, validated: true })
})

test('Invalid schema value cannot be validated.', () => {
  const positiveIntegerType = fs.readFileSync('./test/testTypes/positiveInteger.yaml', 'utf-8')
  const jsonotron = new Jsonotron({ resources: [positiveIntegerType] })
  expect(jsonotron.validateValue('https://jsonotron.org/test/positiveInteger', 'invalid')).toEqual({ resolved: true, validated: false, message: expect.any(String) })
})
