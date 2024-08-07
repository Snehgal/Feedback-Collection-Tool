document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('barChart').getContext('2d');
    let barChart;

    async function fetchData() {
        const room = document.getElementById('room').value;
        const course = document.getElementById('course').value;
        const batch = document.getElementById('batch').value;
        const lab = document.getElementById('lab').value;
    
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Set timeout to 10 seconds
    
        document.querySelector('.loading').style.display = 'block'; // Show loading spinner
    
        try {
            const response = await fetch(`/data?room=${room}&course=${course}&batch=${batch}&lab=${lab}`, {
                signal: controller.signal
            });
            const data = await response.json();
            await updateChart(data);
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Request timed out');
            } else {
                console.error('Error fetching data:', error);
            }
        } finally {
            clearTimeout(timeoutId); // Clear timeout
            document.querySelector('.loading').style.display = 'none'; // Hide loading spinner
        }
    }
    

    async function updateChart(data) {
        if (barChart) {
            barChart.destroy(); // Ensure previous chart is destroyed
        }
    
        barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Positive Responses', 'Negative Responses', 'Resolved Help Calls', 'Unresolved Help Calls'],
                datasets: [{
                    label: 'Counts',
                    data: [data.positiveResponses, data.negativeResponses, data.resolvedHelps, data.unresolvedHelps],
                    backgroundColor: ['#16cc62', '#c10422', '#f0d175', '#f7a009'], // Pastel colors
                    borderColor: ['#16cc82', '#c10482', '#f0d185', '#f7a089'],
                    borderWidth: 2 // Increased border width
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
        
                plugins: {
                    legend: {
                        display: false,
                        position: 'top',
                        labels: {
                            font: {
                                size: 14 // Larger font size for legend
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw;
                                const total = data.positiveResponses + data.negativeResponses + data.resolvedHelps + data.unresolvedHelps;
                                const percentage = ((value / total) * 100).toFixed(2);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        },
                        bodyFont: {
                            size: 14 // Larger font size for tooltips
                        }
                    },
                    datalabels: {
                        display: true,
                        color: '#fff',
                        anchor: 'end',
                        align: 'top',
                        formatter: function(value) {
                            return value;
                        },
                        font: {
                            size: 12 // Font size for data labels
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Type of Response',
                            font: {
                                size: 16 // Larger font size for x-axis title
                            }
                        },
                        grid: {
                            display: true // Hide x-axis grid lines
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Frequency',
                            font: {
                                size: 16 // Larger font size for y-axis title
                            }
                        },
                        grid: {
                            borderColor: '#ccc', // Light grid lines
                            borderWidth: 1, // Thin border width
                            lineWidth: 0.5 // Thin line width
                        }
                    }
                }
            }
        });
    }
    
    

    document.querySelectorAll('select').forEach(el => {
        el.addEventListener('change', fetchData);
    });

    fetchData(); // Initial data fetch
});
