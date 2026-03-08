import { Link } from "react-router-dom";
import {
  Download,
  Plus,
  Layers,
  Package,
  Warehouse,
  AlertTriangle,
  TrendingUp,
  ArrowUp,
  ClipboardList,
  Cpu,
  PieChart,
  BellRing,
  AlertCircle,
} from "lucide-react";

export function Dashboard() {
  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight">Inventory Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Real-time tracking of component stock levels and distribution.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <Download className="w-5 h-5" /> Export
          </button>
          <Link to="/inventory/add" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5" /> New Component
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <p className="text-sm font-semibold uppercase tracking-wider">Total SKUs</p>
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">1,284</p>
            <p className="text-emerald-500 text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" /> 2.4%
            </p>
          </div>
          <p className="text-xs text-slate-400">vs. last month</p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <p className="text-sm font-semibold uppercase tracking-wider">Total Units</p>
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">45,902</p>
            <p className="text-emerald-500 text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" /> 0.5%
            </p>
          </div>
          <p className="text-xs text-slate-400">Active stock</p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <p className="text-sm font-semibold uppercase tracking-wider">Storage Cap.</p>
            <Warehouse className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">78%</p>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-2">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: "78%" }}></div>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 shadow-sm">
          <div className="flex items-center justify-between text-orange-600 dark:text-orange-400">
            <p className="text-sm font-semibold uppercase tracking-wider font-bold">Critical Stock</p>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">12</p>
            <p className="text-red-500 text-sm font-medium flex items-center">
              <ArrowUp className="w-4 h-4 mr-1" /> 4
            </p>
          </div>
          <p className="text-xs text-orange-600/60 dark:text-orange-400/60">Immediate restock needed</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inventory Table */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              Recent Activity
            </h2>
            <button className="text-primary text-sm font-semibold hover:underline">View All</button>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Component</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">ESP32-WROOM-32D</p>
                        <p className="text-xs text-slate-400 font-mono">ID: 48293</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold uppercase tracking-tight">
                      Microcontrollers
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">4,200 units</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold uppercase">
                      <span className="size-1.5 rounded-full bg-emerald-500"></span> Healthy
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Ceramic Capacitor 10uF</p>
                        <p className="text-xs text-slate-400 font-mono">ID: 10245</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[11px] font-bold uppercase tracking-tight">
                      Passives
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">120 units</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-orange-500 text-xs font-bold uppercase">
                      <span className="size-1.5 rounded-full bg-orange-500 animate-pulse"></span> Low Stock
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">SMD Resistor 10k 0603</p>
                        <p className="text-xs text-slate-400 font-mono">ID: 88231</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[11px] font-bold uppercase tracking-tight">
                      Passives
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">25,000 units</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold uppercase">
                      <span className="size-1.5 rounded-full bg-emerald-500"></span> Healthy
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">LM7805 Voltage Reg.</p>
                        <p className="text-xs text-slate-400 font-mono">ID: 15442</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-[11px] font-bold uppercase tracking-tight">
                      Power
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">0 units</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-red-500 text-xs font-bold uppercase">
                      <span className="size-1.5 rounded-full bg-red-500"></span> Out of Stock
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Distribution & Alerts */}
        <div className="flex flex-col gap-6">
          {/* Category Distribution Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <PieChart className="w-6 h-6 text-primary" />
              By Category
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm font-medium">
                  <span>Microcontrollers</span>
                  <span>42%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "42%" }}></div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm font-medium">
                  <span>Passives</span>
                  <span>35%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: "35%" }}></div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm font-medium">
                  <span>Power Management</span>
                  <span>15%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-pink-500 h-2 rounded-full" style={{ width: "15%" }}></div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm font-medium">
                  <span>Connectors</span>
                  <span>8%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "8%" }}></div>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Detailed Analytics
            </button>
          </div>

          {/* Warehouse Alerts */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BellRing className="w-6 h-6 text-primary" />
              Low Stock Alerts
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-start p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-700 dark:text-red-400 leading-tight">ATmega328P-PU</p>
                  <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-1">
                    Stock dropped below 5% of threshold.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900/30">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-orange-700 dark:text-orange-400 leading-tight">
                    LED RGB Common Cathode
                  </p>
                  <p className="text-xs text-orange-600/80 dark:text-orange-400/70 mt-1">
                    Re-order required within 3 days.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900/30">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-orange-700 dark:text-orange-400 leading-tight">
                    16x2 LCD Display (I2C)
                  </p>
                  <p className="text-xs text-orange-600/80 dark:text-orange-400/70 mt-1">Current stock: 15 units.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
