/* const margin = { top: 20, right: 30, bottom: 40, left: 90 };
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom; */

//const margin = { top: 20, right: 30, bottom: 40, left: 90 };
const margin = { top: 20, right: 30, bottom: 40, left: 90 };
const width = 600 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
function init() {
  createBubbleChart("#bubblechart");
}

function createBubbleChart(id) {
  let svg = d3
    .select(id)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  d3.csv("data/final_appData.csv").then(function (data) {
    let nodes = [];
    data.forEach((d) => {
      nodes.push({
        id: d.title,
        score: d.score,
        Installs: d.Installs,
        contentRating: d.contentRating,
        free: d.free,
        title: d.title,
      });
    });

    let sectors = Array.from(new Set(data.map((d) => d.contentRating)));

    const y = d3.scalePoint().domain(sectors).range([height, 0]);
    const x = d3
      .scaleLinear()
      .domain(d3.extent(data.map((d) => +d["score"])))
      .range([0, width]);

    let color = d3.scaleOrdinal().domain(sectors).range(d3.schemePaired);
    let installsDomain = d3.extent(data.map((d) => +d["Installs"]));
    let size = d3.scaleSqrt().domain(installsDomain).range([3, 20]);

    svg
      .selectAll(".circ")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("stroke", "black")
      .attr("class", "circ")
      .attr("fill", (d) => color(d.free))
      .attr("r", (d) => size(d["Installs"]))
      .attr("cx", (d) => x(d.score))
      .attr("cy", (d) => y(d.contentRating))
      .append("title")
      .text((d) => d.title);

    svg
      .append("g")
      .attr("id", "Xaxis")
      .attr("transform", `translate(0, ${height + margin.top})`)
      .call(d3.axisBottom(x));
    svg
      .append("g")
      .attr("id", "Yaxis")
      .attr("transform", `translate(0,0)`)
      .call(d3.axisLeft(y));
    let simulation = d3
      .forceSimulation(nodes)
      .force(
        "x",
        d3
          .forceX((d) => {
            return x(d.score);
          })
          .strength(0.2)
      )

      .force(
        "y",
        d3
          .forceY((d) => {
            return y(d.contentRating);
          })
          .strength(1)
      )

      .force(
        "collide",
        d3.forceCollide((d) => {
          return size(d["Installs"]);
        })
      )

      .alphaDecay(0)
      .alpha(0.3)
      .on("tick", tick);

    function tick() {
      d3.selectAll(".circ")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);
    }
    let init_decay = setTimeout(function () {
      console.log("start alpha decay");
      simulation.alphaDecay(0.1);
    }, 3000);
  });
}
