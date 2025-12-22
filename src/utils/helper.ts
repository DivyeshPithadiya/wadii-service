import { Types } from "mongoose";

export const oid = (id: string | Types.ObjectId) =>
  typeof id === "string" ? new Types.ObjectId(id) : id;

export function parseNumberParam(
  value: string | undefined,
  fallback: number
): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}
export function recalcFoodPackage(pkg: any) {
  let total = 0;

  pkg.sections.forEach((section: any) => {
    const sectionTotal = section.items.reduce(
      (sum: number, item: any) => sum + item.pricePerPerson,
      0
    );

    section.sectionTotalPerPerson = sectionTotal;
    total += sectionTotal;
  });

  pkg.totalPricePerPerson = total;
  return pkg;
}
export function calculateFoodCost(foodPackage: any, guests: number) {
  const foodPerPerson = foodPackage.totalPricePerPerson;
  return foodPerPerson * guests;
}

export function calculateTotals({
  foodPackage,
  numberOfGuests,
  services = [],
}: {
  foodPackage: any;
  numberOfGuests: number;
  services?: any[];
}) {
  const foodCostTotal = foodPackage.totalPricePerPerson * numberOfGuests;

  const servicesTotal = services.reduce((sum, s) => sum + (s.price || 0), 0);

  return {
    foodCostTotal,
    totalAmount: foodCostTotal + servicesTotal,
  };
}
