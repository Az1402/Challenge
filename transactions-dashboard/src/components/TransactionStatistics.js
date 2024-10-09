import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TransactionStatistics = ({ selectedMonth }) => {
    const [statistics, setStatistics] = useState({
        totalAmount: 0,
        totalSoldItems: 0,
        totalNotSoldItems: 0,
    });

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/api/statistics?month=${selectedMonth}`);
                setStatistics(response.data); // Assuming your API returns the stats in this format
            } catch (error) {
                console.error('Error fetching statistics:', error);
            }
        };

        fetchStatistics();
    }, [selectedMonth]); // Fetch new data when the selected month changes

    return (
        <div>
            <h2>Transaction Statistics for {selectedMonth}</h2>
            <div>
                <p>Total Amount of Sale: ${statistics.totalAmount.toFixed(2)}</p>
                <p>Total Sold Items: {statistics.totalSoldItems}</p>
                <p>Total Not Sold Items: {statistics.totalNotSoldItems}</p>
            </div>
        </div>
    );
};

export default TransactionStatistics;
