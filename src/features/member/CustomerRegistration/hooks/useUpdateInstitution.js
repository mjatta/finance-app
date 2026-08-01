import { getFullApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook to update institution member details
 * PUT /api/member/updateInstitutionMember
 */
export function useUpdateInstitution() {
  const updateInstitution = async (payload) => {
    const url = getFullApiUrl('/api/member/updateInstitutionMember');
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text().catch(() => '');

    if (!res.ok) {
      let parsed = {};
      try { parsed = JSON.parse(text || '{}'); } catch {}
      throw new Error(parsed.message || `Update institution failed (${res.status}) - ${text}`);
    }
    try { return JSON.parse(text || '{}'); } catch { return text; }
  };

  return { updateInstitution };
}
