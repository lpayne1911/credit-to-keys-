/**
 * DEPRECATED SHIM — the vehicle service contract / extended warranty catalog and
 * matcher now live in `./warranty/`. This module re-exports them under their
 * original names so existing imports and tests keep working. Prefer importing
 * directly from:
 *   - ./warranty/warranty-catalog          (catalog data)
 *   - ./warranty/detect-warranty-line-item (matcher)
 */
import {
  WARRANTY_DISPLAY_GROUPS,
  WARRANTY_DISPLAY_NAMES,
  matchTerms,
  type WarrantyDisplayGroup,
} from "./warranty/warranty-catalog";
import { isWarrantyLineItem } from "./warranty/detect-warranty-line-item";

export type ServiceContractGroup = WarrantyDisplayGroup;
export const SERVICE_CONTRACT_GROUPS = WARRANTY_DISPLAY_GROUPS;
export const SERVICE_CONTRACT_NAMES = WARRANTY_DISPLAY_NAMES;
export const SERVICE_CONTRACT_MATCH_TERMS = matchTerms;

/** @deprecated use `isWarrantyLineItem` from ./warranty/detect-warranty-line-item */
export const isServiceContract = isWarrantyLineItem;
