let tickerValue = 0;
let tickerSelection;

function initTicker() {
  tickerSelection = d3.select("#ticker");
  tickerSelection.text("$0.00");
}

function updateTicker(value) {
  const start = tickerValue;
  const end = value;
  tickerValue = end;

  tickerSelection.transition()
    .duration(400)
    .ease(d3.easeCubicOut)
    .tween("text", function() {
      const i = d3.interpolateNumber(start, end);
      return function(t) {
        this.textContent = formatCurrency(i(t));
      };
    });
}

let donutChart;

function initDonut(data) {
  const width = 300;
  const height = 300;
  const radius = Math.min(width, height) / 2 - 10;

  const svg = d3.select("#donut")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  donutChart = { svg, radius };
  updateDonut(data);
}

function updateDonut(data) {
  const { svg, radius } = donutChart;
  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.type))
    .range(["#0078d4", "#107c10", "#ffb900", "#d83b01", "#008272"]);

  const pie = d3.pie().value(d => d.value);
  const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);

  const paths = svg.selectAll("path").data(pie(data), d => d.data.type);

  paths.enter()
    .append("path")
    .attr("fill", d => color(d.data.type))
    .attr("d", arc)
    .each(function(d) { this._current = d; })
    .append("title")
    .text(d => `${d.data.type}: ${formatCurrency(d.data.value)}`);

  paths.transition()
    .duration(600)
    .attrTween("d", function(d) {
      const i = d3.interpolate(this._current, d);
      this._current = i(1);
      return t => arc(i(t));
    });

  paths.select("title").text(d => `${d.data.type}: ${formatCurrency(d.data.value)}`);
  paths.exit().remove();
}

let sparklineSvg;

function initSparkline(data) {
  const width = 360;
  const height = 120;
  sparklineSvg = d3.select("#sparkline")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  updateSparkline(data);
}

function updateSparkline(data) {
  const width = 360;
  const height = 120;
  const x = d3.scaleLinear().domain([0, data.length - 1]).range([10, width - 10]);
  const y = d3.scaleLinear().domain([0, d3.max(data) * 1.1]).range([height - 20, 20]);

  const line = d3.line()
    .x((d, i) => x(i))
    .y(d => y(d))
    .curve(d3.curveCatmullRom.alpha(0.5));

  const path = sparklineSvg.selectAll("path").data([data]);

  path.enter()
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "#0078d4")
    .attr("stroke-width", 3)
    .merge(path)
    .transition()
    .duration(600)
    .attr("d", line);

  const dots = sparklineSvg.selectAll("circle").data(data);
  dots.enter()
    .append("circle")
    .attr("r", 3)
    .attr("fill", "#107c10")
    .merge(dots)
    .transition()
    .duration(600)
    .attr("cx", (d, i) => x(i))
    .attr("cy", d => y(d));

  dots.exit().remove();
}

function getHistoryDonutData(history) {
  if (!history || !history.length) return null;
  const now = new Date();
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    return {
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      value: 0,
      dateKey: date.toDateString()
    };
  });

  history.forEach(entry => {
    const entryDate = new Date(entry.date);
    const match = days.find(day => day.dateKey === entryDate.toDateString());
    if (match) match.value += Number(entry.cost) || 0;
  });

  const filtered = days.filter(day => day.value > 0);
  if (!filtered.length) return null;
  return filtered.map(day => ({ type: day.label, value: day.value }));
}

function getHistorySparklineData(history) {
  if (!history || !history.length) return null;
  const now = new Date();
  const days = Array.from({ length: 14 }).map((_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (13 - index));
    return {
      value: 0,
      dateKey: date.toDateString()
    };
  });

  history.forEach(entry => {
    const entryDate = new Date(entry.date);
    const match = days.find(day => day.dateKey === entryDate.toDateString());
    if (match) match.value += Number(entry.cost) || 0;
  });

  const values = days.map(day => day.value);
  if (values.every(val => val === 0)) return null;
  return values;
}
