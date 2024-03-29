import { IdlTypes } from "@project-serum/anchor/dist/cjs/program/namespace/types";
import { OndaAwards } from "./idl/onda_awards";
import { OndaCompression } from "./idl/onda_compression";

export type OndaAwardsTypes = IdlTypes<OndaAwards>;
export type OndaCompressionTypes = IdlTypes<OndaCompression>;

export type DataV1 = OndaCompressionTypes["DataV1"];
export type LeafSchemaV1 = SnakeToCamelCaseObj<
  OndaCompressionTypes["LeafSchema"]["v1"]
>;
export type Gate = OndaCompressionTypes["Gate"];
export type Rule = OndaCompressionTypes["Rule"];
export type Operator = OndaCompressionTypes["Operator"];
export type CreateAwardArgs = OndaAwardsTypes["CreateAwardArgs"];

type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

type SnakeToCamelCaseObj<T> = T extends object
  ? {
      [K in keyof T as SnakeToCamelCase<K & string>]: T[K];
    }
  : T;
