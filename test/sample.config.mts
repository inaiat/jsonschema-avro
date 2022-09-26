import { JSONSchema7 } from "json-schema";
import { Config } from "../src/types.js";

const inJson: JSONSchema7 = {
  $id: 'http://domain/schemas/v1/myschema.json',
  description: 'Example description',
  type: 'object',
  properties: {
    first_name: { type: 'string' },
    address: {
      type: 'object',
      properties: {
        street_address: { type: 'string' },
      },
    },
  },
}

const config: Config = {
  outDir: 'dist',
  models: {
    address: {
      jsonSchema: inJson,
    },
  },
}

export default config