import {
  IdlTypes,
  InstructionContextFnArgs,
} from "@project-serum/anchor/dist/cjs/program/namespace/types";
import { OndaSocial } from "./idl";

export type OndaSocialTypes = IdlTypes<OndaSocial>;
export type EntryData = OndaSocialTypes["EntryData"];
export type LeafSchemaV1 = SnakeToCamelCaseObj<
  OndaSocialTypes["LeafSchema"]["v1"]
>;
export type RestrictionType = OndaSocialTypes["RestrictionType"];

type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

type SnakeToCamelCaseObj<T> = T extends object
  ? {
      [K in keyof T as SnakeToCamelCase<K & string>]: T[K];
    }
  : T;
