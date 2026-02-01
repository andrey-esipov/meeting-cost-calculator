let tickerValue = 0;
let tickerSelection;

function initTicker() {
  tickerSelection = d3.select("#ticker").append("div").attr("class", "ticker-value").text("$0.00");
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
    .range(["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#38bdf8"]);

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
    .attr("stroke", "#6366f1")
    .attr("stroke-width", 3)
    .merge(path)
    .transition()
    .duration(600)
    .attr("d", line);

  const dots = sparklineSvg.selectAll("circle").data(data);
  dots.enter()
    .append("circle")
    .attr("r", 3)
    .attr("fill", "#10b981")
    .merge(dots)
    .transition()
    .duration(600)
    .attr("cx", (d, i) => x(i))
    .attr("cy", d => y(d));

  dots.exit().remove();
}
