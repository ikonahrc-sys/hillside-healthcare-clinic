export function formatMrn(mrnNumber: number): string {
  return `P${mrnNumber.toString().padStart(5, "0")}`;
}
