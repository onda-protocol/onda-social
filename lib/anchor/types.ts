import { IdlTypes } from "@project-serum/anchor/dist/cjs/program/namespace/types";
import { OndaSocial } from "./idl";

export type OndaSocialTypes = IdlTypes<OndaSocial>;
export type EntryData = OndaSocialTypes["EntryData"];
export type LeafSchema = OndaSocialTypes["LeafSchema"];
