// IAS 16: Property, Plant and Equipment
// Depreciation and Asset Management

export type DepreciationMethod = "STRAIGHT_LINE" | "DECLINING_BALANCE" | "UNITS_OF_PRODUCTION";

interface FixedAsset {
    id: string;
    name: string;
    acquisitionDate: Date;
    acquisitionCost: number;
    residualValue: number;
    usefulLifeYears?: number;
    usefulLifeUnits?: number;
    depreciationMethod: DepreciationMethod;
    accumulatedDepreciation: number;
    unitsProducedToDate?: number;
}

// Calculate annual depreciation - Straight Line Method
export function straightLineDepreciation(
    cost: number,
    residualValue: number,
    usefulLifeYears: number
): number {
    const depreciableAmount = cost - residualValue;
    return depreciableAmount / usefulLifeYears;
}

// Calculate annual depreciation - Declining Balance Method
export function decliningBalanceDepreciation(
    cost: number,
    accumulatedDepreciation: number,
    residualValue: number,
    rate: number // e.g., 0.20 for 20%
): number {
    const carryingAmount = cost - accumulatedDepreciation;
    const depreciation = carryingAmount * rate;

    // Cannot depreciate below residual value
    const minCarryingAmount = residualValue;
    if (carryingAmount - depreciation < minCarryingAmount) {
        return Math.max(0, carryingAmount - minCarryingAmount);
    }
    return depreciation;
}

// Calculate depreciation - Units of Production Method
export function unitsOfProductionDepreciation(
    cost: number,
    residualValue: number,
    totalEstimatedUnits: number,
    unitsProducedThisPeriod: number
): number {
    const depreciableAmount = cost - residualValue;
    const depreciationPerUnit = depreciableAmount / totalEstimatedUnits;
    return depreciationPerUnit * unitsProducedThisPeriod;
}

// Calculate depreciation for an asset
export function calculateDepreciation(
    asset: FixedAsset,
    periodUnits?: number,
    decliningBalanceRate?: number
): {
    periodDepreciation: number;
    newAccumulatedDepreciation: number;
    carryingAmount: number;
    isFullyDepreciated: boolean;
} {
    let periodDepreciation = 0;

    switch (asset.depreciationMethod) {
        case "STRAIGHT_LINE":
            if (!asset.usefulLifeYears) throw new Error("Useful life required for straight-line");
            periodDepreciation = straightLineDepreciation(
                asset.acquisitionCost,
                asset.residualValue,
                asset.usefulLifeYears
            );
            break;

        case "DECLINING_BALANCE":
            const rate = decliningBalanceRate || 0.20;
            periodDepreciation = decliningBalanceDepreciation(
                asset.acquisitionCost,
                asset.accumulatedDepreciation,
                asset.residualValue,
                rate
            );
            break;

        case "UNITS_OF_PRODUCTION":
            if (!asset.usefulLifeUnits || !periodUnits) {
                throw new Error("Units required for units-of-production method");
            }
            periodDepreciation = unitsOfProductionDepreciation(
                asset.acquisitionCost,
                asset.residualValue,
                asset.usefulLifeUnits,
                periodUnits
            );
            break;
    }

    // Round to 2 decimal places
    periodDepreciation = Math.round(periodDepreciation * 100) / 100;

    // Ensure we don't over-depreciate
    const maxDepreciation = asset.acquisitionCost - asset.residualValue - asset.accumulatedDepreciation;
    if (periodDepreciation > maxDepreciation) {
        periodDepreciation = Math.max(0, maxDepreciation);
    }

    const newAccumulatedDepreciation = asset.accumulatedDepreciation + periodDepreciation;
    const carryingAmount = asset.acquisitionCost - newAccumulatedDepreciation;
    const isFullyDepreciated = carryingAmount <= asset.residualValue;

    return {
        periodDepreciation,
        newAccumulatedDepreciation,
        carryingAmount,
        isFullyDepreciated,
    };
}

// IAS 36: Impairment Testing
export function testForImpairment(
    carryingAmount: number,
    recoverableAmount: number // Higher of fair value less costs to sell, and value in use
): {
    isImpaired: boolean;
    impairmentLoss: number;
    newCarryingAmount: number;
} {
    const isImpaired = carryingAmount > recoverableAmount;
    const impairmentLoss = isImpaired ? carryingAmount - recoverableAmount : 0;
    const newCarryingAmount = isImpaired ? recoverableAmount : carryingAmount;

    return { isImpaired, impairmentLoss, newCarryingAmount };
}

// Calculate depreciation schedule
export function generateDepreciationSchedule(
    asset: FixedAsset,
    periods: number
): {
    period: number;
    openingBalance: number;
    depreciation: number;
    accumulatedDepreciation: number;
    closingBalance: number;
}[] {
    const schedule = [];
    let accumulatedDep = asset.accumulatedDepreciation;
    let carryingAmount = asset.acquisitionCost - accumulatedDep;

    for (let i = 1; i <= periods; i++) {
        const tempAsset = { ...asset, accumulatedDepreciation: accumulatedDep };
        const result = calculateDepreciation(tempAsset);

        if (result.isFullyDepreciated) break;

        schedule.push({
            period: i,
            openingBalance: carryingAmount,
            depreciation: result.periodDepreciation,
            accumulatedDepreciation: result.newAccumulatedDepreciation,
            closingBalance: result.carryingAmount,
        });

        accumulatedDep = result.newAccumulatedDepreciation;
        carryingAmount = result.carryingAmount;
    }

    return schedule;
}

export default {
    straightLineDepreciation,
    decliningBalanceDepreciation,
    unitsOfProductionDepreciation,
    calculateDepreciation,
    testForImpairment,
    generateDepreciationSchedule,
};
