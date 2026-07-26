import { useCallback, useState } from 'react';

const toNumber = (value, fallback = 0) => {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const extractNumericId = (id) => {
  if (!id) return 0;
  
  // If already numeric, return as-is
  const num = toNumber(id);
  if (num !== 0) return num;
  
  // Extract numeric portion from string ID like "prd-001" or "prd-1785000367181"
  const match = String(id).match(/\d+/);
  return match ? toNumber(match[0]) : 0;
};

const toNullableString = (value) => (value ? String(value).trim() : '');

export function useUpdateProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateProduct = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);

      const isLoan = params.productKind === 'loan';
      const isSavingOrShares = params.productKind === 'saving';
      const isDeducting = Boolean(params.hasDeductions);
      const isGlDestination = params.deductionAccountType === 'gl';
      const isMemberDestination = params.deductionAccountType === 'member';

      const isIslamicProduct = params.isIslamicProduct && isLoan;

      const payload = {
        ProductID: extractNumericId(params.productId || params.id),
        ProductName: toNullableString(params.productName),
        ProductScope: 1,
        MinAmount: toNumber(params.minimumAmount),
        MaxAmount: toNumber(params.maximumAmount),
        MinDuration: toNumber(params.minimumDuration),
        MaxDuration: toNumber(params.maximumDuration),
        MinMembers: 0,
        MaxMembers: 0,
        InterestRate: toNumber(params.interestRate),
        InterestScope: isIslamicProduct ? 3 : 1,
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
        SavingsProductControl: isSavingOrShares ? toNullableString(params.savingProductControl) : '',
        SavingsExpenseAccount: '',
        SavingsARAccount: '',
        SavingsAPAccount: '',

        Gender: true,
        Deduct: isDeducting,
        DestinationType: isGlDestination ? false : isMemberDestination ? true : false,
        SourceProduct: toNumber(params.deductionSourceProduct),
        DestinationAccount: toNullableString(params.deductionDestinationAccount),
        Frequency: 1,
        ProductFrequency: 1,
        DeductionType: true,
        DeductionAmount: toNumber(params.deductionPercentage),

        FromDate: new Date().toISOString().split('T')[0],
        ToDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      };

      const response = await fetch('/api/Product/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📤 Update Product Payload:', JSON.stringify(payload, null, 2));
      console.log('📥 Update Product Response:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Backend Error Response:', errorData);
        throw new Error(errorData?.message || `HTTP ${response.status}`);
      }

      return true;
    } catch (err) {
      setError(err.message || 'Failed to update product');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateProduct, loading, error };
}
