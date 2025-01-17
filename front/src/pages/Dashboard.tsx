import React, { useState, useEffect } from "react";
import API from "services/api";
import Chart from "../components/Chart";


type WalletsResponse = string[];

const Dashboard = () => {
    const [wallets, setWallets] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currency, setCurrency] = useState<string>("USD");
    const [walletDisplay, setWalletDisplay] = useState<string>("");

    console.log(Boolean(walletDisplay))
    console.log(wallets[0]?.length)

    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            try {
                const { data: { favorite_currency } } = await API.get("/profile/favorite_currency");
                const { data: walletsData } = await API.get<WalletsResponse>("/profile/wallet");
                setWallets(walletsData);
                walletsData.map((wallet) => console.log(wallet))
                setCurrency(favorite_currency);
                setError(null);
            } catch (error) {
                setError("Failed to fetch favorite currency");
            } finally {
                setIsLoading(false);
            }
        };

        initData();
    }, []);

    return (
        <div style={{ padding: "2rem" }} className="bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-center mb-8">Crypto Wallet</h1>
            <div className="w-full mx-auto p-6 flex justify-between bg-white rounded-lg shadow-md">
                <div className="flex justify-center items-center p-2 gap-2">
                    <h2>Choose your currency to convert</h2>
                    <select
                        value={currency}
                        onChange={({ target: { value } }) => setCurrency(value)}
                        className="p-2 border rounded"
                    >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="BTC">BTC</option>
                        <option value="ETH">ETH</option>
                    </select>

                </div>
                <div className="flex justify-center items-center p-2 gap-2">
                    <h2>Choose your wallet</h2>
                    <select
                        value={walletDisplay}
                        onChange={({ target: { value } }) => setWalletDisplay(value)}
                        className="p-2 border rounded"
                    >
                        {wallets.map((wallet, index) => (
                            <option key={index} value={wallet}>{wallet}</option>
                        ))}
                    </select>
                </div>
            </div>
            {isLoading && (
                <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            )}
            {error && <p className="text-red-500 text-center">{error}</p>}

            {!isLoading && !error && (

                <Chart currency={currency} wallet={walletDisplay || wallets[0]} />

                // wallets.map((wallet, index) => (
                //     <Chart key={index} currency={currency} wallet={wallet} />
                // ))
            )}
            {!isLoading && !error && wallets.length === 0 && (
                <p className="text-center text-gray-500">No data available.</p>
            )}
        </div>
    );
};

export default Dashboard;