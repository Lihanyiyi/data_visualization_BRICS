import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

const LineChart = ({ data, type, metric, selectedItem, onReset }) => {
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    // Resize dynamically based on parent container
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height: height || 400 });
    });

    const currentSvg = svgRef.current;
    if (currentSvg) {
      resizeObserver.observe(currentSvg.parentNode);
    }

    return () => {
      if (currentSvg) resizeObserver.unobserve(currentSvg.parentNode);
    };
  }, []);

  useEffect(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return;

    const { width, height } = dimensions;
    const margin = { top: 20, right: 30, bottom: 30, left: 60 };

    // Calculate average values for each year
    const calculateAverages = (data) => {
      const yearGroups = d3.group(data, (d) => d.year);
      return Array.from(yearGroups, ([year, values]) => {
        const avg = d3.mean(values, (d) => d.val);
        return { year: +year, val: avg };
      }).sort((a, b) => a.year - b.year);
    };

    // Get data based on selection
    let displayData;
    if (selectedItem) {
      // Filter data for selected item
      displayData = data
        .filter(
          (d) =>
            d.type === type &&
            d.metrics === metric &&
            (type === "country"
              ? d.location === selectedItem
              : d.cause === selectedItem)
        )
        .sort((a, b) => a.year - b.year);
    } else {
      // Calculate and use average values
      displayData = calculateAverages(
        data.filter((d) => d.type === type && d.metrics === metric)
      );
    }

    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(displayData, (d) => d.year))
      .range([margin.left, width - margin.right]);

    // Calculate y-axis domain with padding
    const yMax = d3.max(displayData, (d) => d.val);
    const yMin = d3.min(displayData, (d) => d.val);
    const yPadding = (yMax - yMin) * 0.1; // 10% padding

    const yScale = d3
      .scaleLinear()
      .domain([Math.max(0, yMin - yPadding), yMax + yPadding])
      .range([height - margin.bottom, margin.top]);

    // Create line generator
    const line = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.val))
      .curve(d3.curveMonotoneX);

    // Select the SVG element and clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.format("d")))
      .call((g) => g.select(".domain").remove())
      // rotate 45 degrees and add the line for X axis
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", width)
      .attr("y2", 0)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1)
      .style("font-size", "12px");
    // add the line for X axis

    // Add Y axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale))
      .call((g) => g.select(".domain").remove())
      // add the line for Y axis
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", height)
      .attr("stroke", "#ccc")
      .style("font-size", "12px");

    // Add the line path
    svg
      .append("path")
      .datum(displayData)
      .attr("fill", "none")
      .attr("stroke", "#fc8d62")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add dots
    const dots = svg
      .append("g")
      .selectAll("circle")
      .data(displayData)
      .join("circle")
      .attr("cx", (d) => xScale(d.year))
      .attr("cy", (d) => yScale(d.val))
      .attr("r", 4)
      .attr("fill", "#fc8d62")
      .style("cursor", "pointer");

    // Add tooltip
    const tooltip = d3.select("#tooltip");

    dots
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 6);
        tooltip
          .style("opacity", 1)
          .style("left", `${event.pageX + 5}px`)
          .style("top", `${event.pageY - 20}px`)
          .html(
            `<strong>${d.year}</strong><br/>Value: ${
              metric === "Percent" ? d.val.toFixed(4) + "%" : d.val.toFixed(0)
            }`
          );
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 4);
        tooltip.style("opacity", 0);
      });

    // Add axis labels with adjusted positioning
    // svg
    //   .append("text")
    //   .attr("x", width / 2)
    //   .attr("y", height - margin.bottom / 2)
    //   .attr("text-anchor", "middle")
    //   .style("font-size", "12px")
    //   .text("Year");

    // svg
    //   .append("text")
    //   .attr("transform", "rotate(-90)")
    //   .attr("x", -height / 2)
    //   .attr("y", margin.left / 2 - 10) // Adjusted position
    //   .attr("text-anchor", "middle")
    //   .style("font-size", "12px")
    //   .text(metric === "Percent" ? "Percentage" : "Number");
  }, [data, type, metric, selectedItem, dimensions]);

  return (
    <div>
      <svg ref={svgRef} width="100%" height={dimensions.height}></svg>
      <div
        id="tooltip"
        style={{
          position: "absolute",
          opacity: 0,
          backgroundColor: "white",
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "5px",
          pointerEvents: "none",
          fontSize: "12px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      ></div>
    </div>
  );
};

export default LineChart;
