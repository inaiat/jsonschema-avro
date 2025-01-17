import { convert } from '../src/index.js';
import assert from 'assert';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { JSONSchema7 } from 'json-schema';
const sampleDir = 'test/samples';

const readJSONFile = (filename: string) =>
  JSON.parse(readFileSync(filename, { encoding: 'utf8' }));

const readTestData = (dir: string) => ({
  schema: readJSONFile(join(process.cwd(), sampleDir, dir, 'input.json')),
  expected: readJSONFile(join(process.cwd(), sampleDir, dir, 'expected.json')),
});

describe('json-schema-avro', () => {
  describe('convert()', () => {
    const testDirs = readdirSync(join(process.cwd(), sampleDir));

    testDirs.forEach((dir: string) => {
      describe(dir, () => {
        const { schema, expected } = readTestData(dir);
        let result: any;

        before(() => {
          result = convert(schema);
        });

        it('converts to avro', () => {
          assert.deepEqual(result, expected);
        });
      });
    });

    it('should allow to define namespace with $id', () => {
      const schema: JSONSchema7 = {
        $id: 'http://yourdomain.com/schemas/v1/myschema.json',
        type: 'object',
        description: 'foo',
      };
      const expected = {
        doc: 'foo',
        fields: [],
        type: 'record',
        name: 'Myschema',
        namespace: 'com.yourdomain.schemas',
      };

      const result = convert(schema);

      assert.deepEqual(result, expected);
    });

    it('should allow to pass additional fields', () => {
      const schema: JSONSchema7 = {
        $id: 'http://yourdomain.com/schemas/v1/myschema.json',
        type: 'object',
        description: 'foo',
      };
      const expected = {
        doc: 'foo',
        fields: [
          {
            doc: 'Event timestamp',
            logicalType: 'timestamp-millis',
            name: '_timestamp',
            type: 'long',
          },
        ],
        type: 'record',
        name: 'Myschema',
        namespace: 'com.yourdomain.schemas',
      };

      const result = convert(schema, {
        additionalFields: [
          {
            doc: 'Event timestamp',
            logicalType: 'timestamp-millis',
            name: '_timestamp',
            type: 'long',
          },
        ],
      });

      assert.deepEqual(result, expected);
    });
  });
});
