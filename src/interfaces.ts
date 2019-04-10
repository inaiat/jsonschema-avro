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
  | Array<string | IAvroEnumType | IAvroRecordType>;

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
