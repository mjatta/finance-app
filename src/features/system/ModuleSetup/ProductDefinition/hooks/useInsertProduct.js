import { useCallback } from 'react';

const toNumber = (value, fallback = 0) => {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toNullableString = (value) => (value ? String(value).trim() : '');

export function useInsertProduct() {
  const insertProduct = useCallback(async (params) => {
    try {
      const isLoan = params.productKind === 'loan';
      const isSavingOrShares = params.productKind === 'saving';
      const isDeducting = Boolean(params.hasDeductions);
      const isGlDestination = params.deductionAccountType === 'gl';
      const isMemberDestination = params.deductionAccountType === 'member';

      const payload = {
        ProductName: toNullableString(params.productName),
        ProductScope: 1,
        MinAmount: toNumber(params.minimumAmount),
        MaxAmount: toNumber(params.maximumAmount),
        MinDuration: toNumber(params.minimumDuration),
        MaxDuration: toNumber(params.maximumDuration),
        MinMembers: 0,
        MaxMembers: 0,
        InterestRate: toNumber(params.interestRate),
        InterestScope: 1,
        MinSavings: 0,
        AgeFrom: 0,
        AgeTo: 0,
        CommissionType: false,
        CommissionAmount: 0,
        Tracking: false,
        InterestCalculation: 1,
        DayCount: 1,
        DayRoll: 1,
        LedgerFees: 0,
        LedgerType: false,
        MainCategory: toNumber(params.mainCategoryCode),

        InterestIncomeAccount: isLoan ? toNullableString(params.interestIncome) : '',
        NonInterestIncomeAccount: '',
        ExpenseAccount: isSavingOrShares ? toNullableString(params.expenseAccount) : '',
        AccountsPayable: '',
        AccountsReceivable: '',
        BadDebtIncome: isLoan ? toNullableString(params.badDebtRecovered) : '',
        BadDebtExpense: isLoan ? toNullableString(params.badDebtExpenses) : '',
        ProductControlAccount: isLoan ? toNullableString(params.loanProductControl) : '',

        ManualProduct: true,

        SavingsProductControl: isSavingOrShares ? toNullableString(params.savingProductControl) : '',
        SavingsExpenseAccount: isSavingOrShares ? toNullableString(params.expenseAccount) : '',
        SavingsARAccount: '',
        SavingsAPAccount: '',

        Gender: true,

        Deduct: isDeducting,
        DestinationType: isGlDestination,
        SourceProduct: isDeducting ? toNumber(params.deductionSourceProduct, 0) : 0,
        DestinationAccount: isGlDestination ? toNullableString(params.deductionDestinationAccount) : '',
        Frequency: 1,
        ProductFrequency: 1,
        DeductionType: false,
        DeductionAmount: isDeducting ? toNumber(params.deductionPercentage, 0) : 0,

        FromDate: '2026-01-01T00:00:00',
        ToDate: '2026-12-31T00:00:00',

        SourceProductID: isDeducting ? toNumber(params.deductionSourceProduct, 0) : 0,
        DestinationAccountID: 0,
        DestinationProduct: isMemberDestination ? toNumber(params.deductionDestinationAccount, 0) : 0,
      };

      const response = await fetch('/api/Product/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save product');
      }

      return await response.json();
    } catch {
      return null;
    }
  }, []);

  return { insertProduct };
}
