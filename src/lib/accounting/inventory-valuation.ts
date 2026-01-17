// IFRS Inventory Valuation Service (IAS 2)
// Supports FIFO and Weighted Average (LIFO not permitted under IFRS)

export type InventoryValuationMethod = "FIFO" | "WEIGHTED_AVERAGE";

interface InventoryMovement {
    date: Date;
    type: "IN" | "OUT";
    quantity: number;
    unitCost: number;
}

interface InventoryBatch {
    date: Date;
    quantity: number;
    unitCost: number;
}

// FIFO Valuation (First In, First Out)
export function calculateFIFO(movements: InventoryMovement[]): {
    endingInventory: number;
    cogs: number;
    batches: InventoryBatch[];
} {
    const batches: InventoryBatch[] = [];
    let cogs = 0;

    // Sort by date
    const sorted = [...movements].sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const movement of sorted) {
        if (movement.type === "IN") {
            // Add new batch
            batches.push({
                date: movement.date,
                quantity: movement.quantity,
                unitCost: movement.unitCost,
            });
        } else {
            // Remove from oldest batches first (FIFO)
            let remaining = movement.quantity;
            while (remaining > 0 && batches.length > 0) {
                const oldest = batches[0];
                if (oldest.quantity <= remaining) {
                    cogs += oldest.quantity * oldest.unitCost;
                    remaining -= oldest.quantity;
                    batches.shift();
                } else {
                    cogs += remaining * oldest.unitCost;
                    oldest.quantity -= remaining;
                    remaining = 0;
                }
            }
        }
    }

    const endingInventory = batches.reduce((sum, b) => sum + b.quantity * b.unitCost, 0);
    return { endingInventory, cogs, batches };
}

// Weighted Average Valuation
export function calculateWeightedAverage(movements: InventoryMovement[]): {
    endingInventory: number;
    cogs: number;
    averageCost: number;
} {
    let totalQuantity = 0;
    let totalCost = 0;
    let cogs = 0;

    const sorted = [...movements].sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const movement of sorted) {
        if (movement.type === "IN") {
            totalCost += movement.quantity * movement.unitCost;
            totalQuantity += movement.quantity;
        } else {
            // Calculate weighted average at time of sale
            const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
            const cogsForSale = movement.quantity * avgCost;
            cogs += cogsForSale;
            totalCost -= cogsForSale;
            totalQuantity -= movement.quantity;
        }
    }

    const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    return { endingInventory: totalCost, cogs, averageCost };
}

// IAS 2: Lower of Cost or Net Realizable Value
export function calculateNRV(
    costValue: number,
    estimatedSellingPrice: number,
    estimatedCostsToSell: number
): { nrv: number; writeDown: number; useNRV: boolean } {
    const nrv = estimatedSellingPrice - estimatedCostsToSell;
    const useNRV = nrv < costValue;
    const writeDown = useNRV ? costValue - nrv : 0;

    return { nrv, writeDown, useNRV };
}

// Main valuation function
export function valuateInventory(
    movements: InventoryMovement[],
    method: InventoryValuationMethod
): {
    method: string;
    endingInventory: number;
    cogs: number;
    details: any;
} {
    if (method === "FIFO") {
        const result = calculateFIFO(movements);
        return {
            method: "FIFO (First In, First Out)",
            endingInventory: Math.round(result.endingInventory * 100) / 100,
            cogs: Math.round(result.cogs * 100) / 100,
            details: { batches: result.batches },
        };
    } else {
        const result = calculateWeightedAverage(movements);
        return {
            method: "Weighted Average",
            endingInventory: Math.round(result.endingInventory * 100) / 100,
            cogs: Math.round(result.cogs * 100) / 100,
            details: { averageCost: Math.round(result.averageCost * 100) / 100 },
        };
    }
}

export default {
    calculateFIFO,
    calculateWeightedAverage,
    calculateNRV,
    valuateInventory,
};
