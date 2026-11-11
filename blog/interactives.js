(() => {
  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
  function bindAverageScenario() {
    const scenario = document.querySelector("[data-average-scenario]");
    if (!scenario) return;

    const priceOne = scenario.querySelector("[data-scenario-price-one]");
    const sharesOne = scenario.querySelector("[data-scenario-shares-one]");
    const priceTwo = scenario.querySelector("[data-scenario-price-two]");
    const sharesTwo = scenario.querySelector("[data-scenario-shares-two]");
    const firstBar = scenario.querySelector(".scenario-bar--first");
    const secondBar = scenario.querySelector(".scenario-bar--second");

    const update = () => {
      const firstPrice = Number(priceOne.value);
      const firstShares = Number(sharesOne.value);
      const secondPrice = Number(priceTwo.value);
      const secondShares = Number(sharesTwo.value);
      if (![firstPrice, firstShares, secondPrice, secondShares].every(Number.isFinite)
        || firstPrice <= 0 || secondPrice <= 0 || firstShares <= 0 || secondShares <= 0) {
        scenario.querySelector("[data-scenario-average]").textContent = "Check inputs";
        scenario.querySelector("[data-scenario-total-shares]").textContent = "—";
        scenario.querySelector("[data-scenario-total-outlay]").textContent = "—";
        return;
      }

      const totalShares = firstShares + secondShares;
      const firstOutlay = firstPrice * firstShares;
      const secondOutlay = secondPrice * secondShares;
      const average = (firstOutlay + secondOutlay) / totalShares;
      scenario.querySelector("[data-scenario-label-one]").textContent = currency.format(firstPrice);
      scenario.querySelector("[data-scenario-label-two]").textContent = currency.format(secondPrice);
      scenario.querySelector("[data-scenario-average]").textContent = currency.format(average);
      scenario.querySelector("[data-scenario-total-shares]").textContent = totalShares.toLocaleString("en-IN");
      scenario.querySelector("[data-scenario-total-outlay]").textContent = currency.format(firstOutlay + secondOutlay);

      const minimum = Math.min(firstPrice, secondPrice);
      const spread = Math.max(firstPrice, secondPrice) - minimum || 1;
      firstBar.style.height = `${45 + ((firstPrice - minimum) / spread) * 43}%`;
      secondBar.style.height = `${45 + ((secondPrice - minimum) / spread) * 43}%`;
    };

    [priceOne, sharesOne, priceTwo, sharesTwo].forEach((input) => input.addEventListener("input", update));
    update();
  }

  function bindDipScenario() {
    const tool = document.querySelector("[data-dip-tool]");
    if (!tool) return;

    const firstPrice = tool.querySelector("[data-first-price]");
    const firstShares = tool.querySelector("[data-first-shares]");
    const dipPrice = tool.querySelector("[data-dip-price]");
    const extraShares = tool.querySelector("[data-extra-shares]");
    const currentPrice = tool.querySelector("[data-current-price]");
    const output = (selector) => tool.querySelector(selector);
    const formatSigned = (value) => `${value < 0 ? "−" : value > 0 ? "+" : ""}${currency.format(Math.abs(value))}`;

    const update = () => {
      const initialPrice = Number(firstPrice.value);
      const initialQuantity = Number(firstShares.value);
      const addPrice = Number(dipPrice.value);
      const addedQuantity = Number(extraShares.value);
      const marketPrice = Number(currentPrice.value);
      const values = [initialPrice, initialQuantity, addPrice, addedQuantity, marketPrice];
      if (!values.every(Number.isFinite) || values.some((value) => value <= 0)) {
        output("[data-dip-average]").textContent = "Check inputs";
        output("[data-dip-invested]").textContent = "—";
        output("[data-dip-value]").textContent = "—";
        output("[data-dip-pl]").textContent = "—";
        output("[data-original-pl]").textContent = "—";
        output("[data-dip-detail]").textContent = "All prices and share quantities must be greater than zero.";
        return;
      }

      const initialOutlay = initialPrice * initialQuantity;
      const additionalOutlay = addPrice * addedQuantity;
      const totalShares = initialQuantity + addedQuantity;
      const totalOutlay = initialOutlay + additionalOutlay;
      const average = totalOutlay / totalShares;
      const currentValue = totalShares * marketPrice;
      const combinedPl = currentValue - totalOutlay;
      const originalPl = initialQuantity * (marketPrice - initialPrice);

      output("[data-dip-average]").textContent = currency.format(average);
      output("[data-dip-invested]").textContent = currency.format(totalOutlay);
      output("[data-dip-value]").textContent = currency.format(currentValue);
      output("[data-dip-pl]").textContent = formatSigned(combinedPl);
      output("[data-original-pl]").textContent = formatSigned(originalPl);
      output("[data-dip-pl]").classList.toggle("is-negative", combinedPl < 0);
      output("[data-original-pl]").classList.toggle("is-negative", originalPl < 0);
      output("[data-dip-detail]").textContent = `The dip purchase adds ${currency.format(additionalOutlay)}. At ${currency.format(marketPrice)}, the original shares are ${formatSigned(originalPl)} and the combined position is ${formatSigned(combinedPl)}, before costs.`;
    };

    [firstPrice, firstShares, dipPrice, extraShares, currentPrice].forEach((input) => input.addEventListener("input", update));
    update();
  }

  function bindBreakEvenTool() {
    const tool = document.querySelector("[data-break-even-tool]");
    if (!tool) return;
    const entry = tool.querySelector("[data-entry]");
    const quantity = tool.querySelector("[data-quantity]");
    const costs = tool.querySelector("[data-costs]");
    const salePrice = tool.querySelector("[data-sale-price]");
    const output = tool.querySelector("[data-break-even-output]");
    const netOutput = tool.querySelector("[data-net-pl-output]");
    const detail = tool.querySelector("[data-break-even-detail]");

    const update = () => {
      const entryPrice = Number(entry.value);
      const shares = Number(quantity.value);
      const totalCosts = Number(costs.value);
      const testSalePrice = Number(salePrice.value);
      if (!(entryPrice > 0) || !(shares > 0) || totalCosts < 0 || !(testSalePrice > 0)) {
        output.textContent = "Enter valid values";
        netOutput.textContent = "—";
        detail.textContent = "Price and quantity must be greater than zero; costs cannot be negative.";
        return;
      }
      const breakEven = entryPrice + (totalCosts / shares);
      const grossProfit = (testSalePrice - entryPrice) * shares;
      const netProfit = grossProfit - totalCosts;
      output.textContent = currency.format(breakEven);
      netOutput.textContent = `${netProfit < 0 ? "−" : netProfit > 0 ? "+" : ""}${currency.format(Math.abs(netProfit))}`;
      netOutput.classList.toggle("is-negative", netProfit < 0);
      detail.textContent = `At a ${currency.format(testSalePrice)} sale, gross P/L is ${currency.format(grossProfit)}; after assumed costs of ${currency.format(totalCosts)}, estimated net P/L is ${currency.format(netProfit)}.`;
    };

    [entry, quantity, costs, salePrice].forEach((input) => input.addEventListener("input", update));
    update();
  }

  function bindPositionTool() {
    const tool = document.querySelector("[data-position-tool]");
    if (!tool) return;
    const risk = tool.querySelector("[data-risk]");
    const entry = tool.querySelector("[data-entry]");
    const stop = tool.querySelector("[data-stop]");
    const gapExit = tool.querySelector("[data-gap-exit]");
    const output = tool.querySelector("[data-position-output]");
    const capitalOutput = tool.querySelector("[data-position-capital]");
    const gapOutput = tool.querySelector("[data-position-gap-pl]");
    const detail = tool.querySelector("[data-position-detail]");

    const update = () => {
      const riskBudget = Number(risk.value);
      const entryPrice = Number(entry.value);
      const stopPrice = Number(stop.value);
      const gapExitPrice = Number(gapExit.value);
      const perShareRisk = entryPrice - stopPrice;
      if (!(riskBudget > 0) || !(entryPrice > 0) || !(stopPrice >= 0)
        || !(perShareRisk > 0) || !(gapExitPrice > 0)) {
        output.textContent = "Check your inputs";
        capitalOutput.textContent = "—";
        gapOutput.textContent = "—";
        detail.textContent = "For this long-position example, risk and entry must be positive and the stop must be below entry.";
        return;
      }
      const shares = Math.floor(riskBudget / perShareRisk);
      const capital = shares * entryPrice;
      const stopLoss = shares * perShareRisk;
      const gapPl = shares * (gapExitPrice - entryPrice);
      output.textContent = `${shares.toLocaleString("en-IN")} shares`;
      capitalOutput.textContent = currency.format(capital);
      gapOutput.textContent = `${gapPl < 0 ? "−" : gapPl > 0 ? "+" : ""}${currency.format(Math.abs(gapPl))}`;
      gapOutput.classList.toggle("is-negative", gapPl < 0);
      detail.textContent = `At the ${currency.format(stopPrice)} stop, estimated loss is ${currency.format(stopLoss)}. At a ${currency.format(gapExitPrice)} gap exit, estimated P/L is ${currency.format(gapPl)} before costs and slippage.`;
    };

    [risk, entry, stop, gapExit].forEach((input) => input.addEventListener("input", update));
    update();
  }

  bindAverageScenario();
  bindDipScenario();
  bindBreakEvenTool();
  bindPositionTool();
})();