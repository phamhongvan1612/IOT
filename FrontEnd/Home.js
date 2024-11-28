async function fetchData() {
  try {
    const response = await fetch("http://localhost:3000/api/data1");
    const data = await response.json();

    // Sort data by time (assuming data is not sorted)
    const sortedData = data.sort((a, b) => new Date(a.Time) - new Date(b.Time));

    // Take the 20 most recent entries
    const latestData = sortedData.slice(-20);

    // Extract and format data for the chart
    const labels = latestData.map((item) =>
      new Date(item.Time).toLocaleString("en-GB", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );

    const temperatureData = latestData.map((item) => item.Temperature);
    const humidityData = latestData.map((item) => item.Humidity);
    const lightData = latestData.map((item) => item.Light);

    // Set up the canvas context
    const canvas = document.getElementById("myChart").getContext("2d");

    // Create the chart with temperature, humidity, and light data, and configure dual y-axes
    const myChart = new Chart(canvas, {
      type: "line",
      data: {
        labels: labels, // Use formatted labels
        datasets: [
          {
            label: "Temperature",
            data: temperatureData,
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 2,
            fill: false,
            yAxisID: "y1", // Assign to first y-axis
          },
          {
            label: "Humidity",
            data: humidityData,
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 2,
            fill: false,
            yAxisID: "y1", // Assign to first y-axis
          },
          {
            label: "Light",
            data: lightData,
            borderColor: "rgba(255, 206, 86, 1)",
            borderWidth: 2,
            fill: false,
            yAxisID: "y2", // Assign to second y-axis
          },
        ],
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: "Date and Time",
            },
          },
          y1: {
            type: "linear",
            position: "left",
            title: {
              display: true,
              text: "Temperature and Humidity",
            },
          },
          y2: {
            type: "linear",
            position: "right",
            title: {
              display: true,
              text: "Light Intensity",
            },
            grid: {
              drawOnChartArea: false, // Avoid grid overlap with y1 axis
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
// Call fetchData on page load
fetchData();
