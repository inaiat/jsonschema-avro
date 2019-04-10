import { IAvroProp, JSONSchemaTypes, IConvertationOptions } from './interfaces';
import { parse } from 'url';
import { JSONSchema7 } from 'json-schema';
import { AvroTypes } from './AvroTypes.enum';

const firstToUpper = (str: string) => `${str[0].toUpperCase()}${str.slice(1)}`;

const normalizeName = (fileName: string) =>
  fileName
    .split('-')
    .map(firstToUpper)
    .join('');

const getName = ($id: string) =>
  $id.replace(RE_FILENAME, (_, p1, p2) => normalizeName(p2));

// Json schema on the left, avro on the right
const typeMapping: {
  [key: string]: string;
} = {
  string: AvroTypes.String,
  null: AvroTypes.Null,
  boolean: AvroTypes.Boolean,
  integer: AvroTypes.Integer,
  number: AvroTypes.Number,
};

const RE_SYMBOL = /^[A-Za-z_][A-Za-z0-9_]*$/;
const RE_NAMESPACE = /(.*)\/(v\d)\/.*/i;
const RE_ESCAPE = /([^a-z0-9]+)/gi;
const RE_FILENAME = /.*\/(v\d)\/([a-z-]*).json/i;

const getTopLevelFields = (
  { properties, required }: JSONSchema7,
  additionalFields: IAvroProp[] = [],
) => {
  if (!properties) {
    return [...additionalFields];
  }

  return [...convertProperties(properties, required), ...additionalFields];
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

  return {
    namespace: getNamespace(jsonSchema.$id),
    name: getName(jsonSchema.$id),
    type: AvroTypes.Record,
    doc: jsonSchema.description,
    fields: getTopLevelFields(jsonSchema, options.additionalFields),
  };
};

const getNamespace = (id: string = '') => {
  const url = parse(id);

  if (!url.host) {
    throw new Error(
      'Every top-level schema should set $id to an absolute URI: https://json-schema.org/understanding-json-schema/structuring.html#id',
    );
  }

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
};

const isComplex = (schema: any) => {
  return schema.type === 'object';
};

const isArray = (schema: any) => {
  return schema.type === 'array';
};

const hasEnum = (schema: any) => {
  return Boolean(schema.enum);
};

const convertProperties = (schema: any, required: string[] = []): any => {
  return Object.keys(schema).map(item => {
    const isRequired = Boolean(required.find(key => key === item));

    if (isComplex(schema[item])) {
      return convertComplexProperty(item, schema[item], isRequired);
    } else if (isArray(schema[item])) {
      return convertArrayProperty(item, schema[item], isRequired);
    } else if (hasEnum(schema[item])) {
      return convertEnumProperty(item, schema[item], isRequired);
    }

    return convertProperty(item, schema[item], isRequired);
  });
};

const convertComplexProperty = (
  name: string,
  contents: any,
  isRequired: boolean = false,
) => {
  const type = {
    type: AvroTypes.Record,
    name: `${name}_record`,
    fields: convertProperties(contents.properties || {}, contents.required),
  };

  return {
    name,
    doc: contents.description || '',
    ...resolveRequiredType(type, isRequired),
  };
};

const convertArrayProperty = (
  name: string,
  contents: any,
  isRequired: boolean,
) => {
  const type = {
    type: AvroTypes.Array,
    items: isComplex(contents.items)
      ? {
          type: AvroTypes.Record,
          name: `${name}_record`,
          fields: convertProperties(
            contents.items.properties || {},
            contents.items.required,
          ),
        }
      : convertProperty(name, contents.items, true),
  };

  return {
    name,
    doc: contents.description || '',
    ...resolveRequiredType(type, isRequired),
  };
};

const convertEnumProperty = (
  name: string,
  contents: any,
  isRequired: boolean = false,
) => {
  const valid = contents.enum.every((symbol: any) => RE_SYMBOL.test(symbol));
  const type = valid
    ? {
        type: AvroTypes.Enum,
        name: `${name}_enum`,
        symbols: contents.enum,
      }
    : AvroTypes.String;
  const prop: any = {
    name,
    doc: contents.description || '',
    ...resolveRequiredType(type, isRequired),
  };

  if (contents.hasOwnProperty('default')) {
    prop.default = contents.default;
  }

  return prop;
};

const convertProperty = (
  name: string,
  value: {
    description?: string;
    default?: any;
    type: JSONSchemaTypes | JSONSchemaTypes[];
  },
  isRequired: boolean = false,
) => {
  const prop: IAvroProp = {
    name,
    doc: value.description || '',
  };

  const { type, default: defaultValue } = resolveRequiredType(
    getTypeForProp(value),
    isRequired,
  );

  prop.type = type;

  if (defaultValue !== undefined) {
    prop.default = defaultValue;
  }

  if (value.hasOwnProperty('default')) {
    prop.default = value.default;
  }

  return prop;
};

const getTypeForProp = (value: any): any => {
  if (Array.isArray(value.type)) {
    return value.type.map((type: JSONSchemaTypes) => typeMapping[type]);
  }

  return typeMapping[value.type];
};

const resolveRequiredType = (type: any, isRequired: boolean) => {
  const calculatedType = isRequired
    ? type
    : Array.isArray(type)
    ? [AvroTypes.Null, ...type.filter((k: any) => k !== AvroTypes.Null)]
    : [AvroTypes.Null, type];

  if (calculatedType[0] === AvroTypes.Null) {
    return {
      type: calculatedType,
      default: null,
    };
  }

  return { type };
};
