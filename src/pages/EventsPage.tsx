import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Helmet } from "react-helmet-async";
import { EVENTS } from "../constants";
import { motion } from "motion/react";
import { Calendar, MapPin, ArrowUpRight, Clock, Users, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getEvents } from "../services/eventService";
import { NewsEvent } from "../types";

export default function EventsPage() {
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const data = await getEvents();
      // Combine with static events if database is empty
      setEvents(data.length > 0 ? data : []);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const displayEvents = events.length > 0 ? events : EVENTS.map((e, idx) => ({
    ...e,
    id: `static-${idx}`,
    description: "Experience the future of finance and technology at our upcoming summit.",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800",
    time: "10:00 AM - 4:00 PM",
    createdAt: new Date()
  })) as any[];

  return (
    <>
      <Helmet>
        <title>Upcoming Technology Events & Summits | TechQuo News</title>
        <meta name="description" content="Global meetups, high-stakes summits, and technical briefings for the African technology and venture ecosystem." />
        <link rel="canonical" href="https://www.techquonews.com/events" />
        <meta property="og:title" content="Upcoming Technology Events & Summits | TechQuo News" />
        <meta property="og:description" content="Global meetups, high-stakes summits, and technical briefings for the African technology and venture ecosystem." />
        <meta property="og:url" content="https://www.techquonews.com/events" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navbar />
      <main className="min-h-screen pt-32 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* Header */}
          <header className="mb-20 border-b border-slate-100 pb-12">
            <span className="editorial-label text-brand-accent mb-4 block">Community Hub</span>
            <h1 className="text-6xl md:text-8xl font-editorial font-bold mb-6 tracking-tight">
              Events<span className="text-brand-accent">.</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
              Global meetups, high-stakes summits, and technical briefings for the TechQuo News community.
            </p>
          </header>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-brand-accent" size={48} />
            </div>
          ) : (
            <div className="grid gap-12">
              {displayEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="grid lg:grid-cols-12 gap-8 p-12 bg-slate-50 border border-slate-100 group hover:border-brand-accent/30 transition-all relative overflow-hidden"
                >
                  <div className="lg:col-span-8 flex flex-col md:flex-row gap-8">
                    {event.image && (
                      <div className="w-full md:w-64 h-48 flex-shrink-0 overflow-hidden border border-slate-200 rounded-md">
                        <img 
                          src={event.image} 
                          alt={event.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest">
                          {event.type || 'Conference'}
                        </span>
                        <span className="editorial-label text-brand-accent">Registration Open</span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-editorial font-bold mb-6 group-hover:underline">
                        {event.title}
                      </h2>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-brand-accent">
                            <Calendar size={18} />
                          </div>
                          <div>
                            <p className="editorial-label text-[9px]">Date & Schedule</p>
                            <p className="font-bold text-sm">{event.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-brand-accent">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <p className="editorial-label text-[9px]">Location</p>
                            <p className="font-bold text-sm">{event.location}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-4 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 pt-8 lg:pt-0 lg:pl-12">
                    <div className="space-y-6">
                       <div className="flex items-center gap-3 text-slate-500">
                          <Users size={18} />
                          <span className="text-sm font-medium">Professional Hub</span>
                       </div>
                       <div className="flex items-center gap-3 text-slate-500">
                          <Clock size={18} />
                          <span className="text-sm font-medium">Session Time: {event.time}</span>
                       </div>
                    </div>
                    
                    {event.registrationLink ? (
                      <a 
                        href={event.registrationLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-12 bg-black text-white px-10 py-5 font-bold uppercase text-[12px] tracking-[0.3em] hover:bg-brand-accent transition-colors flex items-center justify-center gap-3"
                      >
                        Reserve My Spot
                        <ArrowUpRight size={18} />
                      </a>
                    ) : (
                      <button className="mt-12 bg-black text-white px-10 py-5 font-bold uppercase text-[12px] tracking-[0.3em] hover:bg-brand-accent transition-colors flex items-center justify-center gap-3">
                        Reserve My Spot
                        <ArrowUpRight size={18} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Featured Sidebar / Call to Action */}
          <section className="mt-32 p-12 bg-brand-accent text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl text-center md:text-left">
              <h3 className="text-4xl font-editorial font-bold mb-4">Host an Event with TechQuo News</h3>
              <p className="text-white/80 leading-relaxed">
                Connect with our global network of 1M+ active readers. Partner with us for your next high-impact industry event.
              </p>
            </div>
            <button className="px-10 py-5 bg-white text-brand-accent font-bold uppercase text-[12px] tracking-[0.3em] hover:bg-slate-50 transition-colors whitespace-nowrap">
              Partner with Us
            </button>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
