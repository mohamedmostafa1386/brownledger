const http = require('http');

async function post(path, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', (d) => responseBody += d);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: responseBody }));
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function runTests() {
    try {
        console.log('Testing Prepaid Expense creation...');
        const prepaid = await post('/api/prepaid-expenses', {
            description: "3-Year Hosting Plan",
            vendorName: "AWS",
            totalAmount: 36000,
            startDate: "2024-01-01",
            endDate: "2026-12-31"
        });
        console.log('Status:', prepaid.statusCode);
        console.log('Body:', prepaid.body);

        console.log('\nTesting Loan creation...');
        const loan = await post('/api/loans', {
            loanName: "Business Expansion Loan",
            lenderName: "National Bank",
            principalAmount: 100000,
            interestRate: 0.12,
            startDate: "2024-01-01",
            termMonths: 24
        });
        console.log('Status:', loan.statusCode);
        console.log('Body:', loan.body);
    } catch (e) {
        console.error('Test failed:', e);
    }
}

runTests();
