"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, FileText, Banknote, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 md:p-24 overflow-hidden relative">
      
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        className="w-full max-w-4xl max-auto text-center z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-blue-400 mb-6 backdrop-blur-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>התהליך דיגיטלי, מאובטח ומוצפן</span>
        </motion.div>

        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          הכסף שלכם. <br className="md:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-400 to-purple-500">
            בחזרה אליכם.
          </span>
        </motion.h1>

        <motion.p variants={itemVariants} className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          מערכת חכמה שעושה עבורכם את כל העבודה השחורה.
          עונים על כמה שאלות פשוטות, מעלים צילומים, ואנחנו כבר נדאג להכין את הכל להגשה לרשות המסים.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/wizard" className="w-full sm:w-auto h-14 px-8 flex items-center justify-center gap-3 bg-white text-black rounded-xl font-bold text-lg hover:bg-neutral-200 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.4)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.6)]">
            <span>יאללה, בואו נתחיל</span>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <a href="#how-it-works" className="w-full sm:w-auto h-14 px-8 flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white rounded-xl font-medium text-lg hover:bg-white/10 transition-all backdrop-blur-sm">
            איך זה עובד?
          </a>
        </motion.div>

        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
          {[
            { icon: FileText, title: "1. ממלאים פרטים", desc: "שאלון קצר, פשוט וברור בגובה העיניים." },
            { icon: CheckCircle2, title: "2. המערכת מחשבת", desc: "סריקת מסמכים חכמה וחישוב מדויק של ההחזר." },
            { icon: Banknote, title: "3. הכסף שלכם", desc: "מקבלים טופס מוכן עם הוראות הגשה פשוטות." }
          ].map((feature, i) => (
            <motion.div key={i} variants={itemVariants} className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 text-blue-400">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-neutral-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

      </motion.div>
    </main>
  );
}
