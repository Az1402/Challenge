// const express = require('express');
// import express from "express";
// import axios from "axios";
// import mongoose, { mongo } from "mongoose";

// const app = express();
// const PORT = 3000;

// const postSchema = new mongoose.Schema({
//     id:{
//         type:Number,
//         required : true
//     },
//     title:{
//         type : String,
//         required : true
//     },
//     price:{
//         type : String,
//         required : true
//     },
//     description:{
//         type : String,
//         required : true
//     },
//     category:{
//         type : String,
//         required : true
//     },
//     image:{
//         type : String,
//         required : true
//     },
//     sold:{
//         type : Boolean,
//         required : true
//     },
//     dateOfSale:{
//         type : String,
//         required : true
//     }
// })

// app.listen(PORT, (error) =>{
//     if(!error)
//         console.log("Server is Successfully Running, and App is listening on port "+ PORT)
//     else 
//         console.log("Error occurred, server can't start", error);
//     }
// );

// app.get("/fetch-data", async (req, res) => {
//     try {
//         const apiUrl = "https://s3.amazonaws.com/roxiler.com/product_transaction.json";
//         const response = await axios.get(apiUrl);
        
        
//         mongoose.connect('mongodb://localhost:27017/test');

//         const data = response.data; // Get the API response data

//         console.log("Data fetched from API:", data); // Display data on console
        

//         res.send(data); // Send the data as the response to the browser
//     } catch (error) {
//         console.error("Error fetching data from API:", error);
//         res.status(500).send("Error fetching data from the API");
//     }
// });

import express from "express";
import axios from "axios";
import mongoose from "mongoose";
import cors from 'cors'; 

const app = express();
const PORT = 3000;
app.use(cors()); 

// MongoDB connection (Connect once when the app starts)
// MongoDB connection (with deprecated options removed)
mongoose.connect('mongodb://localhost:27017/test')
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch((error) => console.log("MongoDB connection error:", error));

// Define the schema
const postSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    sold: {
        type: Boolean,
        required: true
    },
    dateOfSale: {
        type: String,
        required: true
    }
});

// Create a model from the schema
const Post = mongoose.model('Post', postSchema);

// Define the fetch-data route
app.get("/fetch-data", async (req, res) => {
    try {
        const apiUrl = "https://s3.amazonaws.com/roxiler.com/product_transaction.json";
        const response = await axios.get(apiUrl);

        const data = response.data; // Get the API response data

        console.log("Data fetched from API:", data); // Display data on console

        // Save the fetched data to MongoDB
        const promises = data.map(item => {
            const newPost = new Post({
                id: item.id,
                title: item.title,
                price: item.price,
                description: item.description,
                category: item.category,
                image: item.image,
                sold: item.sold,
                dateOfSale: item.dateOfSale
            });
            return newPost.save()
                .then(() => console.log(`Saved item with id: ${item.id}`))  // Log successful save
                .catch(err => console.error(`Error saving item with id: ${item.id}`, err));  // Log any error
        });

        // Wait for all the documents to be saved
        await Promise.all(promises);

        console.log("All data successfully saved to MongoDB");
        res.send("Data fetched from the API and successfully saved to MongoDB!");
    } catch (error) {
        console.error("Error fetching or saving data:", error);
        res.status(500).send("Error occurred while fetching data from the API or saving it to MongoDB.");
    }
});


// Define the API for listing transactions with search and pagination
app.get("/transactions", async (req, res) => {
    try {
        const { search = '', month, page = 1, perPage = 10 } = req.query;

        // Create the query object
        let query = {};

        // Search parameters
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },       // Case-insensitive search on title
                { description: { $regex: search, $options: 'i' } }, // Case-insensitive search on description
                { price: { $regex: search, $options: 'i' } }        // Case-insensitive search on price
            ];
        }

        // Filter by month
        if (month) {
            const monthRegex = new RegExp(`^\\d{4}-${month.padStart(2, '0')}-\\d{2}$`);  // Match month in YYYY-MM-DD
            query.dateOfSale = { $regex: monthRegex };
        }

        // Pagination logic
        const limit = parseInt(perPage);
        const skip = (parseInt(page) - 1) * limit;

        // Fetch transactions based on the query, pagination, and sorting by dateOfSale
        const transactions = await Post.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ dateOfSale: -1 });  // Sort by dateOfSale in descending order

        // Get the total count of matching records
        const totalTransactions = await Post.countDocuments(query);

        // Send response
        res.json({
            totalRecords: totalTransactions,
            currentPage: parseInt(page),
            perPage: limit,
            transactions
        });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).send("Error fetching transactions");
    }
});


// Define the API for statistics
app.get("/statistics", async (req, res) => {
    try {
        const { month } = req.query;

        // Ensure month is provided and valid
        if (!month) {
            return res.status(400).send("Month is required");
        }

        // Define regex to match the month in dateOfSale
        const monthRegex = new RegExp(`-(${month.padStart(2, '0')})-`, 'i');  // Match against the month in YYYY-MM-DD format

        // Aggregate pipeline to calculate statistics
        const statistics = await Post.aggregate([
            {
                $match: {
                    dateOfSale: monthRegex // Match the month
                }
            },
            {
                $group: {
                    _id: null,
                    totalSaleAmount: {
                        $sum: { $toDouble: "$price" } // Sum of prices, converting string to number
                    },
                    totalSoldItems: {
                        $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] } // Count sold items
                    },
                    totalNotSoldItems: {
                        $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] } // Count not sold items
                    }
                }
            }
        ]);

        if (statistics.length === 0) {
            return res.json({
                totalSaleAmount: 0,
                totalSoldItems: 0,
                totalNotSoldItems: 0
            });
        }

        // Send response with statistics
        res.json({
            totalSaleAmount: statistics[0].totalSaleAmount,
            totalSoldItems: statistics[0].totalSoldItems,
            totalNotSoldItems: statistics[0].totalNotSoldItems
        });
    } catch (error) {
        console.error("Error fetching statistics:", error);
        res.status(500).send("Error fetching statistics");
    }
});


// Define the API for bar chart data
app.get("/bar-chart", async (req, res) => {
    try {
        const { month } = req.query;

        // Ensure month is provided and valid
        if (!month) {
            return res.status(400).send("Month is required");
        }

        // Define regex to match the month in dateOfSale
        const monthRegex = new RegExp(`-(${month.padStart(2, '0')})-`, 'i');  // Match against the month in YYYY-MM-DD format

        // Define price ranges
        const priceRanges = [
            { range: "0-100", min: 0, max: 100 },
            { range: "101-200", min: 101, max: 200 },
            { range: "201-300", min: 201, max: 300 },
            { range: "301-400", min: 301, max: 400 },
            { range: "401-500", min: 401, max: 500 },
            { range: "501-600", min: 501, max: 600 },
            { range: "601-700", min: 601, max: 700 },
            { range: "701-800", min: 701, max: 800 },
            { range: "801-900", min: 801, max: 900 },
            { range: "901-above", min: 901, max: Infinity }
        ];

        // Prepare aggregation pipeline
        const aggregationPipeline = [
            {
                $match: {
                    dateOfSale: monthRegex // Match the month
                }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $lte: [{ $toDouble: "$price" }, 100] }, "0-100",
                            { $cond: [
                                { $lte: [{ $toDouble: "$price" }, 200] }, "101-200",
                                { $cond: [
                                    { $lte: [{ $toDouble: "$price" }, 300] }, "201-300",
                                    { $cond: [
                                        { $lte: [{ $toDouble: "$price" }, 400] }, "301-400",
                                        { $cond: [
                                            { $lte: [{ $toDouble: "$price" }, 500] }, "401-500",
                                            { $cond: [
                                                { $lte: [{ $toDouble: "$price" }, 600] }, "501-600",
                                                { $cond: [
                                                    { $lte: [{ $toDouble: "$price" }, 700] }, "601-700",
                                                    { $cond: [
                                                        { $lte: [{ $toDouble: "$price" }, 800] }, "701-800",
                                                        { $cond: [
                                                            { $lte: [{ $toDouble: "$price" }, 900] }, "801-900",
                                                            "901-above"
                                                        ] }
                                                    ]}
                                                ]}
                                            ]}
                                        ]}
                                    ]}
                                ]}
                            ]}
                        ]
                    },
                    count: { $sum: 1 // Count the number of items in each price range
                    }
                }
            }
        ];

        // Execute aggregation
        const barChartData = await Post.aggregate(aggregationPipeline);

        // Prepare the response data
        const responseData = priceRanges.map(priceRange => {
            const found = barChartData.find(data => data._id === priceRange.range);
            return {
                range: priceRange.range,
                count: found ? found.count : 0 // If no items in range, count = 0
            };
        });

        // Send response with bar chart data
        res.json(responseData);
    } catch (error) {
        console.error("Error fetching bar chart data:", error);
        res.status(500).send("Error fetching bar chart data");
    }
});



// Define the API for pie chart data
app.get("/pie-chart", async (req, res) => {
    try {
        const { month } = req.query;

        // Ensure the month is provided
        if (!month) {
            return res.status(400).send("Month is required");
        }

        // Create a regex to match the month in dateOfSale (regardless of year)
        const monthRegex = new RegExp(`-(${month.padStart(2, '0')})-`, 'i');

        // Perform aggregation to find unique categories and count the number of items in each category
        const pieChartData = await Post.aggregate([
            {
                $match: {
                    dateOfSale: monthRegex  // Match the selected month
                }
            },
            {
                $group: {
                    _id: "$category",  // Group by category
                    count: { $sum: 1 }  // Count the number of items in each category
                }
            }
        ]);

        // Send the result as a response
        res.json(pieChartData);
    } catch (error) {
        console.error("Error fetching pie chart data:", error);
        res.status(500).send("Error fetching pie chart data");
    }
});


// Combined API
app.get("/combined-data", async (req, res) => {
    try {
        const month = req.query.month; // Get the month from query parameters

        if (!month) {
            return res.status(400).send("Month is required");
        }

        // Fetch data from the three APIs concurrently
        const [transactions, statistics, pieChart] = await Promise.all([
            axios.get(`http://localhost:${PORT}/transactions?month=${month}`),
            axios.get(`http://localhost:${PORT}/statistics?month=${month}`),
            axios.get(`http://localhost:${PORT}/pie-chart?month=${month}`)
        ]);

        // Combine responses
        const combinedResponse = {
            transactions: transactions.data,
            statistics: statistics.data,
            pieChart: pieChart.data
        };

        // Send combined response
        res.json(combinedResponse);
    } catch (error) {
        console.error("Error fetching combined data:", error);
        res.status(500).send("Error fetching combined data");
    }
});


// Start the server
app.listen(PORT, (error) => {
    if (!error) {
        console.log("Server is Successfully Running, and App is listening on port " + PORT);
    } else {
        console.log("Error occurred, server can't start", error);
    }
});
