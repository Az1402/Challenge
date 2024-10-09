import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LinearScale,
    CategoryScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register the necessary components
ChartJS.register(LinearScale, CategoryScale, BarElement, Title, Tooltip, Legend);

const TransactionsBarChart = ({ month }) => {
    const data = {
        labels: ['Label1', 'Label2', 'Label3'], // replace with dynamic labels
        datasets: [
            {
                label: 'Number of Items',
                data: [12, 19, 3], // replace with dynamic data
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Price Range',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Number of Items',
                },
            },
        },
    };

    return <Bar data={data} options={options} />;
};

export default TransactionsBarChart;
