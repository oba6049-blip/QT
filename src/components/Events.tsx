import { motion } from "motion/react";
import { EVENTS } from "../constants";
import { Calendar, MapPin, ArrowUpRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getEvents } from "../services/eventService";
import { NewsEvent } from "../types";
import { useNavigate } from "react-router-dom";

export default function Events() {
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const data = await getEvents();
        // Show only up to 2 for the homepage
        setEvents(data.length > 0 ? data.slice(0, 2) : []);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (!loading && events.length === 0) return null;

  return (
    <section className="py-32 px-6 md:px-12 bg-black text-white overflow-hidden relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="editorial-label text-brand-accent mb-4 block">Conferences & Summits</span>
            <h2 className="text-4xl md:text-6xl font-editorial font-bold mb-4">Upcoming Events</h2>
            <p className="text-slate-400 max-w-xl text-lg">Join the leaders, makers, and shakers at our curated conferences and private briefings.</p>
          </div>
          <button 
            onClick={() => navigate('/events')}
            className="editorial-label text-white hover:text-brand-accent transition-colors"
          >
            See All Events
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-brand-accent" size={32} />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-px bg-white/10 border border-white/10">
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                onClick={() => navigate('/events')}
                className="bg-black p-12 hover:bg-white/5 transition-colors group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-12">
                  <div className="flex flex-col gap-4">
                    <span className="editorial-label text-brand-accent px-3 py-1 border border-brand-accent/30 tracking-[0.3em] w-fit">
                      {event.type || 'Event'}
                     </span>
                    {event.image && (
                      <div className="w-20 h-20 overflow-hidden border border-white/10 mt-2 rounded-md">
                        <img 
                          src={event.image} 
                          alt={event.title} 
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:bg-brand-accent transition-colors">
                    <ArrowUpRight size={22} strokeWidth={1.5} />
                  </div>
                </div>

                <h3 className="text-3xl font-editorial font-bold mb-8 group-hover:text-brand-accent transition-colors leading-tight">
                  {event.title}
                </h3>

                <div className="flex flex-wrap gap-8">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Calendar size={18} className="text-brand-accent" />
                    <span className="editorial-label text-xs tracking-widest">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <MapPin size={18} className="text-brand-accent" />
                    <span className="editorial-label text-xs tracking-widest">{event.location}</span>
                  </div>
                </div>

                <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between">
                   <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-white">Open for Registration</span>
                   <button className="bg-white text-black px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-brand-accent hover:text-white transition-all">Secure Pass</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
