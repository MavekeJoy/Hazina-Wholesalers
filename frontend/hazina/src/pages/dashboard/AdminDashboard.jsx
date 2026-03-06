import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  // Sample data for charts
  const expenseVsProfitData = [
    { month: "Dec", expense: 40, profit: 24 },
    { month: "Jan", expense: 30, profit: 35 },
    { month: "Feb", expense: 25, profit: 40 },
    { month: "Mar", expense: 35, profit: 30 },
    { month: "Apr", expense: 28, profit: 38 },
    { month: "May", expense: 32, profit: 42 },
    { month: "Jun", expense: 22, profit: 48 },
  ];

  const inventoryValuesData = [
    { name: "Sold units", value: 32, fill: "#e5e7eb" },
    { name: "Total units", value: 68, fill: "#16a34a" },
  ];

  const topStoresData = [
    { name: "Gateway Oil", sales: 674 },
    { name: "The Rustic Fox", sales: 721 },
    { name: "West Vine", sales: 598 },
    { name: "Blue Harbor", sales: 512 },
    { name: "Nobela Novelties", sales: 395 },
    { name: "Crimson Crafters", sales: 344 },
    { name: "Total Treasures", sales: 274 },
    { name: "Whimsy Well", sales: 213 },
    { name: "Mercantile", sales: 185 },
    { name: "Emporium", sales: 179 },
  ];

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-green-100 mt-1">Welcome to Hazina Admin!</p>
            </div>
            <div className="flex items-center gap-6">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <button className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 transition">
                🔔
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {/* Overview Cards */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Over View</h2>
            <div className="grid grid-cols-4 gap-6">
              <OverviewCard
                title="Total Products"
                value="5483"
                icon="📦"
                bgColor="bg-green-50"
                borderColor="border-green-500"
              />
              <OverviewCard
                title="Orders"
                value="2859"
                icon="📋"
                bgColor="bg-blue-50"
                borderColor="border-blue-500"
              />
              <OverviewCard
                title="Total Stock"
                value="5483"
                icon="📊"
                bgColor="bg-green-50"
                borderColor="border-green-500"
              />
              <OverviewCard
                title="Out of Stock"
                value="38"
                icon="⚠️"
                bgColor="bg-red-50"
                borderColor="border-red-500"
              />
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* No of Users */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                No of users
              </h3>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-700">583 K</p>
                  <p className="text-gray-500 mt-2">Total Customers</p>
                </div>
              </div>
            </div>

            {/* Inventory Values */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Inventory Values
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={inventoryValuesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {inventoryValuesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span>Sold units: 32%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Total units: 68%</span>
                </div>
              </div>
            </div>

            {/* Top 10 Stores */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Top 10 Stores by sales
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {topStoresData.map((store, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{store.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${(store.sales / 721) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-10 text-right">
                        {store.sales}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Expense vs Profit */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Expense vs Profit
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={expenseVsProfitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#f97316"
                    strokeWidth={2}
                    name="Expense"
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#16a34a"
                    strokeWidth={2}
                    name="Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-500 mt-4">Last 6 months</p>
            </div>

            {/* Last 6 months placeholder */}
            <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-4">Additional metrics coming soon</p>
                <div className="w-32 h-32 bg-green-50 rounded-lg flex items-center justify-center">
                  <span className="text-4xl">📊</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Overview Card Component
function OverviewCard({ title, value, icon, bgColor, borderColor }) {
  return (
    <div className={`${bgColor} border-l-4 ${borderColor} p-6 rounded-lg shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}

export default AdminDashboard;