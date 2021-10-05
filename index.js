const finnhub = require('finnhub');

const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = process.argv[2];
const finnhubClient = new finnhub.DefaultApi();

finnhubClient.financialsReported({ "symbol": process.argv[3] }, (error, response) => {
  console.log('year', 'revenue', 'operatingIncome', 'netIncome', 'eps', 'epsRatio', 'assets', 'liabilities', 'equity', 'operationMargin', 'netMargin', 'debt', 'roe', 'roa');
  let previousSharesRatio = 1;
  const reportDiff = {
    revenue: [],
    operatingIncome: [],
    netIncome: [],
    eps: [],
    operationMargin: [],
    netMargin: [],
    debt: [],
    roe: [],
    roa: [],
  };
  const reports = response.data.sort((a, b) => Number(a.year) - Number(b.year)).map(annual => {
    const { year, report: { ic, bs } } = annual;
    const revenue = ic.find(({ concept }) => concept === "Revenues")
                    || ic.find(({ concept }) => concept === "SalesRevenueNet")
                    || ic.find(({ concept }) => concept === "RevenueFromContractWithCustomerExcludingAssessedTax")
                    || ic.find(({ concept }) => concept === "SalesRevenueServicesNet");
    const operatingIncome = ic.find(({ concept }) => concept === "OperatingIncomeLoss");
    const netIncome = ic.find(({ concept }) => concept === "NetIncomeLoss");
    const eps = ic.find(({ concept }) => concept === "EarningsPerShareBasic");
    const shares = ic.find(({ concept }) => concept === "WeightedAverageNumberOfSharesOutstandingBasic");
    const operationMargin = revenue && operatingIncome ? operatingIncome.value / revenue.value * 100 : 0;
    const netMargin = revenue && netIncome ? netIncome.value / revenue.value * 100 : 0;
    const assets = bs.find(({ concept }) => concept === "Assets");
    const liabilities = bs.find(({ concept }) => concept === "Liabilities");
    const debt = assets && liabilities ? liabilities.value / assets.value * 100 : 0;
    const equity = bs.find(({ concept }) => concept === "StockholdersEquity");
    const roe = netIncome && equity ? netIncome.value / equity.value * 100 : 0;
    const roa = netIncome && assets ? netIncome.value / assets.value * 100 : 0;
    return {
      year,
      revenue: revenue?.value,
      operatingIncome: operatingIncome?.value,
      netIncome: netIncome?.value,
      eps: eps?.value,
      assets: assets?.value,
      liabilities: liabilities?.value,
      equity: equity?.value || assets?.value - liabilities?.value,
      shares: shares?.value,
      operationMargin,
      netMargin,
      debt,
      roe,
      roa
    }
  })
  reports.forEach((report, index) => {
    if (index > 0) {
      const ratio = 0.5 + 0.5 / reports.length * (index + 1); // [0.5, 1];
      reportDiff.revenue.push((report.revenue - reports[index - 1].revenue) / reports[index - 1].revenue * ratio);
      reportDiff.operatingIncome.push((report.operatingIncome - reports[index - 1].operatingIncome) / reports[index - 1].operatingIncome * ratio);
      reportDiff.netIncome.push((report.netIncome - reports[index - 1].netIncome) / reports[index - 1].netIncome * ratio);
      reportDiff.eps.push((report.eps * previousSharesRatio * report.shares / reports[index - 1].shares - reports[index - 1].eps * previousSharesRatio) / (reports[index - 1].eps * previousSharesRatio) * ratio);
      reportDiff.operationMargin.push(report.operationMargin);
      reportDiff.netMargin.push(report.netMargin);
      reportDiff.debt.push(report.debt);
      reportDiff.roe.push(report.roe);
      reportDiff.roa.push(report.roa);
      previousSharesRatio = previousSharesRatio * report.shares / reports[index - 1].shares;
    }
    console.log(report.year, report.revenue, report.operatingIncome, report.netIncome, report.eps, report.eps * previousSharesRatio, report.assets, report.liabilities, report.equity, report.operationMargin, report.netMargin, report.debt, report.roe, report.roa);
  })
  console.log('average growth revenue', reportDiff.revenue.reduce((a,b) => a+b, 0) / reportDiff.revenue.length * 100);
  console.log('average growth operatingIncome', reportDiff.operatingIncome.reduce((a,b) => a+b, 0) / reportDiff.operatingIncome.length * 100);
  console.log('average growth netIncome', reportDiff.netIncome.reduce((a,b) => a+b, 0) / reportDiff.netIncome.length * 100);
  console.log('average growth eps', reportDiff.eps.reduce((a,b) => a+b, 0) / reportDiff.eps.length * 100);
  console.log('average growth operationMargin', reportDiff.operationMargin.reduce((a,b) => a+b, 0) / reportDiff.operationMargin.length);
  console.log('average growth netMargin', reportDiff.netMargin.reduce((a,b) => a+b, 0) / reportDiff.netMargin.length);
  console.log('average growth debt', reportDiff.debt.reduce((a,b) => a+b, 0) / reportDiff.debt.length);
  console.log('average growth roe', reportDiff.roe.reduce((a,b) => a+b, 0) / reportDiff.roe.length);
  console.log('average growth roa', reportDiff.roa.reduce((a,b) => a+b, 0) / reportDiff.roa.length);
});
