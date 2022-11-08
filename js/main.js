const margin = { top: 25, right: 30, bottom: 40, left: 90 };
const width = 600 - margin.left - margin.right;
const height = 350 - margin.top - margin.bottom;

// Global filter variables
let startDate;
let endDate;
let filterparam_contentRating;

function init() {
  createBubbleChart("#bubblechart");
  createLinePlot("#lineChart");
}

function createBubbleChart(id) {
  let svg = d3
    .select(id)
    .attr("width", width + margin.left + 2*margin.right)
    .attr("height", height + margin.top + 2*margin.bottom)
    .append("g")
    .attr("id", "gBubbleChart")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  data = d3.csv("data/final_appData.csv").then(function (data) {
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
    const y = d3
      .scalePoint()
      .domain(sectors)
      .range([height, margin.bottom + margin.top]);
    const x = d3
      .scaleLinear()
      .domain(d3.extent(data.map((d) => +d["score"])))
      .range([margin.bottom, width - margin.left]);

    let color = d3.scaleOrdinal().domain(free_category).range(["blue", "red"]);
    let ratingsDomain = d3.extent(data.map((d) => +d["ratings"]));
    let size = d3.scaleSqrt().domain(ratingsDomain).range([1, 15]);

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
      .on("mouseover", (event, d) => handleMouseOver(d))
      .on("mouseleave", (event, d) => handleMouseLeave(d))
      .append("title")
      .text((d) => d.title);

      svg.append("text")
      .attr("x", (width / 2))             
      .attr("y", 0 - (margin.top/4 ))
      .attr("text-anchor", "middle")  
      .attr("font-family", "sans-serif")
      .attr("font-size", "16px")
      .text("Score and number of installs of each app");

      svg
    .append("text")      // text label for the x axis
    .attr("x", 0)
    .attr("y",  height + margin.top )
    .attr("font-family", "sans-serif")
    .attr("font-size", "12px")
    .attr("font-weight", 700)
    .text("rating");

    svg
    .append("text")      // text label for the y axis
    .attr("x",  0 - margin.left)
    .attr("y", 0 + 2*margin.top )
    .attr("font-family", "sans-serif")
    .attr("font-size", "12px")
    .attr("font-weight", 700)
    .text("content rating");

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

    svg.select("#gYaxis").selectAll(".tick").on("click", clickMe);

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
      .alpha(0.2)
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
    .attr("width", width + margin.left + 3* margin.right)
    .attr("height", height + margin.top  +  margin.bottom)
    .append("g")
    .attr("id", "gLineChart")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  d3.csv("data/final_appData.csv", function (d) {
    return {
      date: d3.timeParse("%Y-%m-%d")(d.released),
      value: d.Installs,
      title: d.title,
      free: d.free,
      contentRating: d.contentRating,
    };
  }).then(
    // Now I can use this dataset:
    function (data) {
      let original_data = data;
      const free_category = Array.from(new Set(data.map((d) => d.free))).sort();
      data = data.sort((objA, objB) => Number(objA.date) - Number(objB.date));

      let color = d3
        .scaleOrdinal()
        .domain(free_category)
        .range(["blue", "red"]);

      // Add X axis --> it is a date format
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
        .attr("id", "xAxisLineChart")
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
      yAxis = svg.append("g").attr("id", "yAxisLineChart").call(d3.axisLeft(y));

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
        svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .attr("font-family", "sans-serif")
        .attr("font-size", "16px")
        .text("Release year and number of installs per day of each app");
        
        svg.append("text")      // text label for the x axis
        .attr("x", width)
        .attr("y",  height + margin.top )
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .attr("font-weight", 700)
        .text("release \r year");
    
        svg.append("text")      // text label for the y axis
        .attr("x",  0 - margin.left)
        .attr("y", 0 )
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .attr("font-weight", 700)
        .text("number of installs per day");
  
      // Add brushing
      const brush = d3
        .brushX() // Add the brush feature using the d3.brush function
        .extent([
          [0, 0],
          [width, height],
        ]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
        .on("end", updateChartzoom); // Each time the brush selection changes, trigger the 'updateChartzoom' function

      // Create the line variable: where both the line and the brush take place
      const line = svg
        .append("g")
        .attr("clip-path", "url(#clip)")
        .attr("id", "gLine");

      // Add the line
      line
        .append("path")
        //.attr("id", "linePath") //maybe not needed
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
        .style("fill", (d) => color(d.free))
        .attr("cx", (d) => x(d.date))
        .attr("cy", (d) => y(d.value))
        .attr("r", 1.3);

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
          updatebubbleChart({
            startDate: x.invert(extent[0]),
            endDate: x.invert(extent[1]),
          });

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
          .attr("cy", function (d) {
            return y(d.value);
          });
      }

      // If user double click, reinitialize the chart
      svg.on("dblclick", function () {
        const sectors = Array.from(
          new Set(original_data.map((d) => d.contentRating))
        ).reverse();

        const full_time_span = [
          new Date("December 17, 1971 03:24:00"),
          new Date("December 17, 2030 03:24:00"),
        ];

        updatebubbleChart({
          startDate: full_time_span[0],
          endDate: full_time_span[1],
          filterparam_contentRating: sectors,
        });

        x.domain(
          d3.extent(original_data, function (d) {
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
          .attr("cy", function (d) {
            return y(d.value);
          });
      });
    }
  );
}
////////////////////////////////////////////////////////////////////////
// on click function from bubble y axis
function clickMe() {
  updatebubbleChart({ filterparam_contentRating: this.textContent });
  updateLinePlot({ filterparam_contentRating: this.textContent });
}

////////////////////////////////////////////////////////////////////////
// update Bubble
function updatebubbleChart(args) {
  // create optional args for multifiltering
  startDate = args.startDate || startDate;
  endDate = args.endDate || endDate;
  filterparam_contentRating =
    args.filterparam_contentRating || filterparam_contentRating;

  d3.csv("data/final_appData.csv").then(function (data) {
    if (startDate) {
      if (Object.prototype.toString.call(startDate) === "[object Date]") {
        startDate = startDate.toISOString().split("T")[0];
        endDate = endDate.toISOString().split("T")[0];
      }
      data = data.filter(function (elem) {
        return startDate <= elem.released && elem.released <= endDate;
      });
    }
    if (filterparam_contentRating) {
      if (Array.isArray(filterparam_contentRating)) {
        data = data.filter(function (elem) {
          return elem;
        });
      } else {
        data = data.filter(function (elem) {
          return elem.contentRating == filterparam_contentRating;
        });
      }
    }
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
    const y = d3
      .scalePoint()
      .domain(sectors)
      .range([height, margin.bottom + margin.top]);
    const x = d3
      .scaleLinear()
      .domain(d3.extent(data.map((d) => +d["score"])))
      .range([margin.bottom, width - margin.left]);

    let color = d3.scaleOrdinal().domain(free_category).range(["blue", "red"]);
    let ratingsDomain = d3.extent(data.map((d) => +d["ratings"]));
    let size = d3.scaleSqrt().domain(ratingsDomain).range([1, 15]);
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

    svg.select("#gYaxis").selectAll(".tick").on("click", clickMe);

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

////////////////////////////////////////////////////////////////////////

// updateline Chart
// not ready yet
function updateLinePlot(args) {
  filterparam_contentRating =
    args.filterparam_contentRating || filterparam_contentRating;
  d3.csv("data/final_appData.csv", function (d) {
    return {
      date: d3.timeParse("%Y-%m-%d")(d.released),
      value: d.Installs,
      title: d.title,
      free: d.free,
      contentRating: d.contentRating,
    };
  }).then(function (data) {
    data = data.sort((objA, objB) => Number(objA.date) - Number(objB.date));
    let original_data = data;
    const free_category = Array.from(new Set(data.map((d) => d.free))).sort();
    let sectors = Array.from(
      new Set(data.map((d) => d.contentRating))
    ).reverse();

    // filter for contentRating if exists
    if (filterparam_contentRating) {
      if (Array.isArray(filterparam_contentRating)) {
        console.log("arr");
        data = data.filter(function (elem) {
          return elem;
        });
      } else {
        console.log("str");
        data = data.filter(function (elem) {
          console.log(filterparam_contentRating);
          return elem.contentRating === filterparam_contentRating;
        });
      }
    }

    let color = d3.scaleOrdinal().domain(free_category).range(["blue", "red"]);

    let svg = d3.select("#gLineChart");
    const x = d3
      .scaleTime()
      .domain(
        d3.extent(original_data, function (d) {
          return d.date;
        })
      )
      .range([0, width]);

    xAxis = svg
      .select("#xAxisLineChart")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x));

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(original_data, function (d) {
          return +d.value;
        }),
      ])
      .range([height, 0]);
    yAxis = svg.select("#yAxisLineChart").call(d3.axisLeft(y));

    // Add a clipPath: everything out of this area won't be drawn.
    /* const clip = d3
      .select("#clip")
      .append("svg:rect")
      .attr("class", "rect itemValues")
      .attr("width", width)
      .attr("height", height)
      .attr("x", 0)
      .attr("y", 0); */

    // Add brushing
    const brush = d3
      .brushX() // Add the brush feature using the d3.brush function
      .extent([
        [0, 0],
        [width, height],
      ]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
      .on("end", updateChartzoom); // Each time the brush selection changes, trigger the 'updateChartzoom' function

    // Create the line variable: where both the line and the brush take place
    const line = svg.select("#gLine");

    // Add the line
    line
      .select("path.itemValues")
      .datum(data)
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
      .join(
        (enter) => {
          circles = enter
            .append("circle")
            .attr("class", "circle itemValues")
            .attr("cx", (d) => x(d.date))
            .attr("cy", (d) => y(d.value))
            .attr("r", 1.3)
            .style("fill", (d) => color(d.free))
            .on("mouseover", (event, d) => handleMouseOver(d))
            .on("mouseleave", (event, d) => handleMouseLeave(d));
          circles.append("title").text((d) => d.title);
        },
        (update) => {
          update
            .attr("cx", (d) => x(d.date))
            .attr("cy", (d) => y(d.value))
            .attr("r", 1.3)
            .style("fill", (d) => color(d.free));
        },
        (exit) => {
          exit.remove();
        }
      );

    // Add the brushing
    line.select(".brush").call(brush);

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
        updatebubbleChart({
          startDate: x.invert(extent[0]),
          endDate: x.invert(extent[1]),
        });

        x.domain([x.invert(extent[0]), x.invert(extent[1])]);
        line.select(".brush").call(brush.move, null); // This remove the grey brush area as soon as the selection has been done
      }

      // Update axis and line position
      xAxis.transition().duration(1000).call(d3.axisBottom(x));
      line
        .selectAll(".line")
        .datum(original_data)
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
        .data(original_data)
        .join(
          (enter) => {
            circles = enter
              .append("circle")
              .attr("class", "circle itemValues")
              .attr("cx", (d) => x(d.date))
              .attr("cy", (d) => y(d.value))
              .attr("r", 1.3)
              .style("fill", (d) => color(d.free))
              .on("mouseover", (event, d) => handleMouseOver(d))
              .on("mouseleave", (event, d) => handleMouseLeave(d));
            circles.transition().duration(1000);
            circles.append("title").text((d) => d.title);
          },
          (update) => {
            update
              .attr("cx", (d) => x(d.date))
              .attr("cy", (d) => y(d.value))
              .attr("r", 1.3)
              .style("fill", (d) => color(d.free));
          },
          (exit) => {
            exit.remove();
          }
        );
    }

    // If user double click, reinitialize the chart
    svg.on("dblclick", function () {
      const full_time_span = [
        new Date("December 17, 1971 03:24:00"),
        new Date("December 17, 2030 03:24:00"),
      ];
      let sectors = Array.from(
        new Set(original_data.map((d) => d.contentRating))
      ).reverse();

      updatebubbleChart({
        startDate: full_time_span[0],
        endDate: full_time_span[1],
        filterparam_contentRating: sectors,
      });
      x.domain(
        d3.extent(original_data, function (d) {
          return d.date;
        })
      );
      xAxis.transition().call(d3.axisBottom(x));
      line;
      line
        .select("path.line") //maybe not needed
        .datum(original_data)
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

      // adding circles
      line
        .selectAll(".circle")
        .data(original_data)
        .join("circle")
        .attr("class", "circle itemValues")
        .style("fill", (d) => color(d.free))
        .attr("r", 1.3)
        .attr("cx", (d) => x(d.date))
        .attr("cy", (d) => y(d.value))
        .append("title")
        .text((d) => d.title);
    });
  });
}

function handleMouseOver(item) {
  let data = d3.csv("data/final_appData.csv").then(function (data) {
    const free_category = Array.from(new Set(data.map((d) => d.free))).sort();
    let color = d3.scaleOrdinal().domain(free_category).range(["blue", "red"]);
    d3.selectAll(".circle")
      .filter(function (d, i) {
        return d.title == item.title;
      })
      .attr("r", 10)
      .style("fill", (item) => color(item.free));

    d3.selectAll(".circ")
      .filter(function (d, i) {
        return d.title != item.title;
      })
      .attr("fill-opacity", 0.2);
  });
}

function handleMouseLeave(item) {
  let data = d3.csv("data/final_appData.csv").then(function (data) {
    const free_category = Array.from(new Set(data.map((d) => d.free))).sort();
    let color = d3.scaleOrdinal().domain(free_category).range(["blue", "red"]);
    d3.selectAll(".circle")
      .attr("r", 1.3)
      .style("fill", (item) => color(item.free));
    d3.selectAll(".circ").attr("fill-opacity", 1);
  });
}
