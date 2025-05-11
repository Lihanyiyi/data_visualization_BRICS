import React, { useState, useEffect, useMemo } from "react";
import LineChart from "../components/LineChart";
import Treemap from "../components/Treemap";
import * as d3 from "d3";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "../styles/finalproject.module.css";

const FinalProject = () => {
  const [lineData, setLineData] = useState([]);
  const [treemapData, setTreemapData] = useState([]);
  const [availableCountries, setAvailableCountries] = useState(new Set());
  const [selectedMetric, setSelectedMetric] = useState("Percent");
  const [selectedType, setSelectedType] = useState("country");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    let countrySet = new Set();
    Promise.all([
      d3.csv("/linechart_country.csv"),
      d3.csv("/linechart_risk_average_val1.csv"),
    ]).then(([countryData, riskData]) => {
      // 处理 country 数据
      const processedCountryData = countryData.map((d) => ({
        ...d,
        year: +d.year,
        val: +d.val,
        type: "country",
        metrics: d.metrics,
        location: d.location,
        cause: d.cause,
      }));

      // 处理 risk 数据
      const processedRiskData = riskData.map((d) => ({
        ...d,
        year: +d.year,
        val: +d.val,
        type: "risk",
        metrics: d.metrics,
        cause: d.cause,
      }));

      // 合并数据
      setLineData([...processedCountryData, ...processedRiskData]);
    });
    // // Load line chart data
    // d3.csv("/linechart_country.csv").then((data) => {
    //   const processedLineData = data.map((d) => ({
    //     ...d,
    //     year: +d.year,
    //     val: +d.val,
    //     type: d.type,
    //     metrics: d.metrics,
    //     location: d.location,
    //     cause: d.cause,
    //   }));
    //   setLineData(processedLineData);
    // });

    // // Load line chart risk average data
    // d3.csv("/linechart_risk_average_val1.csv").then((data) => {
    //   const processedRiskData = data.map((d) => ({
    //     ...d,
    //     year: +d.year,
    //     val: +d.val,
    //     type: "risk",
    //     metrics: d.metrics,
    //     cause: d.cause,
    //   }));
    //   setLineData((prevData) => [...prevData, ...processedRiskData]);
    // });

    // Load treemap data
    d3.csv("/treemap.csv").then((data) => {
      const processedTreemapData = data.map((d) => ({
        ...d,
        val: +d.val,
        metrics: d.metrics,
        type: d.type,
        location: d.location,
        cause: d.cause,
      }));
      setTreemapData(processedTreemapData);
      data.forEach((d) => countrySet.add(d.location));
      setAvailableCountries(countrySet);
    });
  }, []);

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
    setSelectedItem(null); // Reset selected item when type changes
  };

  const handleMetricChange = (event) => {
    setSelectedMetric(event.target.value);
  };

  const handleTreemapClick = (item) => {
    setSelectedItem(item);
  };

  const filteredTreemapData = useMemo(() => {
    return treemapData.filter(
      (d) => d.type === selectedType && d.metrics === selectedMetric
    );
  }, [treemapData, selectedType, selectedMetric]);

  const getTreemapTitle = () => {
    return `Distribution of maternal deaths by ${selectedType} (${selectedMetric})`;
  };

  const filteredLineData = useMemo(() => {
    if (!selectedItem) {
      // If no item is selected
      if (selectedType === "risk") {
        // If risk type is selected, show average values for all risks
        return lineData.filter(
          (d) => d.type === "risk" && d.metrics === selectedMetric
        );
      } else {
        // Show average values for all countries
        return lineData.filter(
          (d) => d.type === "country" && d.metrics === selectedMetric
        );
      }
    } else if (selectedType === "risk") {
      // If a risk is selected, show the risk values
      return lineData.filter(
        (d) =>
          d.type === "risk" &&
          d.metrics === selectedMetric &&
          d.cause === selectedItem
      );
    } else {
      // If a country is selected, show the country's values
      return lineData.filter(
        (d) =>
          d.type === "country" &&
          d.metrics === selectedMetric &&
          d.location === selectedItem
      );
    }
  }, [lineData, selectedType, selectedMetric, selectedItem]);

  const getLineChartTitle = () => {
    if (!selectedItem) {
      if (selectedType === "risk") {
        return "BRICS Countries avg value in 1990-2021";
      }
      return "BRICS Countries avg value in 1990-2021";
    }
    return `${
      selectedType === "country" ? "Country" : "Risk"
    }: ${selectedItem}`;
  };

  // Helper functions for descriptions
  const getCountryDescription = (country) => {
    const descriptions = {
      Brazil:
        "Largest country in South America, known for its Amazon rainforest and diverse population",
      Russia:
        "World's largest country by land area, spanning Eastern Europe and Northern Asia",
      India:
        "World's largest democracy, with a rapidly growing economy and diverse culture",
      China: "World's most populous country and second-largest economy",
      "South Africa":
        "Most developed country in Africa, known for its mineral resources and diverse wildlife",
      Egypt:
        "Ancient civilization and key player in Middle Eastern and African affairs",
      Ethiopia:
        "One of Africa's fastest-growing economies and home to diverse cultures",
      Indonesia:
        "World's largest archipelago and Southeast Asia's largest economy",
      Iran: "Major regional power with rich cultural heritage and significant natural resources",
      "United Arab Emirates":
        "Modern federation of seven emirates known for rapid development and oil wealth",
    };
    return descriptions[country] || "";
  };

  const getRiskDescription = (risk) => {
    const descriptions = {
      "Air pollution":
        "Environmental risk caused by harmful substances in the air, affecting respiratory health",
      "Unsafe water, sanitation, and handwashing":
        "Risk from contaminated water sources, leading to waterborne diseases",
      "Occupational risks":
        "Combined risks from workplace hazards and environmental factors",
      "Non-optimal temperature":
        "a risk that is caused by the extreme temperature of the environment, either too hot or too cold",
    };
    return descriptions[risk] || "";
  };

  return (
    <div className="container-fluid p-0">
      {/* Navbar */}
      <nav
        className="navbar navbar-expand-lg navbar-light fixed-top"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div className="container-fluid">
          <div className="w-100 d-flex justify-content-center align-items-center position-relative">
            <span
              className="navbar-brand mb-0 h1 text-center"
              style={{ fontSize: "1.5rem" }}
            >
              Mortality with Environmental/occupational Risks across BRICS
              Countries (1990-2021)
            </span>
            <div className="position-absolute end-0">
              <button
                className="btn btn-outline-secondary"
                onClick={() =>
                  window.scrollTo({ top: -20, behavior: "smooth" })
                }
              >
                Scroll to Top
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div style={{ paddingTop: "60px" }}>
        <div className={`${styles.overviewSection} d-flex align-items-center`}>
          <div className="container text-center">
            <h2 className={`mb-4 ${styles.overviewHeading}`}>Overview</h2>
            <ul className={`text-start mx-auto ${styles.overviewList}`}>
              <li>
                <strong>What is BRICS?</strong> BRICS is an intergovernmental
                organization that consists of ten major countries, namely{" "}
                <strong>
                  Brazil, Russia, India, China, South Africa, Egypt, Ethiopia,
                  Indonesia, Iran, and the United Arab Emirates
                </strong>
                . These countries are recognized for their emerging economies
                and significant influence globally.
              </li>
              <li>
                <strong>Why Environmental/occupational Risks:</strong>{" "}
                Environmental and occupational risks often pose substantial
                threats to people's physical health yet are frequently
                overlooked.
              </li>
              <li>
                <strong>Why This Dashboard?</strong> This dashboard enables
                users to explore mortality trends and cause distribution among
                BRICS countries, identify high-risk regions/causes, and propose
                potential solution.
              </li>
            </ul>
          </div>
        </div>

        {/* Main Layout */}
        <div className="row">
          {/* Treemap */}
          <div className="col-lg-6 d-flex flex-column justify-content-center align-items-center">
            <div style={{ width: "100%", height: "auto", marginTop: "-50px" }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 text-center" style={{ flex: 1 }}>
                  {getTreemapTitle()}
                </h5>
                <div className="d-flex gap-3">
                  <select
                    className="form-select"
                    style={{ width: "150px" }}
                    value={selectedType}
                    onChange={handleTypeChange}
                  >
                    <option value="country">Country</option>
                    <option value="risk">Risk</option>
                  </select>
                  <select
                    className="form-select"
                    style={{ width: "150px" }}
                    value={selectedMetric}
                    onChange={handleMetricChange}
                  >
                    <option value="Percent">Percent</option>
                    <option value="Number">Number</option>
                  </select>
                </div>
              </div>
              <Treemap
                data={filteredTreemapData}
                type={selectedType}
                metric={selectedMetric}
                onItemClick={handleTreemapClick}
              />
            </div>
          </div>

          {/* Charts */}
          <div className="col-lg-6 d-flex flex-column align-items-center">
            {/* Line Chart */}
            <div
              className="mb-4"
              style={{ width: "70%", height: "290px", marginLeft: "50px" }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5
                  className="mb-0"
                  style={{
                    flex: 1,
                    textAlign: "left",
                    marginLeft: "60px",
                  }}
                >
                  {getLineChartTitle()}
                </h5>
                {selectedItem && (
                  <button
                    className="btn btn-outline-secondary"
                    style={{ minWidth: "100px" }}
                    onClick={() => setSelectedItem(null)}
                  >
                    Reset
                  </button>
                )}
              </div>
              <LineChart
                data={filteredLineData}
                type={selectedType}
                metric={selectedMetric}
                selectedItem={selectedItem}
              />
            </div>

            {/* Legend with Explanations */}
            <div
              className="mb-4"
              style={{ width: "70%", marginLeft: "50px", marginTop: "150px" }}
            >
              <div className="card">
                <div className="card-body">
                  {selectedType === "country" ? (
                    <div className="row">
                      <div className="col-6">
                        <div className="d-flex flex-column gap-3">
                          {filteredTreemapData
                            .slice(0, 5)
                            .map((item, index) => (
                              <div
                                key={item.location}
                                className="d-flex align-items-center gap-2"
                              >
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: d3.schemeSet3[index % 12],
                                    color: "#000",
                                    cursor: "pointer",
                                    minWidth: "180px",
                                    textAlign: "center",
                                    padding: "8px 12px",
                                    fontSize: "0.9rem",
                                    whiteSpace: "nowrap",
                                  }}
                                  onClick={() =>
                                    handleTreemapClick(item.location)
                                  }
                                >
                                  {item.location}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="d-flex flex-column gap-3">
                          {filteredTreemapData.slice(5).map((item, index) => (
                            <div
                              key={item.location}
                              className="d-flex align-items-center gap-2"
                            >
                              <span
                                className="badge"
                                style={{
                                  backgroundColor:
                                    d3.schemeSet3[(index + 5) % 12],
                                  color: "#000",
                                  cursor: "pointer",
                                  minWidth: "180px",
                                  textAlign: "center",
                                  padding: "8px 12px",
                                  fontSize: "0.9rem",
                                  whiteSpace: "nowrap",
                                }}
                                onClick={() =>
                                  handleTreemapClick(item.location)
                                }
                              >
                                {item.location}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {filteredTreemapData.map((item, index) => (
                        <div
                          key={item.cause}
                          className="d-flex flex-column gap-2"
                        >
                          <span
                            className="badge"
                            style={{
                              backgroundColor: d3.schemeSet3[index % 12],
                              color: "#000",
                              cursor: "pointer",
                              minWidth: "100%",
                              textAlign: "center",
                              padding: "8px 12px",
                              fontSize: "0.9rem",
                              whiteSpace: "nowrap",
                            }}
                            onClick={() => handleTreemapClick(item.cause)}
                          >
                            {item.cause}
                          </span>
                          <span
                            className="text-muted"
                            style={{
                              fontSize: "0.9rem",
                              flex: 1,
                              lineHeight: "1.4",
                            }}
                          >
                            {getRiskDescription(item.cause)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-5 py-3 bg-light">
          <p className="mb-1">
            Data Source:
            <a
              href="https://vizhub.healthdata.org/gbd-results/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Global Burden of Disease Study 2021 (GBD 2021) Results
            </a>
          </p>
          <small>
            Global Burden of Disease Collaborative Network. Global Burden of
            Disease Study 2021 (GBD 2021) Results. Seattle, United States:
            Institute for Health Metrics and Evaluation (IHME), 2022.
          </small>
        </footer>
      </div>
    </div>
  );
};

export default FinalProject;
