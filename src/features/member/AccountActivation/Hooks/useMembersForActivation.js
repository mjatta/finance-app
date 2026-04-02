import { useState, useCallback } from 'react';

// Hook to fetch members pending activation
export function useMembersForActivation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMembersForActivation = useCallback(async () => {
    setLoading(true);
    setError(null);

    const endpoint = '/api/remote-member-activate?memberactivate=0';
    const fullEndpoint = 'http://alakuyateh-001-site10.atempurl.com/api/Cusystem/GetMember4Activate?memberactivate=0';
    
    console.log('=== MEMBER ACTIVATION API DEBUG ===');
    console.log('Calling endpoint:', endpoint);
    console.log('Expected backend endpoint:', fullEndpoint);
    console.log('Request method:', 'GET');
    console.log('Request headers:', {
      'Content-Type': 'application/json',
    });

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('--- RESPONSE DETAILS ---');
      console.log('Status Code:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Content-Type:', response.headers.get('content-type'));
      console.log('Full URL (from response):', response.url);
      console.log('Headers received:', {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'content-type': response.headers.get('content-type'),
      });

      // Handle HTTP errors
      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} ${response.statusText}`);
        console.error('Response URL:', response.url);
        
        // Try to get error message from response
        const errorText = await response.text();
        console.error('Response body:', errorText);
        
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      // Attempt to parse JSON response
      let payload;
      try {
        payload = await response.json();
        console.log('✅ API Response successful!');
        console.log('Payload:', payload);
        console.log('Payload type:', Array.isArray(payload) ? 'Array' : typeof payload);
        console.log('Payload length:', Array.isArray(payload) ? payload.length : 'N/A');
      } catch (jsonError) {
        console.warn('Failed to parse members response as JSON:', jsonError);
        setError('Invalid response format');
        return null;
      }

      // Validate response is an array
      if (!Array.isArray(payload)) {
        console.warn('❌ Members response is not an array:', payload);
        setError('Invalid response structure');
        return null;
      }

      setError(null);
      return payload;
    } catch (err) {
      // Handle network errors and other exceptions
      console.error('=== ERROR DETAILS ===');
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      console.error('Full error:', err);
      
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.error('🔴 Network error or CORS issue detected');
        console.error('Possible causes:');
        console.error('1. Backend server is not accessible');
        console.error('2. CORS headers are not set correctly');
        console.error('3. Proxy configuration is incorrect');
      } else {
        console.error('🔴 Error fetching members for activation');
      }
      
      setError(err.message || 'Failed to fetch members');
      return null;
    } finally {
      setLoading(false);
      console.log('=== API CALL COMPLETE ===\n');
    }
  }, []);

  return { fetchMembersForActivation, loading, error };
}
