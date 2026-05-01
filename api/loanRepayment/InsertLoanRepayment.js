// Vite middleware/Node handler for InsertLoanRepayment
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Parse body if it's a string, otherwise use as-is
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    // Forward the request to the actual backend
    const response = await fetch('https://alakuyateh-001-site10.atempurl.com/api/loanRepayment/InsertLoanRepayment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return res.status(response.status).json({ error: errorData });
    }

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('InsertLoanRepayment error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
