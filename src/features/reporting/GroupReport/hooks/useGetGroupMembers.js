import { useState } from 'react';

export default function useGetGroupMembers() {
  const [loading, setLoading] = useState(false);

  const fetchGroupMembers = async (groupCode) => {
    if (!groupCode) {
      throw new Error('Group code is required');
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/groupmembers/${encodeURIComponent(groupCode)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to fetch group members: ${res.status}`);
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } finally {
      setLoading(false);
    }
  };

  return { fetchGroupMembers, loading };
}
