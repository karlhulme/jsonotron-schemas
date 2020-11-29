import { SchemaType } from '../interfaces'

export const uuid: SchemaType = {
  name: 'uuid',
  title: 'UUID',
  paragraphs: ['A universally unique 128 bit number formatted as 32 alphanumeric characters and defined by RFC 4122.'],
  examples: [
    { value: '1ff9a681-092e-48ad-8d5a-1b0919ddb33b', paragraphs: ['An example.'] }
  ],
  validTestCases: ['123e4567-e89b-12d3-a456-426655440000'],
  invalidTestCases: [123, null, true, {}, [], 'invalid', 'a123e4567-e89b-12d3-a456-426655440000', '123E4567-E89B-12D3-A456-426655440000'],
  jsonSchema: {
    type: 'string',
    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  }
}