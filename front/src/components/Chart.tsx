import React, { useCallback, useEffect, useState } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { toast } from "react-toastify";
import { Line } from "react-chartjs-2";
import API from "services/api";

type Props = {
    wallet: string;
    currency: string;
}

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface PriceEvolution {
    date: string;
    cumulative_balance_currency: number;
}

const isValidData = (data: any): data is PriceEvolution[] => {
    return Array.isArray(data) && data.every(
        (entry) => entry.date && typeof entry.cumulative_balance_currency === "number"
    );
};

const Chart = ({ wallet, currency }: Props) => {
    const [data, setData] = useState<PriceEvolution[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const { data: { data } } = await API.get(`/wallet/get_data/wallet-evolution/${currency}/${wallet}`);

            console.log(data)
            if (isValidData(data)) {
                setData(data);
                console.log(data)
                setError(null);
                toast.success("Data fetched successfully.");
            } else {
                throw new Error("Invalid data format received from the API.");
            }
        } catch (err: any) {
            console.error("Failed to fetch data:", err);
            setError(err?.response?.data?.error || "Failed to fetch data. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, [currency, wallet]);

    useEffect(() => {
        fetchData();
    }, [currency, fetchData, wallet]);

    const chartData = {
        labels: data.map((entry) => entry.date),
        datasets: [
            {
                label: "Crypto Wallet Price Evolution",
                data: data.map((entry) => entry.cumulative_balance_currency),
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                tension: 0.4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
            },
            title: {
                display: true,
                text: "Crypto Wallet Price Evolution" + (currency ? ` (in ${currency})` : ""),
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Date",
                },
            },
            y: {
                title: {
                    display: true,
                    text: `Price (in ${currency})`,
                },
                beginAtZero: false,
            },
        },
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center my-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-center">
                {error}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-gray-500 text-center">
                No data available for the selected wallet.
            </div>
        );
    }

    return (
        <div
            role="graphics-document"
            aria-label="Crypto Wallet Price Evolution Chart"
            className="w-full mx-auto bg-white p-6 my-4 rounded-lg shadow-lg"
        >
            <h3 className='text-xl font-semibold'>{wallet}</h3>
            <Line data={chartData} options={chartOptions} />
        </div>
    );
};

export default Chart