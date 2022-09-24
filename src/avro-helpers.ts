import { IAvroProp, JSONSchemaTypes, AvroSchemaResult } from './interfaces';
import { createHash } from 'crypto';
import { AvroTypes } from './avro-types.enum';

const RE_SYMBOL = /^[A-Za-z_][A-Za-z0-9_]*$/;

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

const md5 = (data: any) =>
  createHash('md5')
    .update(data)
    .digest('hex');

const firstToUpper = (str: string) => `${str[0].toUpperCase()}${str.slice(1)}`;

const isComplex = (schema: any) => {
  return schema.type === 'object';
};

const isArray = (schema: any) => {
  return schema.type === 'array';
};

const hasEnum = (schema: any) => {
  return Boolean(schema.enum);
};

const getComplexType = (
  simpleName: string,
  contents: { properties?: any; required?: string[] },
  parent: string,
) => {
  const name = parent ? `${simpleName}_${md5(parent)}` : `${simpleName}_record`;

  return {
    type: AvroTypes.Record,
    name,
    fields: convertProperties(
      contents.properties || {},
      contents.required,
      name,
    ),
  };
};

const convertComplexProperty = (
  name: string,
  contents: any,
  isRequired: boolean = false,
  item: string,
) => {
  const type = getComplexType(name, contents, item);

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
  item: string,
) => {
  const type = {
    type: AvroTypes.Array,
    items: isComplex(contents.items)
      ? getComplexType(name, contents.items, item)
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

const getTypeForProp = (value: any): any => {
  if (Array.isArray(value.type)) {
    return value.type.map((type: JSONSchemaTypes) => typeMapping[type]);
  }

  return typeMapping[value.type];
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
    value.default,
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

const resolveRequiredType = (
  type: any,
  isRequired: boolean,
  defaultValue?: any,
) => {
  let calculatedType;
  const isDefaulted = typeof defaultValue !== 'undefined';

  if (isRequired) {
    calculatedType = type;
  } else {
    if (isDefaulted) {
      if (Array.isArray(type)) {
        calculatedType = [
          ...type.filter((k: any) => k !== AvroTypes.Null),
          AvroTypes.Null,
        ];
      } else {
        calculatedType = [type, AvroTypes.Null];
      }
    } else if (Array.isArray(type)) {
      calculatedType = [
        AvroTypes.Null,
        ...type.filter((k: any) => k !== AvroTypes.Null),
      ];
    } else {
      calculatedType = [AvroTypes.Null, type];
    }
  }

  if (calculatedType[0] === AvroTypes.Null) {
    return {
      type: calculatedType,
      default: null,
    };
  }

  if (typeof defaultValue !== 'undefined') {
    return {
      type: calculatedType,
      default: defaultValue,
    };
  }

  return { type: calculatedType };
};

export const normalizeName = (fileName: string) =>
  fileName
    .split('-')
    .map(firstToUpper)
    .join('');

export const getValuable = (obj: AvroSchemaResult) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => typeof v !== 'undefined'),
  ) as AvroSchemaResult

export const convertProperties = (
  schema: any,
  required: string[] = [],
  parent = '',
): any => {
  return Object.keys(schema).map(item => {
    const isRequired = Boolean(required.find(key => key === item));

    if (isComplex(schema[item])) {
      return convertComplexProperty(item, schema[item], isRequired, parent);
    } else if (isArray(schema[item])) {
      return convertArrayProperty(item, schema[item], isRequired, parent);
    } else if (hasEnum(schema[item])) {
      return convertEnumProperty(item, schema[item], isRequired);
    }

    return convertProperty(item, schema[item], isRequired);
  });
};