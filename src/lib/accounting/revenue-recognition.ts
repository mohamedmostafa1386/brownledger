// IFRS 15: Revenue from Contracts with Customers
// Five-Step Revenue Recognition Model

export type RecognitionTiming = "POINT_IN_TIME" | "OVER_TIME";
export type ContractStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";

interface PerformanceObligation {
    id: string;
    description: string;
    standalonePrice: number;
    allocatedPrice: number;
    recognitionTiming: RecognitionTiming;
    percentComplete?: number; // For over-time recognition
    isRecognized: boolean;
    recognizedAmount: number;
}

interface Contract {
    id: string;
    customerId: string;
    contractDate: Date;
    transactionPrice: number;
    variableConsideration?: number;
    constrainedAmount?: number;
    performanceObligations: PerformanceObligation[];
    status: ContractStatus;
}

// STEP 1: Identify the Contract
export function identifyContract(contractData: {
    hasCommercialSubstance: boolean;
    partiesApproved: boolean;
    rightsIdentifiable: boolean;
    paymentTermsIdentifiable: boolean;
    collectibleProbable: boolean;
}): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!contractData.partiesApproved) {
        issues.push("Contract must be approved by all parties");
    }
    if (!contractData.rightsIdentifiable) {
        issues.push("Each party's rights must be identifiable");
    }
    if (!contractData.paymentTermsIdentifiable) {
        issues.push("Payment terms must be identifiable");
    }
    if (!contractData.hasCommercialSubstance) {
        issues.push("Contract must have commercial substance");
    }
    if (!contractData.collectibleProbable) {
        issues.push("Collection of consideration must be probable");
    }

    return { isValid: issues.length === 0, issues };
}

// STEP 2: Identify Performance Obligations
export function identifyPerformanceObligations(
    promisedGoods: { description: string; isDistinct: boolean; price: number }[]
): PerformanceObligation[] {
    return promisedGoods
        .filter(g => g.isDistinct)
        .map((g, i) => ({
            id: `PO-${i + 1}`,
            description: g.description,
            standalonePrice: g.price,
            allocatedPrice: 0,
            recognitionTiming: "POINT_IN_TIME" as RecognitionTiming,
            isRecognized: false,
            recognizedAmount: 0,
        }));
}

// STEP 3: Determine Transaction Price
export function determineTransactionPrice(params: {
    fixedConsideration: number;
    variableConsideration?: number;
    significantFinancingComponent?: number;
    nonCashConsideration?: number;
    considerationPayableToCustomer?: number;
}): { transactionPrice: number; breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {};

    breakdown.fixedConsideration = params.fixedConsideration;
    breakdown.variableConsideration = params.variableConsideration || 0;
    breakdown.significantFinancingComponent = params.significantFinancingComponent || 0;
    breakdown.nonCashConsideration = params.nonCashConsideration || 0;
    breakdown.considerationPayableToCustomer = -(params.considerationPayableToCustomer || 0);

    const transactionPrice = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

    return { transactionPrice, breakdown };
}

// STEP 4: Allocate Transaction Price to Performance Obligations
export function allocateTransactionPrice(
    transactionPrice: number,
    obligations: PerformanceObligation[]
): PerformanceObligation[] {
    // Calculate total standalone selling prices
    const totalSSP = obligations.reduce((sum, o) => sum + o.standalonePrice, 0);

    // Allocate proportionally based on relative SSP
    return obligations.map(o => ({
        ...o,
        allocatedPrice: totalSSP > 0
            ? Math.round((o.standalonePrice / totalSSP) * transactionPrice * 100) / 100
            : transactionPrice / obligations.length,
    }));
}

// STEP 5: Recognize Revenue When/As Performance Obligation is Satisfied
export function recognizeRevenue(
    obligation: PerformanceObligation,
    params: {
        isControlTransferred: boolean;
        percentComplete?: number; // For over-time
    }
): { recognizedAmount: number; isFullyRecognized: boolean; remainingAmount: number } {
    if (obligation.recognitionTiming === "POINT_IN_TIME") {
        // Point in time: All or nothing
        const recognizedAmount = params.isControlTransferred ? obligation.allocatedPrice : 0;
        return {
            recognizedAmount,
            isFullyRecognized: params.isControlTransferred,
            remainingAmount: obligation.allocatedPrice - recognizedAmount,
        };
    } else {
        // Over time: Based on progress
        const percentComplete = params.percentComplete || 0;
        const recognizedAmount = Math.round(obligation.allocatedPrice * (percentComplete / 100) * 100) / 100;
        return {
            recognizedAmount,
            isFullyRecognized: percentComplete >= 100,
            remainingAmount: obligation.allocatedPrice - recognizedAmount,
        };
    }
}

// Complete revenue recognition for a contract
export function processContract(contract: Contract): {
    totalRecognized: number;
    deferredRevenue: number;
    contractAsset: number;
    contractLiability: number;
    details: {
        obligationId: string;
        description: string;
        allocated: number;
        recognized: number;
        deferred: number;
    }[];
} {
    let totalRecognized = 0;
    let deferredRevenue = 0;
    const details: any[] = [];

    for (const obligation of contract.performanceObligations) {
        const result = recognizeRevenue(obligation, {
            isControlTransferred: obligation.isRecognized,
            percentComplete: obligation.percentComplete,
        });

        totalRecognized += result.recognizedAmount;
        deferredRevenue += result.remainingAmount;

        details.push({
            obligationId: obligation.id,
            description: obligation.description,
            allocated: obligation.allocatedPrice,
            recognized: result.recognizedAmount,
            deferred: result.remainingAmount,
        });
    }

    // Contract asset: Revenue recognized > Cash received
    // Contract liability: Cash received > Revenue recognized (deferred revenue)
    const contractAsset = Math.max(0, totalRecognized - contract.transactionPrice);
    const contractLiability = deferredRevenue;

    return { totalRecognized, deferredRevenue, contractAsset, contractLiability, details };
}

// Helper: Determine if revenue should be recognized over time
export function isOverTimeRecognition(criteria: {
    customerReceivesBenefitAsPerformed: boolean;
    entityCreatesAssetWithNoAlternativeUse: boolean;
    entityHasEnforceableRightToPayment: boolean;
}): boolean {
    return (
        criteria.customerReceivesBenefitAsPerformed ||
        (criteria.entityCreatesAssetWithNoAlternativeUse && criteria.entityHasEnforceableRightToPayment)
    );
}

export default {
    identifyContract,
    identifyPerformanceObligations,
    determineTransactionPrice,
    allocateTransactionPrice,
    recognizeRevenue,
    processContract,
    isOverTimeRecognition,
};
