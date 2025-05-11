import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

const Treemap = ({ data, type, metric, onItemClick }) => {
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    // Resize dynamically based on parent container
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height: height || 600 });
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
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    // Filter data based on type and metric
    const filteredData = data.filter(
      (d) => d.type === type && d.metrics === metric
    );

    // Prepare data for treemap
    const root = d3
      .hierarchy({
        children: filteredData.map((d) => ({
          name: type === "country" ? d.location : d.cause,
          value: d.val || 0,
          originalData: d, // Store the original data for click handling
        })),
      })
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value);

    // Create treemap layout
    const treemap = d3
      .treemap()
      .size([
        width - margin.left - margin.right,
        height - margin.top - margin.bottom,
      ])
      .padding(1)
      .round(true);

    treemap(root);

    console.log("Total value for percentage calculation:", root.value); // Debugging line

    // Select the SVG element and clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create a group for the treemap
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create color scale
    const color = d3
      .scaleOrdinal()
      .domain(
        filteredData.map((d) => (type === "country" ? d.location : d.cause))
      )
      .range(d3.schemeSet3);

    // Create cells
    const cell = g
      .selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    // Add rectangles
    cell
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => color(d.data.name))
      .attr("stroke", "#fff")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        onItemClick(d.data.name);
      })
      .on("mouseover", function (event, d) {
        const tooltip = d3.select("#tooltip");
        const value =
          metric === "Percent"
            ? `${d.data.value.toFixed(4)}%`
            : d.data.value.toFixed(4);

        tooltip
          .style("opacity", 1)
          .style("left", `${event.pageX + 5}px`)
          .style("top", `${event.pageY - 20}px`)
          .html(`<strong>${d.data.name}</strong><br/>Value: ${value}`);
      })
      .on("mouseout", () => {
        d3.select("#tooltip").style("opacity", 0);
      });

    // Add labels
    cell
      .append("text")
      .attr("x", 3)
      .attr("y", 12)
      .text((d) => {
        if (!d.data || !d.data.name) return "";
        const name = String(d.data.name);
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;

        // Only show label if there's enough space
        if (width > 100 && height > 30) {
          return name.length > 20 ? name.substring(0, 20) + "..." : name;
        }
        return "";
      })
      .attr("font-size", "10px")
      .attr("fill", "#000");

    // Add value labels
    cell
      .append("text")
      .attr("x", 3)
      .attr("y", 24)
      .text((d) => {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;

        if (width > 60 && height > 40) {
          const value =
            metric === "Percent"
              ? `${d.data.value.toFixed(1)}%`
              : d.data.value.toFixed(0);
          return value;
        }
        return "";
      })
      .attr("font-size", "10px")
      .attr("fill", "#000");
  }, [data, type, metric, dimensions, onItemClick]);

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

export default Treemap;
