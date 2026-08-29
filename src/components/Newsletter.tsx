import { motion } from "motion/react";
import { Send, CheckCircle } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (email) {
      try {
        await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } catch (err) {
        console.error("Subscription error:", err);
      }
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="py-24 px-6 md:px-12 bg-white relative overflow-hidden border-t border-slate-100">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
        >
          <span className="editorial-label text-brand-accent mb-6 block">The Briefing</span>
          <h2 className="text-4xl md:text-6xl font-editorial font-bold mb-6">Stay Ahead of the Curve</h2>
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
            Join 50,000+ professionals who get our curated weekly digest of tech trends and market shifts.
          </p>

          {subscribed ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-50 p-12 border border-slate-100 flex flex-col items-center gap-6"
            >
              <CheckCircle size={48} className="text-brand-accent" />
              <div>
                <h3 className="text-3xl font-editorial font-bold mb-2">You're on the list.</h3>
                <p className="text-slate-500">Welcome to TechQuo News. Our briefing will arrive in your inbox shortly.</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 p-1 bg-slate-50 border border-slate-200 max-w-2xl mx-auto group focus-within:border-brand-accent transition-colors">
              <input 
                type="email" 
                placeholder="Email address" 
                className="flex-1 px-8 py-4 bg-transparent outline-hidden text-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button 
                type="submit"
                className="px-10 py-4 bg-black text-white font-bold uppercase text-[12px] tracking-[0.2em] hover:bg-brand-accent transition-colors"
              >
                Join
              </button>
            </form>
          )}
          
          <p className="mt-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            By joining, you agree to our <a href="#" className="underline">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
