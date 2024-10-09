import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TransactionTable from './components/TransactionTable';
import BarChartComponent from './components/BarChartComponent';
import PieChartComponent from './components/PieChartComponent';
import TransactionStatistics from './components/TransactionStatistics'; // Importing the new component
import './App.css';  // optional for custom styling

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [month, setMonth] = useState('March');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 10;

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Fetch transactions data based on month, page, and search query
  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/transactions`, {
        params: { month, page, perPage, search: searchQuery }
      });
      setTransactions(response.data.transactions);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    fetchTransactions(); // Fetch transactions whenever month, searchQuery, or page changes
  }, [month, searchQuery, page]);

  const handleSearchChange = (event) => setSearchQuery(event.target.value);
  const handleMonthChange = (event) => setMonth(event.target.value);

  const handleNextPage = () => page < totalPages && setPage(page + 1);
  const handlePreviousPage = () => page > 1 && setPage(page - 1);

  return (
    <div>
      <h1>Transactions Dashboard</h1>

      {/* Dropdown for Month Selection */}
      <label htmlFor="month-select">Select Month: </label>
      <select id="month-select" value={month} onChange={handleMonthChange}>
        {months.map((monthOption) => (
          <option key={monthOption} value={monthOption}>{monthOption}</option>
        ))}
      </select>

      {/* Search Box */}
      <input
        type="text"
        placeholder="Search transactions"
        value={searchQuery}
        onChange={handleSearchChange}
      />

      {/* Transaction Statistics */}
      <TransactionStatistics month={month} />

      {/* Transaction Table */}
      <TransactionTable transactions={transactions} />

      {/* Pagination Controls */}
      <button onClick={handlePreviousPage} disabled={page === 1}>Previous</button>
      <span> Page {page} of {totalPages} </span>
      <button onClick={handleNextPage} disabled={page === totalPages}>Next</button>

      {/* Charts */}
      <BarChartComponent month={month} />
      <PieChartComponent month={month} />
    </div>
  );
};

export default App;
