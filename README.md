# json-schema-to-avro

[![npm](https://img.shields.io/npm/v/json-schema-to-avro.svg)](https://www.npmjs.com/package/jsonschema-avro)
[![Build Status](https://travis-ci.org/katsanva/jsonschema-avro.svg?branch=master)](https://travis-ci.org/katsanva/jsonschema-avro)

Converts JSON Schema definitions into Avro Schema definitions.

## Install

    yarn add @inaiat/jsonschema-avro
    yarn add @types/json-schema --dev

## Consume

```ts
import {convert} from '@inaiat/jsonschema-avro'
import type { JSONSchema7 } from 'json-schema'

const inJson: JSONSchema7 = {
  $id: 'http://your-domain.com/schemas/your-schema.json',
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

const avro = convert(inJson)
```

## Cli
- create a configuration file `json-schema-avro.mts` with the following content:

```ts
import type { Config } from '@inaiat/jsonschema-avro'
import { myDto } from './src/mymodel/myjsonschema.js'

const config: Config = {
  outDir: 'dist/avro-schemas',
  models: {
    user: {
      jsonSchema: myDto,
    },
  },
}

export default config
```

- finally add the generate script to your package.json and run it
  ```jsonc
  {
    // package.json
    "scripts": {
      "generate-avro-models": "jsonschema-avro generate",
      "postbuild": "yarn generate-avro-models" // If you want always generate models at build phase
    }
  }

- [Typebox](https://github.com/sinclairzx81/typebox). We can use some library that generates json schema and use directly on `jsonSchema` field.
```ts
// src/user-dto.ts
import type { Static} from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'

export const userDtoSchema = Type.Object({
  id: Type.Optional(Type.String({ maxLength: 22 })),
  name: Type.String({ maxLength: 100, minLength: 10 }),
  phone: Type.String({ maxLength: 20, minLength: 8 }),
}, { $id: 'userDto' })

import type { Config } from '@inaiat/jsonschema-avro'
import { userDtoSchema } from './src/usr-dto.js'

//json-schema-avro.mts
const config: Config = {
  outDir: 'dist/avro-schemas',
  models: {
    user: {
      jsonSchema: userDtoSchema,
    },
  },
}

export default config
```

## Configuration

`Json Schema to Avro` requires a configuration file written in TypeScript, to ensure the models have applied the decorators accordingly to read the required metadata.

The `models` record in the config is mandatory. Each entry requires `jsonSchema` - a reference to the TypeScript json schema (@types/json-schema). The name file is defined by entry name.

Additionally, an output directory `outDir` can be declared as seen above. If it is not specified, the generated schemas will be generate on folder 'avro-schemas' on root.

### Locating config not in root

By default, `Json Schema to Avro` will check the current working directory for the file `json-schema-avro.mts`. If your config is located in a different folder, pass it to the program using the flag `--config <path>` or `-c <path>`.

## Test

    npm test

## ESM Only

This package only supports to be directly imported in a ESM context.

For informations on how to use it in a CommonJS context, please check [this page](https://gist.github.com/ShogunPanda/fe98fd23d77cdfb918010dbc42f4504d).

## TODO

* Handle `anyOf` and `allOf`.
