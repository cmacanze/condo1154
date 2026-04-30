import { LateFeeType } from "@prisma/client";
import Decimal from "decimal.js";

export function calculateLateFee(
  baseAmount: number | string,
  lateFeeType: LateFeeType,
  lateFeeValue: number | string
): number {
  const base = new Decimal(baseAmount.toString());
  const feeVal = new Decimal(lateFeeValue.toString());

  if (lateFeeType === "none") return 0;
  if (lateFeeType === "fixed") return feeVal.toNumber();
  if (lateFeeType === "percentage") {
    return base.mul(feeVal).div(100).toDecimalPlaces(2).toNumber();
  }
  return 0;
}

export function calculateOutstanding(
  totalDue: number | string,
  totalPaid: number | string
): number {
  const due = new Decimal(totalDue.toString());
  const paid = new Decimal(totalPaid.toString());
  const outstanding = due.minus(paid);
  return outstanding.lessThan(0) ? 0 : outstanding.toNumber();
}
