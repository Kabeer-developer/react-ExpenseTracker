import { useEffect, useState } from "react";

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : [];
  });

  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  function addTransaction() {
    if (!text.trim() || !amount) return;

    setTransactions([
      ...transactions,
      {
        id: Date.now(),
        text,
        amount: Number(amount)
      }
    ]);

    setText("");
    setAmount("");
  }

  function deleteTransaction(id) {
    setTransactions(transactions.filter(t => t.id !== id));
  }

  const income = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income + expense;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-6 rounded shadow">
        <h1 className="text-2xl font-bold text-center mb-4">
          Expense Tracker
        </h1>

        <div className="flex justify-between mb-4">
          <div>
            <p className="text-gray-500">Income</p>
            <p className="text-green-600 font-bold">₹{income}</p>
          </div>
          <div>
            <p className="text-gray-500">Expense</p>
            <p className="text-red-600 font-bold">₹{Math.abs(expense)}</p>
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-gray-500">Balance</p>
          <p className="text-xl font-bold">₹{balance}</p>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Description"
            className="flex-1 p-2 border rounded"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (+ / -)"
            type="number"
            className="w-36 p-2 border rounded"
          />
        </div>

        <button
          onClick={addTransaction}
          className="w-full bg-blue-500 text-white py-2 rounded mb-4"
        >
          Add Transaction
        </button>

        <ul>
          {transactions.map(t => (
            <li
              key={t.id}
              className={`flex justify-between items-center mb-2 border-l-4 p-2 ${
                t.amount > 0 ? "border-green-500" : "border-red-500"
              }`}
            >
              <span>{t.text}</span>
              <span>
                ₹{t.amount}
                <button
                  onClick={() => deleteTransaction(t.id)}
                  className="ml-3 text-sm text-red-500"
                >
                  x
                </button>
              </span>
            </li>
          ))}
        </ul>

        {transactions.length === 0 && (
          <p className="text-center text-gray-500 mt-4">
            No transactions yet
          </p>
        )}
      </div>
    </div>
  );
}
