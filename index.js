const finnhub = require('finnhub');

const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = process.argv[2];
const finnhubClient = new finnhub.DefaultApi();

finnhubClient.financialsReported({ "symbol": process.argv[3] }, (error, response) => {
  response.data.map(annual => {
    const year = annual.year;
    const revenue = annual.report.ic.find(({ concept }) => concept === "Revenues")
                    || annual.report.ic.find(({ concept }) => concept === "SalesRevenueNet")
                    || annual.report.ic.find(({ concept }) => concept === "RevenueFromContractWithCustomerExcludingAssessedTax");
    const operatingIncome = annual.report.ic.find(({ concept }) => concept === "OperatingIncomeLoss");
    const netIncome = annual.report.ic.find(({ concept }) => concept === "NetIncomeLoss");
    const eps = annual.report.ic.find(({ concept }) => concept === "EarningsPerShareDiluted");
    const operationMargin = revenue && operatingIncome ? operatingIncome.value / revenue.value * 100 : 'none';
    const netMargin = revenue && netIncome ? netIncome.value / revenue.value * 100 : 'none';
    const assets = annual.report.bs.find(({ concept }) => concept === "Assets");
    const liabilities = annual.report.bs.find(({ concept }) => concept === "Liabilities");
    const debt = assets && liabilities ? liabilities.value / assets.value * 100 : 'none';
    const equity = annual.report.bs.find(({ concept }) => concept === "StockholdersEquity");
    const roe = netIncome && equity ? netIncome.value / equity.value * 100 : 'none';
    const roa = netIncome && assets ? netIncome.value / assets.value * 100 : 'none';
    console.log('year', year, 'revenue', revenue?.value, 'operatingIncome', operatingIncome?.value, 'netIncome', netIncome?.value, 'eps', eps?.value, 'assets', assets?.value, 'liabilities', liabilities?.value, 'equity', equity?.value, 'operationMargin', operationMargin, 'netMargin', netMargin, 'debt', debt, 'roe', roe, 'roa', roa);
  })
});
