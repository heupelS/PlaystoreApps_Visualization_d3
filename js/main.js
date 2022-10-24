/* const margin = { top: 20, right: 30, bottom: 40, left: 90 };
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom; */

//const margin = { top: 20, right: 30, bottom: 40, left: 90 };
const margin = { top: 20, right: 30, bottom: 40, left: 90 };
const width = 700 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
function init() {
  createBubbleChart("#bubblechart");
  createLinePlot("#lineChart");
}

function createBubbleChart(id) {
  let svg = d3
    .select(id)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("id", "gBubbleChart")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  d3.csv("data/final_appData.csv").then(function (data) {
    let nodes = [];
    data.forEach((d) => {
      nodes.push({
        id: d.title,
        score: d.score,
        ratings: d.ratings,
        contentRating: d.contentRating,
        genre: d.genre,
        free: d.free,
        title: d.title,
        icon: d.icon,
      });
    });

    let sectors = Array.from(
      new Set(data.map((d) => d.contentRating))
    ).reverse();
    const free_category = Array.from(new Set(data.map((d) => d.free))).sort();
    const y = d3.scalePoint().domain(sectors).range([height, margin.top]);
    const x = d3
      .scaleLinear()
      .domain(d3.extent(data.map((d) => +d["score"])))
      .range([margin.left, width]);

    let color = d3.scaleOrdinal().domain(free_category).range(["blue", "red"]);
    let ratingsDomain = d3.extent(data.map((d) => +d["ratings"]));
    let size = d3.scaleSqrt().domain(ratingsDomain).range([1, 20]);

    svg
      .selectAll(".circ")
      .data(nodes)
      .join("circle")
      .attr("class", "circ itemValues")
      .attr("stroke", "black")
      .attr("class", "circ")
      .style("fill", (d) => color(d.free))
      .attr("r", (d) => size(d["ratings"]))
      .attr("cx", (d) => x(d.score))
      .attr("cy", (d) => y(d.contentRating))
      .append("title")
      .text((d) => d.title);

    svg
      .append("g")
      .attr("id", "gXaxis")
      .attr("transform", `translate(0, ${height + margin.top})`)
      .call(d3.axisBottom(x));
    svg
      .append("g")
      .attr("id", "gYaxis")
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
          return size(d["ratings"]);
        })
      )

      .alphaDecay(0)
      .alpha(0.3)
      .on("tick", tick);

    function tick() {
      d3.selectAll(".circ")
        .attr("id", "circ")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);
    }
    let init_decay = setTimeout(function () {
      console.log("start alpha decay");
      simulation.alphaDecay(0.1);
    }, 3000);
  });
}

function createLinePlot(id) {
  var svg = d3
    .select(id)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  d3.csv("data/final_appData.csv", function (d) {
    return {
      date: d3.timeParse("%Y-%m-%d")(d.released),
      value: d.reviews,
      title: d.title,
    };
  }).then(
    // Now I can use this dataset:
    function (data) {
      // Add X axis --> it is a date format
      data = data.sort((objA, objB) => Number(objA.date) - Number(objB.date));
      const x = d3
        .scaleTime()
        .domain(
          d3.extent(data, function (d) {
            return d.date;
          })
        )
        .range([0, width]);
      xAxis = svg
        .append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

      // Add Y axis
      const y = d3
        .scaleLinear()
        .domain([
          0,
          d3.max(data, function (d) {
            return +d.value;
          }),
        ])
        .range([height, 0]);
      yAxis = svg.append("g").call(d3.axisLeft(y));

      // Add a clipPath: everything out of this area won't be drawn.
      const clip = svg
        .append("defs")
        .append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("class", "rect itemValues")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);

      // Add brushing
      const brush = d3
        .brushX() // Add the brush feature using the d3.brush function
        .extent([
          [0, 0],
          [width, height],
        ]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
        .on("end", updateChartzoom); // Each time the brush selection changes, trigger the 'updateChartzoom' function

      // Create the line variable: where both the line and the brush take place
      const line = svg.append("g").attr("clip-path", "url(#clip)");

      // Add the line
      line
        .append("path")
        .datum(data)
        .attr("class", "line itemValues") // I add the class line to be able to modify this line later on.
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr(
          "d",
          d3
            .line()
            .x(function (d) {
              return x(d.date);
            })
            .y(function (d) {
              return y(d.value);
            })
        );
      // adding circles
      line
        .selectAll(".circle")
        .data(data)
        .join("circle")
        .attr("class", "circle itemValues")
        .attr("cx", (d) => x(d.date))
        .attr("cy", (d) => y(d.value))
        .attr("r", 1)
        .style("fill", "blue");

      // Add the brushing
      line.append("g").attr("class", "brush").call(brush);

      // A function that set idleTimeOut to null
      let idleTimeout;
      function idled() {
        idleTimeout = null;
      }

      // A function that update the chart for given boundaries
      function updateChartzoom(event, d) {
        // What are the selected boundaries?
        extent = event.selection;

        // If no selection, back to initial coordinate. Otherwise, update X axis domain
        if (!extent) {
          if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350)); // This allows to wait a little bit
          x.domain([4, 8]);
        } else {
          updatebubbleChart(x.invert(extent[0]), x.invert(extent[1]));
          //console.log(x.invert(extent[0]));
          x.domain([x.invert(extent[0]), x.invert(extent[1])]);
          line.select(".brush").call(brush.move, null); // This remove the grey brush area as soon as the selection has been done
        }

        // Update axis and line position
        xAxis.transition().duration(1000).call(d3.axisBottom(x));
        line
          .selectAll(".line")
          .transition()
          .duration(1000)
          .attr(
            "d",
            d3
              .line()
              .x(function (d) {
                return x(d.date);
              })
              .y(function (d) {
                return y(d.value);
              })
          );
        line
          .selectAll(".circle")
          .transition()
          .duration(1000)
          .attr("cx", function (d) {
            return x(d.date);
          })
          .atrr("cy", function (d) {
            return y(d.value);
          });
      }

      // If user double click, reinitialize the chart
      svg.on("dblclick", function () {
        const full_time_span = [
          new Date("December 17, 1971 03:24:00"),
          new Date("December 17, 2030 03:24:00"),
        ];

        updatebubbleChart(full_time_span[0], full_time_span[1]);
        x.domain(
          d3.extent(data, function (d) {
            return d.date;
          })
        );
        xAxis.transition().call(d3.axisBottom(x));
        line
          .selectAll(".line")
          .transition()
          .attr(
            "d",
            d3
              .line()
              .x(function (d) {
                return x(d.date);
              })
              .y(function (d) {
                return y(d.value);
              })
          );
        line
          .selectAll(".circle")
          .transition()
          .attr("cx", function (d) {
            return x(d.date);
          })
          .atrr("cy", function (d) {
            return y(d.value);
          });
      });
    }
  );
}
function updatebubbleChart(startDate, endDate) {
  d3.csv("data/final_appData.csv").then(function (data) {
    startDate = startDate.toISOString().split("T")[0];
    endDate = endDate.toISOString().split("T")[0];

    data = data.filter(function (elem) {
      return startDate <= elem.released && elem.released <= endDate;
    });

    let nodes = [];
    data.forEach((d) => {
      nodes.push({
        id: d.title,
        score: d.score,
        ratings: d.ratings,
        contentRating: d.contentRating,
        genre: d.genre,
        free: d.free,
        title: d.title,
        icon: d.icon,
      });
    });

    let sectors = Array.from(
      new Set(data.map((d) => d.contentRating))
    ).reverse();
    const free_category = Array.from(new Set(data.map((d) => d.free))).sort();
    const y = d3.scalePoint().domain(sectors).range([height, margin.top]);
    const x = d3
      .scaleLinear()
      .domain(d3.extent(data.map((d) => +d["score"])))
      .range([margin.left, width]);

    let color = d3.scaleOrdinal().domain(free_category).range(["blue", "red"]);
    let ratingsDomain = d3.extent(data.map((d) => +d["ratings"]));
    let size = d3.scaleSqrt().domain(ratingsDomain).range([1, 20]);
    const svg = d3.select("#gBubbleChart");
    svg
      .selectAll(".circ")
      .data(nodes)
      .join("circle")
      .attr("class", "circ itemValues")
      .attr("stroke", "black")
      .attr("class", "circ")
      .style("fill", (d) => color(d.free))
      .attr("r", (d) => size(d["ratings"]))
      .attr("cx", (d) => x(d.score))
      .attr("cy", (d) => y(d.contentRating))
      .append("title")
      .text((d) => d.title);

    svg.select("gXaxis").call(d3.axisBottom(x));
    svg.select("#gYaxis").call(d3.axisLeft(y));
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
          return size(d["ratings"]);
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
