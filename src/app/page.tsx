"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, FileText, Banknote, ShieldCheck, ChevronDown, Users, Clock, Scale } from "lucide-react";
import Link from "next/link";

const FAQ_ITEMS = [
  {
    q: "כמה כסף אפשר לקבל בחזרה?",
    a: "סכום ההחזר תלוי בהכנסה שלכם, בנקודות הזיכוי שמגיעות לכם, ובכמה מס נוכה בפועל. הסכום הממוצע נע בין 3,000 ל-12,000 ₪ לשנה. ניתן להגיש עד 6 שנים אחורה."
  },
  {
    q: "למי המערכת מתאימה?",
    a: "המערכת מיועדת לשכירים שרוצים להגיש בקשה אישית להחזר מס. עצמאיים, בני זוג המגישים יחד, עולים חדשים ותושבים חוזרים — יתווספו בגרסאות הבאות."
  },
  {
    q: "האם צריך ידע בחשבונאות?",
    a: "בכלל לא. המערכת שואלת שאלות פשוטות בגובה העיניים ומבצעת את כל החישובים בהתאם לחוקי המס העדכניים. בסוף מקבלים טופס מוכן להגשה."
  },
  {
    q: "מה עושים עם הטופס שמתקבל?",
    a: "מעלים אותו לאתר רשות המיסים דרך מערכת הפניות (מפ\"ל), או שולחים אותו בדואר עם טפסי 106 המקוריים. הכסף מועבר ישירות לחשבון הבנק תוך כ-90 יום."
  },
  {
    q: "האם זה בטוח?",
    a: "כן. אנחנו לא שומרים את מסמכי המס שלכם. החישוב מתבצע בצד שלכם, ואנו משתמשים בהצפנת SSL מלאה ואימות Google בלבד."
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
    <main className="flex-1 flex flex-col items-center overflow-hidden relative">
      
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      {/* HERO */}
      <motion.section 
        className="w-full max-w-4xl mx-auto text-center z-10 px-6 pt-16 sm:pt-24 pb-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-blue-400 mb-6 backdrop-blur-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>מאובטח, דיגיטלי ופרטי</span>
        </motion.div>

        <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          בדקו כמה כסף <br className="md:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-400 to-purple-500">
            מגיע לכם בחזרה.
          </span>
        </motion.h1>

        <motion.p variants={itemVariants} className="text-base sm:text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          ענו על כמה שאלות, העלו את טפסי 106 שלכם, וקבלו טופס 135 מוכן להגשה לרשות המסים. התהליך לוקח כ-5 דקות.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/wizard" className="w-full sm:w-auto h-14 px-8 flex items-center justify-center gap-3 bg-white text-black rounded-xl font-bold text-lg hover:bg-neutral-200 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.4)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.6)]">
            <span>בדקו את ההחזר שלכם</span>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <a href="#how-it-works" className="w-full sm:w-auto h-14 px-8 flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white rounded-xl font-medium text-lg hover:bg-white/10 transition-all backdrop-blur-sm">
            איך זה עובד?
          </a>
        </motion.div>
      </motion.section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="w-full max-w-4xl mx-auto px-6 pb-16 z-10">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {[
            { icon: FileText, title: "1. ממלאים פרטים", desc: "שאלון קצר בגובה העיניים — מין, ילדים, הטבות, ויישוב מגורים." },
            { icon: CheckCircle2, title: "2. המערכת מחשבת", desc: "סריקה אוטומטית של טפסי 106 וחישוב מדויק לפי חוקי המס של אותה שנה." },
            { icon: Banknote, title: "3. מקבלים טופס מוכן", desc: "טופס 135 רשמי עם כל הנתונים ממוקמים בדיוק — מוכן להגשה לרשות המסים." }
          ].map((feature, i) => (
            <motion.div key={i} variants={itemVariants} className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 text-blue-400">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-neutral-400 leading-relaxed text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* STATS BAR */}
      <section className="w-full max-w-4xl mx-auto px-6 pb-16 z-10">
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {[
            { icon: Clock, label: "5 דקות", desc: "זמן ממוצע להשלמה" },
            { icon: Scale, label: "6 שנים", desc: "ניתן להגיש רטרואקטיבית" },
            { icon: Users, label: "שכירים", desc: "מתאים להגשה אישית" },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-blue-400 flex-shrink-0">
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold">{stat.label}</div>
                <div className="text-xs text-neutral-400">{stat.desc}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="w-full max-w-2xl mx-auto px-6 pb-20 z-10 text-right">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">שאלות נפוצות</h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <button 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-right hover:bg-white/5 transition-colors"
              >
                <span className="font-bold text-sm sm:text-base">{item.q}</span>
                <ChevronDown className={`w-5 h-5 text-neutral-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-5 pb-5"
                >
                  <p className="text-sm text-neutral-400 leading-relaxed">{item.a}</p>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full border-t border-white/5 py-8 px-6 z-10 text-center">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <span>© {new Date().getFullYear()} TaxEase — מס קל. כל הזכויות שמורות.</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> מאובטח SSL</span>
            <span>אין לראות באתר ייעוץ מס מקצועי</span>
          </div>
        </div>
      </footer>

    </main>
  );
}
