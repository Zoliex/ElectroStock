import { Plus, Cpu, Activity, CircuitBoard, Sun, Zap, Layers, ArrowRight, MoreVertical, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function Categories() {
  const categories = [
    {
      id: "microcontrollers",
      title: "Microcontrollers",
      count: "1,240",
      icon: Cpu,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXziGg5oCBR0497IKGvWWCF2CXV200FOX0hOixGJ9xyFltesPry1FO5EfIssqDNyb2H8MxTdRZrwLvYdRlm_lR-KV-AbBST5qFqkKPhO84qxsuu7gi9q9DEOypaDfUs2w17O4ke6E8dLee79bh4Y93652MRGzmWi5ZASubBWT7Fzsh4x9ullB8cb0gsgsEHSJQJ9zvgBkONUgxFQ-9pfEhWNbtSnZfbV13uDlkJPBxtvlj_cCnz6_16vEw2Zsowl5eXw9ilpXooCOV"
    },
    {
      id: "sensors",
      title: "Sensors",
      count: "850",
      icon: Activity,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRePMfviqU8nnsi59NdHqV2j3p5i9tfH4-50gchWNSnqNUyzM7iVmECfwFqPZM5nd34lmhbuuxyokJrqXzefAIuZ_d0DD4lYxbyd4XrO3O3JlEuvpBXkPxgbpsd-1eqmRqCKqkyCjOvW0yUE6uA5Y_sBBnpeah-Z8B9Jn9d5pRfqIj2ttSPPOkzGiT7G6Y-6DN3zpj7rptR6aCWU23y-0ehy2R4V7NL96LrnL1QIi90kS6v3fD0oaBt5eApmBy8n-hxnJp-1TNH3i6"
    },
    {
      id: "ics",
      title: "Integrated Circuits",
      count: "3,100",
      icon: CircuitBoard,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBaulV-Lq24JN-2rujQVRrp3_-IdCmCVf5yqmlhQ1Oo1rLrWxIvNYISbE61eqWiyfDWW4IoZKO5melLxkKs5dMdeD92AsZUyjNIypL5JB4JM7ZJApwU16oTarSOMd6dHzdJNxIlNrYXpjuyz9UO5tqON7AftggTYOsF1cUtOxp2Pz88cGXzqbOPNyxp-UHLsEPQanxmxe2pOviY5ibaf9CG2zlYA29YJzB1af51OYyOGhiS-fOAHKDkjzjHNJPX_4HgWwWiIFiS1YFP"
    },
    {
      id: "optoelectronics",
      title: "Optoelectronics",
      count: "420",
      icon: Sun,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2JsSrg0JZtcfT_O4R892J8HU9dLgH5vTIOphBavdmj70q1IHGiXneiQ59Gz_9OjSj5-vLn8uu7lorG6lbNFe8mKWvpxSWEdWi_xK6oquIRID1d8GpbMJibfN5NngDcVDJIX87eALD0487MTAYeQeZDD8Mf63IL5xijYB7bNJemhG_tvicB8HXWdqq1RNerjVvT0i9odmD5RUgcKoYrjNrUcYcsyDOrLgXimiT_p518hhUtetQMoqxDTpNAPb0-OO51tewFNS8nly0"
    },
    {
      id: "power",
      title: "Power Management",
      count: "670",
      icon: Zap,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjz4sIMgarWIpNCgdclz9h0bk9Si4dR8rbeZ1NjPAenBUxueNoRrDcArGU8BI7ByIIDMEUe0KbzJJSFrHXVZEQ0WhZ1r6nMEGpAwBiL1TDtBVhOBCd--ypDSnaXL65RoqpkNFDEy0dA95-lbqc5BIiRHRLUuegsomVHzzRQ9W2UWCMySeE4YsXPTfXEZuV0EcDHl4ZyRK-heV7vsJ7X9i_B3VZH6g9_q6EOv4DMxLMXMgu1uEgnoU1gEOpu5yg_o7f2dg-S1TfNsB0"
    },
    {
      id: "passives",
      title: "Passives",
      count: "5,400",
      icon: Layers,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJzNiD83ia1xm7W7dR54JfXCeB9cnyuhM9KoIGDzxMK8NS1gBgtmzpNiRQqpe_MAU30-Lmi-Plkoiq3x-kScMZwDrZxFrCOpuSxnZgLTpIa9cPyGdMJVkx_8lKvktijlDeoL6Ap5oVhYqq0-U29KBJhSn5THqlxfjxDEwWX12Kjwm_Tyneyb5PrQvhrMJT5KvPKj29daZtHY-91se-zGJf0uyZmYSKc8pI2JNwgsDkgxSe8rSBSnNTsAaOmTlDv-n89Kx_na-f7dCv"
    }
  ];

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Component Categories</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and organize your electronics inventory by type.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" />
          New Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-primary/50 dark:hover:border-primary/50 transition-all shadow-sm">
            <div className="aspect-square w-full rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4 relative">
              <div className="absolute inset-0 flex items-center justify-center text-primary/40 group-hover:scale-110 transition-transform duration-300 z-10">
                <cat.icon className="w-16 h-16" />
              </div>
              <img alt={cat.title} className="w-full h-full object-cover mix-blend-overlay opacity-40 relative z-0" src={cat.image} />
            </div>
            <div className="flex flex-col flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{cat.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{cat.count} items in stock</p>
              <div className="mt-auto pt-6 flex items-center justify-between">
                <Link to="/inventory" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                  View Components
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Category Empty State/Card */}
        <div className="flex flex-col items-center justify-center bg-slate-100/50 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-5 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors cursor-pointer min-h-[340px]">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <PlusCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2 px-4">Add a new category to expand your component library.</p>
        </div>
      </div>
    </main>
  );
}
