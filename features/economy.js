const { EmbedBuilder } = require('discord.js');

/**
 * 🏦 ZOLORY ECONOMY SYSTEM V2.0
 * Complete virtual economy with:
 * - ZoloCoins (ZLC) cryptocurrency
 * - Trading system
 * - Stock market
 * - Gambling & betting
 * - Jobs & business
 * - Real estate
 * - NFT marketplace
 * - Banking & loans
 */

class EconomySystem {
    constructor() {
        this.currency = "ZoloCoins";
        this.symbol = "ZLC";
        this.userWallets = new Map();
        this.stockMarket = new Map();
        this.businesses = new Map();
        this.realEstate = new Map();
        this.nftMarket = new Map();
        this.loans = new Map();
        this.tradingPairs = new Map();
        this.jobMarket = new Map();
        
        this.initializeEconomy();
    }

    initializeEconomy() {
        // Initialize stock market
        this.initializeStocks();
        
        // Initialize crypto trading pairs
        this.initializeCrypto();
        
        // Initialize job market
        this.initializeJobs();
        
        // Initialize real estate market
        this.initializeRealEstate();
        
        console.log('💰 Economy system initialized!');
    }

    initializeStocks() {
        const stocks = [
            { symbol: 'ZAPP', name: 'Zap Technologies', price: 150.00, change: 0 },
            { symbol: 'BORI', name: 'Boricua Corp', price: 89.50, change: 0 },
            { symbol: 'HOOD', name: 'Hood Dynamics', price: 45.25, change: 0 },
            { symbol: 'MEME', name: 'Meme Industries', price: 420.69, change: 0 },
            { symbol: 'GAMI', name: 'Gaming United', price: 75.80, change: 0 },
            { symbol: 'TECH', name: 'TechFlow Corp', price: 234.10, change: 0 }
        ];

        for (const stock of stocks) {
            this.stockMarket.set(stock.symbol, {
                ...stock,
                history: [stock.price],
                volume: 0,
                marketCap: stock.price * 1000000
            });
        }
    }

    initializeCrypto() {
        const cryptoPairs = [
            { symbol: 'ZLC/USD', price: 1.00, change: 0 },
            { symbol: 'ZLC/BTC', price: 0.000024, change: 0 },
            { symbol: 'ZLC/ETH', price: 0.00035, change: 0 },
            { symbol: 'ZAPP/ZLC', price: 150.00, change: 0 }
        ];

        for (const pair of cryptoPairs) {
            this.tradingPairs.set(pair.symbol, {
                ...pair,
                volume24h: 0,
                high24h: pair.price,
                low24h: pair.price
            });
        }
    }

    initializeJobs() {
        const jobs = [
            { id: 'dev', name: 'Software Developer', salary: 500, requirements: ['coding'], duration: 60 },
            { id: 'trader', name: 'Crypto Trader', salary: 300, requirements: ['trading'], duration: 45 },
            { id: 'streamer', name: 'Gaming Streamer', salary: 200, requirements: ['gaming'], duration: 120 },
            { id: 'chef', name: 'Restaurant Chef', salary: 180, requirements: [], duration: 90 },
            { id: 'musician', name: 'Street Musician', salary: 100, requirements: [], duration: 30 },
            { id: 'dealer', name: 'Card Dealer', salary: 250, requirements: ['gambling'], duration: 75 }
        ];

        for (const job of jobs) {
            this.jobMarket.set(job.id, job);
        }
    }

    initializeRealEstate() {
        const properties = [
            { id: 1, name: 'Barrio Apartment', price: 50000, type: 'apartment', income: 500 },
            { id: 2, name: 'Beach House', price: 250000, type: 'house', income: 2500 },
            { id: 3, name: 'Hood Corner Store', price: 100000, type: 'business', income: 1200 },
            { id: 4, name: 'Gaming Cafe', price: 150000, type: 'business', income: 1800 },
            { id: 5, name: 'Crypto Mining Farm', price: 500000, type: 'industrial', income: 5000 }
        ];

        for (const property of properties) {
            this.realEstate.set(property.id, {
                ...property,
                owner: null,
                forSale: true
            });
        }
    }

    // Wallet Management
    async getWallet(userId) {
        if (!this.userWallets.has(userId)) {
            this.userWallets.set(userId, {
                balance: 1000, // Starting balance
                bank: 0,
                stocks: new Map(),
                crypto: new Map(),
                properties: [],
                job: null,
                jobCooldown: 0,
                businesses: [],
                loans: [],
                nfts: [],
                streak: 0,
                lastDaily: 0,
                level: 1,
                xp: 0
            });
        }
        return this.userWallets.get(userId);
    }

    async addMoney(userId, amount, reason = 'Unknown') {
        const wallet = await this.getWallet(userId);
        wallet.balance += amount;
        
        // Level up system
        wallet.xp += Math.floor(amount / 10);
        const newLevel = Math.floor(wallet.xp / 1000) + 1;
        if (newLevel > wallet.level) {
            wallet.level = newLevel;
            return { levelUp: true, newLevel };
        }
        
        return { levelUp: false };
    }

    async removeMoney(userId, amount) {
        const wallet = await this.getWallet(userId);
        if (wallet.balance < amount) return false;
        wallet.balance -= amount;
        return true;
    }

    // Banking System
    async deposit(userId, amount) {
        const wallet = await this.getWallet(userId);
        if (wallet.balance < amount) {
            return { success: false, message: "No tienes suficiente dinero hermano 💸" };
        }
        
        wallet.balance -= amount;
        wallet.bank += amount;
        
        return { 
            success: true, 
            message: `Deposited ${amount} ${this.symbol}! Bank balance: ${wallet.bank} ${this.symbol} 🏦`
        };
    }

    async withdraw(userId, amount) {
        const wallet = await this.getWallet(userId);
        if (wallet.bank < amount) {
            return { success: false, message: "No tienes suficiente en el banco papi 🏦" };
        }
        
        wallet.bank -= amount;
        wallet.balance += amount;
        
        return { 
            success: true, 
            message: `Withdrew ${amount} ${this.symbol}! Wallet balance: ${wallet.balance} ${this.symbol} 💰`
        };
    }

    // Daily/Weekly Rewards
    async claimDaily(userId) {
        const wallet = await this.getWallet(userId);
        const now = Date.now();
        const dailyCooldown = 24 * 60 * 60 * 1000; // 24 hours
        
        if (now - wallet.lastDaily < dailyCooldown) {
            const timeLeft = dailyCooldown - (now - wallet.lastDaily);
            const hours = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            return { 
                success: false, 
                message: `¡Cálmate loco! Wait ${hours}h ${minutes}m for daily reward 😤` 
            };
        }
        
        // Check streak
        const streakWindow = 26 * 60 * 60 * 1000; // 26 hours (grace period)
        if (now - wallet.lastDaily > streakWindow) {
            wallet.streak = 0;
        }
        
        wallet.streak += 1;
        wallet.lastDaily = now;
        
        // Calculate reward based on streak
        const baseReward = 100;
        const streakBonus = Math.min(wallet.streak * 10, 500); // Max 500 bonus
        const levelBonus = wallet.level * 25;
        const totalReward = baseReward + streakBonus + levelBonus;
        
        await this.addMoney(userId, totalReward, 'Daily reward');
        
        return {
            success: true,
            amount: totalReward,
            streak: wallet.streak,
            message: `¡Dale! Daily reward: ${totalReward} ${this.symbol}! Streak: ${wallet.streak} days 🔥`
        };
    }

    // Gambling System
    async gamble(userId, amount, game = 'slots') {
        const wallet = await this.getWallet(userId);
        if (wallet.balance < amount) {
            return { success: false, message: "No tienes suficiente dinero pa' apostar loco 🎰" };
        }
        
        await this.removeMoney(userId, amount);
        
        switch (game) {
            case 'slots':
                return this.playSlots(userId, amount);
            case 'blackjack':
                return this.playBlackjack(userId, amount);
            case 'roulette':
                return this.playRoulette(userId, amount);
            case 'crash':
                return this.playCrash(userId, amount);
            default:
                return this.playSlots(userId, amount);
        }
    }

    async playSlots(userId, amount) {
        const symbols = ['🍎', '🍊', '🍇', '🔔', '💎', '7️⃣', '🍀', '⭐'];
        const reels = [
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)]
        ];
        
        let multiplier = 0;
        let message = '';
        
        if (reels[0] === reels[1] && reels[1] === reels[2]) {
            // Three of a kind
            if (reels[0] === '💎') multiplier = 10;
            else if (reels[0] === '7️⃣') multiplier = 8;
            else if (reels[0] === '🍀') multiplier = 6;
            else multiplier = 4;
            message = `¡WEPA! Triple ${reels[0]}! `;
        } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
            // Two of a kind
            multiplier = 2;
            message = `¡Dale! Pair! `;
        } else {
            message = `¡Ay no! Try again hermano... `;
        }
        
        const winnings = amount * multiplier;
        if (winnings > 0) {
            await this.addMoney(userId, winnings, 'Slots winnings');
            message += `Won ${winnings} ${this.symbol}! 🎰💰`;
        } else {
            message += `Lost ${amount} ${this.symbol} 😤`;
        }
        
        return {
            success: true,
            reels,
            multiplier,
            winnings,
            message
        };
    }

    async playRoulette(userId, amount) {
        const number = Math.floor(Math.random() * 37); // 0-36
        const color = number === 0 ? 'green' : (number % 2 === 0 ? 'black' : 'red');
        const isEven = number !== 0 && number % 2 === 0;
        
        // For simplicity, let's bet on red
        let multiplier = 0;
        if (color === 'red') {
            multiplier = 2;
        }
        
        const winnings = amount * multiplier;
        if (winnings > 0) {
            await this.addMoney(userId, winnings, 'Roulette winnings');
        }
        
        return {
            success: true,
            number,
            color,
            winnings,
            message: `Roulette: ${number} ${color === 'red' ? '🔴' : color === 'black' ? '⚫' : '🟢'} ${winnings > 0 ? `Won ${winnings} ${this.symbol}!` : `Lost ${amount} ${this.symbol}`}`
        };
    }

    // Stock Trading
    async buyStock(userId, symbol, shares) {
        const wallet = await this.getWallet(userId);
        const stock = this.stockMarket.get(symbol.toUpperCase());
        
        if (!stock) {
            return { success: false, message: "That stock doesn't exist hermano 📈" };
        }
        
        const totalCost = stock.price * shares;
        if (wallet.balance < totalCost) {
            return { success: false, message: "No tienes suficiente dinero for this stock 📉" };
        }
        
        await this.removeMoney(userId, totalCost);
        
        if (!wallet.stocks.has(symbol)) {
            wallet.stocks.set(symbol, { shares: 0, avgPrice: 0 });
        }
        
        const holding = wallet.stocks.get(symbol);
        const newTotalShares = holding.shares + shares;
        const newAvgPrice = ((holding.avgPrice * holding.shares) + (stock.price * shares)) / newTotalShares;
        
        holding.shares = newTotalShares;
        holding.avgPrice = newAvgPrice;
        
        // Update market volume
        stock.volume += shares;
        
        return {
            success: true,
            message: `Bought ${shares} shares of ${symbol} for ${totalCost.toFixed(2)} ${this.symbol}! 📈`
        };
    }

    async sellStock(userId, symbol, shares) {
        const wallet = await this.getWallet(userId);
        const stock = this.stockMarket.get(symbol.toUpperCase());
        
        if (!stock) {
            return { success: false, message: "That stock doesn't exist hermano 📈" };
        }
        
        if (!wallet.stocks.has(symbol) || wallet.stocks.get(symbol).shares < shares) {
            return { success: false, message: "You don't have enough shares loco 📉" };
        }
        
        const holding = wallet.stocks.get(symbol);
        const totalValue = stock.price * shares;
        const profit = (stock.price - holding.avgPrice) * shares;
        
        await this.addMoney(userId, totalValue, 'Stock sale');
        
        holding.shares -= shares;
        if (holding.shares === 0) {
            wallet.stocks.delete(symbol);
        }
        
        // Update market volume
        stock.volume += shares;
        
        return {
            success: true,
            totalValue,
            profit,
            message: `Sold ${shares} shares of ${symbol} for ${totalValue.toFixed(2)} ${this.symbol}! ${profit > 0 ? `Profit: ${profit.toFixed(2)} 📈` : `Loss: ${Math.abs(profit).toFixed(2)} 📉`}`
        };
    }

    // Job System
    async work(userId, jobId) {
        const wallet = await this.getWallet(userId);
        const job = this.jobMarket.get(jobId);
        
        if (!job) {
            return { success: false, message: "That job doesn't exist hermano 💼" };
        }
        
        const now = Date.now();
        if (wallet.jobCooldown > now) {
            const timeLeft = wallet.jobCooldown - now;
            const minutes = Math.floor(timeLeft / (60 * 1000));
            return { 
                success: false, 
                message: `¡Cálmate! You're still tired from work. Wait ${minutes} minutes 😴` 
            };
        }
        
        // Set cooldown
        wallet.jobCooldown = now + (job.duration * 60 * 1000);
        
        // Calculate pay based on level and random factor
        const basePay = job.salary;
        const levelBonus = wallet.level * 10;
        const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
        const totalPay = Math.floor((basePay + levelBonus) * randomFactor);
        
        await this.addMoney(userId, totalPay, `Work: ${job.name}`);
        
        const workMessages = {
            dev: "Coded some fire apps 💻",
            trader: "Made some trades en el mercado 📈", 
            streamer: "Streamed some games for la gente 🎮",
            chef: "Cooked some bomb food 🍳",
            musician: "Performed en la calle 🎵",
            dealer: "Dealt cards at the casino 🃏"
        };
        
        return {
            success: true,
            amount: totalPay,
            cooldown: job.duration,
            message: `${workMessages[jobId] || 'Worked hard'} - Earned ${totalPay} ${this.symbol}! 💰`
        };
    }

    // Business System
    async buyBusiness(userId, businessId) {
        const wallet = await this.getWallet(userId);
        const businesses = {
            'taco-stand': { name: 'Taco Stand', price: 5000, income: 50 },
            'gaming-cafe': { name: 'Gaming Cafe', price: 25000, income: 200 },
            'crypto-farm': { name: 'Crypto Mining Farm', price: 100000, income: 800 },
            'record-label': { name: 'Record Label', price: 500000, income: 3000 }
        };
        
        const business = businesses[businessId];
        if (!business) {
            return { success: false, message: "That business doesn't exist hermano 🏢" };
        }
        
        if (wallet.balance < business.price) {
            return { success: false, message: "No tienes suficiente dinero pa' eso 💸" };
        }
        
        if (wallet.businesses.find(b => b.id === businessId)) {
            return { success: false, message: "You already own this business loco 🏢" };
        }
        
        await this.removeMoney(userId, business.price);
        wallet.businesses.push({
            id: businessId,
            ...business,
            purchaseDate: Date.now(),
            lastCollected: Date.now()
        });
        
        return {
            success: true,
            message: `Bought ${business.name} for ${business.price} ${this.symbol}! Daily income: ${business.income} ${this.symbol} 🏢💰`
        };
    }

    async collectBusinessIncome(userId) {
        const wallet = await this.getWallet(userId);
        
        if (wallet.businesses.length === 0) {
            return { success: false, message: "You don't own any businesses hermano 🏢" };
        }
        
        let totalIncome = 0;
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        
        for (const business of wallet.businesses) {
            const daysSinceCollection = Math.floor((now - business.lastCollected) / dayMs);
            if (daysSinceCollection >= 1) {
                const income = business.income * daysSinceCollection;
                totalIncome += income;
                business.lastCollected = now;
            }
        }
        
        if (totalIncome === 0) {
            return { success: false, message: "No income to collect yet papi ⏰" };
        }
        
        await this.addMoney(userId, totalIncome, 'Business income');
        
        return {
            success: true,
            amount: totalIncome,
            message: `Collected ${totalIncome} ${this.symbol} from your businesses! 🏢💰`
        };
    }

    // Market simulation
    updateMarket() {
        // Update stock prices
        for (const [symbol, stock] of this.stockMarket) {
            const change = (Math.random() - 0.5) * 0.1; // -5% to +5%
            const newPrice = Math.max(stock.price * (1 + change), 0.01);
            stock.change = ((newPrice - stock.price) / stock.price) * 100;
            stock.price = newPrice;
            stock.history.push(newPrice);
            
            // Keep only last 24 hours of history
            if (stock.history.length > 24) {
                stock.history = stock.history.slice(-24);
            }
        }
    }

    // Display methods
    async getBalanceEmbed(userId, username) {
        const wallet = await this.getWallet(userId);
        
        const embed = new EmbedBuilder()
            .setTitle(`💰 ${username}'s Wallet`)
            .setColor('#00ff00')
            .addFields(
                { name: '💵 Balance', value: `${wallet.balance.toLocaleString()} ${this.symbol}`, inline: true },
                { name: '🏦 Bank', value: `${wallet.bank.toLocaleString()} ${this.symbol}`, inline: true },
                { name: '📈 Level', value: `${wallet.level} (${wallet.xp} XP)`, inline: true },
                { name: '🔥 Daily Streak', value: `${wallet.streak} days`, inline: true },
                { name: '🏢 Businesses', value: `${wallet.businesses.length}`, inline: true },
                { name: '📊 Stocks', value: `${wallet.stocks.size} holdings`, inline: true }
            );
            
        if (wallet.businesses.length > 0) {
            const businessList = wallet.businesses.map(b => `${b.name} (+${b.income}/day)`).join('\n');
            embed.addFields({ name: '🏢 Your Businesses', value: businessList });
        }
        
        return embed;
    }

    async getStockMarketEmbed() {
        const embed = new EmbedBuilder()
            .setTitle('📈 Stock Market')
            .setColor('#0099ff')
            .setDescription('Live stock prices - Updated every hour');
            
        for (const [symbol, stock] of this.stockMarket) {
            const changeEmoji = stock.change > 0 ? '📈' : stock.change < 0 ? '📉' : '➡️';
            const changeColor = stock.change > 0 ? '+' : '';
            
            embed.addFields({
                name: `${changeEmoji} ${symbol} - ${stock.name}`,
                value: `Price: ${stock.price.toFixed(2)} ${this.symbol}\nChange: ${changeColor}${stock.change.toFixed(2)}%\nVolume: ${stock.volume}`,
                inline: true
            });
        }
        
        return embed;
    }
}

module.exports = EconomySystem;