// Vite middleware/Node handler for InsertLoanRepayment
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  // Forward the request to the actual backend
  const response = await fetch('https://alakuyateh-001-site10.atempurl.com/api/loanRepayment/InsertLoanRepayment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...req.headers,
    },
    body: JSON.stringify(req.body),
  });
  const data = await response.json();
  res.status(response.status).json(data);
}
