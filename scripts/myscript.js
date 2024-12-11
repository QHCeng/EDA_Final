// add your JavaScript/D3 to this file
const ageOrder = [
  "12-14 years old",
  "15-17 years old",
  "18-20 years old",
  "21-24 years old",
  "25-29 years old",
  "30-34 years old",
  "35-39 years old",
  "40-44 years old",
  "45-49 years old",
  "50-54 years old",
  "55-64 years old",
  "65 years and older"
];

d3.csv("data_clean.csv").then(rawData => {
  const rollupData = d3.rollups(
    rawData,
    v => v.length,
    d => d.AGE,
    d => d.SUB1
  );
  
  let ages = rollupData.map(d => d[0]);

  ages = ageOrder.filter(age => ages.includes(age));

  let allSubstances = Array.from(new Set(rawData.map(d => d.SUB1)));

  const aggregated = rollupData.map(([age, arr]) => {
    const obj = {AGE: age};
    for (const [sub, count] of arr) {
      obj[sub] = count;
    }
    for (const sub of allSubstances) {
      if (!obj[sub]) obj[sub] = 0;
    }
    return obj;
  });

  const substanceTotals = d3.rollups(rawData, v => v.length, d => d.SUB1)
    .map(([sub, count]) => ({sub, count}));

  substanceTotals.sort((a,b) => d3.ascending(a.count, b.count));

  allSubstances = substanceTotals.map(d => d.sub);

  const stack = d3.stack().keys(allSubstances);
  const series = stack(aggregated);

  const margin = {top: 50, right: 200, bottom: 100, left: 60},
        width = 900,
        height = 500;

  const svg = d3.select("#plot")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const maxY = d3.max(series, s => d3.max(s, d => d[1]));
  const yScale = d3.scaleLinear()
    .domain([0, maxY]).nice()
    .range([height - margin.bottom, margin.top]);

  const xScale = d3.scaleBand()
    .domain(ages)
    .range([margin.left, width - margin.right])
    .padding(0.3);

  const color = d3.scaleOrdinal(d3.schemeTableau10)
    .domain(allSubstances);

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale));

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
      .attr("transform", "rotate(45)")
      .attr("text-anchor", "start")
      .attr("x", 9)
      .attr("y", 3);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .text("Abuse Type by Age");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", margin.left - 45)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Count");

  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 40}, ${margin.top})`);

  allSubstances.forEach((s, i) => {
    const g = legend.append("g")
      .attr("transform", `translate(0, ${i*20})`);
    g.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(s));
    g.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .style("font-size", "12px")
      .text(s);
  });

  const layer = svg.selectAll(".layer")
    .data(series)
    .join("g")
    .attr("class", "layer")
    .attr("fill", d => color(d.key));

  layer.selectAll("rect")
    .data(d => d, d => d.data.AGE)
    .join("rect")
      .attr("x", d => xScale(d.data.AGE))
      .attr("width", xScale.bandwidth())
      .attr("y", height - margin.bottom)
      .attr("height", 0);

  function updateBars(currentAges) {
    const currentAgesSet = new Set(currentAges);

    layer.selectAll("rect")
      .transition()
      .duration(1000)
      .attr("y", d => currentAgesSet.has(d.data.AGE) ? yScale(d[1]) : (height - margin.bottom))
      .attr("height", d => currentAgesSet.has(d.data.AGE) ? (yScale(d[0]) - yScale(d[1])) : 0);
  }

  let currentIndex = 0;
  updateBars([ages[0]]);

  const timer = d3.interval(() => {
    currentIndex++;
    if (currentIndex < ages.length) {
      const subset = ages.slice(0, currentIndex + 1);
      updateBars(subset);
    } else {
      timer.stop();
    }
  }, 2000);

});