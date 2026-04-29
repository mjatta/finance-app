// Vite/Node middleware for Loan Repayment Account endpoint
export default async function handler(req, res) {
  const { accountNumber, ncompid = 30, tranDate } = req.query;
  if (!accountNumber || !tranDate) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const apiUrl = `http://alakuyateh-001-site10.atempurl.com/api/LoanRepayment/getLoanRepaymentAccount?accountNumber=${encodeURIComponent(accountNumber)}&ncompid=${ncompid}&tranDate=${tranDate}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Failed to fetch from remote API');
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch loan repayment account' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
