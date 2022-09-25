import { JSONSchema7 } from 'json-schema';
import { AvroTypes } from './avro-types.enum.js';

interface IAvroEnumType {
  type: 'enum';
  name: string;
  symbols: string[];
}

interface IAvroRecordType {
  type: 'record';
  name: string;
  fields: IAvroProp[];
}

type IAvroType =
  | string
  | IAvroEnumType
  | IAvroRecordType
  | (string | IAvroEnumType | IAvroRecordType)[];

export interface IAvroProp {
  name: string;
  doc: string;
  default?: any;
  type?: IAvroType;
  logicalType?: string;
}

export type JSONSchemaTypes =
  | 'string'
  | 'null'
  | 'boolean'
  | 'integer'
  | 'number';

export interface IJSONSchema {
  type: JSONSchemaTypes | string;
  properties?: {
    [key: string]: {
      type: JSONSchemaTypes | string;
    };
  };
  required?: string[];
  $id: string;
  description: string;
}

export interface IConvertationOptions {
  additionalFields?: IAvroProp[];
}

export type AvroSchemaResult = {
  namespace?: string,
  name: string,
  type: AvroTypes.Record,
  doc?: string,
  fields: unknown[]
}

// export interface Config {
//   /**
//    * An array of dictionaries, for each of your schema files,
//    * containing the class and optionally a custom avsc file name.
//    */
//   models: {
//     /** The decorated typescript class of the model */
//     class: Constructable<unknown>
//     /**
//      * The file name of the generated avsc file.
//      *
//      * default: "<model-name>.avsc"
//      */
//     avscFileName?: string
//   }[]
//   /**
//    * The schema output folder, relative to the current working
//    * directory.
//    */
//   outDir?: string
// }

export type SchemaModelItem = {
  jsonSchema: JSONSchema7
  options?: IConvertationOptions
}

export type SchemaModel = Record<string, SchemaModelItem>

export type Config = {
  outDir?: string,
	models: SchemaModel
}

export type Logger = Pick<typeof console, 'debug' | 'log' | 'info' | 'warn' | 'error'>