import { motion } from "motion/react";
import { CheckCircle2, Zap, Globe2, ShieldCheck, TrendingUp } from "lucide-react";

const REASONS = [
  {
    title: "Global Reach",
    description: "Stories that cross borders and connect ecosystems around the world.",
    icon: Globe2,
    color: "bg-blue-50 text-blue-600"
  },
  {
    title: "Verified Insights",
    description: "Every article is fact-checked and reviewed by industry experts.",
    icon: ShieldCheck,
    color: "bg-emerald-50 text-emerald-600"
  },
  {
    title: "Rapid Updates",
    description: "Get the news as it happens with our real-time global newsroom.",
    icon: Zap,
    color: "bg-amber-50 text-amber-600"
  },
  {
    title: "Market Trends",
    description: "Advanced analytics and predictive insights for business leaders.",
    icon: TrendingUp,
    color: "bg-purple-50 text-purple-600"
  }
];

export default function WhyChooseUs() {
  return (
    <section className="py-24 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="editorial-label text-brand-accent mb-6 block">Our Standards</span>
            <h2 className="text-5xl md:text-7xl font-editorial font-bold mb-8 leading-[0.95] tracking-tight">
              A New Standard in <br /><span className="italic-editorial">Digital Journalism.</span>
            </h2>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              We started TechQuo News because we believed the world needed a more rigorous, thoughtful, and professional approach to tech and business news.
            </p>
            
            <div className="space-y-6">
               {[
                 { title: "Premium editorial standards", desc: "Rigorous fact-checking and independent oversight." },
                 { title: "Direct player access", desc: "Interviews with the CEOs and founders shaping the future." },
                 { title: "Deep data analysis", desc: "Charts, maps, and models to explain the numbers." }
               ].map((item) => (
                 <div key={item.title} className="flex gap-4">
                   <CheckCircle2 className="text-brand-accent shrink-0 mt-1" size={20} />
                   <div>
                     <span className="font-bold text-slate-900 block">{item.title}</span>
                     <span className="text-sm text-slate-500">{item.desc}</span>
                   </div>
                 </div>
               ))}
            </div>

            <button className="mt-12 bg-black text-white px-10 py-5 font-bold uppercase text-[12px] tracking-[0.2em] hover:bg-brand-accent transition-colors">
               Our Editorial Philosophy
            </button>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-px border-slate-200 bg-slate-200 border">
            {REASONS.map((reason, idx) => (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-10 bg-white hover:bg-slate-50 transition-colors"
              >
                <div className={`w-12 h-12 rounded flex items-center justify-center mb-8 ${reason.color}`}>
                  <reason.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold mb-4">{reason.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{reason.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
