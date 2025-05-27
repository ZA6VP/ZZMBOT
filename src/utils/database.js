const mongoose = require('mongoose');

let isConnected = false;
let connectionAttempts = 0;
const maxRetries = 3;

async function connectDatabase() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pdw-bot';

        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            bufferCommands: false,
        });

        isConnected = true;
        connectionAttempts = 0;
        console.log('MongoDB connected successfully');

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err.message);
            isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
            isConnected = false;

            // Attempt to reconnect
            if (connectionAttempts < maxRetries) {
                connectionAttempts++;
                console.log(`Attempting to reconnect to MongoDB (${connectionAttempts}/${maxRetries})...`);
                setTimeout(() => connectDatabase(), 5000);
            }
        });

        mongoose.connection.on('connected', () => {
            console.log('MongoDB connected');
            isConnected = true;
            connectionAttempts = 0;
        });

    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        isConnected = false;
        console.log('Bot will continue without database features');

        // Try to reconnect after delay
        if (connectionAttempts < maxRetries) {
            connectionAttempts++;
            console.log(`Retrying database connection in 10 seconds (${connectionAttempts}/${maxRetries})...`);
            setTimeout(() => connectDatabase(), 10000);
        }
    }
}

function isDbConnected() {
    return isConnected && mongoose.connection.readyState === 1;
}

module.exports = { connectDatabase, isDbConnected };