import { useCallback } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export default function useGetGuarantorsReport() {
  const fetchGuarantorsReport = useCallback(
    async (filters) => {
      try {
        const {
          region = '',
          productType = '',
          transactionFromDate = '',
          transactionToDate = '',
        } = filters;

        // Build request payload with correct API field names
        const payload = {
          lregion: region ? Number(region) : 0,
          ProductType: productType ? Number(productType) : 0,
          TranFromDate: transactionFromDate || '',
          TranToDate: transactionToDate || '',
        };

        const url = getFullApiUrl('/api/loanguarantors/get');
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          return {
            success: false,
            error: `API Error: ${response.status} ${response.statusText}`,
            data: [],
          };
        }

        const data = await response.json();
        return {
          success: true,
          data: Array.isArray(data) ? data : data.data || [],
          error: null,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message || 'Failed to fetch guarantors report',
          data: [],
        };
      }
    },
    []
  );

  return { fetchGuarantorsReport };
}
