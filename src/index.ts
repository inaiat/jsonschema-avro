import { IAvroProp, IConvertationOptions } from './types.js';
import { parse } from 'node:url';
import { JSONSchema7 } from 'json-schema';
import { AvroTypes } from './avro-types.enum.js';
import { AvroLogicalTypes } from './avro-logical-types.enum.js';
import { convertProperties, getValuable, normalizeName } from './avro-helpers.js';

const RE_NAMESPACE = /(.*)\/(v\d)\/.*/i;
const RE_ESCAPE = /([^a-z0-9]+)/gi;
const RE_FILENAME = /.*\/(v\d)\/([a-z-]*).json/i;

const getName = ($id: string) =>
  $id.replace(RE_FILENAME, (_, p1, p2) => normalizeName(p2));

const getTopLevelFields = (
  { properties, required }: JSONSchema7,
  additionalFields: IAvroProp[] = [],
) => {
  if (!properties) {
    return [...additionalFields];
  }

  return [...convertProperties(properties, required), ...additionalFields];
};

const getNamespace = (id: string) => {
  const url = parse(id);
  if (url.host) {
    const prefix = url.host.split('.').reverse();

  if (!url.path) {
    return prefix.join('.');
  }
  return prefix
    .concat(
      url
        .path!.replace(RE_NAMESPACE, (_, p1) => p1)
        .replace(RE_ESCAPE, '.')
        .slice(1),
    )
    .join('.');
  }
  return undefined
};

export const convert = (
  jsonSchema: JSONSchema7,
  options: IConvertationOptions = {},
) => {
  if (!jsonSchema) {
    throw new Error('No schema given');
  }

  if (!jsonSchema.$id) {
    throw new Error(
      'No $id provided for schema: https://json-schema.org/understanding-json-schema/basics.html#declaring-a-unique-identifier',
    );
  }

  return getValuable({
    namespace: getNamespace(jsonSchema.$id),
    name: getName(jsonSchema.$id),
    type: AvroTypes.Record,
    doc: jsonSchema.description,
    fields: getTopLevelFields(jsonSchema, options.additionalFields),
  })
};

export { AvroTypes, AvroLogicalTypes };

export * from './types.js'
