import React, { useState, useEffect } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

type WalletResponse = string[];

const Profile = () => {
    const [input, setInput] = useState<string>("");
    const [wallets, setWallets] = useState<string[]>([""]);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingCurrency, setLoadingCurrency] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [favoriteCurrency, setFavoriteCurrency] = useState<string | null>(null);

    useEffect(() => {
        const fetchWallet = async () => {
            setLoading(true);
            try {
                const { data } = await API.get<WalletResponse>("/profile/wallet");
                const { data: { favorite_currency } } = await API.get("/profile/favorite_currency");
                setWallets(data);
                setFavoriteCurrency(favorite_currency);
                setError(null);
            } catch (error: any) {
                console.error("Failed to fetch wallet");
                setError(error?.response?.data?.error || "Failed to fetch wallet");
            } finally {
                setLoading(false);
            }
        };

        fetchWallet();
    }, []);

    const sendNewFavoriteCurrency = async (currency: string) => {
        try {
            await API.put("/profile/favorite_currency", { favorite_currency: currency });
            setError(null);
            toast.success("Favorite currency updated successfully");
        } catch (error) {
            console.error("Failed to update favorite currency");
            setError("Failed to update favorite currency");
            toast.error("Failed to update favorite currency");
        } finally {
            if (!error) {
                setFavoriteCurrency(currency);
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingCurrency(true);
        try {
            await API.post("/profile/wallet", { wallet: input });
            setError(null);
            setWallets([...wallets, input]);
            setInput("");
            toast.success("Wallet added successfully");
        } catch (error: any) {
            console.error(error);
            setError(error?.response?.data?.error || "Failed to added wallet");
            toast.error(error?.response?.data?.error || "Failed to added wallet");
        } finally {
            setLoadingCurrency(false);
        }
    };

    const onDeleteWallet = async (wallet: string) => {
        try {
            await API.delete(`/profile/wallet/${wallet}`);
            setError(null);
            setWallets(wallets.filter((w) => w !== wallet));
            toast.success("Wallet deleted successfully");
        } catch (error: any) {
            console.error(error);
            setError(error?.response?.data?.error || "Failed to delete wallet");
            toast.error(error?.response?.data?.error || "Failed to delete wallet");
        }
    }

    return (
        <div className="w-full mx-auto">
            <h1 className="w-full text-center text-2xl p-4 font-bold">Profile</h1>
            <div className="w-4/5 mx-auto flex justify-between">
                <div className="p-4 w-3/5">
                    {error && <p className="text-red-500">{error}</p>}
                    <div className="w-full">
                        <h2 className="text-xl font-bold pb-2">Your wallet(s)</h2>
                        <ul className="w-full space-y-2">
                            {wallets.map((wallet, index) => (
                                <li key={index} className="w-full p-2 border rounded">
                                    <div className="flex justify-between">
                                        <p>{wallet}</p>
                                        <button className="text-red-500 px-2" onClick={() => onDeleteWallet(wallet)}>
                                            X
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col w-2/5 p-4 space-y-4">
                    <div>
                        <h2 className="text-xl font-bold">Add new wallet</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Wallet"
                                value={input}
                                onChange={({ target: { value } }) => setInput(value)}
                                className="w-full p-2 border rounded"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-blue-300"
                            >
                                {loading ? "In adding..." : "Add Wallet"}
                            </button>
                        </form>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Your favorite currency</h2>
                        <div className="space-y-4">
                            <select
                                value={favoriteCurrency || "USD"}
                                onChange={({ target: { value } }) => setFavoriteCurrency(value)}
                                className="w-full p-2 border rounded"
                            >
                                <option value="USD">USD</option>
                                <option value="BTC">BTC</option>
                                <option value="ETH">ETH</option>
                            </select>
                            <button
                                disabled={loadingCurrency}
                                className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-blue-300"
                                onClick={() => sendNewFavoriteCurrency(favoriteCurrency || "USD")}
                            >
                                {loadingCurrency ? "Updating..." : "Update favorite currency"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;