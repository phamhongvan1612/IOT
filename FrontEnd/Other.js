async function fetchData() {
  try {
    const response = await fetch("http://localhost:4000/api/Data1");
    const data = await response.json();
    console.log("Fetched data:", data); // Check if data is fetched

    // Extracting and formatting data for the chart
    const labels = data.map((item) => {
      return new Date(item.Time).toLocaleString("en-GB", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    });

    const dustData = data.map((item) => item.Dust);

    // Set up the canvas context
    const canvas = document.getElementById("otherChart").getContext("2d");

    // Create the chart with only Dust data
    const otherChart = new Chart(canvas, {
      type: "bar", // Set the chart type to bar
      data: {
        labels: labels, // Use formatted labels
        datasets: [
          {
            label: "Dust",
            data: dustData,
            backgroundColor: "rgba(153, 102, 255, 0.5)",
            borderColor: "rgba(153, 102, 255, 1)",
            borderWidth: 1,
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
          y: {
            title: {
              display: true,
              text: "Dust Level",
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Load chart after page loads
window.addEventListener("load", fetchData);
