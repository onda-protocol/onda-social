import { IdlTypes } from "@project-serum/anchor/dist/cjs/program/namespace/types";
import { OndaRewards } from "./idl/onda_rewards";
import { OndaCompression } from "./idl/onda_compression";
import { OndaProfile } from "./idl/onda_profile";

export type OndaRewardsTypes = IdlTypes<OndaRewards>;
export type OndaCompressionTypes = IdlTypes<OndaCompression>;
export type OndaProfileTypes = IdlTypes<OndaProfile>;

export type DataV1 = OndaCompressionTypes["DataV1"];
export type LeafSchemaV1 = SnakeToCamelCaseObj<
  OndaCompressionTypes["LeafSchema"]["v1"]
>;
export type Gate = OndaCompressionTypes["Gate"];
export type Rule = OndaCompressionTypes["Rule"];
export type Operator = OndaCompressionTypes["Operator"];
export type RewardMetadata = OndaRewardsTypes["RewardMetadata"];

type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

type SnakeToCamelCaseObj<T> = T extends object
  ? {
      [K in keyof T as SnakeToCamelCase<K & string>]: T[K];
    }
  : T;
